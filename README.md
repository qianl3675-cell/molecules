# Molecules · AI 应用工坊

> 一个迷你版「[Atoms](https://atoms.dev/)」：向智能体描述你的想法，它将**规划 → 编写多文件代码 → 实时预览**一个完整可运行的网页应用；支持多轮对话迭代、人工改码协同、版本回滚、公开分享与 Remix。
>
> 名字由来：Atoms（原子）组合成 Molecules（分子）。

## ✨ 功能

| 模块 | 说明 |
|---|---|
| 🤖 智能体生成 | 流式输出「执行计划 + index.html/style.css/app.js 多文件代码」，写入过程实时可见 |
| 👁 实时预览 | 沙箱 iframe 直接运行生成的应用；桌面/移动端切换、刷新、新标签打开 |
| 🖥 运行控制台 | 捕获生成应用的 console 输出、运行时错误、alert 拦截（postMessage 上报） |
| 💬 多轮迭代 | 继续对话修改应用；演示模式支持换主题色/改名等轻量迭代 |
| ⌨ 人机协同 | 可直接编辑代码，保存即刷新预览（AI 写码 + 人改码） |
| 🕘 版本历史 | 每轮生成自动快照，一键回滚（回滚本身也是新版本，历史不丢失） |
| 🌍 分享 & Remix | 一键生成公开链接 `/p/{slug}`，访客可直接体验并「Remix」复制为自己的项目 |
| 📦 模板库 | 待办清单 / 番茄钟 / 贪吃蛇 / 落地页 / 计算器，一键起创 |
| 👤 账号体系 | 注册 / 登录 / 一键游客体验；数据服务端持久化 |

## 🚀 快速开始

```bash
npm install
npm run dev        # http://localhost:3000
```

**零配置即可体验**：未配置任何 API Key 时自动进入「演示模式」——内置模板智能体按需求意图流式生成完整应用（走通全部主流程）。

## 🔑 三种模型模式

| 模式 | 条件 | 说明 |
|---|---|---|
| 平台模型 | 服务端配置 `ANTHROPIC_API_KEY` | 所有用户直接用大模型生成（默认 `claude-opus-5-5`，可用 `AGENT_MODEL` 覆盖） |
| 个人模型（BYOK） | 用户在「设置」里填入自己的 Key | Key 仅存浏览器 localStorage，只随生成请求传输，服务端不落盘不打印 |
| 演示模式 | 无任何 Key | 内置意图识别 + 6 套高质量模板，流式体验与真模型一致（UI 明确标注） |

## 🧪 测试

```bash
npm test           # vitest 单元测试（25 个用例）
npm run build      # 生产构建（TS 严格类型检查）
```

覆盖：流式解析器（跨 chunk 半截标签/围栏容错/漏闭合容错）、预览组装器（内联替换/`</script>` 转义/替换特殊字符安全）、会话签名与口令哈希、文件存储适配器（CRUD/原子写/slug 索引）、意图识别与演示智能体事件流协议。

## ☁️ 部署（Vercel）

1. Fork / 导入本仓库到 Vercel；
2. 创建免费 [Upstash Redis](https://upstash.com)（无需信用卡），复制 REST URL 与 Token；
3. 在 Vercel 配置环境变量：

| 变量 | 必填 | 说明 |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | ✅（推荐） | Serverless 下的真实持久化；不配则退化为内存（重启丢数据） |
| `ANTHROPIC_API_KEY` | 可选 | 平台统一模型；不配则用户 BYOK / 演示模式 |
| `AUTH_SECRET` | ✅ | 会话签名密钥，随机长字符串 |
| `AGENT_MODEL` / `AGENT_MAX_TOKENS` | 可选 | 默认 `claude-opus-5-5` / `16000` |

4. 部署完成即得公开链接。

本地/自托管（有可写磁盘）无需 Upstash，数据落 `DATA_DIR`（默认 `./data/db.json`，原子写）。

## 🏗 架构（详见 [docs/DESIGN.md](docs/DESIGN.md)）

```
浏览器 ──REST/NDJSON流──> Next.js API Routes ──> 存储适配层（Upstash / 文件 / 内存）
  │                            │
  │ 沙箱 iframe(blob)          └── Anthropic Messages API（流式，服务端持钥或 BYOK）
  └── postMessage（console/错误上报 harness）
```

- **事件协议**：`{stage|plan|file_start|file_delta|file_end|done|error}` NDJSON —— 真模型与演示模式共用，前端无感切换；
- **安全模型**：生成代码 = 不可信代码，仅运行于 `sandbox="allow-scripts"` 的 iframe（无 same-origin，无法触达宿主页面/Cookie/localStorage）；harness 注入 localStorage 内存垫片（沙箱限制）、alert/confirm 拦截与日志上报；服务端对文件集做白名单校验（路径格式/数量/体积）；
- **取舍**：生成目标限定「自包含单页应用（无构建、无外部依赖）」，换取零构建实时预览 + 天然沙箱安全 + 短迭代上下文。

## 📁 目录速览

```
src/
  app/            页面与 API 路由（/  /login  /dashboard  /w/[id]  /p/[slug]  /api/*）
  components/     UI 基件 + workspace（聊天/代码/预览/分享/版本）
  lib/agent/      流式解析器 parser · 预览组装器 assemble · harness · prompt · anthropic · demo
  lib/store/      存储适配层（Upstash / File / 接口）
  lib/templates/  内置模板（演示模式 + 起创模板库）
```

## ⚠️ 已知限制

- 预览沙箱中应用的 localStorage 为内存垫片，预览刷新后不保留（分享页同理）；
- 演示模式仅支持意图模板 + 换色/改名轻量迭代（接模型后无此限制）；
- 账号为用户名+密码（无邮箱找回），适配 Demo 规模；
- 单机内存/文件存储不支持多实例横向扩容（Upstash 模式可）。
