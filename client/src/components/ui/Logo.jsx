export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { icon: 26, text: 'text-base' },
    md: { icon: 32, text: 'text-lg' },
    lg: { icon: 40, text: 'text-xl' },
  };

  const { icon, text } = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-2.5">
      <svg width={icon} height={icon} viewBox="0 0 36 36" fill="none">
        <path
          d="M18 3 L31 8.5 V18 C31 25.2 25.3 31.5 18 34 C10.7 31.5 5 25.2 5 18 V8.5 Z"
          fill="#111111"
        />
        <path
          d="M12 18 L16 22 L24 14"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`${text} font-bold tracking-tight text-gray-900`}>
        SecureAuth
      </span>
    </div>
  );
}
