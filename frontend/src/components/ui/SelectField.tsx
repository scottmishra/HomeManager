interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export function SelectField({ options, className, ...props }: SelectFieldProps) {
  return (
    <select
      className={`w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 disabled:bg-warm-50 disabled:text-warm-400 ${className ?? ""}`}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
