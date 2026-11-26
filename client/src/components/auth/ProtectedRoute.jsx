import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Wraps a page that requires authentication.
// Shows a spinner while the session is being checked,
// then redirects to /login if the user is not signed in.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
