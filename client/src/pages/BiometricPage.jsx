import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';
import { webauthnService } from '../services/api';
import { Fingerprint, ArrowLeft } from 'lucide-react';

export default function BiometricPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  const { identifier } = location.state || {};

  const [status, setStatus] = useState('idle'); // idle | scanning | success | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleBiometricAuth() {
    setStatus('scanning');
    setErrorMsg('');

    try {
      // Check if the WebAuthn library is available (installed in Phase 7)
      let startAuthentication;
      try {
        const webauthnLib = await import(/* @vite-ignore */ '@simplewebauthn/browser');
        startAuthentication = webauthnLib.startAuthentication;
      } catch {
        throw new Error('Biometric authentication is not yet configured on this device.');
      }

      // 1. Get a challenge from the server
      const options = await webauthnService.authenticationOptions({ identifier });

      // 2. Trigger the browser's biometric prompt
      const authResponse = await startAuthentication(options);

      // 3. Send the signed response to the server for verification
      const data = await webauthnService.verifyAuthentication({ identifier, authResponse });

      setStatus('success');
      setUser(data.user);

      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      setStatus('error');

      // User cancelled the biometric prompt — show a friendly message
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Biometric authentication was cancelled. Try again or use a code instead.');
      } else {
        setErrorMsg(err.message || 'Biometric authentication failed.');
      }
    }
  }

  function goToOtp() {
    navigate('/verify-otp', {
      state: { identifier, identifierType: 'email', purpose: 'login' },
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">

        <div className="flex justify-center mb-8">
          <Link to="/"><Logo size="md" /></Link>
        </div>

        <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-center">

          {/* Biometric icon */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center transition-all duration-300 ${
            status === 'scanning' ? 'bg-indigo-500/20 border-2 border-indigo-500/60 scale-105' :
            status === 'success'  ? 'bg-green-500/15 border-2 border-green-500/40' :
            status === 'error'    ? 'bg-red-500/15 border-2 border-red-500/40' :
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
            {status === 'scanning' ? 'Verifying...' :
             status === 'success'  ? 'Verified!' :
             'Biometric sign in'}
          </h1>

          <p className="text-sm text-slate-500 mb-7 leading-relaxed">
            {status === 'idle' &&
              'Use your device fingerprint, Face ID, or security key to sign in securely.'}
            {status === 'scanning' &&
              'Follow the prompt on your device.'}
            {status === 'success' &&
              'Authentication successful. Redirecting you now.'}
            {status === 'error' &&
              'Authentication failed. Please try again.'}
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
