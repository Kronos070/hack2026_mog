// Маршруты приложения: игровой цикл целиком живёт на одном экране
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSessionStore } from '@/entities/game/session-store';
import { LoginPage } from '@/features/auth/LoginPage';
import { HomePage } from '@/features/home/HomePage';
import { ChooseBalloonPage } from '@/features/choose/ChooseBalloonPage';
import { GamePage } from '@/features/game/GamePage';
import { LeaderboardPage } from '@/features/leaderboard/LeaderboardPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { AchievementsPage } from '@/features/profile/AchievementsPage';
import { AdminPage } from '@/features/admin/AdminPage';

export function AppRoutes() {
  // Определяет доступные экраны в зависимости от роли пользователя
  const user = useSessionStore((state) => state.user);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/choose"
        element={user ? <ChooseBalloonPage /> : <Navigate to="/login" replace />}
      />
      <Route path="/game" element={user ? <GamePage /> : <Navigate to="/" replace />} />
      <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" replace />} />
      <Route
        path="/profile/:playerId"
        element={user ? <ProfilePage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/achievements"
        element={user ? <AchievementsPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/leaderboard"
        element={user ? <LeaderboardPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/admin"
        element={user?.role === 'admin' ? <AdminPage /> : <Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
