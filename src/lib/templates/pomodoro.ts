// 模板：番茄钟（SVG 进度环 + 模式切换 + WebAudio 提示音）
export const pomodoroFiles = (): Record<string, string> => ({
  "index.html": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>番茄专注钟</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="app">
  <h1>🍅 番茄专注钟</h1>
  <div class="modes">
    <button class="mode active" data-m="work">专注 25:00</button>
    <button class="mode" data-m="break">休息 05:00</button>
  </div>
  <div class="ring-wrap">
    <svg viewBox="0 0 200 200">
      <circle class="track" cx="100" cy="100" r="88"></circle>
      <circle class="prog" id="prog" cx="100" cy="100" r="88"></circle>
    </svg>
    <div class="time" id="time">25:00</div>
  </div>
  <div class="ctrl">
    <button id="toggle" class="primary">开始专注</button>
    <button id="reset">重置</button>
  </div>
  <p class="stat">本次已收获 <b id="count">0</b> 个番茄 🍅</p>
</div>
<script src="app.js"></script>
</body>
</html>`,
  "style.css": `:root{--primary:#f97316;--bg:#0f0f18;--card:#171726;--line:#262640;--text:#ececf5;--muted:#8a8aa3}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:32px 16px}
.app{width:100%;max-width:380px;text-align:center}
h1{font-size:24px;margin-bottom:18px}
.modes{display:flex;gap:8px;justify-content:center;margin-bottom:26px}
.mode{background:transparent;border:1px solid var(--line);color:var(--muted);border-radius:999px;padding:6px 16px;font-size:13px;cursor:pointer;transition:all .2s}
.mode.active{border-color:var(--primary);color:var(--primary);background:rgba(249,115,22,.12)}
.ring-wrap{position:relative;width:240px;margin:0 auto}
svg{width:240px;height:240px;transform:rotate(-90deg)}
.track{fill:none;stroke:var(--line);stroke-width:10}
.prog{fill:none;stroke:var(--primary);stroke-width:10;stroke-linecap:round;stroke-dasharray:552.9;stroke-dashoffset:552.9;transition:stroke-dashoffset .9s linear}
.time{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:1px}
.ctrl{display:flex;gap:12px;justify-content:center;margin:26px 0 18px}
.ctrl button{border:1px solid var(--line);background:var(--card);color:var(--text);border-radius:12px;padding:11px 30px;font-size:15px;cursor:pointer;transition:all .2s}
.ctrl button:hover{border-color:var(--muted)}
.ctrl .primary{background:var(--primary);border-color:var(--primary);color:#fff}
.ctrl .primary:hover{filter:brightness(1.1);border-color:var(--primary)}
.stat{color:var(--muted);font-size:13px}
.stat b{color:var(--primary)}`,
  "app.js": `var MODES = { work: 25 * 60, break: 5 * 60 };
var mode = 'work', total = MODES.work, remain = total, timer = null, running = false;
var count = 0;
try { count = parseInt(localStorage.getItem('mol-pomo-count') || '0', 10) || 0; } catch (e) {}
var C = 552.9;
function fmt(s) {
  var m = Math.floor(s / 60), r = s % 60;
  return (m < 10 ? '0' + m : m) + ':' + (r < 10 ? '0' + r : r);
}
function render() {
  document.getElementById('time').textContent = fmt(remain);
  var p = total ? 1 - remain / total : 0;
  document.getElementById('prog').style.strokeDashoffset = String(C * (1 - p));
  document.getElementById('count').textContent = String(count);
}
function beep() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.2, 0.4].forEach(function (d) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.type = 'sine';
      g.gain.setValueAtTime(0.001, ctx.currentTime + d);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d + 0.18);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.2);
    });
  } catch (e) {}
}
function finish() {
  beep();
  if (mode === 'work') { count++; try { localStorage.setItem('mol-pomo-count', String(count)); } catch (e) {} }
  setMode(mode === 'work' ? 'break' : 'work', true);
}
function setMode(m, autostart) {
  mode = m; total = MODES[m]; remain = total;
  document.querySelectorAll('.mode').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-m') === m);
  });
  document.title = (m === 'work' ? '专注中 · 番茄钟' : '休息一下 · 番茄钟');
  if (autostart) { start(); } else { stop(); }
  render();
}
function start() {
  if (running) return;
  running = true;
  document.getElementById('toggle').textContent = '暂停';
  timer = setInterval(function () {
    remain--;
    if (remain <= 0) { stop(); render(); finish(); return; }
    render();
  }, 1000);
}
function stop() {
  running = false;
  clearInterval(timer);
  document.getElementById('toggle').textContent = mode === 'work' ? '开始专注' : '开始休息';
}
document.getElementById('toggle').onclick = function () { running ? stop() : start(); };
document.getElementById('reset').onclick = function () { remain = total; stop(); render(); };
document.querySelectorAll('.mode').forEach(function (b) {
  b.onclick = function () { setMode(b.getAttribute('data-m'), false); };
});
render();`,
});
