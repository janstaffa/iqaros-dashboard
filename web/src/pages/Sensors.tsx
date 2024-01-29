import { useContext, useEffect, useState } from 'react';
import { FaSort } from 'react-icons/fa';
import { DataContext, FunctionContext } from '../App';
import SensorModal from '../components/Modals/SensorModal';
import SensorRow from '../components/SensorRow';
import { POOLING_INTERVAL, SensorStatus } from '../constants';
import { Sensor } from '../types';

function Sensors() {
  const data = useContext(DataContext);
  const functions = useContext(FunctionContext);

  useEffect(() => {
    functions.fetchSensorList();
    functions.fetchGroupList();

    const poolingLoop = setInterval(functions.fetchSensorList, POOLING_INTERVAL);

    // const sortableColumns = document.querySelectorAll('sortable_column');
    // console.log('a', sortableColumns);

    return () => {
      clearInterval(poolingLoop);
    };
  }, [functions]);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [detailSensor, setDetailSensor] = useState<Sensor | null>(null);

  return (
    <>
      <div>
        <h1>Senzory</h1>
        <table className="styled_table">
          <thead>
            <tr>
              <td></td>
              <td className="sortable_column" data-columnid="sensorId">
                ID
                <FaSort />
              </td>
              <td className="sortable_column" data-columnid="networkId">
                Síťové ID
              </td>
              <td className="sortable_column" data-columnid="sensorName">
                Název
              </td>
              <td className="sortable_column" data-columnid="">
                Teplota
              </td>
              <td className="sortable_column" data-columnid="">
                Relativní vlhkost
              </td>
              <td className="sortable_column" data-columnid="">
                Poslední záznam
              </td>
              <td className="sortable_column" data-columnid="">
                Síla signálu
              </td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            {data.sensorList.map((sensor, idx) => {
              return (
                <SensorRow
                  key={idx}
                  sensorStatus={SensorStatus.Online}
                  sensorId={sensor.sensor_id}
                  networkId={sensor.network_id}
                  sensorName={sensor.sensor_name}
                  sensorTemperature={1000.69}
                  sensorHumidity={25}
                  sensorLastRecord={new Date()}
                  sensorSignal={10}
                  openModal={() => {
                    const s =
                      data.sensorList.find(
                        (s) => s.sensor_id === sensor.sensor_id
                      ) || null;
                    setDetailSensor(s);
                    setModalIsOpen(true);
                  }}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      {detailSensor && (
        <SensorModal
          isOpen={modalIsOpen}
          setIsOpen={setModalIsOpen}
          sensor={detailSensor}
        />
      )}
    </>
  );
}

export default Sensors;
