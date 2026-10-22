import { describe, expect, it } from "vitest";
import { assembleDocument } from "./assemble";

const HTML = `<!DOCTYPE html>
<html>
<head><title>t</title><link rel="stylesheet" href="style.css"></head>
<body><div id="app"></div><script src="app.js"></script></body>
</html>`;

describe("assembleDocument", () => {
  it("内联 link/script 引用并注入 harness", () => {
    const out = assembleDocument({
      "index.html": HTML,
      "style.css": "body{background:#000}",
      "app.js": "console.log('hi')",
    });
    expect(out).toContain("<style>\nbody{background:#000}\n</style>");
    expect(out).not.toContain('href="style.css"');
    expect(out).toContain("console.log('hi')");
    expect(out).not.toContain('src="app.js"');
    expect(out).toContain("__molecules"); // harness
    // harness 在 <head> 之后、应用代码之前
    expect(out.indexOf("__molecules")).toBeLessThan(out.indexOf("body{background"));
  });

  it("转义 JS 中的 </script> 防止标签截断", () => {
    const out = assembleDocument({
      "index.html": "<html><head></head><body><script src=\"app.js\"></script></body></html>",
      "app.js": `var s = "</script>"; console.log(s);`,
    });
    expect(out).toContain('<\\/script>');
    // 外层只应有一对未转义的 script 开闭标签（harness + 内联 app）
    const opens = (out.match(/<script>/g) ?? []).length;
    const closes = (out.match(/<\/script>/g) ?? []).length;
    expect(opens).toBe(closes);
  });

  it("替换内容含 $& 等特殊字符时不被当作替换模式展开", () => {
    const out = assembleDocument({
      "index.html": HTML,
      "style.css": "a::after{content:'$& $$1'}",
      "app.js": "var x = '$&';",
    });
    expect(out).toContain("content:'$& $$1'");
    expect(out).toContain("var x = '$&';");
  });

  it("HTML 缺少引用时：CSS 注入 </head> 前，JS 注入 </body> 前", () => {
    const out = assembleDocument({
      "index.html": "<html><head></head><body><p>hi</p></body></html>",
      "style.css": "p{}",
      "app.js": "var a=1;",
    });
    expect(out.indexOf("p{}")).toBeLessThan(out.indexOf("</head>"));
    expect(out.indexOf("var a=1;")).toBeLessThan(out.indexOf("</body>"));
  });

  it("缺失 index.html 时使用兜底骨架", () => {
    const out = assembleDocument({ "app.js": "console.log(1)" });
    expect(out).toContain("<!DOCTYPE");
    expect(out).toContain("console.log(1)");
  });
});
