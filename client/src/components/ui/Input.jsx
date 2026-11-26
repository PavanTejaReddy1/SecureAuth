// Input field — white bg, sits inside a white card, so uses a visible gray border
export default function Input({ label, error, className = '', ...props }) {
  const base = [
    'w-full px-4 py-3 rounded-xl text-sm text-gray-900',
    'bg-white border',
    'placeholder:text-gray-400',
    'outline-none transition duration-150',
    'hover:border-gray-400',
    'focus:border-gray-900 focus:ring-2 focus:ring-black/8',
  ].join(' ');

  const borderColor = error
    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
    : 'border-gray-200';

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input className={`${base} ${borderColor} ${className}`} {...props} />
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
