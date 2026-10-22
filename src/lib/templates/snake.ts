// 模板：贪吃蛇（Canvas + 键盘/虚拟方向键 + 最高分）
export const snakeFiles = (): Record<string, string> => ({
  "index.html": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>贪吃蛇</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="app">
  <header>
    <h1>🐍 贪吃蛇</h1>
    <div class="scores">
      <span>得分 <b id="score">0</b></span>
      <span>最高 <b id="best">0</b></span>
    </div>
  </header>
  <div class="stage-wrap">
    <canvas id="stage" width="360" height="360"></canvas>
    <div class="overlay" id="overlay">
      <p class="big" id="ov-title">准备好了吗？</p>
      <p class="tip" id="ov-tip">方向键 / WASD 控制，手机可用屏幕按键</p>
      <button id="ov-btn" class="primary">开始游戏</button>
    </div>
  </div>
  <div class="dpad">
    <button data-d="up">▲</button>
    <div class="row">
      <button data-d="left">◀</button>
      <button data-d="down">▼</button>
      <button data-d="right">▶</button>
    </div>
  </div>
</div>
<script src="app.js"></script>
</body>
</html>`,
  "style.css": `:root{--primary:#22c55e;--bg:#0f0f18;--card:#171726;--line:#262640;--text:#ececf5;--muted:#8a8aa3}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:24px 16px}
.app{width:100%;max-width:400px;text-align:center}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
h1{font-size:22px}
.scores{font-size:13px;color:var(--muted);display:flex;gap:14px}
.scores b{color:var(--primary);font-size:15px}
.stage-wrap{position:relative;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#12121f}
canvas{display:block;width:100%;height:auto}
.overlay{position:absolute;inset:0;background:rgba(10,10,18,.78);backdrop-filter:blur(3px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
.overlay.hide{display:none}
.big{font-size:22px;font-weight:700}
.tip{color:var(--muted);font-size:13px}
button.primary{background:var(--primary);color:#04140a;border:0;border-radius:12px;padding:11px 30px;font-size:15px;font-weight:600;cursor:pointer;transition:filter .2s}
button.primary:hover{filter:brightness(1.1)}
.dpad{margin-top:18px;display:flex;flex-direction:column;align-items:center;gap:6px}
.dpad .row{display:flex;gap:6px}
.dpad button{width:56px;height:44px;background:var(--card);border:1px solid var(--line);border-radius:10px;color:var(--text);font-size:16px;cursor:pointer}
.dpad button:active{background:var(--line)}
@media (min-width:768px){.dpad{display:none}}`,
  "app.js": `var N = 18, CELL = 20;
var canvas = document.getElementById('stage');
var ctx = canvas.getContext('2d');
var snake, dir, nextDir, food, score, best = 0, timer = null, speed;
try { best = parseInt(localStorage.getItem('mol-snake-best') || '0', 10) || 0; } catch (e) {}
document.getElementById('best').textContent = String(best);
function reset() {
  snake = [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }];
  dir = { x: 1, y: 0 }; nextDir = dir;
  score = 0; speed = 150;
  document.getElementById('score').textContent = '0';
  placeFood();
}
function placeFood() {
  do {
    food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
  } while (snake.some(function (s) { return s.x === food.x && s.y === food.y; }));
}
function draw() {
  ctx.fillStyle = '#12121f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  snake.forEach(function (s, i) {
    ctx.fillStyle = i === 0 ? '#4ade80' : '#22c55e';
    var pad = i === 0 ? 1 : 2;
    ctx.beginPath();
    ctx.roundRect(s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 5);
    ctx.fill();
  });
}
function step() {
  dir = nextDir;
  var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N ||
      snake.some(function (s) { return s.x === head.x && s.y === head.y; })) {
    return gameOver();
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    document.getElementById('score').textContent = String(score);
    if (score > best) {
      best = score;
      document.getElementById('best').textContent = String(best);
      try { localStorage.setItem('mol-snake-best', String(best)); } catch (e) {}
    }
    placeFood();
    if (speed > 70) { speed -= 3; clearInterval(timer); timer = setInterval(step, speed); }
  } else {
    snake.pop();
  }
  draw();
}
function gameOver() {
  clearInterval(timer); timer = null;
  var ov = document.getElementById('overlay');
  document.getElementById('ov-title').textContent = '游戏结束 · ' + score + ' 分';
  document.getElementById('ov-btn').textContent = '再来一局';
  ov.classList.remove('hide');
}
function start() {
  reset();
  document.getElementById('overlay').classList.add('hide');
  draw();
  clearInterval(timer);
  timer = setInterval(step, speed);
}
document.getElementById('ov-btn').onclick = start;
var KEYMAP = {
  ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }
};
document.addEventListener('keydown', function (e) {
  var nd = KEYMAP[e.key];
  if (!nd) return;
  e.preventDefault();
  if (nd.x === -dir.x && nd.y === -dir.y) return; // 不允许直接掉头
  nextDir = nd;
  if (!timer) start();
});
document.querySelectorAll('.dpad button').forEach(function (b) {
  b.onclick = function () {
    var map = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
    var nd = map[b.getAttribute('data-d')];
    if (nd.x === -dir.x && nd.y === -dir.y) return;
    nextDir = nd;
  };
});
reset();
draw();`,
});
