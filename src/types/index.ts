export interface Script {
  id: string;
  title: string;
  scenario: string;
  truth: string;
  hints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  author?: string;
  source: 'builtin' | 'custom';
  createdAt: number;
  playCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  answerType?: '是' | '不是' | '无关' | 'welcome' | 'correct' | 'hint' | 'error';
  playerName?: string;
}

export interface GameState {
  id: string;
  scriptId: string;
  scriptTitle: string;
  scenario: string;
  truth: string;
  mode: 'easy' | 'hardcore';
  status: 'active' | 'solved' | 'gave_up' | 'error';
  messages: ChatMessage[];
  questionCount: number;
  hintCount: number;
  hints: string[];
  hintIndex: number;
  progress: number;
  startedAt: number;
  endedAt?: number;
  result?: 'solved' | 'gave_up';
  error?: string;
}

export interface GameRecord {
  id: string;
  scriptId: string;
  scriptTitle: string;
  status: GameState['status'];
  questionCount: number;
  startedAt: number;
  endedAt?: number;
  result?: 'solved' | 'gave_up';
}

export interface PlayerInfo {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
}

export interface RoomState {
  code: string;
  hostMode: 'ai' | 'player';
  gameMode: 'easy' | 'hardcore';
  hostId: string;
  players: PlayerInfo[];
  scriptId: string;
  scriptTitle: string;
  scenario: string;
  truth: string;
  hints: string[];
  status: 'waiting' | 'playing' | 'ended';
  messages: ChatMessage[];
  questionCount: number;
  hintCount: number;
  progress: number;
  maxPlayers: number;
  createdAt: number;
  pendingQuestion?: { questionId: string; playerName: string; question: string } | null;
  gameResult?: { result: string; questionCount: number; truth: string } | null;
}

export interface ProviderPreset {
  id: string;
  name: string;
  apiBaseUrl: string;
  models: string[];
  defaultModel: string;
}

export interface AppSettings {
  provider: string;
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  customPrompt: string;
}

export type ScriptStatus = 'pending' | 'approved' | 'rejected';

export interface SubmittedScript {
  id: string;
  title: string;
  scenario: string;
  truth: string;
  hints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  author: string;
  status: ScriptStatus;
  adminNote?: string;
  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}
