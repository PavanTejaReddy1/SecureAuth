// Inline alert for success, error, and info messages
export default function Alert({ type = 'error', message }) {
  if (!message) return null;

  const styles = {
    error:   'bg-red-500/10 border-red-500/25 text-red-400',
    success: 'bg-green-500/10 border-green-500/25 text-green-400',
    info:    'bg-blue-500/10 border-blue-500/25 text-blue-400',
    warning: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
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
