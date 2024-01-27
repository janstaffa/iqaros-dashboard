import { useEffect, useState } from 'react';
import { FaSort, FaTimes } from 'react-icons/fa';
import { GrStatusGoodSmall } from 'react-icons/gr';
import Modal from 'react-modal';
import SensorRow from '../components/SensorRow';
import {
  APP_API_BASE_PATH,
  POOLING_INTERVAL,
  SensorStatus,
} from '../constants';

function Sensors() {
  const [sensorsList, setSensorsList] = useState<Sensor[]>([]);
  const [groupList, setGroupList] = useState<SensorGroup[]>([]);

  const fetchSensorList = () => {
    return fetch(APP_API_BASE_PATH + '/sensorlist')
      .then((data) => data.json())
      .then((parsed_data) => {
        setSensorsList((parsed_data as SensorListApiResponse).data);
      })
      .catch((e) => {
        throw e;
      });
  };

  const fetchGroupList = () => {
    return fetch(APP_API_BASE_PATH + '/grouplist')
      .then((data) => data.json())
      .then((parsed_data) => {
        const response = parsed_data as GroupListApiResponse;
        setGroupList(response.data);
      })
      .catch((e) => {
        throw e;
      });
  };

  useEffect(() => {
    fetchSensorList();
    fetchGroupList();
    const poolingLoop = setInterval(fetchSensorList, POOLING_INTERVAL);

    const sortableColumns = document.querySelectorAll('sortable_column');
    console.log('a', sortableColumns);

    return () => {
      clearInterval(poolingLoop);
    };
  }, []);

  const [modalIsOpen, setIsOpen] = useState(false);
  const [detailSensor, setDetailSensor] = useState<Sensor | null>(null);
  const [detailSensorNameInput, setDetailSensorNameInput] =
    useState<string>('');

  const [detailSensorCheckedGroups, setDetailSensorCheckedGroups] = useState<
    number[]
  >([]);

  async function postEditedSensor(
    sensorId: number,
    newSensorName: string,
    newCheckedGroups: number[]
  ) {
    return new Promise((res, rej) => {
      const payload = {
        sensorId,
        newSensorName,
        newCheckedGroups,
      };
      fetch(APP_API_BASE_PATH + '/edit_sensor', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then((data) => data.json())
        .then((parsed_data) => {
          res(null);
        })
        .catch((e) => {
          console.error(e);
          rej(e);
        });
    });
  }

  Modal.setAppElement('#root');

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
            {sensorsList &&
              sensorsList.map((sensor, idx) => {
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
                        sensorsList?.find(
                          (s) => s.sensor_id === sensor.sensor_id
                        ) || null;
                      setDetailSensor(s);
                      setDetailSensorNameInput(s?.sensor_name || '');
                      setDetailSensorCheckedGroups(
                        sensor.groups.map((g) => g.group_id)
                      );
                      setIsOpen(true);
                    }}
                  />
                );
              })}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modalIsOpen} style={{ content: { padding: '20px' } }}>
        <div className="modal sensor_modal">
          <div className="modal-header">
            <h2>{detailSensor?.sensor_name}</h2>
            <FaTimes onClick={() => setIsOpen(false)} />
          </div>
          <div>
            <table>
              <tbody>
                <tr>
                  <td>Název:</td>
                  <td>
                    <input
                      type="text"
                      value={detailSensorNameInput}
                      onChange={(e) => setDetailSensorNameInput(e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Skupiny:</td>
                  <td>
                    <div className="group_list_wrap">
                      {groupList?.map((g, idx) => {
                        const elementId = `group_${g.group_id}`;
                        return (
                          <div key={idx}>
                            <input
                              type="checkbox"
                              id={elementId}
                              checked={detailSensorCheckedGroups.includes(
                                g.group_id
                              )}
                              onChange={(e) => {
                                if (e.target.checked === true) {
                                  if (
                                    !detailSensorCheckedGroups.includes(
                                      g.group_id
                                    )
                                  ) {
                                    setDetailSensorCheckedGroups([
                                      ...detailSensorCheckedGroups,
                                      g.group_id,
                                    ]);
                                  }
                                } else {
                                  const index =
                                    detailSensorCheckedGroups.findIndex(
                                      (x) => x === g.group_id
                                    );
                                  if (index > -1) {
                                    const newCheckedGroups = [
                                      ...detailSensorCheckedGroups,
                                    ];
                                    newCheckedGroups.splice(index, 1);
                                    setDetailSensorCheckedGroups(
                                      newCheckedGroups
                                    );
                                  }
                                }
                              }}
                            />
                            <label htmlFor={elementId}>
                              <GrStatusGoodSmall color={g.group_color} />
                              {g.group_name}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="modal-footer">
            <button
              onClick={async () => {
                if (detailSensor) {
                  await postEditedSensor(
                    detailSensor.sensor_id,
                    detailSensorNameInput,
                    detailSensorCheckedGroups
                  );
                }
                setIsOpen(false);
                fetchSensorList();
              }}
            >
              Uložit
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default Sensors;
