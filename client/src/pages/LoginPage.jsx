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
        state: { identifier: identifier.trim(), identifierType, purpose: 'login' },
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
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-up">

        <div className="flex justify-center mb-6">
          <Link to="/"><Logo size="md" /></Link>
        </div>

        {/* White card */}
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
            {serverError && <Alert type="error" message={serverError} />}
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
