// 注入到预览 iframe 的运行时垫片（作为字符串内嵌进 <script>）
// 注意：内容中不能出现 "</script" 字面量。
//
// 能力：
// 1) localStorage 持久化桥：沙箱 iframe 无法访问真实存储（会抛 SecurityError）。
//    平台会在文档头部注入 window.__MOL_DATA__（上次会话的数据快照），
//    垫片以它初始化内存；任何写操作防抖后经 postMessage 上报父页，
//    由父页落库到服务端 —— 刷新/重开/重登后数据完整恢复。
// 2) alert/confirm/prompt 拦截（沙箱下本就不可用）
// 3) console / 运行时错误捕获 -> 父页控制台（供自检闭环使用）
export const HARNESS_JS = String.raw`
(function () {
  var send = function (type, payload) {
    try { parent.postMessage({ __molecules: 1, type: type, payload: payload }, '*'); } catch (e) {}
  };
  // ---- 1) localStorage / sessionStorage（内存垫片 + 持久化桥）----
  var snapshot = {};
  try { if (window.__MOL_DATA__ && typeof window.__MOL_DATA__ === 'object') snapshot = window.__MOL_DATA__; } catch (e) {}
  var useRealStorage = true;
  try { window.localStorage.getItem('__probe__'); } catch (e) { useRealStorage = false; }
  if (!useRealStorage) {
    var mem = {};
    for (var sk in snapshot) { if (Object.prototype.hasOwnProperty.call(snapshot, sk)) mem[sk] = String(snapshot[sk]); }
    var reportTimer = null;
    var report = function () {
      if (reportTimer) clearTimeout(reportTimer);
      reportTimer = setTimeout(function () { send('storage', mem); }, 400);
    };
    var shim = {
      setItem: function (k, v) { mem[k] = String(v); report(); },
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      removeItem: function (k) { delete mem[k]; report(); },
      clear: function () { mem = {}; report(); },
      key: function (i) { return Object.keys(mem)[i] || null; }
    };
    try {
      Object.defineProperty(window, 'localStorage', { value: shim, configurable: true });
      Object.defineProperty(window, 'sessionStorage', { value: shim, configurable: true });
    } catch (e2) {}
  }
  // ---- 2) alert/confirm/prompt 拦截 ----
  window.alert = function (m) { send('console', { level: 'warn', args: ['alert: ' + m] }); };
  window.confirm = function (m) { send('console', { level: 'warn', args: ['confirm（预览环境已拦截）: ' + m] }); return false; };
  window.prompt = function (m) { send('console', { level: 'warn', args: ['prompt（预览环境已拦截）: ' + m] }); return null; };
  // ---- 3) console / 错误捕获 -> 父页 ----
  var fmt = function (a) {
    try {
      if (typeof a === 'object' && a !== null) return JSON.stringify(a);
      return String(a);
    } catch (e) { return String(a); }
  };
  ['log', 'info', 'warn', 'error'].forEach(function (m) {
    var orig = console[m] ? console[m].bind(console) : function () {};
    console[m] = function () {
      send('console', { level: m, args: Array.prototype.map.call(arguments, fmt) });
      orig.apply(null, arguments);
    };
  });
  window.onerror = function (msg, src, line, col) {
    send('console', { level: 'error', args: [msg + ' (' + (line || 0) + ':' + (col || 0) + ')'] });
  };
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    send('console', { level: 'error', args: ['UnhandledRejection: ' + ((r && r.message) ? r.message : fmt(r))] });
  });
  window.addEventListener('load', function () { send('ready', { href: location.href }); });
})();
`;
