interface SelectProps {
  readonly label: string;
  readonly value: string;
  readonly options: readonly string[];
  readonly onChange: (value: string) => void;
}

export function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-card-foreground
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
          hover:border-primary/50 cursor-pointer"
      >
        <option value="">全部</option>
        {options.map((opt) => (
          <option
            key={opt}
            value={opt}
            className="bg-card text-card-foreground"
          >
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
