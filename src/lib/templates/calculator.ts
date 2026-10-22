// 模板：计算器（键盘支持 + 历史记录）
export const calculatorFiles = (): Record<string, string> => ({
  "index.html": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>极客计算器</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="app">
  <div class="panel">
    <div class="expr" id="expr">&nbsp;</div>
    <div class="result" id="result">0</div>
  </div>
  <div class="pad" id="pad">
    <button class="fn" data-k="AC">AC</button>
    <button class="fn" data-k="DEL">⌫</button>
    <button class="fn" data-k="%">%</button>
    <button class="op" data-k="/">÷</button>
    <button data-k="7">7</button><button data-k="8">8</button><button data-k="9">9</button>
    <button class="op" data-k="*">×</button>
    <button data-k="4">4</button><button data-k="5">5</button><button data-k="6">6</button>
    <button class="op" data-k="-">−</button>
    <button data-k="1">1</button><button data-k="2">2</button><button data-k="3">3</button>
    <button class="op" data-k="+">+</button>
    <button class="zero" data-k="0">0</button>
    <button data-k=".">.</button>
    <button class="eq" data-k="=">=</button>
  </div>
  <div class="history">
    <div class="h-head">历史记录 <button id="h-clear" class="ghost">清空</button></div>
    <ul id="h-list"></ul>
  </div>
</div>
<script src="app.js"></script>
</body>
</html>`,
  "style.css": `:root{--primary:#3b82f6;--bg:#0f0f18;--card:#171726;--line:#262640;--text:#ececf5;--muted:#8a8aa3}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;justify-content:center;align-items:flex-start;padding:36px 16px}
.app{width:100%;max-width:340px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;text-align:right;margin-bottom:14px}
.expr{color:var(--muted);font-size:14px;min-height:20px;word-break:break-all}
.result{font-size:38px;font-weight:700;font-variant-numeric:tabular-nums;word-break:break-all}
.pad{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.pad button{height:56px;border:0;border-radius:12px;background:#1e1e33;color:var(--text);font-size:19px;cursor:pointer;transition:filter .15s,transform .05s}
.pad button:hover{filter:brightness(1.25)}
.pad button:active{transform:scale(.96)}
.pad .fn{background:#23233c;color:#fbbf24}
.pad .op{background:rgba(59,130,246,.2);color:#93c5fd}
.pad .eq{background:var(--primary);color:#fff}
.pad .zero{grid-column:span 2}
.history{margin-top:18px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}
.h-head{display:flex;justify-content:space-between;align-items:center;color:var(--muted);font-size:13px;margin-bottom:8px}
.ghost{background:none;border:0;color:var(--muted);font-size:12px;cursor:pointer}
.ghost:hover{color:#f87171}
#h-list{list-style:none;max-height:160px;overflow:auto;display:flex;flex-direction:column;gap:6px}
#h-list li{font-size:13px;color:var(--muted);display:flex;justify-content:space-between;cursor:pointer;padding:6px 8px;border-radius:8px}
#h-list li:hover{background:#1e1e33;color:var(--text)}
#h-list b{color:var(--text)}`,
  "app.js": `var expr = '';
var elExpr = document.getElementById('expr');
var elRes = document.getElementById('result');
function display() {
  var pretty = expr.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/\+/g, ' + ').replace(/-/g, ' − ');
  elExpr.innerHTML = expr ? pretty : '&nbsp;';
  var v = safeEval(expr);
  elRes.textContent = v === null ? (expr ? '…' : '0') : String(v);
}
function safeEval(s) {
  if (!s || !/^[0-9+\-*/.%() ]+$/.test(s)) return null;
  if (/[+\-*/.]$/.test(s)) return null;
  try {
    var r = Function('return (' + s + ')')();
    if (typeof r !== 'number' || !isFinite(r)) return null;
    return Math.round(r * 1e10) / 1e10;
  } catch (e) { return null; }
}
function press(k) {
  if (k === 'AC') { expr = ''; }
  else if (k === 'DEL') { expr = expr.slice(0, -1); }
  else if (k === '=') {
    var v = safeEval(expr);
    if (v !== null) {
      addHistory(expr, v);
      expr = String(v);
    }
  }
  else if (k === '%') {
    var cur = safeEval(expr);
    if (cur !== null) expr = String(cur / 100);
  }
  else { expr += k; }
  display();
}
var history = [];
try { history = JSON.parse(localStorage.getItem('mol-calc-h') || '[]'); } catch (e) {}
function saveHistory() { try { localStorage.setItem('mol-calc-h', JSON.stringify(history.slice(0, 30))); } catch (e) {} }
function renderHistory() {
  var ul = document.getElementById('h-list');
  ul.innerHTML = '';
  history.forEach(function (h) {
    var li = document.createElement('li');
    var s = document.createElement('span');
    s.textContent = h.e + ' =';
    var b = document.createElement('b');
    b.textContent = h.r;
    li.append(s, b);
    li.onclick = function () { expr = h.e; display(); };
    ul.appendChild(li);
  });
}
function addHistory(e, r) { history.unshift({ e: e, r: r }); saveHistory(); renderHistory(); }
document.getElementById('h-clear').onclick = function () { history = []; saveHistory(); renderHistory(); };
document.getElementById('pad').addEventListener('click', function (ev) {
  var b = ev.target.closest('button');
  if (b) press(b.getAttribute('data-k'));
});
var KEY = { Enter: '=', Backspace: 'DEL', Escape: 'AC', '%': '%', '.': '.', '+': '+', '-': '-', '*': '*', '/': '/' };
document.addEventListener('keydown', function (e) {
  var k = /^[0-9]$/.test(e.key) ? e.key : KEY[e.key];
  if (k) { e.preventDefault(); press(k); }
});
renderHistory();
display();`,
});
