// Поле ввода формы авторизации
interface AuthFieldProps {
  label: string;
  value: string;
  type?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
}

export function AuthField({ label, value, type = 'text', autoComplete, onChange }: AuthFieldProps) {
  // Текстовое поле с подписью для форм входа и регистрации
  return (
    <label className="block">
      <span className="block text-[clamp(0.7rem,1.1vw,0.8rem)] font-semibold text-on-glass-dim">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="glass-tile mt-1 w-full rounded-xl px-[clamp(0.75rem,1.6vw,1rem)] py-[clamp(0.5rem,1.2vw,0.7rem)] text-[clamp(0.9rem,1.4vw,1rem)] font-semibold text-on-glass outline-none focus:brightness-125"
      />
    </label>
  );
}
