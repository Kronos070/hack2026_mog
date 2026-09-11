// Хранение JWT-токена между сессиями
const TOKEN_KEY = 'balloon.token';

export function readToken(): string | null {
  // Возвращает сохранённый токен авторизации
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Хранилище недоступно — токен живёт только в текущей вкладке
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Нечего чистить
  }
}
