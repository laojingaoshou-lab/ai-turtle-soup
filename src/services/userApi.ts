import type { GameRecord, Script } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = '/api';

function getToken(): string | null {
  return useAuthStore.getState().token;
}

async function authRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data as T;
}

// --- Auth ---

export interface AuthResponse {
  token: string;
  user: { id: number; username: string };
}

export function loginApi(username: string, password: string): Promise<AuthResponse> {
  return authRequest('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export function registerApi(username: string, password: string): Promise<AuthResponse> {
  return authRequest('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export interface MeResponse {
  user: { id: number; username: string; created_at: string };
}

export function getMe(token: string): Promise<MeResponse> {
  return fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.json().then(data => {
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  }));
}

// --- Game Records ---

export function getRecords(): Promise<{ records: GameRecord[] }> {
  return authRequest('/user/records');
}

export function saveRecord(record: GameRecord): Promise<{ success: boolean }> {
  return authRequest('/user/records', { method: 'POST', body: JSON.stringify(record) });
}

export function saveRecordsBatch(records: GameRecord[]): Promise<{ imported: number }> {
  return authRequest('/user/records/batch', { method: 'POST', body: JSON.stringify({ records }) });
}

// --- Custom Scripts ---

export function getScripts(): Promise<{ scripts: Script[] }> {
  return authRequest('/user/scripts');
}

export function saveScript(script: Script): Promise<{ success: boolean; id: string }> {
  return authRequest('/user/scripts', { method: 'POST', body: JSON.stringify(script) });
}

export function saveScriptsBatch(scripts: Script[]): Promise<{ imported: number }> {
  return authRequest('/user/scripts/batch', { method: 'POST', body: JSON.stringify({ scripts }) });
}

export function updateScript(id: string, fields: Partial<Script>): Promise<{ success: boolean }> {
  return authRequest(`/user/scripts/${id}`, { method: 'PUT', body: JSON.stringify(fields) });
}

export function deleteScript(id: string): Promise<{ success: boolean }> {
  return authRequest(`/user/scripts/${id}`, { method: 'DELETE' });
}
