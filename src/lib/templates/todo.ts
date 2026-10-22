// 模板：极简待办（localStorage 持久化 + 筛选）
export const todoFiles = (): Record<string, string> => ({
  "index.html": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>极简待办</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="app">
  <header>
    <h1>✅ 极简待办</h1>
    <p class="sub" id="summary">今日事今日毕</p>
  </header>
  <form id="form">
    <input id="input" type="text" placeholder="添加一个任务…" autocomplete="off" maxlength="60">
    <button type="submit">添加</button>
  </form>
  <div class="filters">
    <button class="chip active" data-f="all">全部</button>
    <button class="chip" data-f="active">进行中</button>
    <button class="chip" data-f="done">已完成</button>
  </div>
  <ul id="list"></ul>
  <footer id="footer" style="display:none">
    <span id="left"></span>
    <button id="clear" class="ghost">清除已完成</button>
  </footer>
</div>
<script src="app.js"></script>
</body>
</html>`,
  "style.css": `:root{--primary:#7c3aed;--primary-soft:rgba(124,58,237,.14);--bg:#0f0f18;--card:#171726;--line:#262640;--text:#ececf5;--muted:#8a8aa3;--danger:#f87171}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;justify-content:center;padding:40px 16px}
.app{width:100%;max-width:520px}
h1{font-size:26px;letter-spacing:.5px}
.sub{color:var(--muted);font-size:13px;margin-top:6px}
#form{display:flex;gap:10px;margin:22px 0 14px}
#input{flex:1;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;color:var(--text);font-size:15px;outline:none;transition:border-color .2s}
#input:focus{border-color:var(--primary)}
#form button{background:var(--primary);color:#fff;border:0;border-radius:12px;padding:0 18px;font-size:15px;cursor:pointer;transition:filter .2s}
#form button:hover{filter:brightness(1.15)}
.filters{display:flex;gap:8px;margin-bottom:14px}
.chip{background:transparent;border:1px solid var(--line);color:var(--muted);border-radius:999px;padding:5px 14px;font-size:13px;cursor:pointer;transition:all .2s}
.chip.active{background:var(--primary-soft);border-color:var(--primary);color:#c4b5fd}
#list{list-style:none;display:flex;flex-direction:column;gap:8px}
.item{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;animation:in .25s ease}
@keyframes in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.item input{accent-color:var(--primary);width:18px;height:18px;cursor:pointer}
.item span{flex:1;font-size:15px;word-break:break-all}
.item.done span{color:var(--muted);text-decoration:line-through}
.item .del{background:none;border:0;color:var(--muted);cursor:pointer;font-size:15px;opacity:0;transition:opacity .2s}
.item:hover .del{opacity:1}
.item .del:hover{color:var(--danger)}
footer{display:flex;justify-content:space-between;align-items:center;margin-top:16px;color:var(--muted);font-size:13px}
.ghost{background:none;border:0;color:var(--muted);cursor:pointer;font-size:13px}
.ghost:hover{color:var(--danger)}
.empty{text-align:center;color:var(--muted);padding:36px 0;font-size:14px}`,
  "app.js": `var KEY = 'mol-todo-v1';
var state = {
  filter: 'all',
  todos: [
    { id: 1, text: '体验 Molecules 生成的待办应用', done: true },
    { id: 2, text: '用一句话让它变成你想要的样子', done: false },
    { id: 3, text: '完成今天最重要的三件事', done: false }
  ]
};
// 存储规范：键不存在（首次使用）才用默认数据；已存储（包括空数组=用户已清空）一律以存储为准
try {
  var raw = localStorage.getItem(KEY);
  if (raw !== null) {
    var saved = JSON.parse(raw);
    if (Array.isArray(saved)) state.todos = saved;
  }
} catch (e) {}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state.todos)); } catch (e) {} }
function render() {
  var list = document.getElementById('list');
  var todos = state.todos.filter(function (t) { return state.filter === 'all' || (state.filter === 'done') === t.done; });
  list.innerHTML = '';
  if (!todos.length) {
    var li = document.createElement('li');
    li.className = 'empty';
    li.textContent = state.filter === 'all' ? '还没有任务，添加一个吧' : '该分类下暂无任务';
    list.appendChild(li);
  }
  todos.forEach(function (t) {
    var li = document.createElement('li');
    li.className = 'item' + (t.done ? ' done' : '');
    var cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = t.done;
    cb.onchange = function () { t.done = cb.checked; save(); render(); };
    var sp = document.createElement('span');
    sp.textContent = t.text;
    var del = document.createElement('button');
    del.className = 'del'; del.textContent = '✕';
    del.onclick = function () { state.todos = state.todos.filter(function (x) { return x !== t; }); save(); render(); };
    li.append(cb, sp, del);
    list.appendChild(li);
  });
  var left = state.todos.filter(function (t) { return !t.done; }).length;
  document.getElementById('left').textContent = left + ' 项待完成';
  document.getElementById('summary').textContent = state.todos.length ? ('共 ' + state.todos.length + ' 项，剩 ' + left + ' 项') : '今日事今日毕';
  document.getElementById('footer').style.display = state.todos.some(function (t) { return t.done; }) ? 'flex' : 'none';
}
document.getElementById('form').onsubmit = function (e) {
  e.preventDefault();
  var input = document.getElementById('input');
  var text = input.value.trim();
  if (!text) return;
  state.todos.unshift({ id: Date.now(), text: text, done: false });
  input.value = ''; save(); render();
  input.focus();
};
document.getElementById('clear').onclick = function () {
  state.todos = state.todos.filter(function (t) { return !t.done; });
  save(); render();
};
document.querySelectorAll('.chip').forEach(function (c) {
  c.onclick = function () {
    document.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('active'); });
    c.classList.add('active');
    state.filter = c.getAttribute('data-f');
    render();
  };
});
render();`,
});
