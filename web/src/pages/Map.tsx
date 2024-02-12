import { useContext, useEffect, useState } from 'react';
import { MdAdd, MdEdit } from 'react-icons/md';
import { toast } from 'react-toastify';
import { DataContext } from '../App';
import InteractiveMap from '../components/InteractiveMap';
import MapModal from '../components/Modals/MapModal';
import SensorModal from '../components/Modals/SensorModal';
import { APP_API_BASE_PATH } from '../constants';
import {
  DisplayParameter,
  MapColorScheme,
  MapListApiResponse,
  Sensor,
  SensorMap,
} from '../types';
import {
  displayParameterToName,
  parseDisplayParamter as parseDisplayParameter,
} from '../utils';

function Heatmap() {
  const data = useContext(DataContext);

  const [displayedMap, setDisplayedMap] = useState<SensorMap | null>(null);

  const [mapList, setMapList] = useState<SensorMap[]>([]);

  const [isLoadingMap, setIsLoadingMap] = useState(false);

  const fetchMapList = () => {
    setIsLoadingMap(true);
    fetch(APP_API_BASE_PATH + '/maplist')
      .then((data) => data.json())
      .then((parsed_data) => {
        const response = parsed_data as MapListApiResponse;
        if (response.status === 'err') throw new Error(response.message);

        setMapList(response.data);

        if (response.data.length > 0) {
          const firstMap = response.data[0];
          setDisplayedMap(firstMap);
          setDetailMap(firstMap);
        }
        setIsLoadingMap(false);
      })
      .catch((e: Error) => {
        console.error(e);
        toast.error(e.message);
      });
  };

  useEffect(() => {
    fetchMapList();
  }, []);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [detailMap, setDetailMap] = useState<SensorMap | null>(null);

  // const [displayedSensors, setDisplayedSensors] = useState<DisplayedSensor[]>([]);

  const [isNewMap, setIsNewMap] = useState(false);

  const [displayParameter, setDisplayParameter] = useState<DisplayParameter>(
    DisplayParameter.Name
  );

  const [sensorModalOpen, setSensorModalOpen] = useState(false);
  const [detailSensor, setDetailSensor] = useState<Sensor | null>(null);

  const [colorScheme, setColorScheme] = useState<MapColorScheme>(
    MapColorScheme.Absolute
  );
  return (
    <>
      <div className="floating_buttons">
        {detailMap && mapList.length > 0 && (
          <button
            onClick={() => {
              setIsNewMap(false);
              setModalIsOpen(true);
            }}
          >
            <MdEdit size={25} />
          </button>
        )}
        <button
          onClick={() => {
            setIsNewMap(true);
            setModalIsOpen(true);
          }}
        >
          <MdAdd />
        </button>
      </div>
      <div className="h-14 w-full flex flex-row justify-between">
        <div className="h-full flex-grow">
          <div className="h-full w-full flex flex-row gap-1 mr-5">
            {mapList.map((m, idx) => {
              return (
                <button
                  onClick={() => {
                    setDisplayedMap(m);
                    setDetailMap(m);
                  }}
                  className={
                    'map_button' +
                    (displayedMap?.map_id === m.map_id ? ' active' : '')
                  }
                  key={idx}
                >
                  {m.map_name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-row items-center gap-1">
          <select
            className="p-2"
            value={colorScheme}
            onChange={(e) => {
              setColorScheme(parseInt(e.target.value) as MapColorScheme);
            }}
          >
            <option value={MapColorScheme.Absolute}>Absolutní barvy</option>
            <option value={MapColorScheme.Relative}>Relativní barvy</option>
          </select>
          <select
            className="p-2"
            value={displayParameter}
            onChange={(e) => {
              const parsedDisplayParameter = parseDisplayParameter(
                parseInt(e.target.value)
              );
              if (parsedDisplayParameter !== undefined)
                setDisplayParameter(parsedDisplayParameter);
            }}
          >
            <option value={DisplayParameter.Name}>
              {displayParameterToName(DisplayParameter.Name)}
            </option>
            <option value={DisplayParameter.Temperature}>
              {displayParameterToName(DisplayParameter.Temperature)}
            </option>
            <option value={DisplayParameter.Humidity}>
              {displayParameterToName(DisplayParameter.Humidity)}
            </option>
            <option value={DisplayParameter.RSSI}>
              {displayParameterToName(DisplayParameter.RSSI)}
            </option>
            <option value={DisplayParameter.Voltage}>
              {displayParameterToName(DisplayParameter.Voltage)}
            </option>
          </select>
        </div>
      </div>
      {isLoadingMap || mapList.length > 0 ? (
        <InteractiveMap
          map={displayedMap}
          displayedSensors={displayedMap?.sensors}
          displayParameter={displayParameter}
          colorScheme={colorScheme}
          handleSensorClick={(sensorId) => {
            const sensor = data.sensorList.find(
              (s) => s.sensor_id === sensorId
            );
            if (sensor) setDetailSensor(sensor);
            setSensorModalOpen(true);
          }}
          isLoading={isLoadingMap}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center text-3xl bg-light-normal">
          <span className='pt-20'>
            Žádná mapa -{' '}
            <span
              className="link"
              onClick={() => {
                setIsNewMap(true);
                setModalIsOpen(true);
              }}
            >
              přidat
            </span>
          </span>
        </div>
      )}
      <MapModal
        detailMap={detailMap}
        fetchMapList={fetchMapList}
        isNewMap={isNewMap}
        isOpen={modalIsOpen}
        setIsOpen={setModalIsOpen}
      />
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
