import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { DataContext } from '../../App';
import { APP_API_BASE_PATH } from '../../config';
import {
  DisplayParameter,
  DisplayedSensor,
  GenericApiResponse,
  SensorMap,
} from '../../types';
import CustomModal from '../CustomModal';
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
        credentials: 'include'
      })
        .then((data) => data.json())
        .then((response: GenericApiResponse) => {
          if (response.status === 'err') throw new Error(response.message);
          res(null);
        })
        .catch((e: Error) => {
          console.error(e);
          toast.error(e.message);
        });
    });
  }

  async function removeMap(mapId: number) {
    const payload = {
      mapId,
    };
    return new Promise((res, rej) =>
      fetch(APP_API_BASE_PATH + '/removemap', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      })
        .then((data) => data.json())
        .then((response: GenericApiResponse) => {
          if (response.status === 'err') throw new Error(response.message);
          res(null);
        })
        .catch((e: Error) => {
          console.error(e);
          toast.error(e.message);
          throw e;
        })
    );
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
        credentials: 'include'
      })
        .then((data) => data.json())
        .then((response: GenericApiResponse) => {
          if (response.status === 'err') throw new Error(response.message);
          res(null);
        })
        .catch((e: Error) => {
          console.error(e);
          toast.error(e.message);
          throw e.message;
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
    <CustomModal
      isOpen={isOpen}
      handleClose={() => setIsOpen(false)}
      title={isNewMap ? 'Nová mapa' : `Mapa - ${detailMap?.map_name}`}
      content={
        <>
          <div className="flex-shrink h-full flex flex-col">
            <div className="flex-shrink flex flex-row justify-start">
              <table>
                <tbody>
                  <tr>
                    <td className="font-bold pr-5 border p-2">Název:</td>
                    <td className="border p-2">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-5 border p-2">Mapa:</td>
                    <td className="border p-2">
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
                </tbody>
              </table>
            </div>
            <div className="flex-grow overflow-y-hidden flex flex-col">
              {!isNewMap && (
                <>
                  <h5 className="text-xl mt-2 mb-1">Senzory</h5>
                  <div className="h-full flex flex-col overflow-y-auto flex-grow border p-2">
                    {data.sensorList.map((s, idx) => {
                      const checkboxId = 'show-on-map_' + s.sensor_id;
                      const displayedSensorIdx = displayedSensors.findIndex(
                        (x) => x.sensor.sensor_id === s.sensor_id
                      );

                      return (
                        <div className="w-full flex flex-row gap-1" key={idx}>
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
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex-grow overflow-y-hidden flex flex-col">
            {!isNewMap && (
              <div className="flex-grow">
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
            )}
          </div>
        </>
      }
      footer={
        <>
          <button
            onClick={async () => {
              if (nameInput === null || nameInput.length === 0) {
                toast.error('Název mapy nemůže být prázdný');
                return;
              }
              if (isNewMap) {
                if (fileInput === null) {
                  toast.error('Nebyl vybrán obrázek');
                  return;
                }
                try {
                  await createNewMap(nameInput, fileInput);
                  toast.success('Mapa byla přidána');
                  fetchMapList();
                } catch (_) {
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
                  } catch (_) {
                    return;
                  }
                }
              }
              setIsOpen(false);
            }}
          >
            {isNewMap ? 'Přidat' : 'Uložit'}
          </button>
          {!isNewMap && (
            <button
              onClick={async () => {
                if (!detailMap) return;
                const prompt = window.confirm(
                  `Opravdu si přejete smazat mapu ${detailMap.map_name}?`
                );
                if (prompt) {
                  try {
                    await removeMap(detailMap.map_id);
                    toast.success('Mapa byla odstraněna');
                    fetchMapList();
                    setIsOpen(false);
                  } catch (_) {}
                }
              }}
            >
              Smazat mapu
            </button>
          )}
        </>
      }
    />
  );
};

export default MapModal;
