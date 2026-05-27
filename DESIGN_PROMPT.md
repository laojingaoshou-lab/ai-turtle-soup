# 海龟汤 — 完整功能与 UI 设计提示词

## 产品概述

**海龟汤**是一款"情境推理谜题"（Situation Puzzle）游戏平台。玩家阅读一段简短的场景描述（称为"汤面"），通过向 AI 主持人提问"是/否/无关"类问题，逐步还原事件背后的完整真相（称为"汤底"）。支持**单人 AI 游戏**和**多人联机**两种模式，多人模式可选择 **AI 主持**或**玩家主持**。

---

## 技术栈

| 层级 | 方案 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 8 |
| 样式方案 | Tailwind CSS 4 |
| 动画引擎 | Framer Motion |
| 图标库 | Lucide React（SVG 图标，禁止 emoji） |
| 状态管理 | Zustand 5（persist 持久化到 localStorage） |
| 实时通信 | Socket.IO Client |
| 路由 | react-router-dom v7 |
| 后端 | Node.js + Socket.IO（零改动沿用已有 server/） |

---

## 路由架构

```
/                          → 重定向到 /home
/home                      → 首页（统计 + 操作 + 最近游戏）
/scripts                   → 剧本库（内置 + 自定义）
/script/:id                → 剧本详情（查看 + 开始游戏）
/script/import             → 导入自定义剧本
/game/:id?scriptId=X       → 单人游戏
/game/multiplayer/:id      → 多人游戏
/lobby                     → 多人联机大厅（创建/加入房间）
/room/:code                → 多人等待房间
/summary/:id               → 结算页（结果 + 汤底 + 统计）
```

**App Shell**: 全高全宽容器（`h-full w-full`），深色背景（`#090912`），垂直 flex 布局。包含：
- `ParticleBackground` — canvas 粒子星空背景
- `PageTransition` — Framer Motion AnimatePresence 路由过渡动画
- 内容区（flex-1，overflow-y-auto）
- `TabBar` — 底部固定导航栏（64px 高，backdrop-blur）

---

## 页面功能详情

### 1. 首页 `/home`

**Hero 区域：**
- 标题"海 龟 汤"，紫色（#A78BFA），letter-spacing 0.15em，标题发光动画
- 副标题"情 境 推 理 谜 题"，小字，低对比度，letter-spacing 0.35em

**统计卡片（3 列 Grid）：**
- 总局数（Gamepad2 图标，紫色 #A78BFA）
- 解谜率（TrendingUp 图标，青绿色 #5EEAD4，百分比后缀）
- 总提问（Hash 图标，琥珀色 #FBBF24）
- 每个卡片：GlassPanel 容器，图标 + 大号数字 + 标签文字

**主操作区：**
1. 主要 CTA "立即开始" → 跳转 `/scripts`。横排大按钮：Play 图标紫色圆形、标题 + "从剧本库中选择海龟汤"副标题、ChevronRight 箭头。紫色渐变背景，hover 发光阴影
2. "随机开局" → `getRandomScript()` 随机脚本，跳转详情页。Dices 图标，紫色渐变
3. "多人联机" → 跳转 `/lobby`。Users 图标，青绿色渐变
4. 次要 CTA 并排 2 列 Grid

**最近游戏：**
- 显示最近 20 条游戏记录
- 每条：左侧色条（青绿=解谜 / 粉色=放弃）+ 剧本标题 + 日期时间 + 提问数 + 结果标签
- 空状态：EmptyState 组件，"尚未开始游戏"
- 点击记录跳转对应剧本详情
- flex-1 填充剩余空间，content-start 顶部对齐

### 2. 剧本库 `/scripts`

- 顶部标题"剧本库"+ 数量角标 + "导入"按钮（紫色，Plus 图标）
- `ScriptList` 组件：分"内置剧本"和"自定义剧本"两个区域
- 剧本卡片（ScriptCard）：左侧色条 + 难度标签（DifficultyBadge）+ 标题 + 分类/作者信息
- 空状态提示"暂无剧本"
- 3 列响应式 Grid（1/2/3 列）

### 3. 剧本详情 `/script/:id`

