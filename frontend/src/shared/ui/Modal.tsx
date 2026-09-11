// Модальное окно на нативном dialog
import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  // Открывает нативный dialog и закрывает его по клику вне окна
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(92vw,32rem)] rounded-lg border border-line p-0 backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Закрыть">
          ✕
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
    </dialog>
  );
}
