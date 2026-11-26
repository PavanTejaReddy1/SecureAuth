import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Fingerprint, ArrowLeft } from 'lucide-react';

// WebAuthn (Phase 7) — the @simplewebauthn/browser package is not installed yet.
// This page shows the UI and handles the flow, but biometric calls will return
// a friendly "not available" message until Phase 7 wires up the real library.

export default function BiometricPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { identifier } = location.state || {};

  const [status, setStatus] = useState('idle'); // idle | scanning | success | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleBiometricAuth() {
    setStatus('scanning');
    setErrorMsg('');

    // Check whether the browser supports WebAuthn at all
    if (!window.PublicKeyCredential) {
      setStatus('error');
      setErrorMsg('Your browser does not support biometric authentication. Please use a 6-digit code instead.');
      return;
    }

    // The @simplewebauthn/browser library will be wired up in Phase 7.
    // For now, show a clear placeholder message so the page is functional.
    setStatus('error');
    setErrorMsg('Biometric sign-in will be available in the next update. Please use a 6-digit code for now.');
  }

  function goToOtp() {
    navigate('/verify-otp', {
      state: {
        identifier,
        identifierType: identifier && identifier.includes('@') ? 'email' : 'phone',
        purpose: 'login',
      },
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">

        <div className="flex justify-center mb-8">
          <Link to="/"><Logo size="md" /></Link>
        </div>

        <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-center">

          {/* Biometric icon — colour changes with status */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center transition-all duration-300 ${
            status === 'scanning' ? 'bg-indigo-500/20 border-2 border-indigo-500/60 scale-105' :
            status === 'success'  ? 'bg-green-500/10 border-2 border-green-500/30' :
            status === 'error'    ? 'bg-red-500/10 border border-red-500/25' :
            'bg-indigo-500/10 border border-indigo-500/20'
          }`}>
            <Fingerprint
              size={36}
              className={`transition-colors duration-300 ${
                status === 'scanning' ? 'text-indigo-400 animate-pulse' :
                status === 'success'  ? 'text-green-400' :
                status === 'error'    ? 'text-red-400' :
                'text-indigo-400'
              }`}
            />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            {status === 'scanning' ? 'Verifying...'  :
             status === 'success'  ? 'Verified!'     :
             'Biometric sign in'}
          </h1>

          <p className="text-sm text-slate-500 mb-7 leading-relaxed">
            {status === 'idle'     && 'Use your device fingerprint, Face ID, or security key to sign in securely.'}
            {status === 'scanning' && 'Follow the prompt on your device.'}
            {status === 'success'  && 'Authentication successful. Redirecting you now.'}
            {status === 'error'    && 'Could not complete biometric authentication.'}
          </p>

          {errorMsg && <Alert type="error" message={errorMsg} />}

          {status !== 'success' && (
            <div className="flex flex-col gap-3 mt-5">
              <Button
                onClick={handleBiometricAuth}
                loading={status === 'scanning'}
                variant="primary"
              >
                <Fingerprint size={16} />
                {status === 'error' ? 'Try again' : 'Use biometrics'}
              </Button>

              <button
                onClick={goToOtp}
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors py-2"
              >
                Use a 6-digit code instead
              </button>
            </div>
          )}

        </div>

        <div className="flex justify-center mt-5">
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-400 transition-colors"
          >
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
