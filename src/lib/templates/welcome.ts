// 模板：个性化欢迎页（演示模式兜底 —— 未命中任何意图时，用需求文本生成定制页面）
import { titleFromPrompt } from "../utils";

export function welcomeFiles(prompt: string): Record<string, string> {
  const title = titleFromPrompt(prompt, 24);
  const safe = prompt.replace(/[<>&"']/g, " ");
  return {
    "index.html": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<main class="hero">
  <div class="badge">🧪 由 Molecules 演示智能体生成</div>
  <h1>${title}</h1>
  <p class="sub">你描述的是：「${safe}」</p>
  <p class="sub">演示模式基于内置模板匹配意图；在「设置」中填入 API Key 后，即可由大模型自由生成任何应用。</p>
  <div class="cards">
    <div class="card">💡<h3>描述更具体</h3><p>试试「待办清单」「番茄钟」「贪吃蛇」「计算器」「产品落地页」</p></div>
    <div class="card">🎨<h3>继续迭代</h3><p>生成后可以说「换成蓝色」「改名为 XX」体验多轮修改</p></div>
    <div class="card">🚀<h3>接入大模型</h3><p>设置 → 填入 Anthropic API Key，解锁无限生成能力</p></div>
  </div>
</main>
<script src="app.js"></script>
</body>
</html>`,
    "style.css": `:root{--primary:#7c3aed;--bg:#0b0b14;--card:#151524;--line:#262640;--text:#ececf5;--muted:#8a8aa3}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 16px}
.hero{max-width:720px;text-align:center}
.badge{display:inline-block;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:6px 14px;font-size:13px;color:#c4b5fd;margin-bottom:20px}
h1{font-size:clamp(26px,5vw,40px);line-height:1.2;background:linear-gradient(90deg,#a78bfa,#f0abfc);-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{color:var(--muted);font-size:14px;line-height:1.8;margin-top:14px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-top:36px;text-align:left}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px;transition:transform .25s,border-color .25s}
.card:hover{transform:translateY(-3px);border-color:var(--primary)}
.card h3{font-size:15px;margin:8px 0 6px}
.card p{color:var(--muted);font-size:13px;line-height:1.6}`,
    "app.js": `console.log('应用已就绪 ✅');
document.querySelectorAll('.card').forEach(function (c, i) {
  setTimeout(function () { c.style.opacity = '1'; }, 120 * (i + 1));
});`,
  };
}