- 返回按钮（hover 左移动画）
- 标题 + DifficultyBadge（easy/medium/hard，不同颜色）
- 来源标签："内置"（紫色）或"自定义"（青绿）
- GlassPanel：ScenarioCard 显示"汤面"场景文本，120 字符折叠/展开
- 提示面板：编号圆圈（1, 2, 3）+ 每条提示文本
- 操作按钮："开始游戏"（主按钮，单人）、"创建联机房"（次按钮）、"删除剧本"（危险按钮，仅自定义）
- 删除确认：模态框，白色三角形警告 + 文字 + 取消/确认

### 4. 导入剧本 `/script/import`

- 返回按钮 + 标题"导入剧本"
- ImportForm 表单，调用 `importScript()` 后跳转 `/scripts`

### 5. 单人游戏 `/game/:id?scriptId=X`

**状态管理（gameStore）：**
- `startGame(scriptId)` 创建 GameState，含 status/messages/questionCount/hintCount
- `sendQuestion(question)` 追加用户消息，questionCount++
- `receiveAnswer(content, answerType)` 追加 AI 回复
- `markSolved()` / `giveUp()` 结束游戏，生成 GameRecord（result: solved/gave_up）
- localStorage 持久化 `@haigui/game`

**界面：**
- GameHeader：剧本标题（200px 截断）+ 提问数"（N问）"+ 返回按钮
- ScenarioCard：汤面场景 + 展开/折叠（120 字符阈值）+ animate-border-pulse 动画
- MessageList：聊天记录，TypingIndicator（AI 思考中）
- 底部栏：
  - ChatInput：textarea 自适应高度（最大 80px），200 字限制，Enter 发送（Shift+Enter 换行），字数计数器，紫色发送按钮
  - "放弃"按钮（粉色 Flag 图标）→ GiveUpDialog 确认
  - 提示系统：圆点显示已用/可用（琥珀色），默认 3 个，"提示（N/M）" 按钮

**GiveUpDialog：** 模态框，三角形警告，文字"放弃后将揭示汤底，是否确认？"，取消/确认按钮

**对话气泡类型（ChatBubble answerType）：**
- `是`（青绿#5EEAD4）、`不是`（粉色#F472B6）、`无关`（琥珀#FBBF24）
- `welcome`（紫色"欢迎"）、`correct`（青绿"正确"）、`hint`（琥珀"提示"）
- 用户消息：右对齐，紫色半透明背景，右下小圆角
- AI 消息：左对齐，白色半透明背景，backdrop-blur，左下小圆角，可能带左侧彩色边框
- 系统消息：居中，斜体，低对比度

### 6. 多人联机大厅 `/lobby`

**Header：** 返回按钮 + "多人联机"标题

**连接状态：** 绿点（已连接）/ 粉点（连接中）+ "已连接服务器"/"连接中..."

**Tab 切换器：** "创建房间" / "加入房间"，Framer Motion layoutId 滑动指示器

**创建房间：**
- 玩家名称（12 字符限制）
- 主持模式："AI 主持" / "玩家主持"
- 剧本选择列表（前 10 个），选中紫色边框
- "创建房间"按钮（未连接时禁用）

**加入房间：**
- 玩家名称（12 字符限制）
- 房间码输入：6 字符上限，自动转大写，等宽字体，大字，居中，letter-spacing 0.3em

### 7. 等待房间 `/room/:code`

- "离开"返回按钮 + "等待房间"标题
- 房间码展示：大号紫色文字 + text-shadow 发光 + "将此码分享给好友"
- GlassPanel 房间信息：剧本标题、主持模式（AI/玩家）、场景预览（2 行截断）
- 玩家列表：每个玩家紫色渐变圆形头像（名字首字母大写）+ 名称"(你)"+ "房主"琥珀标签
- "开始游戏"按钮（仅房主可见，Play 图标）
- 自动跳转：room.status === 'playing' → /game/multiplayer
- **持久化恢复：** 页面刷新后可通过 roomCode 从 localStorage 恢复房间状态

### 8. 多人游戏 `/game/multiplayer/:id`

- GameHeader（同单人） + 玩家芯片行（房主琥珀色点，其他青绿色点）
- 玩家主持模式：主持人看到答疑面板（玩家名称 + 问题文本 + "是/不是/无关"三个回答按钮）
- 消息列表显示所有玩家的问题和主持人的回答
- 非主持人玩家看到 ChatInput 发送问题
- 主持人看到"等待玩家提问..."
- 提示系统（非主持人可用）
- "放弃"按钮
- 自动跳转：gameResult 设定后 → summary

