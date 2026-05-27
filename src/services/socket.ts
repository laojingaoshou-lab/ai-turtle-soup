import { io, Socket } from 'socket.io-client';
import { useRoomStore } from '@/stores/roomStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useMultiplayerResumeStore } from '@/stores/multiplayerResumeStore';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  const store = useRoomStore.getState();

  if (socket?.connected) {
    store.setConnected(true);
    store.setMyId(socket.id ?? null);
    return socket;
  }

  socket = io(window.location.origin, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    store.setConnected(true);
    store.setMyId(socket!.id ?? null);
    store.setError(null);
  });

  socket.on('disconnect', () => {
    store.setConnected(false);
  });

  socket.on('connect_error', () => {
    store.setConnected(false);
    store.setError('无法连接到服务器');
  });

  socket.on('room_created', (data) => {
    store.setRoom(data.room);
  });

  socket.on('room_joined', (data) => {
    store.setRoom(data.room);
  });

  socket.on('room_rejoined', (data) => {
    store.setRoom(data.room);
    // Clear resume info when game has ended
    if (data.room.status === 'ended') {
      useMultiplayerResumeStore.getState().clear();
    }
  });

  socket.on('room_error', (data) => {
    store.setError(data.message);
  });

  socket.on('player_list_updated', (data) => {
    store.updatePlayers(data.players);
  });

  socket.on('game_started', (data) => {
    store.setStatus('playing');
    store.setMessages(data.messages || []);
  });

  socket.on('new_message', (data) => {
    store.addMessage(data.message);
    if (typeof data.progress === 'number') {
      store.setProgress(data.progress);
    }
  });

  socket.on('question_received', (data) => {
    store.setPendingQuestion(data);
  });

  socket.on('game_ended', (data) => {
    store.setStatus('ended');
    store.setGameResult(data);
  });

  socket.on('room_closed', () => {
    store.reset();
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function createRoom(data: {
  playerName: string;
  hostMode: 'ai' | 'player';
  gameMode: 'easy' | 'hardcore';
  scriptId: string;
  scriptTitle: string;
  scenario: string;
  truth: string;
  hints: string[];
}) {
  const s = getSocket();
  if (!s) return;
  const { settings } = useSettingsStore.getState();
  s.emit('create_room', {
    ...data,
    apiConfig: data.hostMode === 'ai' ? {
      apiBaseUrl: settings.apiBaseUrl,
      apiKey: settings.apiKey,
      model: settings.model,
      temperature: settings.temperature,
      customPrompt: settings.customPrompt,
    } : undefined,
  });
}

export function joinRoom(roomCode: string, playerName: string) {
  const s = getSocket();
  if (!s) throw new Error('未连接到服务器');
  s.emit('join_room', { roomCode, playerName });
}

export function rejoinRoom(roomCode: string, playerName: string) {
  const s = getSocket();
  if (!s) throw new Error('未连接到服务器');
  s.emit('rejoin_room', { roomCode, playerName });
}

export function leaveRoom() {
  const s = getSocket();
  if (s) s.emit('leave_room');
}

export function startGame() {
  const s = getSocket();
  if (s) s.emit('start_game');
}

export function sendQuestion(question: string) {
  const s = getSocket();
  if (s) s.emit('send_question', { question });
}

export function hostAnswer(questionId: string, answer: string, answerType: string) {
  const s = getSocket();
  if (s) s.emit('host_answer', { questionId, answer, answerType });
}

export function requestHint() {
  const s = getSocket();
  if (s) s.emit('request_hint');
}

export function giveUp() {
  const s = getSocket();
  if (s) s.emit('give_up');
}

export function solveGame() {
  const s = getSocket();
  if (s) s.emit('solve_game');
}
