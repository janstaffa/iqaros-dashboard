import { Link } from 'react-router-dom';

function Nav() {
  return (
    <nav>
      <div className="logo">Kejdží IQAROS</div>
      <div>
        <Link to="/">Domů</Link>
      </div>
      <div>
        <Link to="sensors">Senzory</Link>
      </div>
      <div>
        <Link to="groups">Skupiny</Link>
      </div>
      <div>
        <Link to="heatmap">Heatmap</Link>
      </div>
      <div>
        <Link to="chart">Graf</Link>
      </div>
      <div>
        <Link to="docs">Docs</Link>
      </div>
    </nav>
  );
}

export default Nav;
