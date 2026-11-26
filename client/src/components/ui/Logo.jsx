// SecureAuth brand logo — shield icon + wordmark
export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 44, text: 'text-2xl' },
  };

  const { icon, text } = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-3">
      {/* Shield icon */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shield-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <path
          d="M18 3 L31 8.5 V18 C31 25.2 25.3 31.5 18 34 C10.7 31.5 5 25.2 5 18 V8.5 Z"
          fill="url(#shield-gradient)"
        />
        <path
          d="M12 18 L16 22 L24 14"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Wordmark */}
      <span className={`${text} font-bold tracking-tight text-white`}>
        Secure<span className="text-blue-400">Auth</span>
      </span>
    </div>
  );
}
