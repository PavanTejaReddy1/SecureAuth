import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import { User, LogOut } from 'lucide-react';
import { maskIdentifier } from '../utils/validators';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
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

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
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

      <main className="max-w-xl mx-auto px-6 py-10">

        {/* Greeting */}
        <div className="mb-6 animate-fade-up">
          <p className="text-sm text-gray-400 mb-0.5">Welcome back</p>
          <h1 className="text-2xl font-bold text-gray-900">{user.surname || 'User'}</h1>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-fade-up">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <User size={15} className="text-gray-600" />
            </div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profile</h2>
          </div>

          <div className="flex flex-col gap-4">
            <InfoRow label="Surname"      value={user.surname || '—'} />
            <InfoRow label="Contact"      value={displayId} />
            <InfoRow label="Member since" value={joinDate} />
          </div>
        </div>

        {/* Sign out button */}
        <div className="mt-5">
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
