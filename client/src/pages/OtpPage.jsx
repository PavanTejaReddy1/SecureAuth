import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import OtpInput from '../components/auth/OtpInput';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { maskIdentifier } from '../utils/validators';

const RESEND_COOLDOWN = 60; // seconds before the user can request a new OTP
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

export default function OtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  // The register/login page passes these in navigation state
  const { identifier, identifierType, purpose } = location.state || {};

  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasOtpError, setHasOtpError] = useState(false);

  // Resend countdown
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  // If no identifier was passed, redirect away
  useEffect(() => {
    if (!identifier) {
      navigate('/login');
    }
  }, [identifier, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.length === 6) {
      handleVerify();
    }
  }, [otp]);

  async function handleVerify() {
    if (otp.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    setError('');
    setHasOtpError(false);

    try {
      const data = await authService.verifyOtp({ identifier, otp, purpose });

      setSuccess('Verified successfully!');
      setUser(data.user);

      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    } catch (err) {
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

      // In demo mode the server returns the OTP in the response
      if (IS_DEMO && data.demoOtp) {
        setDemoOtp(data.demoOtp);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  const maskedId = identifier ? maskIdentifier(identifier) : '';
  const channelLabel = identifierType === 'email' ? 'email' : 'phone';

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">

        <div className="flex justify-center mb-8">
          <Link to="/"><Logo size="md" /></Link>
        </div>

        <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.07]">

          <div className="text-center mb-8">
            {/* Lock icon */}
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check your {channelLabel}</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              We sent a 6-digit code to{' '}
              <span className="text-slate-300 font-medium">{maskedId}</span>
            </p>
          </div>

          {/* OTP boxes */}
          <div className="mb-6">
            <OtpInput
              value={otp}
              onChange={(val) => {
                setOtp(val);
                setHasOtpError(false);
                setError('');
              }}
              hasError={hasOtpError}
              disabled={loading}
            />
          </div>

          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <Button
            onClick={handleVerify}
            loading={loading}
            disabled={otp.length !== 6}
            className="mt-5"
          >
            Verify code
          </Button>

          {/* Resend */}
          <div className="text-center mt-5">
            {countdown > 0 ? (
              <p className="text-sm text-slate-500">
                Resend code in{' '}
                <span className="text-slate-300 font-mono font-medium">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
              >
                {resending ? 'Sending...' : "Didn't receive it? Resend"}
              </button>
            )}
          </div>

          {/* Demo mode panel */}
          {IS_DEMO && (
            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-semibold text-amber-400 mb-1 uppercase tracking-wide">Demo mode</p>
              <p className="text-xs text-amber-300/70 mb-2">
                No real messages are sent. Your OTP is shown here for evaluation purposes.
              </p>
              {demoOtp && (
                <p className="text-2xl font-mono font-bold text-amber-300 tracking-widest text-center py-1">
                  {demoOtp}
                </p>
              )}
            </div>
          )}

        </div>

        <p className="text-center text-sm text-slate-600 mt-5">
          Wrong details?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
}
