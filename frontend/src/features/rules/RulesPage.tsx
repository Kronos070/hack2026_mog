// Страница правил игры: разбор механики раунда

import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/Button';

const RULES: readonly (readonly [string, string])[] = [
  ['Ставка', 'Выберите фрагмент пазла — его стоимость списывается с баланса бонусов.'],
  ['Полёт', 'Шар поднимается, коэффициент растёт. Чем дольше полёт, тем больше выигрыш.'],
  ['Уровни', 'Зелёная тема — 9 уровней, красная — 12. За каждый пройденный уровень начисляются очки.'],
  ['Забрать', 'Кнопка активна после первого уровня. Выигрыш = ставка × текущий коэффициент.'],
  ['Бустер', 'Если шар достиг уровня с бустером до нажатия «Забрать», коэффициент умножается.'],
  ['Крах', 'В случайный момент шар лопается. Если выигрыш не зафиксирован — ставка сгорает.'],
  ['Награда', 'За каждый раунд выдаётся фрагмент коллекции. Соберите все 6 — получите бонус.'],
];

export function RulesPage() {
  // Показывает правила игры отдельным экраном
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-glass-line/40 pb-4">
        <div>
          <h1 className="text-xl font-bold">Правила игры</h1>
          <p className="text-sm text-on-glass-dim">Как устроен раунд и из чего складывается выигрыш</p>
        </div>
        <Button variant="glass" onClick={() => navigate('/game')}>
          К игре
        </Button>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        {RULES.map(([term, description]) => (
          <div key={term} className="glass-tile rounded-xl px-4 py-3.5">
            <dt className="text-base font-bold text-accent">{term}</dt>
            <dd className="mt-1 text-base text-on-glass-dim">{description}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
