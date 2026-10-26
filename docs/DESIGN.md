# Molecules（Atoms-Demo）实现方案

> 目标：在 6–8 小时等效工作量内，交付一个"类似 Atoms"的可运行 AI Agent 应用生成平台：
> 用户用自然语言描述需求 → 智能体流式生成代码（计划 → 多文件代码）→ 生成的应用以可视化网页实时预览 → 可继续对话迭代 → 数据持久化 → 可分享。
>
> 产品名 **Molecules**：致敬 Atoms——原子组合成分子。
>
> **v2 修订（2026-10-22）**：根据笔试评审反馈新增「生成后自检闭环」与「应用数据持久化桥」，2048 完整实现纳入模板库；实际部署平台为 Render + Upstash + 智谱 GLM（glm-5.1）。详见 §6 v2 小节、§8 R16/R17、§9/§10 实测记录。

---

## 1. 需求拆解（对照笔试要求）

| 笔试要求 | 对应设计 |
|---|---|
| 智能体驱动完成代码（应用）生成 | 对话式工作台：Agent 输出「执行计划 + 多文件代码」，流式呈现 |
| 生成的应用以可视化网页展示 | 沙箱 iframe 实时预览（桌面/移动端切换、刷新、新标签打开、运行控制台） |
| 真实交互（非静态） | 全流程可操作：注册登录、创建、对话迭代、人工改码、版本回滚、分享 Remix |
| 数据持久化 | 服务端存储适配层：Upstash Redis（云）/ JSON 文件（本地/自托管），账户、项目、版本全落盘 |
| 基本使用流程 | 注册 / 登录 / 一键游客体验 → 新建应用（描述或模板）→ Agent 生成 → 预览与迭代 |
| 至少一个延展能力 | ① 版本历史与一键回滚 ② 公开分享链接 + Remix ③ 人工直接编辑代码与 AI 协同 ④ 模板库 |
| 可测试在线链接 + GitHub 源码 | 线上部署于 **Render**（免费档）+ Upstash Redis + 智谱 GLM；亦支持 Vercel / 任意 Node 宿主，零密钥也可完整体验 |
| 简要说明文档 | README + 本 DESIGN + SUBMISSION |

**明确不做（取舍）**：真实多租户计费、复杂权限体系、生成 React/Next 多文件工程与构建（Demo 生成的目标应用限定为「自包含单页 Web 应用」，无构建步骤——这是复杂度控制的关键取舍，理由见 §8-R2）。

---

## 2. 技术选型

| 层 | 选择 | 理由 |
|---|---|---|
| 框架 | Next.js 15（App Router）+ TypeScript | 前后端一体、API Routes 内置流式响应，静态托管/Serverless 均可部署，单人 6-8h 内可完成的最短路径 |
| UI | TailwindCSS 3 + lucide-react + prismjs | 手写少量组件（Button/Modal/Tabs/Toast），不引重组件库，控制复杂度 |
| 认证 | 用户名+密码（bcryptjs）+ HMAC 签名 Cookie 会话 | 无第三方依赖、无邮件依赖；Demo 场景下够用且安全基线清晰 |
| 存储 | 适配器模式：**Upstash Redis（REST）** / **本地 JSON 文件** / 内存兜底 | 见 §5，是本方案工程思维的核心展示点 |
| LLM | Anthropic 协议（官方 API / 智谱 GLM 兼容端点，服务端流式代理） | 双供应商一套代码：官方走 beta+refusal fallback，兼容端点走原生 /v1/messages；服务端持钥（env）或用户 BYOK（请求头，不落盘）；演示模式无钥可用 |
| 测试 | vitest 单测（纯逻辑层）+ next build + curl 冒烟 | 覆盖正确性关键路径，成本可控 |

## 3. 总体架构

```
┌────────────────────────── 浏览器 ──────────────────────────┐
│  落地页/登录  │  仪表盘  │  工作台 /w/[id]  │  分享页 /p/[slug]  │
│      │             │           │                    │          │
│      │   ChatPanel │ FileTree/CodeView │ PreviewPane(沙箱iframe)│
│      │             │   useWorkspace（工作台状态机）           │
└──────┬─────────────────────────┬───────────────────┬─────────┘
       │ REST(JSON)              │ NDJSON 流(fetch reader)  │ postMessage(沙箱↔父页)
┌──────▼─────────────────────────▼───────────────────▼─────────┐
│ Next.js API Routes                                            │
│  /api/auth/*  /api/projects/*  /api/public/[slug]  /api/agent │
│       │                          │                            │
│  lib/auth(HMAC+bcrypt)     lib/agent：parser→events           │
│  lib/store（适配器）         assemble(注入harness)  anthropic  │
│       │                          │                            │
│  Upstash / JSON文件 / 内存     Anthropic API（流式）            │
└───────────────────────────────────────────────────────────────┘
```

