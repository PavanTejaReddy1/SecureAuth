import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import { User, Shield, Smartphone, LogOut, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  if (!user) return null;

  const displayName = user.surname || 'User';
  const displayId = user.email || user.phone || '—';
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen bg-[#0a0f1e]">

      {/* Top nav */}
      <header className="border-b border-white/[0.07] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Greeting */}
        <div className="mb-8 animate-fade-up">
          <p className="text-sm text-slate-500 mb-1">Welcome back</p>
          <h1 className="text-3xl font-bold text-white">{displayName}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Profile card */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <User size={17} className="text-blue-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-200">Profile</h2>
            </div>

            <div className="flex flex-col gap-4">
              <InfoRow label="Surname" value={user.surname || '—'} />
              <InfoRow label="Contact" value={displayId} />
              <InfoRow label="Member since" value={joinDate} />
            </div>
          </div>

          {/* Security card */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Shield size={17} className="text-green-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-200">Security</h2>
            </div>

            <div className="flex flex-col gap-3">
              <SecurityBadge label="OTP verification" active />
              <SecurityBadge label="Single device session" active />
              <SecurityBadge label="Biometric passkey" active={!!user.hasPasskey} />
            </div>
          </div>

          {/* Active session card */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Smartphone size={17} className="text-indigo-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-slate-200">Current session</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium">
                Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoRow label="Device" value={getBrowserName()} />
              <InfoRow label="Signed in" value={user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-GB') : 'Just now'} />
              <InfoRow label="Session" value="This device only" />
            </div>
          </div>

        </div>

        {/* Sign out */}
        <div className="mt-8 max-w-xs">
          <Button variant="danger" onClick={handleLogout}>
            <LogOut size={15} />
            Sign out
          </Button>
        </div>

      </main>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm text-slate-200 font-medium">{value}</p>
    </div>
  );
}

function SecurityBadge({ label, active }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`flex items-center gap-1.5 text-xs font-medium ${active ? 'text-green-400' : 'text-slate-600'}`}>
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
