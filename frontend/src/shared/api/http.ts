// HTTP-клиент бэкенда с подстановкой JWT в заголовок
import axios from 'axios';
import { clearToken, readToken } from '@/shared/api/auth-token';

export const API_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:8080/api';
export const USE_MOCK = import.meta.env['VITE_API_MODE'] !== 'real';

export const http = axios.create({ baseURL: API_URL });

http.interceptors.request.use((config) => {
  const token = readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const status =
      typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;
    if (status === 401) clearToken();
    return Promise.reject(error instanceof Error ? error : new Error('Ошибка запроса'));
  },
);
