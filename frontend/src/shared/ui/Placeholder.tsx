// Заглушка для нереализованных блоков прототипа
interface PlaceholderProps {
  title: string;
  note?: string;
  className?: string;
}

export function Placeholder({ title, note, className }: PlaceholderProps) {
  // Явно помечает незаполненный блок как заглушку
  return (
    <div
      className={`rounded-md border border-dashed border-line p-4 text-center ${className ?? ''}`}
    >
      <p className="text-sm font-medium text-muted">{title}</p>
      <p className="mt-1 text-xs text-muted/70">{note ?? 'Заглушка — блок не реализован'}</p>
    </div>
  );
}
