import { API_BASE_PATH } from '../constants';

function Docs() {
  return (
    <div>
      <h1>Dokumentace k API</h1>
      {API_BASE_PATH}
      <section>
        <h2>1. Získej seznam senzorů</h2>
        <p>
          <code>GET /api/sensorlist</code>
        </p>
      </section>
      <section>
        <h2>2. Získej poslední naměřenou hodnotu</h2>
        <p>
          <code>GET /api/fetchdata?sensorId=x,y,z...</code>
        </p>
      </section>
      <section>
        <h2>3. Získej data v rozmezí</h2>
        <code>
          GET /api/fetchdata?sensorId=x,y,z...&from=a&to=b (a/b = unix
          timestamp)
        </code>
      </section>
    </div>
  );
}

export default Docs;
