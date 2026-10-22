import { describe, expect, it } from "vitest";
import { AgentStreamParser } from "./parser";
import type { AgentEvent } from "../types";

const SAMPLE = `好的，我来构建这个应用。

<plan>
1. 搭建页面结构
2. 编写视觉样式
3. 实现交互逻辑
</plan>
<file path="index.html">
<!DOCTYPE html>
<html lang="zh-CN"><head><title>Demo</title></head><body></body></html>
</file>
<file path="style.css">
body { background: #111; color: #eee }
</file>
完成！`;

function collect(events: AgentEvent[]) {
  const stage = events.filter((e) => e.type === "stage").map((e) => (e as { text: string }).text).join("");
  const plan = events.filter((e) => e.type === "plan").map((e) => (e as { text: string }).text).join("");
  const starts = events.filter((e) => e.type === "file_start").map((e) => (e as { path: string }).path);
  const ends = events.filter((e) => e.type === "file_end").map((e) => (e as { path: string }).path);
  const files: Record<string, string> = {};
  for (const e of events) {
    if (e.type === "file_delta") files[e.path] = (files[e.path] ?? "") + e.delta;
  }
  return { stage, plan, starts, ends, files };
}

describe("AgentStreamParser", () => {
  it("整段输入：正确拆分 stage/plan/文件事件", () => {
    const p = new AgentStreamParser();
    const events = [...p.push(SAMPLE), ...p.end()];
    const r = collect(events);
    expect(r.stage).toContain("好的，我来构建这个应用。");
    expect(r.stage).toContain("完成！");
    expect(r.plan.trim()).toBe("1. 搭建页面结构\n2. 编写视觉样式\n3. 实现交互逻辑");
    expect(r.starts).toEqual(["index.html", "style.css"]);
    expect(r.ends).toEqual(["index.html", "style.css"]);
    expect(r.files["index.html"]).toContain("<!DOCTYPE html>");
    expect(r.files["index.html"]).not.toContain("<file");
    expect(r.files["style.css"]).toContain("background: #111");
  });

  it("按 1~2 字符切 chunk：重组后内容与整段解析完全一致", () => {
    const onceP = new AgentStreamParser();
    const once = collect([...onceP.push(SAMPLE), ...onceP.end()]);
    for (let trial = 0; trial < 5; trial++) {
      const p = new AgentStreamParser();
      const events: AgentEvent[] = [];
      let i = 0;
      while (i < SAMPLE.length) {
        const step = 1 + Math.floor(Math.random() * 2);
        events.push(...p.push(SAMPLE.slice(i, i + step)));
        i += step;
      }
      events.push(...p.end());
      const r = collect(events);
      expect(r).toEqual(once);
    }
  });

  it("剔除文件内容中的 markdown 围栏", () => {
    const input = `<file path="app.js">
\`\`\`js
console.log(1);
\`\`\`
</file>`;
    const r = collect([...new AgentStreamParser().push(input), ...new AgentStreamParser().end()]);
    expect(r.files["app.js"]).toBe("\nconsole.log(1);\n");
  });

  it("容忍缺失 </file>：end() 冲刷并补发 file_end", () => {
    const input = `<file path="app.js">
console.log("no close tag");`;
    const p = new AgentStreamParser();
    const events = [...p.push(input), ...p.end()];
    const r = collect(events);
    expect(r.ends).toEqual(["app.js"]);
    expect(r.files["app.js"]).toContain("no close tag");
  });

  it("普通文本中的 < 不会被吞掉", () => {
    const p = new AgentStreamParser();
    const events = [...p.push("如果 a < b，则输出 <file 类型的提示：注意"), ...p.end()];
    const stage = collect(events).stage;
    expect(stage).toBe("如果 a < b，则输出 <file 类型的提示：注意");
  });

  it("缺 <plan> 也能正常解析文件", () => {
    const r = collect([...new AgentStreamParser().push(`<file path="a.css">x{}</file>`), ...new AgentStreamParser().end()]);
    expect(r.files["a.css"]).toBe("x{}");
    expect(r.plan).toBe("");
  });
});