### 9. 结算页 `/summary/:id`

- 大圆环动画图标：CheckCircle（青绿，解谜成功）/ XCircle（粉色，放弃），带发光阴影
- 结果文字："恭喜解谜！"（青绿）/ "已放弃"（粉色）
- 统计行：提问数 + 用时（格式：M分S秒）+ 结果（成功/失败）
- TruthReveal：汤底标签 + 真相文本
- "再来一局"（随机剧本）+ "返回首页"按钮

---

## UI 设计系统

### 配色方案（Cosmic Mystery 暗黑神秘美学）

| Token | 值 | 用途 |
|-------|-----|------|
| 背景 | `#090912` | 深空蓝黑 |
| 表面/Glass | `rgba(22,20,45,0.65)` | 玻璃面板背景 |
| 主色 | `#A78BFA` | 紫色：标题、主 CTA、选中态、激活态 |
| 主色浅 | `#C4B5FD` | 紫色 hover 过渡 |
| 主色暗 | `#7C3AED` | 头像圆渐变终点 |
| 成功/Yes | `#5EEAD4` | 青绿色：解谜成功、正确回答、联机 |
| 失败/No | `#F472B6` | 粉色：放弃、错误、否定回答 |
| 无关/Warn | `#FBBF24` | 琥珀色：提示系统、无关回答 |
| 文本主色 | `#E8E6F0` | 近白带淡紫 |
| 文本次要 | `#9D99B5` | 中对比度灰紫 |
| 文本弱化 | `#6B6680` | 低对比度灰紫 |
| 错误/Danger | `#FB7185` | 玫瑰红：危险操作、错误状态 |
| 玻璃边框 | `rgba(255,255,255,0.07)` | 默认玻璃边框 |

**边框体系：** 所有边框使用 `rgba(255,255,255, 0.06~0.08)`，交互态使用 `rgba(167,139,250, ...)`

### 玻璃效果

**GlassPanel 组件：**
- 背景 `rgba(22,20,45,0.65)` + `backdrop-filter: blur(14px)`
- 边框 `rgba(255,255,255,0.07)`，阴影 `0 4px 12px rgba(0,0,0,0.35)`
- `strong` 模式：边框变紫色 `rgba(167,139,250,0.30)`，阴影加紫色 `rgba(167,139,250,0.15)`
- 入场动画：Framer Motion `opacity 0→1, y 12→0`

**模态框/弹窗：**
- 遮罩：`bg-black/60 backdrop-blur-sm`
- 容器：`bg-[#16142D]/95 backdrop-blur-xl`，圆角 16px，白色细微边框
- 出场动画：`opacity 0, scale 0.92, y 20` → 正常

**底部导航 TabBar：**
- `bg-[#0F0B2E]/85 backdrop-blur-xl border-t border-white/[0.06]`
- 4 个标签：首页、剧本、设置、联机
- 当前项：紫色文字 + Framer Motion layoutId 滑动标签指示器
- 非当前项：弱化文字

### 动效语言

**入场动画：**
- 页面过渡：`opacity 0, y 8-12` → `opacity 1, y 0`，duration 0.25-0.45s，ease `[0.25,0.1,0.25,1]`
- 模态框：`opacity 0, scale 0.92, y 20` → 正常，0.25s
- 列表交错：`delay: i * 0.03s`
- 统计卡片交错：`delay: 0.06s * i`

**微交互：**
- 按钮：`whileHover scale 1.02`，`whileTap scale 0.97`
- 返回按钮：`whileHover x: -2`
- Tab 指示器：layoutId spring（stiffness 400, damping 30）

**CSS 关键帧：**
- `title-glow`：文字阴影呼吸 `0 0 15px → 0 0 30px #A78BFA`
- `border-pulse`：边框色 `rgba(167,139,250,0.15) ↔ 0.35`
- `shimmer`：骨架屏发光扫过（background-position -200% → 200%）
- `fade-in-up`：淡入上移
- `scale-in`：缩放入场

**性能原则：** 只动画 transform/opacity，避免 width/height/top/left，动画时长 150-300ms

### 排版规范

