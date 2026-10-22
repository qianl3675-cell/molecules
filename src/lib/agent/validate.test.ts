import { describe, expect, it } from "vitest";
import { validateFiles } from "./validate";

describe("validateFiles（生成产物静态校验）", () => {
  it("合法文件集通过", () => {
    expect(
      validateFiles({
        "index.html": "<html><head></head><body><script src=\"app.js\"></script></body></html>",
        "style.css": "a{color:red}",
        "app.js": "var x = 1; console.log(x);",
      })
    ).toEqual([]);
  });

  it("捕获 JS 语法错误（评审场景：追加功能后代码损坏）", () => {
    const issues = validateFiles({ "app.js": "function f( { return 1; }" });
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("JS 语法错误");
    expect(issues[0].file).toBe("app.js");
  });

  it("捕获 CSS 花括号不配对", () => {
    expect(validateFiles({ "style.css": "a{color:red" })[0].message).toContain("花括号");
  });

  it("捕获 HTML 结构缺失与未引用 app.js", () => {
    const issues = validateFiles({
      "index.html": "<html><body><p>hi</p>",
      "app.js": "var a=1;",
    });
    expect(issues.some((i) => i.message.includes("结束标签"))).toBe(true);
    expect(issues.some((i) => i.message.includes("未引用 app.js"))).toBe(true);
  });

  it("空文件被标记", () => {
    expect(validateFiles({ "app.js": "   " })[0].message).toBe("文件内容为空");
  });
});
