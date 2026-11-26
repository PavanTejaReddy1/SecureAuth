export default function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  ...props
}) {
  const base = 'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary:   'bg-gray-900 hover:bg-gray-800 active:bg-black text-white',
    secondary: 'bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 text-gray-800',
    ghost:     'bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-900',
    danger:    'bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
