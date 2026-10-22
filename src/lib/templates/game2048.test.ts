import { describe, expect, it } from "vitest";
import { game2048Files } from "./game2048";
import { validateFiles } from "../agent/validate";

const src = game2048Files()["app.js"] as string;

/** 从模板源码中提取函数源码并求值（测试真实实现，而非复制逻辑） */
function extractFn(name: string): (...args: unknown[]) => unknown {
  const m = src.match(new RegExp("function " + name + "\\([\\s\\S]*?\\n}"));
  if (!m) throw new Error("未找到函数 " + name);
  return new Function(m[0] + "; return " + name + ";")() as (...args: unknown[]) => unknown;
}

const slide = extractFn("slide") as (a: number[]) => { row: number[]; gained: number };

describe("2048 模板", () => {
  it("通过严格语法校验（评审反馈：迭代后语法错误的回归保障）", () => {
    expect(validateFiles(game2048Files())).toEqual([]);
  });

  it("开局初始化：newGame 生成两个初始数字方块", () => {
    expect(src).toMatch(/addRandom\(\); addRandom\(\);/);
    expect(src).toContain("// 开局初始两个数字方块");
  });

  it("撤销快照同时记录棋盘与分数", () => {
    expect(src).toContain("history.push({ board: snapshot, score: prevScore })");
    expect(src).toContain("board = h.board; score = h.score");
  });

  it("存储规范：键不存在（首次）才初始化，已存储一律以存储为准", () => {
    expect(src).toContain("if (raw !== null)");
  });

  it("slide：向左滑动与合并", () => {
    expect(slide([2, 2, 0, 0])).toEqual({ row: [4, 0, 0, 0], gained: 4 });
    expect(slide([2, 2, 2, 2])).toEqual({ row: [4, 4, 0, 0], gained: 8 });
    expect(slide([2, 0, 2, 4])).toEqual({ row: [4, 4, 0, 0], gained: 4 });
    expect(slide([0, 0, 0, 2])).toEqual({ row: [2, 0, 0, 0], gained: 0 });
    // 每行每格一回合只合并一次：[2,2,4] -> [4,4]（而非 8）
    expect(slide([2, 2, 4, 0])).toEqual({ row: [4, 4, 0, 0], gained: 4 });
  });

  it("lineIdx：四个方向的下标映射正确", () => {
    const lineIdx = extractFn("lineIdx") as (d: string, k: number) => number[];
    expect(lineIdx("left", 1)).toEqual([4, 5, 6, 7]);
    expect(lineIdx("right", 0)).toEqual([3, 2, 1, 0]);
    expect(lineIdx("up", 2)).toEqual([2, 6, 10, 14]);
    expect(lineIdx("down", 3)).toEqual([15, 11, 7, 3]);
  });
});
