import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';

const PrivateRoute = () => {
  const { user } = useAuth();

  // If there is no user, redirect them to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If there is a user, render the 'children' routes
  return <Outlet />;
};

export default PrivateRoute;
