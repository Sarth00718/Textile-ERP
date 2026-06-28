function FieldWrapper({ label, error, required, children }) {
  return (
    <div className="mb-3.5">
      {label && (
        <label className="mb-1 block text-sm font-medium text-steel-700 dark:text-steel-200">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error.message}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-steel-300 dark:border-steel-600 bg-white dark:bg-steel-900 px-3 py-2 text-sm text-steel-900 dark:text-steel-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:bg-steel-100 dark:disabled:bg-steel-800';

export function Input({ label, error, required, register, name, ...props }) {
  return (
    <FieldWrapper label={label} error={error} required={required}>
      <input className={inputClass} {...register(name, { valueAsNumber: props.type === 'number' })} {...props} />
    </FieldWrapper>
  );
}

export function Select({ label, error, required, register, name, options, placeholder, ...props }) {
  return (
    <FieldWrapper label={label} error={error} required={required}>
      <select className={inputClass} {...register(name)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </FieldWrapper>
  );
}

export function Textarea({ label, error, required, register, name, ...props }) {
  return (
    <FieldWrapper label={label} error={error} required={required}>
      <textarea className={inputClass} rows={3} {...register(name)} {...props} />
    </FieldWrapper>
  );
}

export function Checkbox({ label, register, name, ...props }) {
  return (
    <label className="mb-3.5 flex items-center gap-2 text-sm text-steel-700 dark:text-steel-200">
      <input type="checkbox" className="rounded border-steel-300 dark:border-steel-600 text-amber-500 focus:ring-amber-500" {...register(name)} {...props} />
      {label}
    </label>
  );
}
