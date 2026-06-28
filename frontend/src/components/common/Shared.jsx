export function PageHeader({ title, description, action, breadcrumb }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        {breadcrumb && (
          <div className="mb-1 text-xs font-medium text-steel-400">{breadcrumb}</div>
        )}
        <h1 className="text-xl font-semibold text-steel-900 dark:text-steel-50">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-steel-500 dark:text-steel-400">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-lg border border-steel-200 dark:border-steel-700 bg-white dark:bg-steel-900 p-4 ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3.5 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  const variants = {
    primary: 'bg-steel-900 text-white hover:bg-steel-800 dark:bg-amber-500 dark:text-steel-950 dark:hover:bg-amber-400',
    secondary: 'border border-steel-300 dark:border-steel-600 text-steel-700 dark:text-steel-200 hover:bg-steel-100 dark:hover:bg-steel-700',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    ghost: 'text-steel-600 dark:text-steel-300 hover:bg-steel-100 dark:hover:bg-steel-800',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white dark:bg-steel-800 p-5 shadow-xl">
        <h3 className="text-base font-semibold text-steel-900 dark:text-steel-50">{title}</h3>
        <p className="mt-1.5 text-sm text-steel-500 dark:text-steel-400">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
