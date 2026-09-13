// HTTP-клиент бэкенда с подстановкой JWT в заголовок
import axios from 'axios';
import { clearToken, readToken } from '@/shared/api/auth-token';

export const API_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:8080/api';
export const USE_MOCK = import.meta.env['VITE_API_MODE'] !== 'real';

export const http = axios.create({ baseURL: API_URL });

http.interceptors.request.use((config) => {
  const isAuth = config.url?.startsWith('/auth/login') || config.url?.startsWith('/auth/register');
  const token = readToken();
  if (token && !isAuth) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const res =
      typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { status?: number; data?: { error?: string; message?: string } } }).response
        : undefined;
    if (res?.status === 401) clearToken();
    const serverMessage = res?.data?.error ?? res?.data?.message;
    if (serverMessage) {
      return Promise.reject(new Error(serverMessage));
    }
    return Promise.reject(error instanceof Error ? error : new Error('Ошибка запроса'));
  },
);
