import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import { ArrowRight, Fingerprint } from 'lucide-react';

// The landing page is a clean entry point into the auth flow.
// No marketing — just the brand and two clear actions.

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-4">

      <div className="w-full max-w-sm animate-fade-up flex flex-col items-center text-center gap-10">

        {/* Brand */}
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" />
          <p className="text-sm text-slate-500">
            Secure authentication for your account.
          </p>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            Sign in <ArrowRight size={15} />
          </Link>

          <Link
            to="/register"
            className="w-full flex items-center justify-center px-6 py-3.5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/18 text-slate-200 font-medium text-sm rounded-xl transition-all"
          >
            Create account
          </Link>
        </div>

      </div>

    </div>
  );
}
