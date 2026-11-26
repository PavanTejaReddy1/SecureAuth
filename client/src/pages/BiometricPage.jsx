import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { startAuthentication } from '@simplewebauthn/browser';
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

  const [status, setStatus]     = useState('idle'); // idle | scanning | success | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleBiometricAuth() {
    if (!identifier) {
      setStatus('error');
      setErrorMsg('No identifier provided. Please go back and enter your email or phone.');
      return;
    }

    // Check browser support before attempting
    if (!window.PublicKeyCredential) {
      setStatus('error');
      setErrorMsg('Your browser does not support biometric authentication. Please use a 6-digit code instead.');
      return;
    }

    setStatus('scanning');
    setErrorMsg('');

    try {
      // 1. Get a challenge from the server
      const options = await webauthnService.authenticationOptions({ identifier });

      // 2. Trigger the browser's native biometric prompt (Face ID, fingerprint, etc.)
      //    The browser handles everything — we never see the actual biometric data
      const authResponse = await startAuthentication({ optionsJSON: options });

      // 3. Send the signed response back to the server for verification
      const data = await webauthnService.verifyAuthentication({
        identifier,
        authenticationResponse: authResponse,
      });

      setStatus('success');
      setUser(data.user);

      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      setStatus('error');

      if (err.name === 'NotAllowedError') {
        // User cancelled the browser prompt
        setErrorMsg('Authentication was cancelled. Please try again or use a 6-digit code instead.');
      } else if (err.message && err.message.includes('No passkeys')) {
        setErrorMsg('No passkeys are registered for this account. Please sign in with a code and register a passkey from your dashboard.');
      } else if (err.message && err.message.includes('already active')) {
        setErrorMsg('Your account is already active on another device. Please sign out from that device first.');
      } else {
        setErrorMsg(err.message || 'Biometric authentication failed. Please try again or use a code.');
      }
    }
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
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-up">

        <div className="flex justify-center mb-6">
          <Link to="/"><Logo size="md" /></Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-8 text-center">

          {/* Status icon */}
          <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            status === 'scanning' ? 'bg-gray-200 scale-105 border border-gray-300'  :
            status === 'success'  ? 'bg-green-50 border border-green-200'           :
            status === 'error'    ? 'bg-red-50 border border-red-200'               :
            'bg-gray-100 border border-gray-200'
          }`}>
            <Fingerprint size={30} className={`transition-colors duration-200 ${
              status === 'scanning' ? 'text-gray-600 animate-pulse' :
              status === 'success'  ? 'text-green-600'              :
              status === 'error'    ? 'text-red-500'                :
              'text-gray-700'
            }`} />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {status === 'scanning' ? 'Verifying...'       :
             status === 'success'  ? 'Verified!'          :
             status === 'error'    ? 'Could not verify'   :
             'Biometric sign in'}
          </h1>

          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {status === 'idle'     && 'Use your device fingerprint, Face ID, or security key to sign in securely.'}
            {status === 'scanning' && 'Follow the prompt on your device…'}
            {status === 'success'  && 'Authentication successful. Redirecting you now.'}
            {status === 'error'    && 'Please try again or use a 6-digit code instead.'}
          </p>

          {errorMsg && <div className="mb-4"><Alert type="error" message={errorMsg} /></div>}

          {status !== 'success' && (
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleBiometricAuth}
                loading={status === 'scanning'}
                variant="primary"
              >
                <Fingerprint size={15} />
                {status === 'error' ? 'Try again' : 'Use Face ID / Fingerprint'}
              </Button>

              <button
                onClick={goToOtp}
                className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors py-1"
              >
                Use a 6-digit code instead
              </button>
            </div>
          )}

        </div>

        <div className="flex justify-center mt-5">
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
