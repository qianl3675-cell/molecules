// 注入到预览 iframe 的运行时垫片（作为字符串内嵌进 <script>）
// 注意：内容中不能出现 "</script" 字面量。
export const HARNESS_JS = String.raw`
(function () {
  var send = function (type, payload) {
    try { parent.postMessage({ __molecules: 1, type: type, payload: payload }, '*'); } catch (e) {}
  };
  // 1) localStorage 内存垫片：sandbox iframe 访问真实 localStorage 会抛 SecurityError
  try { window.localStorage.getItem('__probe__'); } catch (e) {
    var mem = {};
    var shim = {
      setItem: function (k, v) { mem[k] = String(v); },
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      removeItem: function (k) { delete mem[k]; },
      clear: function () { mem = {}; },
      key: function (i) { return Object.keys(mem)[i] || null; }
    };
    shim.length = 0;
    try {
      Object.defineProperty(window, 'localStorage', { value: shim, configurable: true });
      Object.defineProperty(window, 'sessionStorage', { value: shim, configurable: true });
    } catch (e2) {}
  }
  // 2) alert/confirm 拦截（sandbox 下本就不可用）
  window.alert = function (m) { send('console', { level: 'warn', args: ['alert: ' + m] }); };
  window.confirm = function (m) { send('console', { level: 'warn', args: ['confirm（预览环境已拦截）: ' + m] }); return false; };
  window.prompt = function (m) { send('console', { level: 'warn', args: ['prompt（预览环境已拦截）: ' + m] }); return null; };
  // 3) console / 错误捕获 -> 父页面板
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
