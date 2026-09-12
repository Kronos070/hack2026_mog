// Админ-панель: управление игровыми параметрами (Hot-Reload), House Edge и финализацией турнира

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/shared/api/client';
import { gameConfigSchema, type GameConfig } from '@/shared/api/contract';
import { Button } from '@/shared/ui/Button';
import { NumberField } from '@/features/admin/NumberField';

const FIELDS: { key: keyof GameConfig; label: string; step?: number }[] = [
  { key: 'alpha', label: 'Alpha (крутизна распределения краха)', step: 0.01 },
  { key: 'maxMultiplier', label: 'Максимальный множитель' },
  { key: 'minCrashMultiplier', label: 'Минимальный множитель краха', step: 0.1 },
  { key: 'multiplierGrowthRate', label: 'Темп роста множителя (growthRate)', step: 0.01 },
  { key: 'growthAcceleration', label: 'Ускорение роста (1 = ровно, 2 = резко)', step: 0.1 },
  { key: 'pointsPerLine', label: 'Очки за уровень (pointsPerLine)' },
  { key: 'pointsCashoutBonus', label: 'Очки за cashout' },
  { key: 'pointsBoosterBonus', label: 'Очки за бустер' },
  { key: 'minWinAmount', label: 'Порог выигрыша для апсейла' },
  { key: 'popupTimeout', label: 'Таймаут попапа, с' },
];