- **生成目标格式**：Agent 产出 `index.html`（+可选 `style.css`、`app.js` 等少量文件）。预览时组装器把 CSS/JS 内联进 HTML，并注入 harness 脚本，经 `blob:` URL 放入 `sandbox="allow-scripts"` 的 iframe。
- **事件协议（NDJSON）**：`{type:'stage'|'thinking'|'plan'|'file_start'|'file_delta'|'file_end'|'done'|'error'}`，同一协议同时驱动「真模型」与「演示模式」，前端无感知差异。v2 新增 `thinking`（思考增量实时转发）与首字节心跳（响应立即下发空 stage 事件，避免长思考期间代理链路空转挂起）。

## 4. 数据模型

```ts
User    { id, username, passHash, createdAt }
Project { id, ownerId, title, slug?, isPublic,
          files: Record<path, content>,
          messages: {role:'user'|'agent', text, ts}[],
          versions: {id, ts, label, files}[],   // 每轮生成快照，上限30
          createdAt, updatedAt }
```

API：

- `POST /api/auth/register|login|logout|demo`，`GET /api/auth/me`
- `GET/POST /api/projects`（POST 支持 `template` / `copyFrom` 起始方式）
- `GET/PATCH/DELETE /api/projects/[id]`（PATCH：改名/换文件/追加消息与版本/公开开关）
- `GET /api/public/[slug]`
- `POST /api/agent`（流式；头 `x-llm-key` 可选 BYOK）+ `GET /api/agent/status`

## 5. 存储适配层（工程亮点）

统一 `Store` 接口（getUser/upsertUser/listProjects/getProject/saveProject/deleteProject）：

1. **UpstashAdapter**：环境变量存在时启用。纯 `fetch` 调 REST（不引 SDK），单键存整个项目 JSON + `user:{id}:projects` 集合做索引；**管道端点实测为 `/pipeline` 路径**（`?pipeline=true` 查询参数不被识别，已用 mock fetch 单测锁死协议）。Serverless（Render/Vercel）下真实持久化。
2. **FileAdapter**：本地/自托管默认。单 JSON 文件 + 临时文件 rename 原子写。
3. **MemoryAdapter**：FS 不可写时的兜底（部署忘配 Upstash 也不至于 500），启动时告警提示。

## 6. Agent 设计

**System Prompt 要点**：角色=资深前端；只输出 `<plan>`（步骤列表）与 `<file path="...">`（完整文件内容）标签；纯原生 HTML/CSS/JS、无构建、无外部网络依赖（本地运行也不受影响）；默认中文文案；迭代时只输出被修改文件的完整内容。

**流式解析器（核心纯函数）**：`AgentStreamParser.push(chunk) → Event[]`。状态机在 `<file>`/`</file>`/`<plan>` 标签间切换；跨 chunk 的半截标签用「保留缓冲尾部」策略；容忍模型输出的 markdown 围栏。单测覆盖按 1–3 字符切 chunk、无 plan、文件内围栏等边界。

**预览组装器（纯函数）**：`assemble(files) → {html, externalRefs}`。将 `<link href="style.css">` / `<script src="app.js">` 替换为内联；注入 harness 脚本——

- `localStorage` 内存垫片（沙箱 iframe 不带 `allow-same-origin` 时访问 localStorage 会抛 SecurityError，生成应用常用 localStorage，必须垫）
- `alert/confirm` 垫片
- console.log/error、window.onerror 捕获 → `postMessage` 给父页 → 工作台「控制台」面板

**安全模型**：生成代码=不可信代码。iframe 仅 `sandbox="allow-scripts"`（无 same-origin，无法触达父页 DOM/Cookie/localStorage 与同源接口）；分享页同理。

**演示模式（无任何 API Key 可用）**：`agent/status` 返回 `demo` 时，前端运行本地确定性智能体——意图识别（待办/番茄钟/贪吃蛇/落地页/计算器/2048 + 个性化兜底）+ 内置高质量模板 + 打字机式流式事件（同一协议），并明确标注「演示模式」。保证 HR 打开部署链接无需任何配置即可完整走通主流程。

**v2 新增：生成后自检闭环**（响应评审反馈）。每轮生成/自动修复完成后自动执行：
1. 静态校验（validateFiles）：JS 用 `new Function` 只编译不执行（可捕获语法错误且无副作用）、CSS 花括号配对、HTML 结束标签与 app.js 引用检查；
2. 沙箱试运行：4.5s 错误观察窗，收集 harness 上报的运行时错误与就绪（load）信号；
3. 有问题 → 把错误清单回喂模型**自动修复（≤2 轮）**，全程在对话中可见；通过才提示「✅ 已完成」，失败给出明确问题清单与控制台入口；人工编辑代码同样实时校验。

