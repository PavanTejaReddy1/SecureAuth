// A single labelled text input with optional error message
// Uses Tailwind for all styling — no custom CSS classes
export default function Input({ label, error, className = '', ...props }) {
  const baseClasses = [
    'w-full px-4 py-3 rounded-xl text-sm text-slate-100',
    'bg-white/[0.04] border',
    'placeholder:text-slate-500',
    'outline-none transition duration-150',
    'hover:bg-white/[0.06] hover:border-white/20',
    'focus:bg-blue-500/[0.05] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15',
  ];

  const errorClasses = error
    ? 'border-red-500/60 bg-red-500/[0.03] focus:border-red-500/60 focus:ring-red-500/10'
    : 'border-white/10';

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`${baseClasses.join(' ')} ${errorClasses} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1 mt-0.5">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
