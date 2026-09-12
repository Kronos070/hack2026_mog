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
      <span className="block text-xs text-muted">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-base focus:border-ink focus:outline-none"
      />
    </label>
  );
}
