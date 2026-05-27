import { useSettingsStore } from '@/stores/settingsStore';

export async function askAI(
  question: string,
  scenario: string,
  truth: string,
  messages: { role: string; content: string }[],
  mode: 'easy' | 'hardcore' = 'easy'
): Promise<{ content: string; answerType: '是' | '不是' | '无关'; progress: number }> {
  const { settings } = useSettingsStore.getState();
  const { apiBaseUrl, apiKey, model, temperature, customPrompt } = settings;

  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key。推荐使用 DeepSeek（价格极低）：https://platform.deepseek.com');
  }

  const isHardcore = mode === 'hardcore';

  const customSection = customPrompt?.trim()
    ? `\n## 玩家自定义指令\n${customPrompt.trim()}\n`
    : '';

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
    ? `你是"AI主持人海龟汤"游戏的主持人。

## 游戏规则
- 汤面（场景描述）：${scenario}
- 汤底（完整真相）：${truth}

## 硬核模式规则
玩家会提出问题来试图还原事件真相。你需要判断每个问题与真相的关系，并回答：
1. **"是"** — 如果玩家的猜测与真相一致
2. **"不是"** — 如果玩家的猜测与真相不一致，或者问题涉及的人、事、物与故事背景有任何关联但推测方向不对。绝大多数问题都应归入此类。
3. **"无关"** — 极其罕见，几乎不用：仅当问题完全脱离汤面场景、引入了完全不相关的人物/事件/设定（如"有外星人吗"而故事根本不涉及科幻元素）时才用。每局游戏最多使用1-2次"无关"。
- **关键原则：默认答"不是"，只有万不得已才答"无关"**。只要问题与场景中的人物、地点、事件有一丝一毫的联系（包括合理的逻辑延伸和常见推理方向），就必须回答"不是"。"无关"会严重破坏玩家的游戏体验和推理热情，请极度克制。

## 对话记忆
你需要记住本局游戏中玩家已经问过的所有问题以及你给出的回答。这些历史对话会一并提供给你。当玩家的问题与之前的问题相关联时，你应该：
- 结合之前的问答来综合判断，而不是孤立地看待每个问题
- 如果玩家在之前问题的基础上推进推理，应在 explanation 中给予肯定（如"结合你之前的推理，这个方向是对的"）
- 如果玩家重复了之前已经确认过的问题，应温和地提醒他们已经问过类似的问题
${progressGuide}${customSection}
## 回复格式
请用 JSON 格式回复：
{
  "answer": "是" | "不是" | "无关",
  "explanation": "",
  "progress": 0
}

## 重要提醒
- 在硬核模式下，explanation 必须为空字符串 ""
- 你绝对不能提供任何解释、暗示或额外信息
- 你只能输出"是"、"不是"或"无关"，不能有任何其他内容
- 不要直接告诉玩家汤底！
- 即使玩家完全猜对了真相，你也不能在 explanation 中说任何话，只能让 answer 为"是"`
    : `你是"AI主持人海龟汤"游戏的主持人。

## 游戏规则
- 汤面（场景描述）：${scenario}
- 汤底（完整真相）：${truth}

## 你的任务
玩家会提出问题来试图还原事件真相。你需要判断每个问题与真相的关系，并回答：
1. **"是"** — 如果玩家的猜测与真相一致
2. **"不是"** — 如果玩家的猜测与真相不一致，或者问题涉及的人、事、物与故事背景有任何关联但推测方向不对。绝大多数问题都应归入此类。
3. **"无关"** — 极其罕见，几乎不用：仅当问题完全脱离汤面场景、引入了完全不相关的人物/事件/设定（如"有外星人吗"而故事根本不涉及科幻元素）时才用。每局游戏最多使用1-2次"无关"。
- **关键原则：默认答"不是"，只有万不得已才答"无关"**。只要问题与场景中的人物、地点、事件有一丝一毫的联系（包括合理的逻辑延伸和常见推理方向），就必须回答"不是"。"无关"会严重破坏玩家的游戏体验和推理热情，请极度克制。

## 对话记忆
你需要记住本局游戏中玩家已经问过的所有问题以及你给出的回答。这些历史对话会一并提供给你。当玩家的问题与之前的问题相关联时，你应该：
- 结合之前的问答来综合判断，而不是孤立地看待每个问题
- 如果玩家在之前问题的基础上推进推理，应在 explanation 中给予肯定（如"结合你之前的推理，这个方向是对的"）
- 如果玩家重复了之前已经确认过的问题，应温和地提醒他们已经问过类似的问题
${progressGuide}${customSection}
## 回复格式
请用 JSON 格式回复：
{
  "answer": "是" | "不是" | "无关",
  "explanation": "简短的解释（1-2句话），帮助玩家理解你的判断，但不要直接泄露汤底",
  "progress": 0
}

## 重要提醒
- 不要直接告诉玩家汤底！
- 解释要简短，保持神秘感
- 如果玩家基本还原了真相，可以在 explanation 中暗示"你离真相很近了"
- 如果玩家的猜测完全正确，answer 应该是"是"，并在 explanation 中表示肯定"`;

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
        ...messages.slice(-40),
        { role: 'user', content: question },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API 请求失败 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content;
  let result: { answer?: string; explanation?: string; progress?: number };
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
  const progress = typeof result.progress === 'number' ? Math.max(0, Math.min(100, Math.round(result.progress))) : 0;

  return {
    content: result.explanation || result.answer || '无关',
    answerType: result.answer === '是' ? '是' : result.answer === '不是' ? '不是' : '无关',
    progress,
  };
}

