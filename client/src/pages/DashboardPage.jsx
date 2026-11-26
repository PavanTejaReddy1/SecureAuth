import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startRegistration } from '@simplewebauthn/browser';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import Alert from '../components/ui/Alert';
import { User, Shield, Smartphone, LogOut, CheckCircle, Fingerprint, KeyRound } from 'lucide-react';
import { webauthnService } from '../services/api';
import { maskIdentifier } from '../utils/validators';

export default function DashboardPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [passkeyLoading, setPasskeyLoading]   = useState(false);
  const [passkeyMessage, setPasskeyMessage]   = useState('');
  const [passkeyError, setPasskeyError]       = useState('');

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  // Register a new passkey for this account
  async function handleRegisterPasskey() {
    setPasskeyLoading(true);
    setPasskeyMessage('');
    setPasskeyError('');

    try {
      // 1. Get registration options (challenge) from the server
      const options = await webauthnService.registrationOptions();

      // 2. Browser shows the native biometric prompt
      const registrationResponse = await startRegistration({ optionsJSON: options });

      // 3. Send the signed response to the server
      await webauthnService.verifyRegistration({ registrationResponse });

      setPasskeyMessage('Passkey registered successfully! You can now use biometrics to sign in.');
      // Update the user state so the dashboard shows hasPasskey: true
      setUser((prev) => ({ ...prev, hasPasskey: true }));
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setPasskeyError('Registration was cancelled.');
      } else {
        setPasskeyError(err.message || 'Failed to register passkey. Please try again.');
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  if (!user) return null;

  const displayId = user.email
    ? user.email
    : user.phone
      ? maskIdentifier(user.phone)
      : '—';

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  return (
    <div className="min-h-screen bg-[#f4f5f7]">

      {/* Top navigation bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* Greeting */}
        <div className="mb-8 animate-fade-up">
          <p className="text-sm text-gray-400 mb-0.5">Welcome back</p>
          <h1 className="text-2xl font-bold text-gray-900">{user.surname || 'User'}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <CardHeader icon={<User size={15} />} title="Profile" />
            <div className="flex flex-col gap-4">
              <InfoRow label="Surname"      value={user.surname || '—'} />
              <InfoRow label="Contact"      value={displayId} />
              <InfoRow label="Member since" value={joinDate} />
              <InfoRow label="Status"       value={user.isVerified ? 'Verified' : 'Unverified'} />
            </div>
          </div>

          {/* Security card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <CardHeader icon={<Shield size={15} />} title="Security" />
            <div className="flex flex-col gap-1">
              <SecurityRow label="OTP verification"    active={true} />
              <SecurityRow label="Single device session" active={true} />
              <SecurityRow label="Biometric passkey"   active={!!user.hasPasskey} />
            </div>
          </div>

          {/* Active session card — full width */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Smartphone size={15} className="text-gray-600" />
              </div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex-1">
                Current session
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 font-semibold">
                Active
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoRow label="Browser"    value={getBrowserName()} />
              <InfoRow label="Signed in"  value={user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-GB') : 'Just now'} />
              <InfoRow label="Restriction" value="This device only" />
            </div>
          </div>

          {/* Passkey registration card — full width */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:col-span-2">
            <CardHeader icon={<KeyRound size={15} />} title="Passkeys" />

            {user.hasPasskey ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle size={18} className="text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Passkey registered</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    You can sign in with Face ID or fingerprint on this or other registered devices.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  Register a passkey to sign in using Face ID, fingerprint, or a security key — no code required.
                </p>

                {passkeyMessage && <div className="mb-4"><Alert type="success" message={passkeyMessage} /></div>}
                {passkeyError   && <div className="mb-4"><Alert type="error"   message={passkeyError} /></div>}

                <button
                  onClick={handleRegisterPasskey}
                  disabled={passkeyLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-semibold transition-colors disabled:opacity-40"
                >
                  {passkeyLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registering…
                    </>
                  ) : (
                    <>
                      <Fingerprint size={15} />
                      Register a passkey
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Sign out button */}
        <div className="mt-6 max-w-xs">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-600 hover:text-red-600 text-sm font-medium shadow-sm transition-all"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>

      </main>
    </div>
  );
}

// ─── Small helper components ─────────────────────────────────────────────────

function CardHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600">
        {icon}
      </div>
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h2>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-800 font-semibold">{value}</p>
    </div>
  );
}

function SecurityRow({ label, active }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`flex items-center gap-1.5 text-xs font-semibold ${active ? 'text-green-700' : 'text-gray-400'}`}>
        <CheckCircle size={13} />
        {active ? 'Enabled' : 'Not set up'}
      </span>
    </div>
  );
}

function getBrowserName() {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox'))                        return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg'))                            return 'Edge';
  return 'Browser';
}
