import { describe, expect, it } from "vitest";
import { detectTemplateKey, templateFilesFor, TEMPLATES } from "./index";
import { runDemoAgent } from "../agent/demo";
import { snakeFiles } from "./snake";
import type { AgentEvent } from "../types";

describe("意图识别", () => {
  it("常见需求命中对应模板", () => {
    expect(detectTemplateKey("帮我做一个待办清单")).toBe("todo");
    expect(detectTemplateKey("一个 todo 应用")).toBe("todo");
    expect(detectTemplateKey("番茄工作法计时器")).toBe("pomodoro");
    expect(detectTemplateKey("倒计时专注工具")).toBe("pomodoro");
    expect(detectTemplateKey("贪吃蛇小游戏")).toBe("snake");
    expect(detectTemplateKey("做一个 SaaS 落地页")).toBe("landing");
    expect(detectTemplateKey("计算器")).toBe("calculator");
  });

  it("未命中时兜底为个性化页面（welcome）", () => {
    expect(detectTemplateKey("一个很奇怪的东西")).toBe("welcome");
    const t = templateFilesFor("婚礼请柬生成器");
    expect(t.key).toBe("welcome");
    expect(t.files["index.html"]).toContain("婚礼请柬生成器");
  });

  it("模板文件完整（index.html 引用 style.css/app.js）", () => {
    for (const t of TEMPLATES) {
      const files = t.files();
      expect(Object.keys(files).length).toBe(3);
      expect(files["index.html"]).toContain('href="style.css"');
      expect(files["index.html"]).toContain('src="app.js"');
    }
  });
});

async function drain(gen: AsyncGenerator<AgentEvent>) {
  const out: AgentEvent[] = [];
  for await (const ev of gen) out.push(ev);
  return out;
}

describe("演示智能体（事件流协议）", () => {
  it("首次生成：产出计划与完整文件，与模板内容一致", async () => {
    const events = await drain(runDemoAgent("做个贪吃蛇", {}));
    const starts = events.filter((e) => e.type === "file_start").map((e) => e.path);
    expect(starts).toEqual(["index.html", "style.css", "app.js"]);
    expect(events.some((e) => e.type === "plan")).toBe(true);
    expect(events[events.length - 1].type).toBe("done");
    let js = "";
    for (const e of events) if (e.type === "file_delta" && e.path === "app.js") js += e.delta;
    expect(js).toBe(snakeFiles()["app.js"]);
  }, 30000);

  it("迭代改色：只重写 style.css 且主色替换生效", async () => {
    const files = {
      "index.html": "<h1>x</h1>",
      "style.css": ":root{--primary:#7c3aed}",
    };
    const events = await drain(runDemoAgent("换成蓝色", files));
    let css = "";
    for (const e of events) if (e.type === "file_delta") css += e.delta;
    expect(css).toContain("#3b82f6");
    expect(css).not.toContain("#7c3aed");
  }, 20000);

  it("不支持的迭代：只输出说明文字（不产出文件）", async () => {
    const events = await drain(runDemoAgent("加一个登录系统", { "index.html": "<p></p>" }));
    expect(events.some((e) => e.type === "file_start")).toBe(false);
    expect(events[events.length - 1].type).toBe("done");
  });
});