export interface ExtractedScript {
  title: string;
  scenario: string;
  truth: string;
  hints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export async function extractScript(rawText: string): Promise<ExtractedScript> {
  const { settings } = useSettingsStore.getState();
  const { apiBaseUrl, apiKey, model } = settings;

  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key。推荐使用 DeepSeek（价格极低）：https://platform.deepseek.com');
  }

  const systemPrompt = `你是"AI主持人海龟汤"的剧本编辑助手。用户会给你一段文字，请从中提炼出剧本信息。

## 输出格式
请用 JSON 格式回复：
{
  "title": "简练的剧本标题（不超过20字）",
  "scenario": "汤面——玩家看到的场景描述。要简洁、引人遐想，通常以奇怪或反常的场景结尾。不超过200字",
  "truth": "汤底——事件的完整真相。要逻辑自洽，出人意料但又在情理之中。不超过500字",
  "hints": ["提示1", "提示2", "提示3"],
  "difficulty": "easy|medium|hard",
  "category": "分类（如：悬疑、经典、恐怖、情感、历史等）"
}

## 提炼原则
- 如果原文已有完整结构，直接整理提取
- 如果原文只是一个故事或描述，你需要自己设计汤面和汤底，让故事变成一个 AI主持人海龟汤谜题
- 汤面只呈现表象（奇怪的场景），汤底揭示真相（背后的故事）
- hints 要循序渐进，从宽泛到具体
- 宁可留白，不要编造不合理的情节`;

  const response = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawText },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API 请求失败 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content;
  let result: any;
  try {
    result = JSON.parse(raw);
  } catch {
    throw new Error('AI 返回格式异常，请重试');
  }

  return {
    title: result.title?.trim() || '未命名剧本',
    scenario: result.scenario?.trim() || '',
    truth: result.truth?.trim() || '',
    hints: Array.isArray(result.hints) ? result.hints.filter(Boolean) : [],
    difficulty: ['easy', 'medium', 'hard'].includes(result.difficulty) ? result.difficulty : 'medium',
    category: result.category?.trim() || '',
  };
}

export function buildMessageHistory(messages: { role: string; content: string }[]): { role: string; content: string }[] {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));
}
