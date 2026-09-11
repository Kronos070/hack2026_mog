// Числовое поле ввода для админ-панели
interface NumberFieldProps {
  label: string;
  value: number;
  step?: number;
  onChange: (value: number) => void;
}

export function NumberField({ label, value, step = 1, onChange }: NumberFieldProps) {
  // Поле ввода числа с подписью
  return (
    <label className="block">
      <span className="block text-xs text-muted">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
      />
    </label>
  );
}
