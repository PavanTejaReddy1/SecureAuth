import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import { ShieldAlert, Clock } from 'lucide-react';

export default function LockedPage() {
  const location = useLocation();

  // The server passes the unlock time when redirecting here
  const { unlockAt } = location.state || {};

  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!unlockAt) return;

    function calcSeconds() {
      const remaining = Math.max(0, Math.floor((new Date(unlockAt) - Date.now()) / 1000));
      setSecondsLeft(remaining);
    }

    calcSeconds();
    const interval = setInterval(calcSeconds, 1000);
    return () => clearInterval(interval);
  }, [unlockAt]);

  function formatTime(secs) {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const isUnlocked = secondsLeft === 0 && unlockAt;

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">

        <div className="flex justify-center mb-8">
          <Link to="/"><Logo size="md" /></Link>
        </div>

        <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-center">

          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <ShieldAlert size={30} className="text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Account locked</h1>

          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Too many failed verification attempts. Your account has been locked for{' '}
            <span className="text-white font-medium">1 hour</span> as a security measure.
          </p>

          {/* Countdown */}
          {unlockAt && !isUnlocked && (
            <div className="p-5 rounded-xl bg-red-500/[0.07] border border-red-500/15 mb-6">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-2">
                <Clock size={13} />
                Time remaining
              </div>
              <p className="text-4xl font-mono font-bold text-red-400 tracking-widest">
                {formatTime(secondsLeft)}
              </p>
            </div>
          )}

          {/* Unlocked state */}
          {isUnlocked && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 mb-6">
              <p className="text-sm text-green-400 font-medium">
                ✓ Your account is now unlocked. You can try signing in again.
              </p>
            </div>
          )}

          {/* Security tip */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-left mb-6">
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Security notice</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              If you did not make these attempts, someone may be trying to access your account.
              Contact support if you need immediate assistance.
            </p>
          </div>

          {isUnlocked ? (
            <Link
              to="/login"
              className="flex items-center justify-center w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all"
            >
              Try signing in again
            </Link>
          ) : (
            <Link
              to="/"
              className="flex items-center justify-center w-full px-6 py-3.5 bg-white/5 border border-white/10 text-slate-300 font-medium text-sm rounded-xl hover:bg-white/8 transition-all"
            >
              Return to home
            </Link>
          )}

        </div>
      </div>
    </div>
  );
}
