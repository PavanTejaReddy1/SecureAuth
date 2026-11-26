import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import { User, Shield, Smartphone, LogOut, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  if (!user) return null;

  const displayId = user.email || user.phone || '—';
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen bg-[#f4f5f7]">

      {/* Header — white bar */}
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

        {/* Greeting — on gray background */}
        <div className="mb-8 animate-fade-up">
          <p className="text-sm text-gray-400 mb-0.5">Welcome back</p>
          <h1 className="text-2xl font-bold text-gray-900">{user.surname || 'User'}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Profile — white card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <User size={15} className="text-gray-600" />
              </div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profile</h2>
            </div>
            <div className="flex flex-col gap-4">
              <InfoRow label="Surname" value={user.surname || '—'} />
              <InfoRow label="Contact" value={displayId} />
              <InfoRow label="Member since" value={joinDate} />
            </div>
          </div>

          {/* Security — white card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Shield size={15} className="text-gray-600" />
              </div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Security</h2>
            </div>
            <div className="flex flex-col gap-1">
              <SecurityRow label="OTP verification" active />
              <SecurityRow label="Single device session" active />
              <SecurityRow label="Biometric passkey" active={!!user.hasPasskey} />
            </div>
          </div>

          {/* Session — white card spanning full width */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Smartphone size={15} className="text-gray-600" />
              </div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex-1">Current session</h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 font-semibold">
                Active
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoRow label="Device" value={getBrowserName()} />
              <InfoRow label="Signed in" value={user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-GB') : 'Just now'} />
              <InfoRow label="Restriction" value="This device only" />
            </div>
          </div>

        </div>

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
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  return 'Browser';
}
