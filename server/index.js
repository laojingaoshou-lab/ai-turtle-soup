import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// In-memory storage
const rooms = new Map();

// --- Admin Config ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lyt<1023>';
const adminSessions = new Map(); // token -> expiry timestamp

// --- Script Persistence ---
const DATA_DIR = path.join(__dirname, 'data');
const SCRIPTS_FILE = path.join(DATA_DIR, 'scripts.json');

function readScripts() {
  try {
    if (!fs.existsSync(SCRIPTS_FILE)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(SCRIPTS_FILE, JSON.stringify({ submitted: [], approved: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(SCRIPTS_FILE, 'utf-8'));
  } catch (e) {
    console.error('[脚本存储] 读取失败', e.message);
    return { submitted: [], approved: [] };
  }
}

function writeScripts(data) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SCRIPTS_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[脚本存储] 写入失败', e.message);
  }
}

const scriptStore = readScripts();

function genScriptId() {
  return 'sub-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function genRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

io.on('connection', (socket) => {
  console.log(`[连接] ${socket.id}`);

  // Create room
  socket.on('create_room', (data) => {
    const { playerName, hostMode, gameMode, scriptId, scriptTitle, scenario, truth, hints, apiConfig } = data;
    const code = genRoomCode();

    const room = {
      code,
      hostMode,
      gameMode: gameMode || 'easy',
      hostId: socket.id,
      players: [{
        id: socket.id,
        name: playerName,
        isHost: true,
        isReady: true,
      }],
      scriptId,
      scriptTitle,
      scenario,
      truth,
      hints: hints || [],
      status: 'waiting',
      messages: [],
      questionCount: 0,
      hintCount: hints?.length || 3,
      progress: 0,
      maxPlayers: 10,
      createdAt: Date.now(),
      apiConfig: apiConfig || null,
      pendingQuestion: null,
      gameResult: null,
    };

    rooms.set(code, room);
    socket.join(code);
    socket.emit('room_created', { room });
    console.log(`[房间] ${socket.id} 创建了房间 ${code}`);
  });

  // Join room
  socket.on('join_room', ({ roomCode, playerName }) => {
    const code = roomCode.toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('room_error', { message: '房间不存在' });
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit('room_error', { message: '房间已满' });
      return;
    }

    if (room.status !== 'waiting') {
      socket.emit('room_error', { message: '游戏已开始，无法加入' });
      return;
    }

    const player = {
      id: socket.id,
      name: playerName,
      isHost: false,
      isReady: true,
    };

    room.players.push(player);
    socket.join(code);
    socket.emit('room_joined', { room });
    io.to(code).emit('player_list_updated', { players: room.players });
    console.log(`[房间] ${socket.id}(${playerName}) 加入了房间 ${code}`);
  });

  // Rejoin room (resume after disconnect/navigate-away)
  socket.on('rejoin_room', ({ roomCode, playerName }) => {
    const code = roomCode.toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('room_error', { message: '房间不存在或已结束' });
      return;
    }

    const player = room.players.find((p) => p.name === playerName);
    if (!player) {
      socket.emit('room_error', { message: '你不在该房间中' });
      return;
    }

    // Update socket ID to the new connection
    const wasHost = player.isHost;
    player.id = socket.id;
    if (wasHost) {
      room.hostId = socket.id;
    }

    socket.join(code);

    // Send full current room state
    socket.emit('room_rejoined', { room });

    // Notify other players of updated list (new socket IDs)
    io.to(code).emit('player_list_updated', { players: room.players });

    console.log(`[房间] ${socket.id}(${playerName}) 重新加入了房间 ${code} (status: ${room.status})`);
  });

  // Leave room
  socket.on('leave_room', () => {
    for (const [code, room] of rooms) {
      const playerIdx = room.players.findIndex((p) => p.id === socket.id);
      if (playerIdx !== -1) {
        const wasHost = room.players[playerIdx].isHost;
        room.players.splice(playerIdx, 1);

        if (room.players.length === 0) {
          rooms.delete(code);
          console.log(`[房间] ${code} 已删除（无玩家）`);
        } else {
          if (wasHost) {
            room.players[0].isHost = true;
            room.hostId = room.players[0].id;
          }
          io.to(code).emit('player_list_updated', { players: room.players });
        }
        socket.leave(code);
        break;
      }
    }
  });

  // Start game
  socket.on('start_game', () => {
    for (const [code, room] of rooms) {
      if (room.hostId === socket.id && room.status === 'waiting') {
        room.status = 'playing';
        const welcomeMsg = {
          id: genId(),
          role: 'assistant',
          content: `游戏开始！\n\n**汤面：** ${room.scenario}\n\n请开始提问，主持人会回答"是"、"不是"或"无关"。`,
          timestamp: Date.now(),
          answerType: 'welcome',
        };
        room.messages.push(welcomeMsg);
        io.to(code).emit('game_started', { messages: room.messages });
        console.log(`[游戏] 房间 ${code} 游戏开始`);
        break;
      }
    }
  });

  // Send question (multiplayer)
  socket.on('send_question', ({ question }) => {
    for (const [code, room] of rooms) {
      const player = room.players.find((p) => p.id === socket.id);
      if (player && room.status === 'playing') {
        const userMsg = {
          id: genId(),
          role: 'user',
          content: question,
          timestamp: Date.now(),
          playerName: player.name,
        };
        room.messages.push(userMsg);
        room.questionCount++;

        if (room.hostMode === 'ai') {
          // AI host mode - process via AI on server side
          io.to(code).emit('new_message', { message: userMsg });
          processAIAnswer(code, room, question);
        } else {
          // Player host mode - send to host
          room.pendingQuestion = {
            questionId: userMsg.id,
            playerName: player.name,
            question,
          };
          io.to(code).emit('new_message', { message: userMsg });
          io.to(room.hostId).emit('question_received', room.pendingQuestion);
        }
        break;
      }
    }
  });

  // Host answer
  socket.on('host_answer', ({ questionId, answer, answerType }) => {
    for (const [code, room] of rooms) {
      if (room.hostId === socket.id && room.status === 'playing') {
        const hostMsg = {
          id: genId(),
          role: 'assistant',
          content: answer,
          timestamp: Date.now(),
          answerType,
        };
        room.messages.push(hostMsg);
        room.pendingQuestion = null;
        io.to(code).emit('new_message', { message: hostMsg });
        break;
      }
    }
  });

  // Request hint
  socket.on('request_hint', () => {
    for (const [code, room] of rooms) {
      const player = room.players.find((p) => p.id === socket.id);
      if (player && room.status === 'playing') {
        const hintIdx = room.messages.filter((m) => m.answerType === 'hint').length;
        if (hintIdx < room.hints.length) {
          const hintMsg = {
            id: genId(),
            role: 'system',
            content: `提示 ${hintIdx + 1}/${room.hints.length}：${room.hints[hintIdx]}`,
            timestamp: Date.now(),
            answerType: 'hint',
          };
          room.messages.push(hintMsg);
          io.to(code).emit('new_message', { message: hintMsg });
        }
        break;
      }
    }
  });

  // Give up
  socket.on('give_up', () => {
    for (const [code, room] of rooms) {
      const player = room.players.find((p) => p.id === socket.id);
      if (player && room.status === 'playing') {
        room.status = 'ended';
        const result = {
          result: 'gave_up',
          questionCount: room.questionCount,
          truth: room.truth,
        };
        room.gameResult = result;
        io.to(code).emit('game_ended', result);
        const endMsg = {
          id: genId(),
          role: 'system',
          content: `${player.name} 选择放弃。\n\n**汤底：** ${room.truth}`,
          timestamp: Date.now(),
          answerType: 'error',
        };
        room.messages.push(endMsg);
        io.to(code).emit('new_message', { message: endMsg });
        break;
      }
    }
  });

  // Declare completion (通关)
  socket.on('solve_game', () => {
    for (const [code, room] of rooms) {
      const player = room.players.find((p) => p.id === socket.id);
      if (player && room.status === 'playing') {
        if (room.progress < 80) {
          socket.emit('room_error', { message: '推理进度不足，请继续探索' });
          return;
        }
        room.status = 'ended';
        const result = {
          result: 'solved',
          questionCount: room.questionCount,
          truth: room.truth,
        };
        room.gameResult = result;
        io.to(code).emit('game_ended', result);
        const solveMsg = {
          id: genId(),
          role: 'system',
          content: `${player.name} 宣布通关！\n\n**汤底：** ${room.truth}`,
          timestamp: Date.now(),
          answerType: 'correct',
        };
        room.messages.push(solveMsg);
        io.to(code).emit('new_message', { message: solveMsg });
        break;
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[断开] ${socket.id}`);
    for (const [code, room] of rooms) {
      const playerIdx = room.players.findIndex((p) => p.id === socket.id);
      if (playerIdx !== -1) {
        // During an active game, keep the player so they can rejoin
        if (room.status === 'playing') {
          console.log(`[断开] ${socket.id} 游戏中暂时离开，保留玩家槽位`);
          io.to(code).emit('player_list_updated', { players: room.players });
          break;
        }

        const wasHost = room.players[playerIdx].isHost;
        room.players.splice(playerIdx, 1);

        if (room.players.length === 0) {
          rooms.delete(code);
        } else {
          if (wasHost) {
            room.players[0].isHost = true;
            room.hostId = room.players[0].id;
          }
          io.to(code).emit('player_list_updated', { players: room.players });
        }
        break;
      }
    }
  });
});

async function processAIAnswer(code, room, question) {
  try {
    const config = room.apiConfig || {};
    const apiBaseUrl = config.apiBaseUrl || 'https://api.deepseek.com/v1';
    const apiKey = config.apiKey;
    const model = config.model || 'deepseek-v4-flash';
    const customSection = config.customPrompt?.trim()
      ? `\n## 玩家自定义指令\n${config.customPrompt.trim()}\n`
      : '';

    if (!apiKey) {
      const errorMsg = {
        id: genId(),
        role: 'system',
        content: 'AI 主持需要配置 API Key。请房主在设置中配置。',
        timestamp: Date.now(),
        answerType: 'error',
      };
      room.messages.push(errorMsg);
      io.to(code).emit('new_message', { message: errorMsg });
      return;
    }

    const isHardcore = room.gameMode === 'hardcore';

    const progressGuide = `
## 进度评估
根据玩家目前所有提问中体现的累积理解，评估玩家对汤底的推理进度（0-100的整数）：
- 0-10分：完全没头绪，或仅在问无关的边缘细节
- 20-40分：有部分零散的正确猜测，但核心要素未触及
- 50-70分：已推断出部分核心要素（如关键人物、关键事件）
- 80-90分：基本还原了真相的主要脉络，仅次要细节缺失
- 100分：完全推断出汤底的全部核心内容
- 进度只增不减——已正确推断出的事实不会因后续问题而扣分
- 综合判断：不要仅根据最近一个问题评估，要结合所有提问历史`;

    const systemPrompt = isHardcore
      ? `你是一个"海龟汤"游戏 AI 主持人（硬核模式）。汤面：${room.scenario}。汤底：${room.truth}。请严格判断与真相的关系。硬核模式规则：你只能回答"是"、"不是"或"无关"，绝不能提供任何解释或额外信息。

## 回答指南
- "是"：玩家猜测与真相一致
- "不是"：玩家猜测与真相不一致，或者问题涉及的人、事、物与故事背景有丝毫关联但推测方向不对
- "无关"：极少使用！仅当问题与汤面中的场景、人物、背景完全没有任何关联时才用
- 重要：宁可答"不是"，也不要轻易答"无关"。只要问题与场景有丝毫联系就答"不是"。${customSection}
${progressGuide}\n\n用 JSON 格式回复：{"answer": "是|不是|无关", "explanation": "", "progress": 0}。explanation 必须为空字符串。`
      : `你是一个"海龟汤"游戏 AI 主持人。汤面：${room.scenario}。汤底：${room.truth}。请判断与真相的关系。

## 回答指南
- "是"：玩家猜测与真相一致
- "不是"：玩家猜测与真相不一致，或者问题涉及的人、事、物与故事背景有丝毫关联但推测方向不对
- "无关"：极少使用！仅当问题与汤面中的场景、人物、背景完全没有任何关联时才用
- 重要：宁可答"不是"，也不要轻易答"无关"。只要问题与场景有丝毫联系就答"不是"。${customSection}
${progressGuide}\n\n用 JSON 格式回复：{"answer": "是|不是|无关", "explanation": "简短解释", "progress": 0}。`;

    const temperature = isHardcore ? (config.temperature ?? 0.1) : (config.temperature ?? 0.3);

    // Build message history for context
    const history = room.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))
      .slice(-20);

    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: 512,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`API 错误: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices[0].message.content;
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      const answerMatch = raw.match(/"(?:answer|答案)"\s*:\s*"([^"]+)"/);
      const progressMatch = raw.match(/"(?:progress|进度)"\s*:\s*(\d+)/);
      result = {
        answer: answerMatch?.[1] || '无关',
        explanation: '',
        progress: progressMatch ? parseInt(progressMatch[1], 10) : 0,
      };
    }
    const progress = typeof result.progress === 'number' ? Math.max(room.progress, Math.min(100, Math.round(result.progress))) : room.progress;
    room.progress = progress;

    const aiMsg = {
      id: genId(),
      role: 'assistant',
      content: result.explanation || result.answer,
      timestamp: Date.now(),
      answerType: result.answer === '是' ? '是' : result.answer === '不是' ? '不是' : '无关',
    };
    room.messages.push(aiMsg);
    io.to(code).emit('new_message', { message: aiMsg, progress });
  } catch (err) {
    console.error('[AI错误]', err.message);
    const errorMsg = {
      id: genId(),
      role: 'system',
      content: `AI 响应失败：${err.message}`,
      timestamp: Date.now(),
      answerType: 'error',
    };
    room.messages.push(errorMsg);
    io.to(code).emit('new_message', { message: errorMsg });
  }
}

// --- Admin Auth Middleware ---
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ error: '未授权：需要管理员登录' });
  }
  const expiry = adminSessions.get(token);
  if (Date.now() > expiry) {
    adminSessions.delete(token);
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
  adminSessions.set(token, Date.now() + 2 * 60 * 60 * 1000);
  next();
}

// --- Admin Login ---
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: '密码错误' });
  }
  const token = 'adm-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  adminSessions.set(token, Date.now() + 2 * 60 * 60 * 1000);
  for (const [t, exp] of adminSessions) {
    if (Date.now() > exp) adminSessions.delete(t);
  }
  res.json({ token });
});

// --- Submit script for review (requires login) ---
app.post('/api/scripts/submit', requireAuth, (req, res) => {
  try {
    const { title, scenario, truth, hints, difficulty, category } = req.body;
    if (!title?.trim() || !scenario?.trim() || !truth?.trim()) {
      return res.status(400).json({ error: '标题、汤面和汤底不能为空' });
    }
    const submission = {
      id: genScriptId(),
      title: title.trim(),
      scenario: scenario.trim(),
      truth: truth.trim(),
      hints: Array.isArray(hints) ? hints.filter(Boolean) : [],
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
      category: category?.trim() || undefined,
      author: req.user.username,
      submittedBy: req.user.id,
      status: 'pending',
      submittedAt: Date.now(),
    };
    scriptStore.submitted.push(submission);
    writeScripts(scriptStore);
    res.status(201).json({ id: submission.id, status: submission.status });
  } catch (e) {
    res.status(500).json({ error: '提交失败' });
  }
});

// --- Public: Get approved scripts ---
app.get('/api/scripts/approved', (req, res) => {
  res.json(scriptStore.approved.map(s => ({
    id: s.id,
    title: s.title,
    scenario: s.scenario,
    truth: s.truth,
    hints: s.hints,
    difficulty: s.difficulty,
    category: s.category,
    author: s.author,
    source: 'builtin',
    createdAt: s.submittedAt,
    playCount: 0,
  })));
});

// --- Admin: List submissions ---
app.get('/api/admin/submissions', requireAdmin, (req, res) => {
  const { status } = req.query;
  let list = scriptStore.submitted;
  if (status === 'pending') list = list.filter(s => s.status === 'pending');
  if (status === 'rejected') list = list.filter(s => s.status === 'rejected');
  res.json(list);
});

// --- Admin: Approve submission ---
app.post('/api/admin/submissions/:id/approve', requireAdmin, (req, res) => {
  const idx = scriptStore.submitted.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '提交不存在' });
  const submission = scriptStore.submitted[idx];
  submission.status = 'approved';
  submission.reviewedAt = Date.now();
  submission.reviewedBy = 'admin';
  scriptStore.approved.push({ ...submission });
  scriptStore.submitted.splice(idx, 1);
  writeScripts(scriptStore);
  res.json({ success: true, id: submission.id });
});

// --- Admin: Reject submission ---
app.post('/api/admin/submissions/:id/reject', requireAdmin, (req, res) => {
  const idx = scriptStore.submitted.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '提交不存在' });
  scriptStore.submitted[idx].status = 'rejected';
  scriptStore.submitted[idx].reviewedAt = Date.now();
  scriptStore.submitted[idx].reviewedBy = 'admin';
  scriptStore.submitted[idx].adminNote = req.body.note || '';
  writeScripts(scriptStore);
  res.json({ success: true });
});

// --- Admin: Delete submission ---
app.delete('/api/admin/submissions/:id', requireAdmin, (req, res) => {
  const idx = scriptStore.submitted.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '提交不存在' });
  scriptStore.submitted.splice(idx, 1);
  writeScripts(scriptStore);
  res.json({ success: true });
});

// --- Admin: Delete approved script ---
app.delete('/api/admin/approved/:id', requireAdmin, (req, res) => {
  const idx = scriptStore.approved.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '脚本不存在' });
  scriptStore.approved.splice(idx, 1);
  writeScripts(scriptStore);
  res.json({ success: true });
});

// --- Admin: Add script directly to approved ---
app.post('/api/admin/approved', requireAdmin, (req, res) => {
  try {
    const { title, scenario, truth, hints, difficulty, category } = req.body;
    if (!title?.trim() || !scenario?.trim() || !truth?.trim()) {
      return res.status(400).json({ error: '标题、汤面和汤底不能为空' });
    }
    const script = {
      id: genScriptId(),
      title: title.trim(),
      scenario: scenario.trim(),
      truth: truth.trim(),
      hints: Array.isArray(hints) ? hints.filter(Boolean) : [],
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
      category: category?.trim() || undefined,
      author: '管理员',
      status: 'approved',
      submittedAt: Date.now(),
    };
    scriptStore.approved.push(script);
    writeScripts(scriptStore);
    res.status(201).json({ id: script.id });
  } catch (e) {
    res.status(500).json({ error: '添加失败' });
  }
});

// --- Admin: Update approved script ---
app.put('/api/admin/approved/:id', requireAdmin, (req, res) => {
  try {
    const idx = scriptStore.approved.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: '脚本不存在' });
    const { title, scenario, truth, hints, difficulty, category } = req.body;
    const s = scriptStore.approved[idx];
    if (title !== undefined) s.title = title.trim();
    if (scenario !== undefined) s.scenario = scenario.trim();
    if (truth !== undefined) s.truth = truth.trim();
    if (hints !== undefined) s.hints = Array.isArray(hints) ? hints.filter(Boolean) : [];
    if (difficulty !== undefined) s.difficulty = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';
    if (category !== undefined) s.category = category?.trim() || undefined;
    writeScripts(scriptStore);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '更新失败' });
  }
});

// Admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size, uptime: process.uptime() });
});

// --- User Auth Routes ---
import { registerAuthRoutes, requireAuth } from './auth.js';
import {
  saveGameRecord, getGameRecords, saveGameRecordsBatch,
  saveCustomScript, getCustomScripts, saveCustomScriptsBatch,
  updateCustomScript, deleteCustomScript
} from './db.js';

registerAuthRoutes(app);

// --- User Data Routes ---

// Game records
app.get('/api/user/records', requireAuth, (req, res) => {
  try {
    const records = getGameRecords(req.user.id);
    res.json({ records });
  } catch (e) {
    res.status(500).json({ error: '获取记录失败' });
  }
});

app.post('/api/user/records', requireAuth, (req, res) => {
  try {
    saveGameRecord(req.user.id, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '保存记录失败' });
  }
});

app.post('/api/user/records/batch', requireAuth, (req, res) => {
  try {
    const count = saveGameRecordsBatch(req.user.id, req.body.records || []);
    res.json({ imported: count });
  } catch (e) {
    res.status(500).json({ error: '批量导入失败' });
  }
});

// Custom scripts
app.get('/api/user/scripts', requireAuth, (req, res) => {
  try {
    const scripts = getCustomScripts(req.user.id);
    res.json({ scripts });
  } catch (e) {
    res.status(500).json({ error: '获取剧本失败' });
  }
});

app.post('/api/user/scripts', requireAuth, (req, res) => {
  try {
    saveCustomScript(req.user.id, req.body);
    res.json({ success: true, id: req.body.id });
  } catch (e) {
    res.status(500).json({ error: '保存剧本失败' });
  }
});

app.post('/api/user/scripts/batch', requireAuth, (req, res) => {
  try {
    const count = saveCustomScriptsBatch(req.user.id, req.body.scripts || []);
    res.json({ imported: count });
  } catch (e) {
    res.status(500).json({ error: '批量导入失败' });
  }
});

app.put('/api/user/scripts/:id', requireAuth, (req, res) => {
  try {
    const ok = updateCustomScript(req.user.id, req.params.id, req.body);
    if (!ok) return res.status(404).json({ error: '脚本不存在或无权修改' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '更新剧本失败' });
  }
});

app.delete('/api/user/scripts/:id', requireAuth, (req, res) => {
  try {
    const ok = deleteCustomScript(req.user.id, req.params.id);
    if (!ok) return res.status(404).json({ error: '脚本不存在或无权删除' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '删除剧本失败' });
  }
});

// --- Serve built client in production ---
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`海龟汤服务器运行在 http://localhost:${PORT}`);
  console.log(`数据库路径: ${path.join(__dirname, 'data', 'haigui.db')}`);
});
