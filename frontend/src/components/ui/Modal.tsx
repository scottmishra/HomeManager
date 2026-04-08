import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-nav md:pb-0 sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div className="relative flex w-full flex-col rounded-t-2xl bg-white sm:max-w-lg sm:rounded-2xl animate-slide-up"
           style={{ maxHeight: "min(90dvh, 90vh)" }}>
        {/* Header — always visible */}
        <div className="flex shrink-0 items-center justify-between border-b border-warm-200 px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-warm-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>

        {/* Footer — always visible, outside scroll area */}
        {footer && (
          <div className="shrink-0 border-t border-warm-200 px-4 pb-safe-or-4 pt-3 pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