**v2 新增：应用数据持久化桥**（响应评审反馈）。沙箱 iframe 无 same-origin、无法访问真实 localStorage——不允许加 `allow-same-origin`（等于拆掉沙箱）。解法：harness 的 localStorage 垫片以注入的 `__MOL_DATA__` 快照初始化，任何写操作防抖 400ms 后 postMessage 上报父页，父页再防抖 800ms 落库到 `pd:{projectId}:{userId}`（项目×用户维度，≤50 键/32KB）；打开预览时注入快照恢复——刷新/重开项目/退出重登数据完整保留。系统提示词同步增加硬性存储规范：`getItem() !== null` 才视为首次使用，空状态（如空任务列表）是合法数据，绝不重灌默认值。

**模型选型实录（v2）**：一套代码双供应商——官方 Anthropic（beta + refusal fallback）与智谱 GLM 兼容端点（原生 /v1/messages）。实测 glm-5.3「始终深度思考且不可关闭」（错误码 1210），思考会吞掉 max_tokens 并导致长时间无正文输出；定版 **glm-5.1**（即问即写，40-60s 出完整应用）。配套两项流式加固：thinking 增量转发为独立事件（用户实时可见）、响应先发首字节心跳（实测首字节从挂起 240s → 1-4s）。

## 7. 页面与交互

1. **落地页**：品牌、价值主张、CTA（开始构建 / 登录）。
2. **登录页**：注册/登录切换 + 「一键游客体验」（demo 账号，数据可延续）。
3. **仪表盘**：我的应用网格（标题/更新时间/文件数/公开标记）、新建（描述 or 模板库）、重命名、删除（确认）、设置（BYOK/模型信息）。
4. **工作台**（核心）：
   - 左：对话面板（流式计划清单✓、正在写入的文件实时滚动、Stop、错误重试）
   - 右：Tab 预览/代码。预览=沙箱 iframe + 设备切换/刷新/新标签/控制台；代码=文件树 + 高亮查看/编辑（人工改码→保存→预览刷新）
   - 顶栏：标题行内编辑、保存状态、版本抽屉（回滚）、分享弹窗（公开开关+链接复制+Remix 说明）
   - 生成完成自动切到预览（v0 式编排感）
5. **分享页** `/p/[slug]`：全屏只读预览 + 「用 Molecules 创作」+ Remix 一键复制为自己的项目。

## 8. 方案深度评审（自审记录）

> 以下是对上文的对抗性审查：每个风险给出结论，评审通过或修改后通过。

- **R1 单页应用作为生成目标，是否"不够 Atoms"？** 结论：通过。笔试 Highlight 明确"不考察用 Atoms 做 Atoms"，考察想法→可运行原型的转化。自包含单页应用可零构建实时预览、天然沙箱安全、迭代上下文短（省 token/延迟）。在 README 中说明这是有意取舍，并给出"多文件工程生成 + WebContainer"的演进路线。
- **R2 沙箱 iframe 中 localStorage 抛 SecurityError（生成应用高概率用到）**。结论：已解决——harness 注入内存垫片（try/catch 探测后替换）。预览态数据不跨刷新保留，属可接受限制并已注明。
- **R3 演示模式会不会被误判为"假产品"？** 结论：利大于弊，保留但强约束——① UI 持续标注"演示模式"；② 设置面板一键填入个人 API Key 立即变真模型（BYOK 不落盘）；③ README/提交文档如实说明。它把"可测试链接"的评估成本降到零。
- **R4 srcdoc vs blob URL**：选 blob（iframe 与"新标签打开"复用同一 URL 构造逻辑），均保持 sandbox 属性。
- **R5 模型不守格式协议（围栏/漏标签/多余解释）**：解析器宽容处理（剥离围栏、无 plan 也允许、标签外文本按说明渲染）；System Prompt 严格约束 + max_tokens 上限；错误以事件流回传并在 UI 给重试。
- **R6 Next 15 破坏性变更（async params/cookies）**：开发时统一 `await`；风险受控。
- **R7 认证安全**：bcrypt(cost10) + HMAC-SHA256 签名 Cookie（httpOnly/sameSite=lax/prod 下 secure）+ AUTH_SECRET；无邮箱找回（Demo 范围）。通过。
- **R8 Upstash/文件双实现的正确性**：共享同一接口 + 各自单测（文件适配器用临时目录原子性测试）；内存兜底防部署配置缺失导致全站 500。
- **R9 并发写覆盖**：Demo 规模单用户操作为主；文件适配器原子写 + 整体 JSON 快照语义（最后写赢）；不做行级锁（明确不做的复杂度）。通过。
- **R10 XSS/注入**：用户内容全部经 React 转义；生成代码只进沙箱；代码高亮先 escape 再高亮。通过。
- **R11 BYOK 泄露面**：Key 仅存 localStorage、仅随 /api/agent 请求头传输、服务端不打印不落盘；README 声明。通过。
- **R12 上下文膨胀（迭代轮次多）**：每次请求只带「当前全部文件 + 最近 6 条消息 + 首条需求」，文件本身即状态。通过。
- **R13 版本存储膨胀**：快照上限 30，超限淘汰最旧（保留首版）。通过。
- **R14 移动端可用性**：工作台在窄屏改为上下堆叠（预览/代码 Tab 保留），不追求完美移动体验（明确取舍）。通过。
- **R15 时间盒风险**：按优先级裁剪顺序：控制台面板 → 模板数量(≥4) → Remix → 移动端优化。核心链路（注册→创建→生成→预览→迭代→持久化→分享）最先保证。

