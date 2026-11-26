import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Fingerprint, ArrowLeft } from 'lucide-react';

export default function BiometricPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { identifier } = location.state || {};

  const [status, setStatus] = useState('idle'); // idle | scanning | success | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleBiometricAuth() {
    setStatus('scanning');
    setErrorMsg('');

    if (!window.PublicKeyCredential) {
      setStatus('error');
      setErrorMsg('Your browser does not support biometric authentication. Please use a 6-digit code instead.');
      return;
    }

    // @simplewebauthn/browser will be wired up in Phase 7
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-up">

        <div className="flex justify-center mb-8">
          <Link to="/"><Logo size="md" /></Link>
        </div>

        <div className="p-8 rounded-2xl bg-white border border-gray-200 text-center">

          {/* Icon */}
          <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            status === 'scanning' ? 'bg-gray-200 border border-gray-300 scale-105' :
            status === 'success'  ? 'bg-green-50 border border-green-200' :
            status === 'error'    ? 'bg-red-50 border border-red-200' :
            'bg-gray-100 border border-gray-200'
          }`}>
            <Fingerprint
              size={30}
              className={`transition-colors duration-200 ${
                status === 'scanning' ? 'text-gray-600 animate-pulse' :
                status === 'success'  ? 'text-green-600' :
                status === 'error'    ? 'text-red-500' :
                'text-gray-700'
              }`}
            />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {status === 'scanning' ? 'Verifying...'  :
             status === 'success'  ? 'Verified!'     :
             'Biometric sign in'}
          </h1>

          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {status === 'idle'     && 'Use your device fingerprint, Face ID, or security key.'}
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
                <Fingerprint size={15} />
                {status === 'error' ? 'Try again' : 'Use biometrics'}
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
