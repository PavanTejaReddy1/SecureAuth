import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up flex flex-col items-center text-center gap-10">

        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" />
          <p className="text-sm text-gray-500">
            Secure authentication for your account.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-gray-800 active:bg-black text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Sign in <ArrowRight size={15} />
          </Link>

          <Link
            to="/register"
            className="w-full flex items-center justify-center px-6 py-3.5 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 text-gray-800 font-medium text-sm rounded-xl transition-colors"
          >
            Create account
          </Link>
        </div>

      </div>
    </div>
  );
}
