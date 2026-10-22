// 预览组装器（纯函数，前后端通用）：
// 将多文件(index.html + *.css/*.js)组装为单个自包含 HTML 文档，并注入沙箱 harness。
// 可选注入应用数据快照（__MOL_DATA__），配合 harness 持久化桥恢复 localStorage。
// 安全：生成代码只在 sandbox="allow-scripts" 的 iframe 中运行（无 same-origin），
// harness 提供 localStorage 内存垫片、alert/confirm 拦截、console/错误捕获（postMessage 给父页）。
import { HARNESS_JS } from "./harness";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 数据快照序列化（防 </script> 截断） */
function dataScript(appData: Record<string, string> | null | undefined): string {
  if (!appData || Object.keys(appData).length === 0) return "";
  const json = JSON.stringify(appData).replace(/</g, "\\u003c");
  return `<script>window.__MOL_DATA__=${json};</script>\n`;
}

/** 将外链 css/js 内联；引用缺失时注入 head/body 尾部 */
function inlineAll(html: string, files: Record<string, string>): string {
  let out = html;
  for (const [p, content] of Object.entries(files)) {
    if (p === "index.html" || !content) continue;
    if (p.endsWith(".css")) {
      const tag = `<style>\n${content}\n</style>`;
      const re = new RegExp(`<link[^>]*href=["'][./]*${escapeRegExp(p)}["'][^>]*>`, "gi");
      if (re.test(out)) {
        re.lastIndex = 0;
        out = out.replace(re, () => tag);
      } else {
        out = out.includes("</head>") ? out.replace("</head>", () => tag + "\n</head>") : tag + out;
      }
    } else if (p.endsWith(".js")) {
      // 防止 JS 字符串中的 </script> 截断外层标签
      const safe = content.replace(/<\/script/gi, "<\\/script");
      const tag = `<script>\n${safe}\n</script>`;
      const re = new RegExp(`<script[^>]*src=["'][./]*${escapeRegExp(p)}["'][^>]*>\\s*</script>`, "gi");
      if (re.test(out)) {
        re.lastIndex = 0;
        out = out.replace(re, () => tag);
      } else {
        out = out.includes("</body>") ? out.replace("</body>", () => tag + "\n</body>") : out + tag;
      }
    }
  }
  return out;
}

/** 无 index.html 时的兜底骨架（模型只输出了 css/js 的容错） */
function fallbackDoc(files: Record<string, string>): string {
  void files;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>App</title></head>
<body>
  <div id="app"></div>
</body>
</html>`;
}

export function assembleDocument(
  files: Record<string, string>,
  appData?: Record<string, string> | null
): string {
  const html = files["index.html"] ?? fallbackDoc(files);
  let out = inlineAll(html, files);
  // 注入数据快照 + harness：紧跟 <head>（保证先于应用代码执行）
  const head = `\n${dataScript(appData)}<script>${HARNESS_JS}</script>`;
  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => m + head);
  } else {
    out = `<head><meta charset="utf-8">${head}</head>\n${out}`;
  }
  return out;
}
