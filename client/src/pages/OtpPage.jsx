import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import OtpInput from '../components/auth/OtpInput';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { maskIdentifier } from '../utils/validators';

const RESEND_COOLDOWN = 60; // seconds
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

export default function OtpPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { setUser } = useAuth();

  // The login/register page passes these in navigation state
  const { identifier, identifierType, purpose } = location.state || {};

  const [otp, setOtp]               = useState('');
  // demoOtp can come from navigation state (send-otp response) or from resend
  const [demoOtp, setDemoOtp]       = useState(location.state?.demoOtp || '');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [hasOtpError, setHasOtpError] = useState(false);
  const [countdown, setCountdown]   = useState(RESEND_COOLDOWN);
  const [resending, setResending]   = useState(false);

  // Redirect to login if no identifier was passed
  useEffect(() => {
    if (!identifier) navigate('/login');
  }, [identifier, navigate]);

  // Countdown timer for the resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (otp.length === 6) handleVerify();
  }, [otp]);

  async function handleVerify() {
    if (otp.length !== 6) { setError('Please enter all 6 digits.'); return; }

    setLoading(true);
    setError('');
    setHasOtpError(false);

    try {
      const data = await authService.verifyOtp({ identifier, otp, purpose });
      setSuccess('Verified successfully!');
      setUser(data.user);
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      // If the account was just locked, redirect to the locked page with the unlock time
      if (err.lockedUntil || (err.message && err.message.toLowerCase().includes('locked'))) {
        navigate('/locked', { state: { unlockAt: err.lockedUntil || null } });
        return;
      }
      setError(err.message);
      setHasOtpError(true);
      setOtp('');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;

    setResending(true);
    setError('');
    setDemoOtp('');

    try {
      const data = await authService.resendOtp({ identifier, purpose });
      setCountdown(RESEND_COOLDOWN);
      if (data.demoOtp) setDemoOtp(data.demoOtp);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }


  const maskedId     = identifier ? maskIdentifier(identifier) : '';
  const channelLabel = identifierType === 'email' ? 'email' : 'phone';

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-up">

        <div className="flex justify-center mb-6">
          <Link to="/"><Logo size="md" /></Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-8">

          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Check your {channelLabel}</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              We sent a 6-digit code to{' '}
              <span className="text-gray-900 font-semibold">{maskedId}</span>
            </p>
          </div>

          <div className="mb-6">
            <OtpInput
              value={otp}
              onChange={(val) => { setOtp(val); setHasOtpError(false); setError(''); }}
              hasError={hasOtpError}
              disabled={loading}
            />
          </div>

          {error   && <Alert type="error"   message={error} />}
          {success && <Alert type="success" message={success} />}

          <Button
            onClick={handleVerify}
            loading={loading}
            disabled={otp.length !== 6}
            className="mt-5"
          >
            Verify code
          </Button>

          <div className="text-center mt-5">
            {countdown > 0 ? (
              <p className="text-sm text-gray-400">
                Resend in <span className="text-gray-700 font-mono font-semibold">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-gray-900 font-semibold hover:underline disabled:opacity-40"
              >
                {resending ? 'Sending...' : "Didn't receive it? Resend"}
              </button>
            )}
          </div>

          {/* Demo mode panel — only shown when VITE_DEMO_MODE=true */}
          {IS_DEMO && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-bold text-amber-700 mb-1 uppercase tracking-widest">
                Demo mode — evaluation only
              </p>
              <p className="text-xs text-amber-600 mb-3">
                No real messages are sent. The actual OTP code is shown below.
              </p>
              {demoOtp ? (
                <p className="text-3xl font-mono font-bold text-amber-900 tracking-[0.3em] text-center py-1">
                  {demoOtp}
                </p>
              ) : (
                <p className="text-xs text-amber-500 text-center italic">
                  OTP will appear here after you request one.
                </p>
              )}
            </div>
          )}

        </div>

        <p className="text-center text-sm text-gray-400 mt-5">
          Wrong details?{' '}
          <Link to={purpose === 'registration' ? '/register' : '/login'} className="text-gray-700 font-medium hover:underline">
            Go back
          </Link>
        </p>

      </div>
    </div>
  );
}
