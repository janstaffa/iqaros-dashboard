import { useContext } from 'react';
import {
  FaChartLine,
  FaFileAlt,
  FaHome,
  FaLayerGroup,
  FaMap,
  FaThermometerThreeQuarters,
} from 'react-icons/fa';
import { MdLogin, MdLogout } from 'react-icons/md';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './App';
function Nav() {
  const { isAuth, logout } = useContext(AuthContext);

  const location = useLocation();
  const navigate = useNavigate();
  return (
    <nav>
      {/* <TbTemperatureCelsius size={40} color="white" /> */}
      {/* <div className="logo">Kejdží IQAROS</div> */}
      <div className="flex flex-col gap-2">
        {isAuth && (
          <>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              <FaHome title="Domů" />
              <div className="title">Domů</div>
            </Link>
            <Link
              to="sensors"
              className={location.pathname === '/sensors' ? 'active' : ''}
            >
              <FaThermometerThreeQuarters title="Senzory" />
              <div className="title">Senzory</div>
            </Link>
            <Link
              to="groups"
              className={location.pathname === '/groups' ? 'active' : ''}
            >
              <FaLayerGroup title="Skupiny" />
              <div className="title">Skupiny</div>
            </Link>
            <Link
              to="map"
              className={location.pathname === '/map' ? 'active' : ''}
            >
              <FaMap title="Mapa" />
              <div className="title">Mapy</div>
            </Link>
            <Link
              to="chart"
              className={location.pathname === '/chart' ? 'active' : ''}
            >
              <FaChartLine title="Graf" />
              <div className="title">Graf</div>
            </Link>
          </>
        )}
        <Link
          to="docs"
          className={location.pathname === '/docs' ? 'active' : ''}
        >
          <FaFileAlt title="Dokumentace" />
          <div className="title">Dokumentace</div>
        </Link>
      </div>

      <div className="mb-4">
        {isAuth ? (
          <button
            onClick={() => logout()}
            className="bg-transparent border-none hover:bg-transparent text-white hover:text-gray-300"
          >
            <MdLogout title="Odhlášení" size={30} />
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="bg-transparent border-none hover:bg-transparent text-white hover:text-gray-300"
          >
            <MdLogin title="Přihlášení" size={30} />
          </button>
        )}
      </div>
    </nav>
  );
}

export default Nav;
