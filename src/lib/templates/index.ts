// 模板注册表 + 意图识别（演示模式智能体使用）
import type { TemplateMeta } from "../types";
import { todoFiles } from "./todo";
import { pomodoroFiles } from "./pomodoro";
import { snakeFiles } from "./snake";
import { landingFiles } from "./landing";
import { calculatorFiles } from "./calculator";
import { game2048Files } from "./game2048";
import { welcomeFiles } from "./welcome";

export interface Template extends TemplateMeta {
  files: (prompt?: string) => Record<string, string>;
}

export const TEMPLATES: Template[] = [
  { key: "todo", name: "待办清单", desc: "添加/完成/删除任务，筛选与本地持久化", emoji: "✅", files: todoFiles },
  { key: "pomodoro", name: "番茄钟", desc: "专注/休息切换，进度环与提示音", emoji: "🍅", files: pomodoroFiles },
  { key: "snake", name: "贪吃蛇", desc: "Canvas 小游戏，键盘与触屏操控", emoji: "🐍", files: snakeFiles },
  { key: "landing", name: "产品落地页", desc: "Hero/特性/定价/FAQ 营销页", emoji: "🚀", files: landingFiles },
  { key: "calculator", name: "计算器", desc: "四则运算，键盘输入与历史记录", emoji: "🧮", files: calculatorFiles },
  { key: "2048", name: "2048", desc: "初始方块/移动合并/计分/撤销/换色/持久化", emoji: "🔢", files: game2048Files },
];

const INTENT_RULES: Array<{ key: string; re: RegExp }> = [
  { key: "todo", re: /待办|清单|todo|todolist|任务列表|备忘/i },
  { key: "pomodoro", re: /番茄|计时|倒计时|专注|pomodoro|timer/i },
  { key: "snake", re: /贪吃蛇|吃蛇|snake|小游戏|游戏/i },
  { key: "landing", re: /落地页|官网|产品页|营销页|介绍页|landing|首页|网站/i },
  { key: "calculator", re: /计算器|计算|calc|算数/i },
  { key: "2048", re: /2048|数字合并|合并数字/i },
];

export function detectTemplateKey(prompt: string): string {
  for (const r of INTENT_RULES) if (r.re.test(prompt)) return r.key;
  return "welcome";
}

/** 演示模式：按意图返回模板文件（welcome 兜底注入需求文本） */
export function templateFilesFor(prompt: string): { key: string; name: string; files: Record<string, string> } {
  const key = detectTemplateKey(prompt);
  if (key === "welcome") {
    return { key, name: "个性化页面", files: welcomeFiles(prompt) };
  }
  const tpl = TEMPLATES.find((t) => t.key === key)!;
  return { key, name: tpl.name, files: tpl.files(prompt) };
}

export function getTemplate(key: string): Template | undefined {
  return TEMPLATES.find((t) => t.key === key);
}
