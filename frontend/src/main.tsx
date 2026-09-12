// Точка входа приложения
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import '@/index.css';

function applyStoredTheme(): void {
  try {
    const raw = localStorage.getItem('balloon.theme');
    const scheme = raw ? (JSON.parse(raw) as { state?: { scheme?: string } }).state?.scheme : null;
    if (scheme === 'dark') document.documentElement.classList.add('dark');
  } catch {
    // Настройка недоступна — остаётся светлая тема по умолчанию
  }
}

applyStoredTheme();

const container = document.getElementById('root');
if (!container) throw new Error('Не найден корневой элемент #root');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
