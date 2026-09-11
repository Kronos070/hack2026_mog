// Маршруты приложения: игровой цикл целиком живёт на одном экране
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSessionStore } from '@/entities/game/session-store';
import { RolePage } from '@/features/auth/RolePage';
import { GamePage } from '@/features/game/GamePage';
import { AdminPage } from '@/features/admin/AdminPage';

export function AppRoutes() {
  // Определяет доступные экраны в зависимости от роли пользователя
  const user = useSessionStore((state) => state.user);

  return (
    <Routes>
      <Route path="/" element={<RolePage />} />
      <Route path="/game" element={user ? <GamePage /> : <Navigate to="/" replace />} />
      <Route
        path="/admin"
        element={user?.role === 'admin' ? <AdminPage /> : <Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
