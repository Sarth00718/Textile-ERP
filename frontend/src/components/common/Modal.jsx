import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className={`w-full ${maxWidth} rounded-lg bg-white dark:bg-steel-800 shadow-xl my-8`}>
        <div className="flex items-center justify-between border-b border-steel-200 dark:border-steel-700 px-5 py-3.5">
          <h3 className="text-base font-semibold text-steel-900 dark:text-steel-50">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-steel-400 hover:bg-steel-100 dark:hover:bg-steel-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