**评审结论**：方案通过，进入开发。开发顺序：脚手架 → 纯逻辑层（parser/assemble/auth/store，含单测）→ API → 前端 → 联调冒烟 → 文档。

**v2 追加评审（笔试评审反馈，2026-10-22）**：

- **R16 生成产物缺运行验证（评审实例：2048 空棋盘、迭代后语法错误）**。结论：新增自检闭环（见 §6）——语法校验 + 沙箱试运行 + 自动修复 + 明确成败提示；2048 完整实现纳入模板库，核心算法（slide/lineIdx）从模板源码提取做真实单测。通过。
- **R17 沙箱内存垫片导致应用数据不持久（评审实例：待办刷新丢数据、删空后默认任务复活）**。结论：垫片升级为持久化桥（见 §6）；「删空 vs 首次」由提示词硬性规范 + 模板修复 + 单测三重保障，线上实测新生成代码已符合规范。R2 中「预览态数据不跨刷新保留」的限制就此解除。通过。

## 9. 测试计划（v2 实测数据）

1. **单测（vitest，42/42 通过）**：流式解析器（含随机切块等价性/围栏/漏闭合）、组装器（内联替换/harness 注入/数据快照注入与 `</script>` 转义）、校验器 validateFiles（5 例）、2048 核心算法（从模板源码提取 slide/lineIdx 真实验证，6 例）、演示模式意图识别与事件流、Cookie 签名防篡改、文件存储适配器（原子写/CRUD/slug 索引）、Upstash 适配器（mock fetch 锁死 `/pipeline` 管道协议，4 例）。
2. **构建验证**：`next build` 通过（TS 严格模式，15 条路由）。
3. **冒烟（curl，本地 13 步 + 线上复测）**：注册→登录→me→建项目（模板）→PATCH 改文件→公开→匿名读分享→Remix→鉴权 401/404→删除→登出；agent 无钥 400 NO_KEY、假 Key 返回流式 error 事件而非崩溃；数据持久化 API 往返；真模型全链路流式生成（首字节 1-4s，完整三文件应用）。
4. **人工验证清单**（浏览器）：主流程 + 预览控制台 + 回滚 + Remix + 持久化桥（刷新/重开/重登场景）。

## 10. 部署与交付（v2 实际部署记录）

- **线上**：Render 免费档（`npm install && npm run build` / `npm start` / Free 实例），环境变量：智谱 Key + `ANTHROPIC_BASE_URL` + `AGENT_MODEL=glm-5.1` + Upstash×2 + `AUTH_SECRET`。约 15 分钟无访问休眠，首访约 1 分钟唤醒。
- **持久化**：Upstash Redis（管道端点 `/pipeline`，见 §5 踩坑记录）。
- **平台选型实录**：Vercel（新账号手机验证被临时封锁 12h）→ Railway（试用风控暂停部署）→ **Render**（GitHub 一键登录、无手机验证、长流式请求稳定）落地。期间自建 `/api/probe` 出网诊断接口做排除法（实测平台出网 1.3s 正常，证伪"连不上智谱"假设，真正原因是 glm-5.3 长思考，见 §6）。
- 亦可部署于 Vercel / 任意 Node 宿主 / Docker（README 附指引）。
- 交付文档：`README.md`（使用+部署）、`docs/DESIGN.md`（本方案+评审+v2 修订）、`SUBMISSION.md`（笔试回收内容 + 评审反馈响应）。
