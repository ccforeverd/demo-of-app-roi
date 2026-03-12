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
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">
        {groupLabel}
      </span>
      <div className="flex items-center gap-4">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-1.5 text-sm"
          >
            <input
              type="radio"
              name={groupLabel}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="h-4 w-4 accent-primary"
            />
            <span
              className={
                value === opt.value
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              }
            >
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
