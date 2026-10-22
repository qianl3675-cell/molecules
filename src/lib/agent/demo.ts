// 演示模式智能体（客户端本地运行，无需任何 API Key）
// 与真模型共用 AgentEvent 协议：意图识别 → 模板 → 打字机式流式输出
// 迭代请求支持轻量改写：主题色 / 标题；其余情况如实说明演示模式限制。
import type { AgentEvent } from "../types";
import { templateFilesFor } from "../templates";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const COLORS: Array<{ re: RegExp; hex: string; name: string }> = [
  { re: /红色|red|火红/i, hex: "#ef4444", name: "红色" },
  { re: /蓝色|blue/i, hex: "#3b82f6", name: "蓝色" },
  { re: /绿色|green|翠绿/i, hex: "#22c55e", name: "绿色" },
  { re: /紫色|purple|violet/i, hex: "#8b5cf6", name: "紫色" },
  { re: /橙色|orange|橘色/i, hex: "#f97316", name: "橙色" },
  { re: /粉色|pink/i, hex: "#ec4899", name: "粉色" },
  { re: /青色|cyan|蓝绿/i, hex: "#06b6d4", name: "青色" },
  { re: /金色|gold|黄色/i, hex: "#f59e0b", name: "金色" },
];

async function* streamText(text: string): AsyncGenerator<string> {
  let i = 0;
  while (i < text.length) {
    const step = 3 + Math.floor(Math.random() * 5);
    yield text.slice(i, i + step);
    i += step;
    await sleep(10);
  }
}

export async function* runDemoAgent(
  prompt: string,
  files: Record<string, string>
): AsyncGenerator<AgentEvent, void, undefined> {
  await sleep(200);

  // ---------- 迭代请求（已有文件）：轻量改写 ----------
  if (Object.keys(files).length > 0) {
    const color = COLORS.find((c) => c.re.test(prompt));
    if (color && files["style.css"]) {
      yield { type: "stage", text: `好的，把主题色切换为${color.name}。` };
      yield* streamPlanLines(["定位 style.css 中的 --primary 主色变量", "替换为 " + color.hex + " 并保持对比度合理"]);
      const css = files["style.css"].replace(/--primary:\s*#[0-9a-fA-F]{3,8}/, "--primary: " + color.hex);
      yield* streamFile("style.css", css);
      yield { type: "stage", text: `已将主题色更新为${color.name} 🎨（演示模式仅支持改色/改名等轻量修改）` };
      yield { type: "done" };
      return;
    }
    const m = prompt.match(/(?:改名为|标题改为|叫做|叫)\s*["“']?([^"”'，。!！?？\s]{1,20})/);
    if (m && files["index.html"]) {
      const name = m[1];
      yield { type: "stage", text: `把应用改名为「${name}」。` };
      yield* streamPlanLines(["更新 <title> 与主标题", "保持其余结构不变"]);
      const html = files["index.html"]
        .replace(/<title>[^<]*<\/title>/, `<title>${name}</title>`)
        .replace(/(<h1[^>]*>)([^<]*)(<\/h1>)/, "$1" + name + "$3");
      yield* streamFile("index.html", html);
      yield { type: "stage", text: `已改名完成 ✅` };
      yield { type: "done" };
      return;
    }
    yield {
      type: "stage",
      text:
        "当前处于演示模式（未配置模型），仅支持「换主题色 / 改名」等轻量迭代。\n" +
        "在右上角「设置」中填入 Anthropic API Key 后，即可让大模型理解任意修改需求并重写代码。",
    };
    yield { type: "done" };
    return;
  }

  // ---------- 首次生成：意图识别 → 模板 ----------
  const tpl = templateFilesFor(prompt);
  const isFallback = tpl.key === "welcome";
  yield {
    type: "stage",
    text: isFallback
      ? "收到！演示模式下我先为你生成一个个性化页面（未匹配到内置应用类型）。"
      : `收到！我来为你构建一个「${tpl.name}」🛠️`,
  };
  yield* streamPlanLines(
    isFallback
      ? ["解析需求文本", "生成个性化展示页（HTML/CSS/JS）", "注入交互动效并自检"]
      : ["搭建页面结构（index.html）", "编写视觉样式（style.css）", "实现交互逻辑（app.js）", "整体自检与收尾"]
  );
  for (const [path, content] of Object.entries(tpl.files)) {
    yield* streamFile(path, content);
    await sleep(120);
  }
  yield {
    type: "stage",
    text: isFallback
      ? "完成 ✅ 可以继续对话（如「换成蓝色」「改名为 XX」），或在设置中填入 API Key 解锁自由生成。"
      : "完成 ✅ 预览即可体验。你可以继续对话迭代（如「换成蓝色」「改名为 XX」）。",
  };
  yield { type: "done" };
}

async function* streamPlanLines(lines: string[]): AsyncGenerator<AgentEvent, void, undefined> {
  for (const line of lines) {
    yield { type: "plan", text: "1. " + line + "\n" };
    await sleep(260);
  }
}

async function* streamFile(path: string, content: string): AsyncGenerator<AgentEvent, void, undefined> {
  yield { type: "file_start", path };
  let i = 0;
  while (i < content.length) {
    const step = 16 + Math.floor(Math.random() * 24);
    yield { type: "file_delta", path, delta: content.slice(i, i + step) };
    i += step;
    await sleep(12);
  }
  yield { type: "file_end", path };
}
