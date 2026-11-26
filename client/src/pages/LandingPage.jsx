import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import { ShieldCheck, Fingerprint, Smartphone, ArrowRight, Lock, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center animate-fade-up">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium mb-8">
          <ShieldCheck size={12} />
          Enterprise-grade security
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight tracking-tight max-w-2xl mb-6">
          Authentication you can{' '}
          <span className="brand-gradient">trust</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-xl leading-relaxed mb-10">
          SecureAuth protects your users with OTP verification, biometric passkeys,
          and intelligent session management — all in one clean platform.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Link
            to="/register"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all hover:-translate-y-px shadow-lg shadow-blue-600/25"
          >
            Create account <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="flex-1 flex items-center justify-center px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 font-medium rounded-xl transition-all hover:-translate-y-px"
          >
            Sign in
          </Link>
        </div>
      </main>

      {/* Feature cards */}
      <section className="px-6 pb-16 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FeatureCard
            icon={<Smartphone size={20} className="text-blue-400" />}
            title="OTP Verification"
            description="Six-digit codes delivered to email or SMS, with rate limiting and secure hashing."
          />
          <FeatureCard
            icon={<Fingerprint size={20} className="text-indigo-400" />}
            title="Biometric Passkeys"
            description="Face ID and fingerprint login via WebAuthn — no passwords stored."
          />
          <FeatureCard
            icon={<Lock size={20} className="text-cyan-400" />}
            title="Session Control"
            description="One active device per user. Automatic lockout after failed attempts."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-600">
        © 2026 SecureAuth. Built for security.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all">
      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
