import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up flex flex-col items-center text-center gap-8">

        <Logo size="lg" />

        {/* White card */}
        <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-md p-8 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500">Sign in or create your SecureAuth account.</p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-black text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Sign in <ArrowRight size={15} />
            </Link>
            <Link
              to="/register"
              className="w-full flex items-center justify-center px-6 py-3.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 font-medium text-sm rounded-xl transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
