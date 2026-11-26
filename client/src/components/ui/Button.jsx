// Reusable button with primary and secondary variants + loading state
export default function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  ...props
}) {
  const base = 'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35 hover:-translate-y-px',
    secondary: 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 hover:-translate-y-px',
    ghost: 'bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200',
    danger: 'bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
