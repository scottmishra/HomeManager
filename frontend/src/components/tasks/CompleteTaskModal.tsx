import { useState } from "react";
import { Modal } from "../ui/Modal";

const INPUT_CLASS =
  "w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30";

interface CompleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  onConfirm: (notes: string) => Promise<void>;
}

export function CompleteTaskModal({
  isOpen,
  onClose,
  taskTitle,
  onConfirm,
}: CompleteTaskModalProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(notes);
      setNotes("");
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark Task Complete">
      <div className="space-y-4">
        <p className="text-sm text-warm-700">
          <span className="font-medium">{taskTitle}</span>
        </p>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-warm-700">
            Notes{" "}
            <span className="font-normal text-warm-400">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this completion…"
            rows={3}
            className={INPUT_CLASS}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-warm-200 px-4 py-2.5 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Mark Complete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