- 字体栈：`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif`
- 字号阶梯：10px / 11px / 13px / 14px(sm) / 15px / 16px(base) / 18px(lg) / 20px(xl) / 24px(2xl)
- 字重：font-extrabold（数字/标题）、font-bold（强调）、font-semibold（次级）、font-normal（正文）
- 中文字间距：0.15em ~ 0.35em
- 等宽字体（房间码）：font-mono + tracking 0.3em
- 抗锯齿：`-webkit-font-smoothing: antialiased`

### 圆角与间距

- 圆角：8px(sm)、12px(md)、16px(lg)、24px(xl)、full（圆形）
- 间距基准：4px（p-1=4px, p-2=8px, p-3=12px, p-4=16px, p-5=20px, p-6=24px）
- 区域间距：mb-5(20px) 移动端 / mb-8~mb-12(32~48px) 桌面端
- 响应式内边距：`px-4 sm:px-6 lg:px-8 xl:px-16`

### 粒子背景

- Canvas 绘制，80 个紫色粒子（`rgba(167,139,250, alpha)`）
- 缓慢移动 `(random-0.5) * 0.3`
- 透明度正弦脉冲
- 粒子间距 < 80px 时绘制连线，透明度随距离衰减
- 环形拓扑（越界回绕）

### 骨架屏 / 加载态

- 渐变 `linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)`
- shimmer 动画扫过
- loading spinner：紫色圆环 + "加载中..." 文字

### 空状态 / 错误状态

- EmptyState 组件：Lucide 图标 + 标题文字 + 副标题，居中淡入
- 错误态：粉色三角形 + 错误信息 + "返回"按钮

---

## 状态管理（Zustand + localStorage）

### gameStore（`@haigui/game`）
- `currentGame: GameState | null` — 当前游戏会话
- `gameHistory: GameRecord[]` — 最近 50 条记录
- `isLoading: boolean`
- 操作：startGame / sendQuestion / receiveAnswer / markSolved / giveUp / resetGame / loadGameHistory

### scriptStore（`@haigui/scripts`）
- `builtInScripts: Script[]` — 内置剧本（硬编码）
- `customScripts: Script[]` — 用户导入（localStorage）
- `isLoading: boolean`
- 操作：loadScripts / getScriptById / getRandomScript / importScript / deleteScript / incrementPlayCount

### settingsStore（`@haigui/settings`）
- `settings: AppSettings` — apiBaseUrl / apiKey / model / temperature(0.3)
- `isConfigured: boolean` — apiBaseUrl 和 apiKey 都设置时返回 true
- 默认 API URL：`https://api.deepseek.com/v1`
- 默认模型：`deepseek-chat`
- API Key 独立存储在 `@haigui/api-key`

### roomStore（不持久化，Socket.IO 驱动）
- `room: RoomState | null` — 房间状态
- `isConnected: boolean` — 连接状态
- `myId: string | null` — 自己的 socket ID
- `pendingQuestion` — 等待主持人回答的问题
- `gameResult` — 游戏结果
- 操作全部通过 Socket.IO emit/on 实现

---

## Socket.IO 通信协议

**服务地址：** `http://localhost:3001`

### 客户端 → 服务端事件

| 事件 | Payload | 说明 |
|------|---------|------|
| `create_room` | `{ playerName, hostMode, scriptId, scriptTitle, scenario, truth, hints, apiConfig }` | 创建房间 |
| `join_room` | `{ roomCode, playerName }` | 加入房间 |
| `leave_room` | — | 离开房间 |
| `start_game` | — | 房主开始游戏 |
| `send_question` | `{ question }` | 发送问题 |
| `host_answer` | `{ questionId, answer, answerType }` | 主持人回答 |
| `request_hint` | — | 请求提示 |
| `give_up` | — | 放弃游戏 |

### 服务端 → 客户端事件

| 事件 | Payload | 说明 |
|------|---------|------|
| `room_created` | `{ room: RoomState }` | 房间创建成功 |
| `room_joined` | `{ room: RoomState }` | 加入房间成功 |
| `room_error` | `{ message: string }` | 错误消息 |
| `player_list_updated` | `{ players: PlayerInfo[] }` | 玩家列表更新 |
| `game_started` | `{ messages: ChatMessage[] }` | 游戏开始 |
| `new_message` | `{ message: ChatMessage }` | 新消息 |
| `question_received` | `{ questionId, playerName, question }` | 收到问题（仅主持） |
| `game_ended` | `{ result, questionCount, truth }` | 游戏结束 |
| `room_closed` | — | 房间关闭 |

