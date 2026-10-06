import { cn } from "@/lib/utils";

export type Errors = Record<string, string | undefined>;

/** Shared attributes that wire an input to its label and error message. */
export function fieldProps(name: string, errors: Errors) {
  return {
    id: name,
    name,
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  };
}

export function Field({
  name,
  label,
  errors,
  required,
  hint,
  className,
  children,
}: {
  name: string;
  label: string;
  errors: Errors;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-rose"> *</span> : <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      {hint && !errors[name] && <p className="text-xs text-muted">{hint}</p>}
      {errors[name] && (
        <p id={`${name}-error`} role="alert" className="text-sm text-red-600">
          {errors[name]}
        </p>
      )}
    </div>
  );
}
