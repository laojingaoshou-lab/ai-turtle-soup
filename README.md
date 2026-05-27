# AI主持人海龟汤 🍲

> AI 驱动的沉浸式情境推理游戏（Situation Puzzle / Lateral Thinking Puzzle）

**[🎮 开始游戏 → https://haigui.yuntianli.art](https://haigui.yuntianli.art)**

## 关于

海龟汤是一种经典的推理游戏：玩家面对一个奇怪甚至荒诞的场景（"汤面"），通过向主持人提问"是/否"问题来逐步还原事件真相（"汤底"）。本项目使用 AI 大模型作为主持人，支持单人和多人联机模式。
使用vibe coding开发，本人技术力及其有限。

## 特性

- 🤖 **AI 主持人** — 支持 DeepSeek、OpenAI、智谱、Kimi、通义千问等大模型
- 🎯 **双模式** — 简单模式（AI 提供解释）和硬核模式（仅回答是/否/无关）
- 👥 **多人联机** — 创建房间邀请朋友一起推理，支持 AI/人工主持人
- 📝 **剧本系统** — 内置剧本 + 社区投稿 + AI 提炼 + 自定义导入
- 🔐 **账号系统** — 注册登录，游戏记录和自定义剧本云端同步
- 📱 **响应式设计** — 桌面端和移动端均可流畅使用
- 🌙 **深色主题** — 沉浸式游戏体验

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/laojingaoshou-lab/ai-turtle-soup.git
cd ai-turtle-soup
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
# 启动后端（端口 3001）
npm run server

# 另一个终端启动前端（端口 5173）
npm run dev
```

### 4. 配置 AI

打开 http://localhost:5173  配置你的大模型 API 密钥。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| 后端 | Express + Socket.IO |
| 数据库 | SQLite (better-sqlite3) |
| 状态管理 | Zustand |
| 动画 | Framer Motion |
| 认证 | JWT + bcryptjs |

## 部署

项目包含完整的部署配置（`deploy/` 目录），支持使用 Nginx 反向代理 + PM2 进程守护部署到 Linux 服务器。

```bash
# 构建前端
npm run build

# 上传到服务器并运行部署脚本
scp -r dist/ server/ package.json deploy/ root@your-server:/var/www/haigui/
ssh root@your-server "cd /var/www/haigui && npm install --omit=dev && pm2 start server/index.js --name haigui"
```

## 许可证

MIT