---

## 类型定义

```typescript
Script {
  id, title, scenario, truth, hints?: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  category?, author?, source: 'builtin' | 'custom',
  createdAt, playCount
}

GameState {
  id, scriptId, scriptTitle, scenario, truth,
  status: 'active' | 'solved' | 'gave_up' | 'error',
  messages: ChatMessage[], questionCount: number,
  hintCount: number, hintRequested?: boolean,
  startedAt, endedAt?, result?, error?
}

GameRecord {
  id, scriptId, scriptTitle, status: GameState['status'],
  questionCount, startedAt, endedAt?,
  result?: 'solved' | 'gave_up'
}

ChatMessage {
  id, role: 'user' | 'assistant' | 'system',
  content: string, timestamp: number,
  answerType?: '是' | '不是' | '无关' | 'welcome' | 'correct' | 'hint' | 'error',
  playerName?: string  // 多人游戏用
}

RoomState {
  code: string, hostMode: 'ai' | 'player', hostId: string,
  players: PlayerInfo[], scriptId, scriptTitle, scenario,
  truth, hints, status: 'waiting' | 'playing' | 'ended',
  messages, questionCount, hintCount, maxPlayers,
  createdAt, apiConfig?, pendingQuestion?
}

PlayerInfo { id, name, isHost, isReady }

AppSettings { apiBaseUrl, apiKey, model, temperature }
```

---

## 目录结构

```
site/src/
├── main.tsx                      # 入口：BrowserRouter + App 挂载
├── App.tsx                       # 路由定义 + AppShell（ParticleBg + PageTransition + TabBar）
├── styles/index.css              # Tailwind 指令 + CSS 变量 + 玻璃面板/动画工具类
├── components/
│   ├── layout/TabBar.tsx         # 底部导航（首页/剧本/设置/联机）
│   ├── ui/                       # Button, GlassPanel, Modal, Skeleton
│   ├── common/                   # ParticleBackground, EmptyState, PageTransition
│   ├── chat/                     # ChatBubble, ChatInput, MessageList, TypingIndicator
│   ├── game/                     # GameHeader, ScenarioCard, TruthReveal, GiveUpDialog
│   ├── script/                   # ScriptCard, ScriptList, DifficultyBadge, ImportForm
│   └── settings/                 # ApiKeyInput, ModelPicker
├── pages/
│   ├── HomePage.tsx              # 首页
│   ├── ScriptsPage.tsx           # 剧本库
│   ├── ScriptDetailPage.tsx      # 剧本详情
│   ├── ScriptImportPage.tsx      # 导入剧本
│   ├── GamePage.tsx              # 单人游戏
│   ├── MultiplayerGamePage.tsx   # 多人游戏
│   ├── LobbyPage.tsx             # 联机大厅
│   ├── RoomPage.tsx              # 等待房间
│   ├── SummaryPage.tsx           # 结算页
│   └── SettingsPage.tsx          # 设置
├── stores/                       # gameStore, scriptStore, settingsStore, roomStore
├── services/                     # aiApi, connectSocket（Socket.IO）
├── hooks/                        # useGame（单人游戏逻辑）
├── types/                        # script, game, chat, multiplayer, settings
├── utils/                        # 工具函数
└── data/                         # builtinScripts（内置剧本数据）
```

---

## 关键交互约束

- **消息长度限制：** 200 字符
- **玩家名限制：** 12 字符
- **房间码：** 6 位大写字母数字
- **默认提示数：** 3（剧本无提示时的回退值）
- **场景折叠阈值：** 120 字符
- **历史记录上限：** 50 条
- **剧本列表（大厅）：** 显示前 10 个
- **最近游戏（首页）：** 显示前 20 条
- **响应式断点：** sm(640px) / md(768px) / lg(1024px) / xl(1280px)
- **移动端优先：** 紧凑布局，lg 以上拉开间距放大元素
- **页面禁止水平滚动**
- **滚动区隐藏滚动条**（scrollbar-width: none）
- **模态框：** Escape 关闭 + 点击遮罩关闭 + body 滚动锁定
- **持久化恢复：** 刷新页面后恢复当前游戏、游戏历史、自定义剧本、房间状态
- **深色模式唯一**（无亮色切换）
