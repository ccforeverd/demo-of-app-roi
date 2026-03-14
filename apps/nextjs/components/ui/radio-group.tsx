interface RadioOption<T extends string> {
  readonly label: string;
  readonly value: T;
}

interface RadioGroupProps<T extends string> {
  readonly groupLabel: string;
  readonly options: readonly RadioOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}

export function RadioGroup<T extends string>({
  groupLabel,
  options,
  value,
  onChange,
}: RadioGroupProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{groupLabel}</span>
      <div className="flex rounded-lg border border-border bg-background p-1 gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors
              ${
                value === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
