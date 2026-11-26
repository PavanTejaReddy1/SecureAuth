import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import LandingPage    from './pages/LandingPage';
import RegisterPage   from './pages/RegisterPage';
import LoginPage      from './pages/LoginPage';
import OtpPage        from './pages/OtpPage';
import BiometricPage  from './pages/BiometricPage';
import LockedPage     from './pages/LockedPage';
import DashboardPage  from './pages/DashboardPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  // Don't render routes until we know the auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/"            element={<LandingPage />} />
      <Route path="/register"    element={<RegisterPage />} />
      <Route path="/login"       element={<LoginPage />} />
      <Route path="/verify-otp"  element={<OtpPage />} />
      <Route path="/biometric"   element={<BiometricPage />} />
      <Route path="/locked"      element={<LockedPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      {/* Redirect unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
