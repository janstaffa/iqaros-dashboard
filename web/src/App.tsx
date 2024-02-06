import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BallTriangle } from 'react-loader-spinner';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Nav from './Nav';
import {
  API_BASE_PATH,
  APP_API_BASE_PATH,
  DATA_PARAMETER_KEYS,
  POOLING_INTERVAL,
} from './constants';
import Chart from './pages/Chart';
import Dashboard from './pages/Dashboard';
import Docs from './pages/Docs';
import Groups from './pages/Groups';
import Heatmap from './pages/Map';
import Sensors from './pages/Sensors';
import {
  FetchDataApiResponse,
  FetchDataData,
  FetchDataDataWrapped,
  GroupListApiResponse,
  Sensor,
  SensorDataCache,
  SensorGroup,
  SensorListApiResponse,
} from './types';

interface DataContextType {
  sensorList: Sensor[];
  groupList: SensorGroup[];
  latestSensorData: FetchDataDataWrapped;
}

interface FunctionContextType {
  fetchSensorList: () => void;
  fetchGroupList: () => void;
  getSensorDataInPeriod: (
    sensorIds: number[],
    from: number,
    to: number
  ) => Promise<FetchDataDataWrapped>;
}
// @ts-ignore
export const DataContext = createContext<DataContextType>();
// @ts-ignore
export const FunctionContext = createContext<FunctionContextType>();

