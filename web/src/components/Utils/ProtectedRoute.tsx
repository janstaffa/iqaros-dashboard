import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../App';

interface ProtectedRouteProps {
  children: JSX.Element;
}
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuth } = useContext(AuthContext);
  if (!isAuth) {
    return <Navigate to="/login" />;
  }

  return children;
};
