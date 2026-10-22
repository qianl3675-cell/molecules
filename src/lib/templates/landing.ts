// 模板：SaaS 产品落地页（Hero / 特性 / 定价 / CTA，锚点平滑滚动）
export const landingFiles = (): Record<string, string> => ({
  "index.html": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nebula 云笔记 · 为灵感而生</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<nav id="nav">
  <div class="logo">🌙 Nebula</div>
  <div class="links">
    <a href="#features">特性</a>
    <a href="#pricing">定价</a>
    <a href="#faq">FAQ</a>
  </div>
  <a class="cta" href="#pricing">免费开始</a>
</nav>

<header class="hero">
  <div class="badge">✨ 全新 3.0 版本已发布</div>
  <h1>为<span class="grad">灵感</span>而生的云笔记</h1>
  <p class="sub">双向链接 · AI 摘要 · 多端同步。让每一个想法都找到归属，目前已有 12 万创作者在此记录与创造。</p>
  <div class="actions">
    <a class="btn primary" href="#pricing">立即免费体验</a>
    <a class="btn ghost" href="#features">了解更多 →</a>
  </div>
  <div class="stats">
    <div><b>120k+</b><span>活跃用户</span></div>
    <div><b>99.9%</b><span>可用性</span></div>
    <div><b>0ms</b><span>同步延迟感知</span></div>
  </div>
</header>

<section id="features" class="section">
  <h2>为什么选择 Nebula</h2>
  <div class="grid">
    <div class="card"><div class="icon">🔗</div><h3>双向链接</h3><p>笔记之间自由关联，知识自动织成网络，越写越聪明。</p></div>
    <div class="card"><div class="icon">🤖</div><h3>AI 助手</h3><p>一键生成摘要、提炼待办、续写灵感，写作效率翻倍。</p></div>
    <div class="card"><div class="icon">⚡️</div><h3>秒级同步</h3><p>端到端加密，手机、平板、电脑无缝接力，离线也能写。</p></div>
  </div>
</section>

<section id="pricing" class="section">
  <h2>简单透明的定价</h2>
  <div class="grid">
    <div class="plan"><h3>免费版</h3><div class="price">¥0<span>/月</span></div><ul><li>100 条笔记</li><li>基础编辑器</li><li>双端同步</li></ul><a class="btn ghost w100">开始使用</a></div>
    <div class="plan hot"><div class="tag">最受欢迎</div><h3>专业版</h3><div class="price">¥18<span>/月</span></div><ul><li>无限笔记</li><li>AI 助手</li><li>版本历史</li><li>优先支持</li></ul><a class="btn primary w100">立即升级</a></div>
    <div class="plan"><h3>团队版</h3><div class="price">¥48<span>/月</span></div><ul><li>5 个席位</li><li>协作空间</li><li>权限管理</li></ul><a class="btn ghost w100">联系我们</a></div>
  </div>
</section>

<section id="faq" class="section">
  <h2>常见问题</h2>
  <div class="faq"><b>数据安全吗？</b><p>全量端到端加密，服务器零知识存储，随时一键导出。</p></div>
  <div class="faq"><b>可以离线使用吗？</b><p>可以，离线编辑的内容会在联网后自动合并同步。</p></div>
  <div class="faq"><b>支持退款吗？</b><p>订阅后 14 天内无理由全额退款。</p></div>
</section>

<footer>© 2026 Nebula Labs · 用 ❤️ 与 ☕ 制作</footer>
<script src="app.js"></script>
</body>
</html>`,
  "style.css": `:root{--primary:#7c3aed;--bg:#0b0b14;--card:#151524;--line:#262640;--text:#ececf5;--muted:#8a8aa3}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--text)}
nav{position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:28px;padding:16px 6vw;background:rgba(11,11,20,.75);backdrop-filter:blur(10px);border-bottom:1px solid transparent;transition:border-color .3s}
nav.scrolled{border-color:var(--line)}
.logo{font-weight:800;font-size:18px;margin-right:auto}
.links{display:flex;gap:22px}
.links a{color:var(--muted);text-decoration:none;font-size:14px;transition:color .2s}
.links a:hover{color:var(--text)}
.cta{background:var(--primary);color:#fff;text-decoration:none;font-size:14px;padding:8px 18px;border-radius:10px;transition:filter .2s}
.cta:hover{filter:brightness(1.15)}
.hero{text-align:center;padding:90px 6vw 70px;background:radial-gradient(600px 300px at 50% 0,rgba(124,58,237,.18),transparent)}
.badge{display:inline-block;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:6px 14px;font-size:13px;color:#c4b5fd;margin-bottom:22px}
h1{font-size:clamp(32px,6vw,52px);line-height:1.15}
.grad{background:linear-gradient(90deg,#a78bfa,#f0abfc);-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{color:var(--muted);max-width:560px;margin:18px auto 30px;line-height:1.7}
.actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.btn{display:inline-block;text-decoration:none;border-radius:12px;padding:13px 30px;font-size:15px;transition:all .2s}
.btn.primary{background:var(--primary);color:#fff}
.btn.primary:hover{filter:brightness(1.15);transform:translateY(-1px)}
.btn.ghost{border:1px solid var(--line);color:var(--text)}
.btn.ghost:hover{border-color:var(--muted)}
.w100{width:100%;text-align:center}
.stats{display:flex;justify-content:center;gap:54px;margin-top:56px;flex-wrap:wrap}
.stats div{display:flex;flex-direction:column;gap:4px}
.stats b{font-size:26px}
.stats span{color:var(--muted);font-size:13px}
.section{padding:80px 6vw;max-width:1080px;margin:0 auto}
.section h2{text-align:center;font-size:28px;margin-bottom:44px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px;transition:transform .25s,border-color .25s}
.card:hover{transform:translateY(-4px);border-color:var(--primary)}
.card .icon{font-size:30px;margin-bottom:14px}
.card h3{font-size:17px;margin-bottom:10px}
.card p{color:var(--muted);font-size:14px;line-height:1.7}
.plan{position:relative;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:30px;display:flex;flex-direction:column;gap:14px}
.plan.hot{border-color:var(--primary);box-shadow:0 0 40px rgba(124,58,237,.15)}
.plan .tag{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--primary);color:#fff;font-size:12px;padding:4px 12px;border-radius:999px}
.price{font-size:34px;font-weight:800}
.price span{font-size:14px;color:var(--muted);font-weight:400}
.plan ul{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:6px}
.plan li{font-size:14px;color:var(--muted)}
.plan li::before{content:"✓ ";color:var(--primary)}
.faq{max-width:720px;margin:0 auto 14px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px 24px}
.faq b{font-size:15px}
.faq p{color:var(--muted);font-size:14px;margin-top:8px;line-height:1.6}
footer{text-align:center;color:var(--muted);font-size:13px;padding:40px 0;border-top:1px solid var(--line)}
@media(max-width:640px){.links{display:none}}`,
  "app.js": `var nav = document.getElementById('nav');
window.addEventListener('scroll', function () {
  nav.classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });
document.querySelectorAll('.btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    console.log('点击按钮：' + btn.textContent.trim());
  });
});`,
});
