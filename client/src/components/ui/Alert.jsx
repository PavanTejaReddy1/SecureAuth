export default function Alert({ type = 'error', message }) {
  if (!message) return null;

  const styles = {
    error:   'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info:    'bg-gray-50 border-gray-200 text-gray-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  const icons = {
    error:   '✕',
    success: '✓',
    info:    'ℹ',
    warning: '⚠',
  };

  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm ${styles[type]}`}>
      <span className="font-bold mt-px leading-none">{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}
