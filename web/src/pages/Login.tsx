import { useContext, useState } from 'react';
import { FaLock, FaUser } from 'react-icons/fa';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../App';

export interface LoginPageProps {}

const AFTER_LOGIN_NAVIGATE = '/';
const LoginPage: React.FC<LoginPageProps> = () => {
  const navigate = useNavigate();
  const { isAuth, login } = useContext(AuthContext);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  const location = useLocation();

  if (isAuth) {

    return <Navigate to={AFTER_LOGIN_NAVIGATE} />;
  }

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div className="bg-white p-10 shadow-lg">
        <h1 className="text-3xl mb-5 text-accent-dark">IQAROS DASHBOARD</h1>
        <div className="flex flex-row justify-center">
          <div className="flex flex-col gap-1">
            <div className="flex flex-row items-center bg-white border-gray-300 border">
              <FaUser size={18} className="m-2" />
              <input
                type="text"
                value={username}
                className="outline-none border-0"
                placeholder="Uživatel"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="flex flex-row items-center bg-white border-gray-300 border">
              <FaLock size={18} className="m-2" />
              <input
                type="password"
                value={password}
                className="outline-none border-0"
                placeholder="Heslo"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className='flex flex-row gap-2 items-center mt-3'>
              <button
                className="bg-accent-normal text-white rounded-full px-3 py-1 border-none hover:bg-accent-light"
                onClick={() => {
                  login(username, password)
                    .then(() => navigate(AFTER_LOGIN_NAVIGATE))
                    .catch((e) => toast.error(e.message));
                }}
              >
                Login
              </button>
			  <Link to="/docs" className='link'>Dokumentace</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
