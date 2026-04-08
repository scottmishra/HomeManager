interface BadgeProps {
  variant:
    | "urgent"
    | "high"
    | "medium"
    | "low"
    | "pending"
    | "completed"
    | "overdue"
    | "upcoming"
    | "ai";
  label?: string;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeProps["variant"], string> = {
  urgent:    "bg-red-50 text-red-700 border border-red-200",
  overdue:   "bg-red-50 text-red-700 border border-red-200",
  high:      "bg-gold-50 text-gold-600 border border-gold-200",
  medium:    "bg-warm-100 text-warm-700 border border-warm-200",
  low:       "bg-warm-50 text-warm-500 border border-warm-200",
  pending:   "bg-warm-100 text-warm-700",
  completed: "bg-sage-50 text-sage-500 border border-sage-200",
  upcoming:  "bg-brand-50 text-brand-700 border border-brand-200",
  ai:        "bg-warm-100 text-warm-600 border border-warm-200",
};

const DEFAULT_LABELS: Record<BadgeProps["variant"], string> = {
  urgent:    "Urgent",
  overdue:   "Overdue",
  high:      "High",
  medium:    "Medium",
  low:       "Low",
  pending:   "Pending",
  completed: "Completed",
  upcoming:  "Upcoming",
  ai:        "AI",
};

export function Badge({ variant, label, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {label ?? DEFAULT_LABELS[variant]}
    </span>
  );
}
