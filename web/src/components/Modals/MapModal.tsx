import { useContext, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import { DataContext } from '../../App';
import { APP_API_BASE_PATH } from '../../constants';
import {
  DisplayParameter,
  DisplayedSensor,
  GenericApiResponse,
  SensorMap,
} from '../../types';
import InteractiveMap from '../InteractiveMap';

export interface MapModalProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  detailMap: SensorMap | null;
  fetchMapList: () => void;
  isNewMap: boolean;
}

const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  setIsOpen,
  detailMap,
  fetchMapList,
  isNewMap,
}) => {
  const data = useContext(DataContext);

  const [modalErrorMessage, setModalErrorMessage] = useState('');

  const [fileInput, setFileInput] = useState<File | null>(null);
  const [nameInput, setNameInput] = useState('');

  const [displayedSensors, setDisplayedSensors] = useState<DisplayedSensor[]>(
    []
  );

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
        .then((parsed_data: GenericApiResponse) => {
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
      .then((parsed_data: GenericApiResponse) => {
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
        .then((parsed_data: GenericApiResponse) => {
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

  useEffect(() => {
    if (!detailMap || isNewMap) {
      setNameInput('');
      setFileInput(null);
      return;
    }
    setDisplayedSensors(detailMap.sensors);
    setNameInput(detailMap.map_name);
  }, [detailMap, isNewMap]);
  return (
    <Modal
      isOpen={isOpen}
      style={{ content: { padding: '20px' }, overlay: { zIndex: 10000 } }}
    >
      <div className="modal map_modal">
        <div className="modal-header">
          <h2>{isNewMap ? 'Nová mapa' : detailMap?.map_name}</h2>
          <FaTimes
            onClick={() => {
              setIsOpen(false);
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
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
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
                          setFileInput(e.target.files?.[0] || null);
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
              <div className="sensor_list" style={{ maxHeight: '400px' }}>
                <table>
                  <tbody>
                    {data.sensorList.map((s, idx) => {
                      const checkboxId = 'show-on-map_' + s.sensor_id;
                      const displayedSensorIdx = displayedSensors.findIndex(
                        (x) => x.sensor.sensor_id === s.sensor_id
                      );

                      return (
                        <tr key={idx} /*draggable*/>
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
                                  ...displayedSensors,
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

                                setDisplayedSensors(newDisplayedSensors);
                              }}
                            />
                            <label htmlFor={checkboxId}>{s.sensor_name}</label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="map_wrap">
                {detailMap && (
                  <InteractiveMap
                    map={detailMap}
                    displayedSensors={displayedSensors}
                    displayParameter={DisplayParameter.Name}
                    moveSensor={(sensorId, newX, newY) => {
                      const updatedDisplayedSensors = displayedSensors.map(
                        (s) => ({ ...s })
                      );

                      const sensorIdx = updatedDisplayedSensors.findIndex(
                        (s) => s.sensor.sensor_id === sensorId
                      );

                      if (sensorIdx !== -1) {
                        updatedDisplayedSensors[sensorIdx].pos_x = newX;
                        updatedDisplayedSensors[sensorIdx].pos_y = newY;
                        setDisplayedSensors(updatedDisplayedSensors);
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
              if (nameInput === null || nameInput.length === 0) {
                setModalErrorMessage('Map name cannot be empty.');
                return;
              }
              if (isNewMap) {
                if (fileInput === null) {
                  setModalErrorMessage('No image selected.');
                  return;
                }
                try {
                  await createNewMap(nameInput, fileInput);
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
                      nameInput,
                      displayedSensors
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
              setIsOpen(false);
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
                  setIsOpen(false);
                }
              }}
            >
              Smazat mapu
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default MapModal;
