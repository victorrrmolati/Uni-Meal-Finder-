// ============================================================
//  src/lib/api.ts
//  Replace your existing src/lib/supabase.ts with this file.
//  This is the single place all backend calls come from.
// ============================================================

const BASE_URL = 'https://uni-meal-finder-production.up.railway.app/api';

// Saves the token after login so every request can use it
export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function removeToken(): void {
  localStorage.removeItem('token');
}

// Base fetch helper — adds the auth token to every request automatically
export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
