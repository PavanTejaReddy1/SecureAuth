import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { getIdentifierType } from '../utils/validators';
import { authService } from '../services/api';
import { Fingerprint, MonitorSmartphone } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeOnOtherDevice, setActiveOnOtherDevice] = useState(false);
  const [showRegisterLink, setShowRegisterLink] = useState(false);

  function handleChange(value) {
    setIdentifier(value);
    setIdentifierError('');
    setServerError('');
    setActiveOnOtherDevice(false);
    setShowRegisterLink(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const identifierType = getIdentifierType(identifier.trim());
    if (!identifierType) {
      setIdentifierError('Please enter a valid email address or phone number.');
      return;
    }

    setLoading(true);
    setServerError('');
    setActiveOnOtherDevice(false);

    try {
      const data = await authService.sendOtp({ identifier: identifier.trim() });

      navigate('/verify-otp', {
        state: {
          identifier:     identifier.trim(),
          identifierType,
          purpose:        'login',
          demoOtp:        data.demoOtp || null,
        },
      });
    } catch (err) {
      if (err.message && err.message.includes('already active on another device')) {
        setActiveOnOtherDevice(true);
      } else if (err.message && err.message.includes('No account found')) {
        // Show a register link alongside the error message
        setServerError('No account found with this email or phone number.');
        setShowRegisterLink(true);
      } else {
        setServerError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleBiometric() {
    navigate('/biometric', { state: { identifier: identifier.trim() } });
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-up">

        <div className="flex justify-center mb-6">
          <Link to="/"><Logo size="md" /></Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-8">

          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in</h1>
            <p className="text-sm text-gray-500">Enter your email or phone to continue.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              label="Email or phone number"
              type="text"
              placeholder="you@example.com or +447911123456"
              value={identifier}
              onChange={(e) => handleChange(e.target.value)}
              error={identifierError}
              autoFocus
              autoComplete="email"
            />

            {serverError && !showRegisterLink && <Alert type="error" message={serverError} />}

            {/* Not registered — show error with a direct link to register */}
            {serverError && showRegisterLink && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <span className="text-red-500 font-bold mt-px leading-none">✕</span>
                <div>
                  <p className="text-sm text-red-700">{serverError}</p>
                  <Link
                    to="/register"
                    className="text-sm font-semibold text-red-800 hover:underline mt-1 inline-block"
                  >
                    Create an account →
                  </Link>
                </div>
              </div>
            )}

            {/* Specific message for active-on-another-device scenario */}
            {activeOnOtherDevice && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <MonitorSmartphone size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-0.5">Already signed in elsewhere</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Your account is active on another device. Sign out from that device first, then try again.
                  </p>
                </div>
              </div>
            )}

            <Button type="submit" loading={loading}>
              Continue with OTP
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            type="button"
            onClick={handleBiometric}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium transition-colors"
          >
            <Fingerprint size={17} className="text-gray-500" />
            Use Face ID / Fingerprint
          </button>

          <p className="text-center text-sm text-gray-400 mt-6">
            No account?{' '}
            <Link to="/register" className="text-gray-900 font-semibold hover:underline">
              Create one
            </Link>
          </p>

        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          <Link to="/" className="hover:text-gray-600 transition-colors">← Back to home</Link>
        </p>

      </div>
    </div>
  );
}