export function AdminPage() {
  // Загружает конфиг, валидирует правки и сохраняет их на бэкенд
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: () => api.getConfig(),
  });

  const { data: houseEdge } = useQuery({
    queryKey: ['house-edge'],
    queryFn: () => api.getHouseEdge(),
  });

  const { data: tournamentHistory = [] } = useQuery({
    queryKey: ['tournament-history'],
    queryFn: () => api.getTournamentHistory({ limit: 10 }),
  });

  const [draft, setDraft] = useState<GameConfig | null>(null);

  // Синхронизируем черновик при первой загрузке или изменении
  const currentConfig = draft ?? config ?? null;

  const saveMutation = useMutation({
    mutationFn: (cfg: GameConfig) => api.saveConfig(cfg),
    onSuccess: (saved) => {
      setDraft(saved);
      void queryClient.invalidateQueries({ queryKey: ['config'] });
      toast.success('Параметры сохранены и применены в памяти сервера (Hot-Reload)');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Не удалось сохранить параметры'),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.resetConfig(),
    onSuccess: (resetCfg) => {
      setDraft(resetCfg);
      void queryClient.invalidateQueries({ queryKey: ['config'] });
      toast.success('Конфигурация сброшена к эталонным заводским значениям');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Ошибка сброса'),
  });

  const resetHeMutation = useMutation({
    mutationFn: () => api.resetHouseEdge(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['house-edge'] });
      toast.success('House Edge сброшен к базовому 0.04 (4%)');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Ошибка сброса House Edge'),
  });

  const settleMutation = useMutation({
    mutationFn: () => api.settleTournament(true),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['tournament'] });
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      void queryClient.invalidateQueries({ queryKey: ['tournament-history'] });
      toast.success(`${res.message} Награждено игроков: ${res.rewardedPlayersCount}`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Ошибка финализации турнира'),
  });

  const handleSave = (): void => {
    if (!currentConfig) return;
    const parsed = gameConfigSchema.safeParse(currentConfig);
    if (!parsed.success) {
      toast.error('Проверьте корректность значений');
      return;
    }
    saveMutation.mutate(parsed.data);
  };

  if (!currentConfig) {
    return <main className="p-6 text-sm text-muted">Загрузка параметров…</main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 space-y-8">
      <header className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-bold">Панель управления (Admin)</h1>
          <p className="text-xs text-muted">Горячее обновление параметров игры, House Edge и управление турниром</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/game')}>
            К игре
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Выйти
          </Button>
        </div>
      </header>

      {/* Параметры игры (GameConfigDto) */}
      <section className="rounded-xl border border-line bg-card/60 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-base font-bold">Конфигурация раундов (Hot-Reload)</h2>
          <span className="text-xs text-muted">O(1) in-memory кэш</span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <NumberField
              key={field.key}
              label={field.label}
              value={currentConfig[field.key] as number}
              step={field.step ?? 1}
              onChange={(value) => setDraft({ ...currentConfig, [field.key]: value })}
            />
          ))}
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-semibold text-muted">Множители бустеров</h3>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {currentConfig.boosterTierValues.map((value, index) => (
              <NumberField
                key={index}
                label={`Tier ${index + 1}`}
                value={value}
                step={0.1}
                onChange={(next) => {
                  const values = [...currentConfig.boosterTierValues];
                  values[index] = next;
                  setDraft({ ...currentConfig, boosterTierValues: values });
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Сохранение…' : 'Сохранить параметры'}
          </Button>
          <Button
            variant="outline"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            className="text-red-theme border-red-theme/30 hover:bg-red-theme/10"
          >
            {resetMutation.isPending ? 'Сброс…' : 'Заводские настройки (Reset)'}
          </Button>
          {config && draft && (
            <Button variant="ghost" onClick={() => setDraft(config)}>
              Отменить правки
            </Button>
          )}
        </div>
      </section>

      {/* Персональный House Edge и RTP */}
      <section className="rounded-xl border border-line bg-card/60 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="text-base font-bold">House Edge и RTP</h2>
            <p className="text-xs text-muted">Динамическая балансировка математического ожидания</p>
          </div>
          <Button
            variant="outline"
            disabled={resetHeMutation.isPending}
            onClick={() => resetHeMutation.mutate()}
          >
            Сбросить к базовому (4%)
          </Button>
        </div>

        {houseEdge && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-muted/5 p-3">
              <span className="text-xs text-muted">Текущий House Edge</span>
              <p className="mt-1 text-lg font-bold text-ink">
                {(houseEdge.currentHouseEdge * 100).toFixed(2)}%
              </p>
            </div>
            <div className="rounded-lg border border-line bg-muted/5 p-3">
              <span className="text-xs text-muted">Теоретический возврат (RTP)</span>
              <p className="mt-1 text-lg font-bold text-accent">
                {(houseEdge.rtp * 100).toFixed(2)}%
              </p>
            </div>
            <div className="rounded-lg border border-line bg-muted/5 p-3">
              <span className="text-xs text-muted">Матожидание (EV)</span>
              <p className="mt-1 text-lg font-bold text-ink">
                {(houseEdge.expectedValue * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Управление турниром и финализация наград */}
      <section className="rounded-xl border border-line bg-card/60 p-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <h2 className="text-base font-bold">Турнир и выплата наград</h2>
            <p className="text-xs text-muted">
              Финализация суточного турнира, начисление бонусов топ-3 и сброс таблицы
            </p>
          </div>
          <Button
            variant="success"
            disabled={settleMutation.isPending}
            onClick={() => settleMutation.mutate()}
          >
            {settleMutation.isPending ? 'Расчёт…' : 'Финализировать турнир (Force Settle)'}
          </Button>
        </div>

        <div className="mt-4">
          <h3 className="text-xs font-semibold text-muted mb-2">История завершенных турниров (Архив призов)</h3>
          {tournamentHistory.length === 0 ? (
            <p className="text-xs text-muted py-2">Архив пуст. Финализируйте турнир, чтобы зафиксировать победителей.</p>
          ) : (
            <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
              {tournamentHistory.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="font-semibold text-amber-500">#{item.place} место: {item.playerName}</span>
                  <span className="text-muted">{item.score} очков</span>
                  <span className="font-bold text-pick">+{item.prizeAwarded} бонусов</span>
                  <span className="text-muted text-[10px]">{new Date(item.awardedAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
