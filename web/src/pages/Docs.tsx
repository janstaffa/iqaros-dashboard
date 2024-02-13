import { API_BASE_PATH } from "../config";

function Docs() {
  return (
    <div>
      <h1 className="text-3xl">Dokumentace k API</h1>
      <a href={API_BASE_PATH} className='hover:underline' target='_blank' rel="noreferrer">{API_BASE_PATH}</a>
      <section>
        <h2 className="text-2xl mt-3">1. Získej seznam senzorů</h2>
        <p className="italic">
          <code>GET /api/sensorlist</code>
        </p>
      </section>
      <section>
        <h2 className="text-2xl mt-3">2. Získej poslední naměřenou hodnotu</h2>
        <p className="italic">
          <code>GET /api/fetchdata?sensorId=x,y,z...</code>
        </p>
      </section>
      <section>
        <h2 className="text-2xl mt-3">3. Získej data v rozmezí</h2>
        <p className="italic">
          <code>
            GET /api/fetchdata?sensorId=x,y,z...&from=a&to=b (a/b = unix
            timestamp)
          </code>
        </p>
      </section>
    </div>
  );
}

export default Docs;
