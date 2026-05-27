import type { SubmittedScript } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data as T;
}

async function authRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token;
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

export interface SubmitPayload {
  title: string;
  scenario: string;
  truth: string;
  hints: string[];
  difficulty: string;
  category?: string;
  author?: string;
}

export interface SubmissionResponse {
  id: string;
  status: string;
}

export function submitScript(payload: SubmitPayload): Promise<SubmissionResponse> {
  return authRequest('/scripts/submit', { method: 'POST', body: JSON.stringify(payload) });
}

export interface ApprovedScript {
  id: string;
  title: string;
  scenario: string;
  truth: string;
  hints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  author?: string;
  source: string;
  createdAt: number;
  playCount: number;
}

export function fetchApprovedScripts(): Promise<ApprovedScript[]> {
  return request('/scripts/approved');
}

export function adminLogin(password: string): Promise<{ token: string }> {
  return request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
}

function adminHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function fetchSubmissions(token: string, status?: string): Promise<SubmittedScript[]> {
  const qs = status ? `?status=${status}` : '';
  return request(`/admin/submissions${qs}`, { headers: adminHeaders(token) });
}

export function approveSubmission(token: string, id: string): Promise<{ success: boolean }> {
  return request(`/admin/submissions/${id}/approve`, { method: 'POST', headers: adminHeaders(token) });
}

export function rejectSubmission(token: string, id: string, note?: string): Promise<{ success: boolean }> {
  return request(`/admin/submissions/${id}/reject`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify({ note }),
  });
}

export function deleteSubmission(token: string, id: string): Promise<{ success: boolean }> {
  return request(`/admin/submissions/${id}`, { method: 'DELETE', headers: adminHeaders(token) });
}

export function deleteApprovedScript(token: string, id: string): Promise<{ success: boolean }> {
  return request(`/admin/approved/${id}`, { method: 'DELETE', headers: adminHeaders(token) });
}
