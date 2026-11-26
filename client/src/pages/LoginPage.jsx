import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { getIdentifierType } from '../utils/validators';
import { authService } from '../services/api';
import { Fingerprint } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(value) {
    setIdentifier(value);
    setIdentifierError('');
    setServerError('');
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

    try {
      await authService.sendOtp({ identifier: identifier.trim() });

      navigate('/verify-otp', {
        state: {
          identifier: identifier.trim(),
          identifierType,
          purpose: 'login',
        },
      });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleBiometric() {
    navigate('/biometric', { state: { identifier: identifier.trim() } });
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-up">

        <div className="flex justify-center mb-8">
          <Link to="/"><Logo size="md" /></Link>
        </div>

        <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.07]">

          <div className="mb-6">
            <h1 className="text-xl font-bold text-white mb-1">Sign in</h1>
            <p className="text-sm text-slate-500">
              Enter your email or phone number to continue.
            </p>
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

            {serverError && <Alert type="error" message={serverError} />}

            <Button type="submit" loading={loading}>
              Continue with OTP
            </Button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-xs text-slate-600 uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          {/* Biometric option */}
          <button
            type="button"
            onClick={handleBiometric}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] text-slate-300 text-sm font-medium transition-all"
          >
            <Fingerprint size={17} className="text-indigo-400" />
            Use Face ID / Fingerprint
          </button>

        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          No account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
}