function App() {
  const [sensorList, setSensorList] = useState<Sensor[]>([]);
  const [groupList, setGroupList] = useState<SensorGroup[]>([]);

  const [sensorListLoading, setSensorListLoading] = useState(false);
  const [groupListLoading, setGroupListLoading] = useState(false);
  const [latestDataLoading, setLatestDataLoading] = useState(false);

  const [loaderVisible, setLoaderVisible] = useState(false);

  const fetchSensorList = useCallback(async (inBackground: boolean = false) => {
    if (!inBackground) setSensorListLoading(true);
    return new Promise<Sensor[]>((res, rej) =>
      fetch(APP_API_BASE_PATH + '/sensorlist')
        .then((data) => data.json())
        .then((parsed_data: SensorListApiResponse) => {
          if (parsed_data.status === 'err')
            throw new Error(parsed_data.message);
          const data = parsed_data.data.map((s) => {
            const lastMessageTimestamp = Math.max(
              s.data.temperature.timestamp,
              s.data.humidity.timestamp,
              s.data.rssi.timestamp,
              s.data.voltage.timestamp
            );
            s['last_response'] = lastMessageTimestamp;

            return s;
          });
          setSensorList(data);
          if (!inBackground) setSensorListLoading(false);
          res(data);
        })
        .catch((e) => {
          rej(null);
          throw e;
        })
    );
  }, []);

  const fetchGroupList = useCallback((inBackground: boolean = false) => {
    if (!inBackground) setGroupListLoading(true);
    fetch(APP_API_BASE_PATH + '/grouplist')
      .then((data) => data.json())
      .then((parsed_data) => {
        const response = parsed_data as GroupListApiResponse;
        setGroupList(response.data);
        if (!inBackground) setGroupListLoading(false);
      })
      .catch((e) => {
        throw e;
      });
  }, []);

  const [latestSensorData, setLatestSensorData] =
    useState<FetchDataDataWrapped>({});

  function fetchLatestSensorData(
    sensorIds: number[],
    inBackground: boolean = false
  ) {
    if (!inBackground) setLatestDataLoading(true);
    let query = `?sensorId=${sensorIds.join(',')}`;

    return fetch(API_BASE_PATH + '/fetchdata' + query)
      .then((data) => data.json())
      .then((parsed_data) => {
        const response = parsed_data as FetchDataApiResponse;
        setLatestSensorData(response.data.values);
        if (!inBackground) setLatestDataLoading(false);
      })
      .catch((e) => {
        throw e;
      });
  }

  const [cachedSensorsData, setCachedSensorsData] = useState<SensorDataCache>(
    {}
  );
  const cachedSensorsRef = useRef(cachedSensorsData);
  cachedSensorsRef.current = cachedSensorsData;

  const getSensorDataInPeriod = useCallback(
    async (sensorIds: number[], from: number, to: number) => {
      let query = `?sensorId=${sensorIds.join(',')}&from=${from}&to=${to}`;

      const cache = cachedSensorsRef.current;
      for (const [timestamps, values] of Object.entries(cache)) {
        const parts = timestamps.split('-');
        const cacheFrom = parseInt(parts[0]);
        const cacheTo = parseInt(parts[1]);

        if (cacheFrom <= from && cacheTo >= to) {
          let hasAllSensors = true;
          for (const sId of sensorIds) {
            const hasSensor = Object.keys(values).find(
              (v) => parseInt(v) === sId
            );
            if (hasSensor === undefined) {
              hasAllSensors = false;
              break;
            }
          }
          if (hasAllSensors) {
            const filteredValues: FetchDataDataWrapped = {};
            for (const [sId, data] of Object.entries(values)) {
              const hasSensor = sensorIds.findIndex((s) => s === parseInt(sId));
              if (hasSensor !== -1) {
                const filteredData: { [key: string]: any } = {};
                for (const key of DATA_PARAMETER_KEYS) {
                  const timestamps = [];
                  const values = [];
                  for (const idx in data[key].timestamps) {
                    const timestamp = data[key].timestamps[idx];
                    const value = data[key].values[idx];

                    if (timestamp >= from && timestamp <= to) {
                      timestamps.push(timestamp);
                      values.push(value);
                    }
                  }
                  filteredData[key] = {
                    timestamps,
                    values,
                  };
                }
                filteredValues[sId] = filteredData as FetchDataData;
              }
            }
            console.log('GETTING FROM CACHE', filteredValues, cachedSensorsRef.current);
            return filteredValues;
          }
        }
      }
      console.log('GETTING FROM SERVER');
      // console.log(cachedSensorsData);
      return new Promise<FetchDataDataWrapped>((res, rej) =>
        fetch(API_BASE_PATH + '/fetchdata' + query)
          .then((data) => data.json())
          .then((parsed_data) => {
            const response = parsed_data as FetchDataApiResponse;
            const key = `${from}-${to}`;
            const values = response.data.values;
            setCachedSensorsData((oldCachedSensorData) => {
              const newCachedSensorData = { ...oldCachedSensorData };
              newCachedSensorData[key] = values;
              return newCachedSensorData;
            });
            res(values);
          })
          .catch((e) => {
            rej(e);
            throw e;
          })
      );
    },
    []
  );

  useEffect(() => {
    setLoaderVisible(
      sensorListLoading || groupListLoading || latestDataLoading
    );
  }, [sensorListLoading, groupListLoading, latestDataLoading]);

  useEffect(() => {
    fetchSensorList().then((d) => {
      fetchLatestSensorData(d.map((s) => s.sensor_id));
    });
    fetchGroupList();

    const poolingLoop = setInterval(() => {
      fetchSensorList(true).then((d) => {
        fetchLatestSensorData(
          d.map((s) => s.sensor_id),
          true
        );
      });
      fetchSensorList(true);
    }, POOLING_INTERVAL);

    return () => {
      clearInterval(poolingLoop);
    };
  }, [fetchGroupList, fetchSensorList]);

  const dataContextValue = useMemo(
    () => ({
      sensorList,
      groupList,
      latestSensorData,
    }),
    [sensorList, groupList, latestSensorData]
  );

  const functionContextValue = useMemo(
    () => ({
      fetchSensorList,
      fetchGroupList,
      getSensorDataInPeriod,
    }),
    [fetchSensorList, fetchGroupList, getSensorDataInPeriod]
  );

  return (
    <div className="app">
      <DataContext.Provider value={dataContextValue}>
        <FunctionContext.Provider value={functionContextValue}>
          <BrowserRouter>
            <Nav />
            <main>
              <>
                {!loaderVisible && (
                  <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="map" element={<Heatmap />} />
                    <Route path="sensors" element={<Sensors />} />
                    <Route path="groups" element={<Groups />} />
                    <Route path="chart" element={<Chart />} />
                    <Route path="docs" element={<Docs />} />
                    <Route path="*" element={<Dashboard />} />
                  </Routes>
                )}
                <BallTriangle
                  height={100}
                  width={100}
                  radius={5}
                  color="#11547a"
                  ariaLabel="Loading..."
                  wrapperClass="loader"
                  visible={loaderVisible}
                />
              </>
            </main>
          </BrowserRouter>
          <ToastContainer />
        </FunctionContext.Provider>
      </DataContext.Provider>
    </div>
  );
}

export default App;
