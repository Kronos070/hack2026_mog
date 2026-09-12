// HTTP-клиент бэкенда с подстановкой JWT в заголовок
import axios from 'axios';
import { clearToken, readToken } from '@/shared/api/auth-token';

export const API_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:8080/api';
export const USE_MOCK = import.meta.env['VITE_API_MODE'] === 'mock';

export const http = axios.create({ baseURL: API_URL });

http.interceptors.request.use((config) => {
  const token = readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    let serverMessage: string | undefined;
    let status: number | undefined;

    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { status?: number; data?: { message?: string; error?: string } } }).response;
      status = response?.status;
      serverMessage = response?.data?.message ?? response?.data?.error;
    }

    if (status === 401) clearToken();

    const message = serverMessage ?? (error instanceof Error ? error.message : 'Ошибка запроса');
    return Promise.reject(new Error(message));
  },
);
