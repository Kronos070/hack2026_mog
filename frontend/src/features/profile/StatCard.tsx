// Карточка с одним показателем профиля
interface StatCardProps {
  label: string;
  value: string;
  note?: string;
}

export function StatCard({ label, value, note }: StatCardProps) {
  // Отображает значение показателя с подписью
  return (
    <div className="rounded-lg border border-glass-line/40 p-4">
      <p className="text-xs text-on-glass-dim">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {note && <p className="mt-0.5 text-xs text-on-glass-dim">{note}</p>}
    </div>
  );
}
