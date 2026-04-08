import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white sm:max-w-lg sm:rounded-2xl animate-slide-up">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-warm-100 px-4 py-3">
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
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
