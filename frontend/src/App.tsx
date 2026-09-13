// Корневой компонент: провайдеры данных, роутер и уведомления
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppRoutes } from '@/app/routes';
import { AchievementToast } from '@/features/profile/AchievementToast';
import { soundManager } from '@/shared/lib/sound-manager';
import { useTournamentStreams } from '@/shared/api/use-tournament-streams';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5000, refetchOnWindowFocus: false } },
});

function TournamentStreams() {
  useTournamentStreams();
  return null;
}

export function App() {
  // Инициализирует звук и оборачивает приложение в провайдеры
  useEffect(() => {
    soundManager.init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TournamentStreams />
      <BrowserRouter>
        <AppRoutes />
        <AchievementToast />
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

