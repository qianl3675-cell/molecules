// Agent 输出流式解析器（纯函数状态机）
// 将模型原始文本流增量解析为 AgentEvent：plan / file 标签路由、跨 chunk 半截标签保持、
// 文件内容中的 markdown 围栏按行剔除。
import type { AgentEvent } from "../types";

const FENCE_RE = /^\s*```[a-zA-Z0-9]*\s*$/;
const MARKER_STARTS = ["<plan>", "</plan>", "<file", "</file>"];

/** 判断从哪个下标开始可能是「未到齐的标记前缀」，需要暂缓输出 */
function holdIndex(buf: string): number {
  const i = buf.lastIndexOf("<");
  if (i === -1) return buf.length;
  const tail = buf.slice(i);
  return MARKER_STARTS.some((m) => m.startsWith(tail)) ? i : buf.length;
}

export class AgentStreamParser {
  private buf = "";
  private state: "text" | "plan" | "file" = "text";
  private filePath = "";
  private lineBuf = "";

  push(chunk: string): AgentEvent[] {
    this.buf += chunk;
    return this.process();
  }

  /** 流结束时冲刷残余缓冲；容忍模型漏写 </file> */
  end(): AgentEvent[] {
    const evs = this.process();
    if (this.state === "file") {
      // 文件态：buf 中可能还留着「防半截 </file> 标签」而暂缓的内容
      this.feedFileChunk(evs, this.buf);
      this.buf = "";
      if (this.lineBuf && !FENCE_RE.test(this.lineBuf)) {
        evs.push({ type: "file_delta", path: this.filePath, delta: this.lineBuf });
      }
      this.lineBuf = "";
      evs.push({ type: "file_end", path: this.filePath });
      this.state = "text";
    } else if (this.state === "plan" && this.buf) {
      evs.push({ type: "plan", text: this.buf });
      this.buf = "";
    } else if (this.state === "text" && this.buf) {
      evs.push({ type: "stage", text: this.buf });
      this.buf = "";
    }
    return evs;
  }

  private process(): AgentEvent[] {
    const evs: AgentEvent[] = [];
    let guard = 0;
    for (;;) {
      if (++guard > 10000) throw new Error(`parser loop: state=${this.state} buf=${JSON.stringify(this.buf.slice(0, 80))}`);
      if (this.state === "text") {
        const planOpen = this.buf.indexOf("<plan>");
        const fileOpen = this.buf.indexOf("<file");
        const strayClose = Math.min(
          ...[this.buf.indexOf("</plan>"), this.buf.indexOf("</file>")].filter((i) => i >= 0)
        );

        const fileGt = fileOpen >= 0 ? this.buf.indexOf(">", fileOpen) : -1;
        // <file 标签未到齐：暂缓
        if (fileOpen !== -1 && fileGt === -1) {
          this.emitStage(evs, this.buf.slice(0, fileOpen));
          this.buf = this.buf.slice(fileOpen);
          return evs;
        }

        // 选最早出现的完整标记
        let target = planOpen >= 0 ? planOpen : Infinity;
        let kind: "plan" | "file" | "stray" = planOpen >= 0 ? "plan" : "stray";
        if (fileOpen !== -1 && fileOpen < target) {
          target = fileOpen;
          kind = "file";
        }
        if (strayClose >= 0 && strayClose < target) {
          target = strayClose;
          kind = "stray";
        }
        if (!Number.isFinite(target)) {
          const hold = holdIndex(this.buf);
          this.emitStage(evs, this.buf.slice(0, hold));
          this.buf = this.buf.slice(hold);
          return evs;
        }
        this.emitStage(evs, this.buf.slice(0, target));
        if (kind === "plan") {
          this.buf = this.buf.slice(target + 6);
          this.state = "plan";
        } else if (kind === "file") {
          const tag = this.buf.slice(target, fileGt + 1);
          const m = tag.match(/path\s*=\s*["']([^"']+)["']/);
          this.filePath = m?.[1] ?? "index.html";
          evs.push({ type: "file_start", path: this.filePath });
          this.state = "file";
          this.lineBuf = "";
          this.buf = this.buf.slice(fileGt + 1);
        } else {
          // 孤立闭合标签：直接吞掉
          this.buf = this.buf.replace(/^<\/(plan|file)>/, "");
        }
      } else if (this.state === "plan") {
        const close = this.buf.indexOf("</plan>");
        if (close === -1) {
          // 保留末尾 6 字符（"</plan>" 可能未到齐）
          const safeLen = Math.max(0, this.buf.length - 6);
          if (safeLen > 0) {
            evs.push({ type: "plan", text: this.buf.slice(0, safeLen) });
            this.buf = this.buf.slice(safeLen);
          }
          return evs;
        }
        if (close > 0) evs.push({ type: "plan", text: this.buf.slice(0, close) });
        this.buf = this.buf.slice(close + 7);
        this.state = "text";
      } else {
        // file 态
        const close = this.buf.indexOf("</file>");
        const safeLen = close === -1 ? Math.max(0, this.buf.length - 6) : close;
        if (safeLen > 0) {
          this.feedFileChunk(evs, this.buf.slice(0, safeLen));
          this.buf = this.buf.slice(safeLen);
        }
        if (close !== -1) {
          if (this.lineBuf) {
            if (!FENCE_RE.test(this.lineBuf)) {
              evs.push({ type: "file_delta", path: this.filePath, delta: this.lineBuf });
            }
            this.lineBuf = "";
          }
          evs.push({ type: "file_end", path: this.filePath });
          this.state = "text";
          // 此前已用 safeLen 切掉内容前缀，此时 buf 恰以 "</file>" 开头
          this.buf = this.buf.slice(7);
        } else {
          return evs;
        }
      }
    }
  }

  private feedFileChunk(evs: AgentEvent[], chunk: string) {
    this.lineBuf += chunk;
    const lines = this.lineBuf.split("\n");
    this.lineBuf = lines.pop() ?? "";
    let out = "";
    for (const line of lines) {
      if (!FENCE_RE.test(line)) out += line + "\n";
    }
    if (out) evs.push({ type: "file_delta", path: this.filePath, delta: out });
  }

  private emitStage(evs: AgentEvent[], text: string) {
    if (text) evs.push({ type: "stage", text });
  }
}

/** 便捷函数：一次性解析完整文本（测试与调试用） */
export function parseAgentOutput(text: string): AgentEvent[] {
  const p = new AgentStreamParser();
  return [...p.push(text), ...p.end()];
}
