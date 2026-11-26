import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import { ShieldAlert, Clock } from 'lucide-react';

export default function LockedPage() {
  const location = useLocation();
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-up">

        <div className="flex justify-center mb-8">
          <Link to="/"><Logo size="md" /></Link>
        </div>

        <div className="p-8 rounded-2xl bg-white border border-gray-200 text-center">

          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
            <ShieldAlert size={26} className="text-red-500" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">Account locked</h1>

          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Too many failed attempts. Your account has been locked for{' '}
            <span className="text-gray-900 font-semibold">1 hour</span>.
          </p>

          {/* Countdown */}
          {unlockAt && !isUnlocked && (
            <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 mb-6">
              <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs mb-2">
                <Clock size={12} />
                Time remaining
              </div>
              <p className="text-4xl font-mono font-bold text-gray-900 tracking-widest">
                {formatTime(secondsLeft)}
              </p>
            </div>
          )}

          {/* Unlocked */}
          {isUnlocked && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 mb-6">
              <p className="text-sm text-green-700 font-medium">
                ✓ Your account is now unlocked. You can try signing in again.
              </p>
            </div>
          )}

          {/* Security notice */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-left mb-6">
            <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Security notice</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              If you did not make these attempts, someone may be trying to access your account.
            </p>
          </div>

          {isUnlocked ? (
            <Link
              to="/login"
              className="flex items-center justify-center w-full px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Try signing in again
            </Link>
          ) : (
            <Link
              to="/"
              className="flex items-center justify-center w-full px-6 py-3.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium text-sm rounded-xl transition-colors"
            >
              Return to home
            </Link>
          )}

        </div>
      </div>
    </div>
  );
}
