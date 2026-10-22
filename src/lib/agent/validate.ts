// 生成产物静态校验（纯函数，浏览器/Node 双端可用）
// - JS：new Function 编译（只编译不执行，可捕获语法错误）
// - CSS：花括号配对
// - HTML：结束标签与基本结构
export interface ValidationIssue {
  file: string;
  message: string;
}

export function validateFiles(files: Record<string, string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const [path, content] of Object.entries(files)) {
    if (typeof content !== "string" || !content.trim()) {
      issues.push({ file: path, message: "文件内容为空" });
      continue;
    }
    if (path.endsWith(".js") || path.endsWith(".mjs")) {
      try {
        // 仅编译不执行：可捕获语法错误，不触发任何运行时行为
        new Function(content);
      } catch (e) {
        issues.push({ file: path, message: `JS 语法错误：${(e as Error).message}` });
      }
    } else if (path.endsWith(".css")) {
      const open = (content.match(/{/g) ?? []).length;
      const close = (content.match(/}/g) ?? []).length;
      if (open !== close) {
        issues.push({ file: path, message: `CSS 花括号不配对（{ ${open} 个，} ${close} 个）` });
      }
    } else if (path.endsWith(".html")) {
      if (!/<\/body>/i.test(content) || !/<\/html>/i.test(content)) {
        issues.push({ file: path, message: "HTML 缺少 </body> 或 </html> 结束标签" });
      }
      if (!/<script[^>]*src=["'][^"']*app\.js/i.test(content) && files["app.js"]) {
        issues.push({ file: path, message: "index.html 未引用 app.js（存在该文件但未通过 <script src> 加载）" });
      }
    }
  }
  return issues;
}
