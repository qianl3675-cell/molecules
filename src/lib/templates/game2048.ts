// 模板：2048（初始方块/移动合并/计分/最高分/重开/撤销/主题换色/localStorage 持久化）
// —— 响应评审反馈：首版空棋盘、迭代后语法错误等问题在此模板中逐项落实并有单测保障
export const game2048Files = (): Record<string, string> => ({
  "index.html": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>2048</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="app">
  <header>
    <h1>2048</h1>
    <div class="scores">
      <div class="score-box"><span>分数</span><b id="score">0</b></div>
      <div class="score-box"><span>最高</span><b id="best">0</b></div>
    </div>
  </header>
  <div class="toolbar">
    <button id="btn-new">🔄 新游戏</button>
    <button id="btn-undo">↩️ 撤销</button>
    <button id="btn-theme">🎨 主题</button>
  </div>
  <div class="board" id="board"></div>
  <div class="overlay hide" id="overlay">
    <p class="big" id="ov-title">游戏结束</p>
    <button id="ov-btn">再来一局</button>
  </div>
  <p class="tip">方向键 / WASD 移动 · 相同数字合并 · 撤销可回退一步（棋盘与分数一起恢复）</p>
</div>
<script src="app.js"></script>
</body>
</html>`,
  "style.css": `:root{--primary:#7c3aed;--primary-soft:rgba(124,58,237,.15);--bg:#0f0f18;--card:#171726;--line:#262640;--text:#ececf5;--muted:#8a8aa3;--board-bg:#1b1b2e;--cell:#22223a}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:24px 16px}
.app{width:100%;max-width:400px}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
h1{font-size:30px;font-weight:800;color:var(--primary);transition:color .3s}
.scores{display:flex;gap:8px}
.score-box{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px 14px;text-align:center;min-width:64px}
.score-box span{display:block;font-size:10px;color:var(--muted)}
.score-box b{font-size:17px;font-variant-numeric:tabular-nums}
.toolbar{display:flex;gap:8px;margin-bottom:12px}
.toolbar button{flex:1;background:var(--card);border:1px solid var(--line);color:var(--text);border-radius:10px;padding:9px 0;font-size:13px;cursor:pointer;transition:all .2s}
.toolbar button:hover{border-color:var(--primary);color:#fff}
.board{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:var(--board-bg);border:1px solid var(--line);border-radius:14px;padding:8px;aspect-ratio:1}
.cell{background:var(--cell);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-variant-numeric:tabular-nums;transition:transform .12s ease,background .2s;user-select:none}
.cell.pop{animation:pop .16s ease}
@keyframes pop{from{transform:scale(.6)}to{transform:scale(1)}}
.t2{background:#3d3d5c;color:#cdd2ff}
.t4{background:#4a4a80;color:#dfe3ff}
.t8{background:#6a5acd;color:#fff}
.t16{background:#7c3aed;color:#fff}
.t32{background:#a855f7;color:#fff}
.t64{background:#d946ef;color:#fff}
.t128{background:#f59e0b;color:#fff}
.t256{background:#f97316;color:#fff}
.t512{background:#ef4444;color:#fff}
.t1024{background:#22c55e;color:#fff}
.t2048{background:#10b981;color:#fff;box-shadow:0 0 18px rgba(34,197,94,.5)}
.cell{font-size:clamp(16px,5.5vw,26px)}
.cell.big{font-size:clamp(13px,4vw,20px)}
.overlay{position:absolute;inset:0;border-radius:14px;background:rgba(10,10,18,.8);backdrop-filter:blur(3px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;z-index:5}
.overlay.hide{display:none}
.overlay .big{font-size:22px;font-weight:700}
.overlay button{background:var(--primary);color:#fff;border:0;border-radius:12px;padding:10px 28px;font-size:15px;cursor:pointer}
.tip{margin-top:12px;text-align:center;color:var(--muted);font-size:12px;line-height:1.7}`,
  "app.js": `var SIZE = 4;
var KEY = 'mol-2048-v1';
var THEMES = [
  { name: '紫', p: '#7c3aed', s: 'rgba(124,58,237,.15)' },
  { name: '蓝', p: '#3b82f6', s: 'rgba(59,130,246,.15)' },
  { name: '绿', p: '#22c55e', s: 'rgba(34,197,94,.15)' },
  { name: '橙', p: '#f97316', s: 'rgba(249,115,22,.15)' }
];
var board = new Array(16).fill(0);
var score = 0, best = 0, themeIdx = 0, over = false, won = false;
var history = [];

// ---- 存取档：键不存在（首次使用）才走默认初始化；已存储（含任意状态）一律以存储为准 ----
function load() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw !== null) {
      var d = JSON.parse(raw);
      if (d && Array.isArray(d.board) && d.board.length === 16) {
        board = d.board;
        score = d.score || 0; best = d.best || 0;
        themeIdx = d.themeIdx || 0;
        over = !!d.over; won = !!d.won;
        if (Array.isArray(d.history)) history = d.history;
        return;
      }
    }
  } catch (e) {}
  newGame();
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      board: board, score: score, best: best, themeIdx: themeIdx,
      over: over, won: won, history: history.slice(-20)
    }));
  } catch (e) {}
}

function emptyCells() {
  var out = [];
  for (var i = 0; i < 16; i++) if (board[i] === 0) out.push(i);
  return out;
}
function addRandom() {
  var cells = emptyCells();
  if (!cells.length) return;
  var idx = cells[Math.floor(Math.random() * cells.length)];
  board[idx] = Math.random() < 0.9 ? 2 : 4;
}
function newGame() {
  board = new Array(16).fill(0);
  score = 0; over = false; won = false; history = [];
  addRandom(); addRandom();          // 开局初始两个数字方块
  save(); render();
}

// ---- 移动与合并 ----
function slide(arr) {                 // 一行向左滑 + 合并
  var vals = arr.filter(function (v) { return v; });
  var out = [], gained = 0, i = 0;
  while (i < vals.length) {
    if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
      out.push(vals[i] * 2); gained += vals[i] * 2; i += 2;
    } else { out.push(vals[i]); i += 1; }
  }
  while (out.length < 4) out.push(0);
  return { row: out, gained: gained };
}
function lineIdx(dir, k) {            // 第 k 条线（依方向）的 4 个下标，均指向“滑动方向的前端”
  var idx = [];
  for (var j = 0; j < 4; j++) {
    if (dir === 'left') idx.push(k * 4 + j);
    else if (dir === 'right') idx.push(k * 4 + (3 - j));
    else if (dir === 'up') idx.push(j * 4 + k);
    else idx.push((3 - j) * 4 + k);
  }
  return idx;
}
function canMove() {
  if (emptyCells().length) return true;
  for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
    var v = board[r * 4 + c];
    if (c < 3 && board[r * 4 + c + 1] === v) return true;
    if (r < 3 && board[(r + 1) * 4 + c] === v) return true;
  }
  return false;
}
function move(dir) {
  if (over) return;
  var moved = false, gainedTotal = 0;
  var snapshot = board.slice();
  var prevScore = score;
  for (var k = 0; k < 4; k++) {
    var idx = lineIdx(dir, k);
    var arr = idx.map(function (i) { return board[i]; });
    var res = slide(arr);
    for (var j = 0; j < 4; j++) {
      if (board[idx[j]] !== res.row[j]) moved = true;
      board[idx[j]] = res.row[j];
    }
    gainedTotal += res.gained;
  }
  if (!moved) return;
  history.push({ board: snapshot, score: prevScore });   // 撤销快照：棋盘 + 分数
  if (history.length > 20) history.shift();
  score += gainedTotal;
  if (score > best) best = score;
  addRandom();
  if (!won && hasValue(2048)) { won = true; flash('🎉 达成 2048！继续挑战更高分'); }
  if (!canMove()) { over = true; }
  save(); render();
}
function hasValue(v) {
  for (var i = 0; i < 16; i++) if (board[i] === v) return true;
  return false;
}
function undo() {
  if (!history.length) { flash('没有可撤销的步骤了'); return; }
  var h = history.pop();
  board = h.board; score = h.score; over = false;
  save(); render();
}
function flash(msg) {
  var ov = document.getElementById('overlay');
  document.getElementById('ov-title').textContent = msg;
  ov.classList.remove('hide');
  document.getElementById('ov-btn').textContent = '继续';
}

// ---- 渲染 ----
function render() {
  var el = document.getElementById('board');
  el.innerHTML = '';
  for (var i = 0; i < 16; i++) {
    var d = document.createElement('div');
    var v = board[i];
    d.className = 'cell' + (v ? ' t' + v + ' pop' + (v >= 128 ? ' big' : '') : '');
    d.textContent = v ? String(v) : '';
    el.appendChild(d);
  }
  document.getElementById('score').textContent = String(score);
  document.getElementById('best').textContent = String(best);
  var theme = THEMES[themeIdx % THEMES.length];
  document.documentElement.style.setProperty('--primary', theme.p);
  document.documentElement.style.setProperty('--primary-soft', theme.s);
  document.getElementById('btn-theme').textContent = '🎨 主题·' + theme.name;
  var ov = document.getElementById('overlay');
  if (over) {
    document.getElementById('ov-title').textContent = '游戏结束 · ' + score + ' 分';
    document.getElementById('ov-btn').textContent = '再来一局';
    ov.classList.remove('hide');
  } else {
    ov.classList.add('hide');
  }
  document.getElementById('btn-undo').disabled = !history.length;
}

// ---- 事件 ----
var KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
document.addEventListener('keydown', function (e) {
  var dir = KEYS[e.key];
  if (!dir) return;
  e.preventDefault();
  move(dir);
});
document.getElementById('btn-new').onclick = newGame;
document.getElementById('btn-undo').onclick = undo;
document.getElementById('btn-theme').onclick = function () {
  themeIdx = (themeIdx + 1) % THEMES.length;
  save(); render();
};
document.getElementById('ov-btn').onclick = function () {
  if (over) newGame();
  else document.getElementById('overlay').classList.add('hide');
};

load();
`,
});
