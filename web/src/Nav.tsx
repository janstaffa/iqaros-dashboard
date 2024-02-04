import {
  FaChartLine,
  FaFileAlt,
  FaHome,
  FaLayerGroup,
  FaMap,
  FaThermometerThreeQuarters,
} from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
function Nav() {
  const location = useLocation();
  return (
    <nav>
      {/* <TbTemperatureCelsius size={40} color="white" /> */}
      {/* <div className="logo">Kejdží IQAROS</div> */}
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
      <Link to="map" className={location.pathname === '/map' ? 'active' : ''}>
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
      <Link to="docs" className={location.pathname === '/docs' ? 'active' : ''}>
        <FaFileAlt title="Dokumentace" />
        <div className="title">Dokumentace</div>
      </Link>
    </nav>
  );
}

export default Nav;
