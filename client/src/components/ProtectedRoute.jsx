import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, roles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-dark-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-dark-200">403</h1>
          <p className="text-lg text-dark-500 mt-2">Access Denied</p>
          <p className="text-sm text-dark-400 mt-1">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
