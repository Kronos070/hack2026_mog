// Админ-панель: редактирование игровых параметров с валидацией через zod

import { useEffect, useState } from 'react';
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
  { key: 'multiplierGrowthRate', label: 'Темп роста множителя', step: 0.01 },
  { key: 'growthAcceleration', label: 'Ускорение роста (1 = ровно, 2 = резко)', step: 0.1 },
  { key: 'pointsPerLine', label: 'Очки за уровень (points_per_line)' },
  { key: 'pointsCashoutBonus', label: 'Очки за cashout' },
  { key: 'pointsBoosterBonus', label: 'Очки за бустер' },
  { key: 'minWinAmount', label: 'Порог выигрыша для апсейла' },
  { key: 'popupTimeout', label: 'Таймаут попапа, с' },
];

export function AdminPage() {
  // Загружает конфиг, валидирует правки и сохраняет их на бэкенд
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<GameConfig | null>(null);

  const { data } = useQuery({ queryKey: ['config'], queryFn: () => api.getConfig() });

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (config: GameConfig) => api.saveConfig(config),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['config'] });
      void queryClient.invalidateQueries({ queryKey: ['booster-pricing'] });
      toast.success('Параметры сохранены — применятся со следующего раунда');
    },
    onError: () => toast.error('Не удалось сохранить параметры'),
  });

  const handleSave = (): void => {
    if (!draft) return;
    const parsed = gameConfigSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error('Проверьте корректность значений');
      return;
    }
    mutation.mutate(parsed.data);
  };

  if (!draft) return <main className="p-6 text-sm text-muted">Загрузка параметров…</main>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <header className="flex items-center justify-between border-b border-line pb-4">
        <h1 className="text-xl font-bold">Параметры игры</h1>
        <Button variant="ghost" onClick={() => navigate('/')}>
          Выйти
        </Button>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <NumberField
            key={field.key}
            label={field.label}
            value={draft[field.key] as number}
            step={field.step ?? 1}
            onChange={(value) => setDraft({ ...draft, [field.key]: value })}
          />
        ))}
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-muted">Множители бустеров</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {draft.boosterTierValues.map((value, index) => (
            <NumberField
              key={index}
              label={`Tier ${index + 1}`}
              value={value}
              step={0.1}
              onChange={(next) => {
                const values = [...draft.boosterTierValues];
                values[index] = next;
                setDraft({ ...draft, boosterTierValues: values });
              }}
            />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-muted">Стоимость бустеров (в пазлах)</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(draft.boosterCostFragments ?? [0, 2, 4, 6]).map((value, index) => (
            <NumberField
              key={index}
              label={`Tier ${index + 1}`}
              value={value}
              step={1}
              onChange={(next) => {
                const values = [...(draft.boosterCostFragments ?? [0, 2, 4, 6])];
                values[index] = Math.max(0, Math.round(next));
                setDraft({ ...draft, boosterCostFragments: values });
              }}
            />
          ))}
        </div>
      </section>

      <div className="mt-8 flex gap-3">
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? 'Сохранение…' : 'Сохранить'}
        </Button>
        {data && (
          <Button variant="outline" onClick={() => setDraft(data)}>
            Сбросить
          </Button>
        )}
      </div>
    </main>
  );
}
