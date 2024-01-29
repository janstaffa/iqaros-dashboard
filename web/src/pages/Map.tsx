import { useContext, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { MdAdd, MdEdit } from 'react-icons/md';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import { DataContext, FunctionContext } from '../App';
import InteractiveMap from '../components/InteractiveMap';
import SensorModal from '../components/Modals/SensorModal';
import { APP_API_BASE_PATH } from '../constants';
import {
  DisplayParameter,
  DisplayedSensor,
  GenericAppApiResponse,
  MapListApiResponse,
  Sensor,
  SensorMap,
} from '../types';
import { parseDisplayParamter as parseDisplayParameter } from '../utils';

function Heatmap() {
  const data = useContext(DataContext);
  const functions = useContext(FunctionContext);

  const [displayedMap, setDisplayedMap] = useState<SensorMap | null>(null);

  const [mapList, setMapList] = useState<SensorMap[]>([]);

  const fetchMapList = () => {
    fetch(APP_API_BASE_PATH + '/maplist')
      .then((data) => data.json())
      .then((parsed_data) => {
        const response = parsed_data as MapListApiResponse;
        if (response.status === 'err') {
          console.error(response.message);
          return;
        }
        console.log(response);
        setMapList(response.data);

        if (response.data.length > 0) {
          const firstMap = response.data[0];
          setDisplayedMap(firstMap);
          setDetailMap(firstMap);
          setNewModalNameInput(firstMap.map_name);
          setNewModalDisplayedSensors(firstMap.sensors);
        }
      })
      .catch((e) => {
        throw e;
      });
  };

  useEffect(() => {
    functions.fetchSensorList();
    functions.fetchGroupList();
    fetchMapList();
  }, [functions]);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [detailMap, setDetailMap] = useState<SensorMap | null>(null);

  const [isNewMap, setIsNewMap] = useState(false);

  const [newModalNameInput, setNewModalNameInput] = useState('');
  const [newModalFileInput, setNewModalFileInput] = useState<File | null>(null);

  async function createNewMap(mapName: string, file: File) {
    return new Promise((res, rej) => {
      const payload = new FormData();
      payload.append('mapName', mapName);
      payload.append('file', file);

      fetch(APP_API_BASE_PATH + '/newmap', {
        method: 'POST',
        mode: 'cors',
        body: payload,
      })
        .then((data) => data.json())
        .then((parsed_data: GenericAppApiResponse) => {
          console.log(parsed_data);
          if (parsed_data.status === 'err') {
            return rej(parsed_data.message!);
          }

          res(null);
        })
        .catch((e) => {
          console.error(e);
          rej('Unknown error.');
        });
    });
  }

  function removeMap(mapId: number) {
    const payload = {
      mapId,
    };
    fetch(APP_API_BASE_PATH + '/removemap', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((data) => data.json())
      .then((parsed_data: GenericAppApiResponse) => {
        if (parsed_data.status === 'err') {
          console.error(parsed_data.message);
          return;
        }
        fetchMapList();
      })
      .catch((e) => console.error(e));
  }

  async function postEditedMap(
    mapId: number,
    newMapName: string,
    newSensors: DisplayedSensor[]
  ) {
    return new Promise((res, rej) => {
      const restructuredSensors = newSensors.map((s) => ({
        sensorId: s.sensor.sensor_id,
        pos_x: s.pos_x,
        pos_y: s.pos_y,
      }));
      const payload = {
        mapId,
        newMapName,
        newSensors: restructuredSensors,
      };

      fetch(APP_API_BASE_PATH + '/editmap', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then((data) => data.json())
        .then((parsed_data: GenericAppApiResponse) => {
          if (parsed_data.status !== 'ok') throw new Error('Request failed');
          res(null);
        })
        .catch((e) => {
          console.error(e);
          if (e.message) rej(e.message);
          if (typeof e === 'string') rej(e);
        });
    });
  }

  const [modalErrorMessage, setModalErrorMessage] = useState('');

  // const testDisplayedSensors: DisplayedSensor[] = [
  //   {
  //     senor: { sensor_id: 1, sensor_name: 'TEST 1', network_id: 48 },
  //     pos_x: 20,
  //     pos_y: 20,
  //     data: {
  //       humidity: 35,
  //     },
  //     color: '#0000ff',
  //   },
  //   {
  //     senor: { sensor_id: 2, sensor_name: 'TEST 2', network_id: 49 },
  //     pos_x: 30,
  //     pos_y: 80,
  //     data: {
  //       temperature: 35,
  //     },
  //     color: '#ff0000',
  //   },
  // ];

  const [newModalDisplayedSensors, setNewModalDisplayedSensors] = useState<
    DisplayedSensor[]
  >([]);

  const [displayParameter, setDisplayParameter] = useState<DisplayParameter>(
    DisplayParameter.Name
  );

  const [sensorModalOpen, setSensorModalOpen] = useState(false);
  const [detailSensor, setDetailSensor] = useState<Sensor | null>(null);
  return (
    <>
      <div>
        <h1>Mapa</h1>
        <div className="tabs_wrap">
          <div className="tabs_header">
            <div className="tab_control">
              {mapList.map((m, idx) => {
                return (
                  <button
                    onClick={() => {
                      setDisplayedMap(m);
                      setDetailMap(m);
                      setNewModalNameInput(m.map_name);
                      setNewModalDisplayedSensors(m.sensors);
                    }}
                    key={idx}
                  >
                    {m.map_name}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setIsNewMap(true);
                  setModalIsOpen(true);
                  setNewModalNameInput('');
                }}
              >
                <MdAdd />
              </button>
            </div>
            <div className="map_tools">
              <div>
                <input type="datetime-local" />
              </div>
              <div>
                <select
                  value={displayParameter}
                  onChange={(e) => {
                    const parsedDisplayParameter = parseDisplayParameter(
                      parseInt(e.target.value)
                    );
                    if (parsedDisplayParameter !== undefined)
                      setDisplayParameter(parsedDisplayParameter);
                  }}
                >
                  <option value={DisplayParameter.Name}>Název senzoru</option>
                  <option value={DisplayParameter.Temperature}>Teplota</option>
                  <option value={DisplayParameter.Humidity}>Vlhkost</option>
                  <option value={DisplayParameter.RSSI}>RSSI</option>
                  <option value={DisplayParameter.Voltage}>Napětí</option>
                </select>
              </div>
              <button
                onClick={() => {
                  if (!detailMap) return;
                  setIsNewMap(false);
                  setModalIsOpen(true);
                  setNewModalNameInput(detailMap.map_name);
                }}
              >
                <MdEdit />
              </button>
            </div>
          </div>
          <div className="tabs">
            {mapList.map((m, idx) => {
              if (m !== displayedMap) return null;
              return (
                <div className="tab" key={idx}>
                  <InteractiveMap
                    map={m}
                    displayedSensors={m.sensors}
                    displayParameter={displayParameter}
                    handleSensorClick={(sensorId) => {
                      const sensor = data.sensorList.find(
                        (s) => s.sensor_id === sensorId
                      );
                      if (sensor) setDetailSensor(sensor);
                      setSensorModalOpen(true);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Modal
        isOpen={modalIsOpen}
        style={{ content: { padding: '20px' }, overlay: { zIndex: 10000 } }}
      >
        <div className="modal map_modal">
          <div className="modal-header">
            <h2>{isNewMap ? 'Nová mapa' : detailMap?.map_name}</h2>
            <FaTimes
              onClick={() => {
                setModalIsOpen(false);
                setModalErrorMessage('');
              }}
            />
          </div>
          <div className="modal_content">
            <div>
              <table>
                <tbody>
                  <tr>
                    <td>Název:</td>
                    <td>
                      <input
                        type="text"
                        value={newModalNameInput}
                        onChange={(e) => setNewModalNameInput(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Mapa:</td>
                    <td>
                      {isNewMap ? (
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!isNewMap}
                          onChange={(e) => {
                            setNewModalFileInput(e.target.files?.[0] || null);
                          }}
                        />
                      ) : (
                        <span>{detailMap?.original_image_name}</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="error">
                      {modalErrorMessage}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {!isNewMap && (
              <div className="map_compartment">
                <div className="sensor_list">
                  <table>
                    <tbody>
                      {data.sensorList.map((s, idx) => {
                        const checkboxId = 'show-on-map_' + s.sensor_id;
                        const displayedSensorIdx =
                          newModalDisplayedSensors.findIndex(
                            (x) => x.sensor.sensor_id === s.sensor_id
                          );
                        return (
                          <tr key={idx} draggable>
                            <td
                              onDragStart={(e) => {
                                e.dataTransfer.setData(
                                  'sensorid',
                                  s.sensor_id.toString()
                                );
                              }}
                            >
                              <input
                                type="checkbox"
                                id={checkboxId}
                                checked={displayedSensorIdx !== -1}
                                onChange={(e) => {
                                  let newDisplayedSensors: DisplayedSensor[] = [
                                    ...newModalDisplayedSensors,
                                  ];
                                  if (e.target.checked) {
                                    newDisplayedSensors.push({
                                      sensor: s,
                                      pos_x: 10,
                                      pos_y: 10,
                                    });
                                  } else {
                                    newDisplayedSensors.splice(
                                      displayedSensorIdx,
                                      1
                                    );
                                  }

                                  setNewModalDisplayedSensors(
                                    newDisplayedSensors
                                  );
                                }}
                              />
                              <label htmlFor={checkboxId}>
                                {s.sensor_name}
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="map_wrap">
                  {displayedMap && (
                    <InteractiveMap
                      map={displayedMap}
                      displayedSensors={newModalDisplayedSensors}
                      displayParameter={DisplayParameter.Name}
                      moveSensor={(sensorId, newX, newY) => {
                        const updatedDisplayedSensors =
                          newModalDisplayedSensors.map((s) => ({ ...s }));
                          
                        const sensorIdx = updatedDisplayedSensors.findIndex(
                          (s) => s.sensor.sensor_id === sensorId
                        );

                        if (sensorIdx !== -1) {
                          updatedDisplayedSensors[sensorIdx].pos_x = newX;
                          updatedDisplayedSensors[sensorIdx].pos_y = newY;
                          setNewModalDisplayedSensors(updatedDisplayedSensors);
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              onClick={async () => {
                if (
                  newModalNameInput === null ||
                  newModalNameInput.length === 0
                ) {
                  setModalErrorMessage('Map name cannot be empty.');
                  return;
                }
                if (isNewMap) {
                  if (newModalFileInput === null) {
                    setModalErrorMessage('No image selected.');
                    return;
                  }
                  try {
                    await createNewMap(newModalNameInput, newModalFileInput);
                    toast.success('Mapa byla přidána.');
                    fetchMapList();
                  } catch (e: any) {
                    setModalErrorMessage(e);
                    return;
                  }
                } else {
                  if (detailMap) {
                    try {
                      await postEditedMap(
                        detailMap.map_id,
                        newModalNameInput,
                        newModalDisplayedSensors
                      );
                      toast.success('Změny byly uloženy');
                      fetchMapList();
                    } catch (e: any) {
                      setModalErrorMessage(e);
                      return;
                    }
                  }
                }
                setModalErrorMessage('');
                setModalIsOpen(false);
              }}
            >
              {isNewMap ? 'Přidat' : 'Uložit'}
            </button>
            {!isNewMap && (
              <button
                onClick={() => {
                  if (!detailMap) return;
                  const prompt = window.confirm(
                    `Opravdu si přejete smazat mapu ${detailMap.map_name}?`
                  );
                  if (prompt) {
                    removeMap(detailMap.map_id);
                    setModalIsOpen(false);
                  }
                }}
              >
                Smazat mapu
              </button>
            )}
          </div>
        </div>
      </Modal>
      {detailSensor && (
        <SensorModal
          isOpen={sensorModalOpen}
          setIsOpen={setSensorModalOpen}
          sensor={detailSensor}
          onClose={() => fetchMapList()}
        />
      )}
    </>
  );
}

export default Heatmap;
