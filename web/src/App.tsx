import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LayoutWithNav, LayoutWithoutNav } from './components/Utils/Layouts';
import { ProtectedRoute } from './components/Utils/ProtectedRoute';
import { API_BASE_PATH, APP_API_BASE_PATH } from './config';
import { DATA_PARAMETER_KEYS, POOLING_INTERVAL } from './constants';
import Chart from './pages/Chart';
import Dashboard from './pages/Dashboard';
import Docs from './pages/Docs';
import Groups from './pages/Groups';
import LoginPage from './pages/Login';
import Heatmap from './pages/Map';
import NotFound from './pages/NotFound';
import Sensors from './pages/Sensors';
import {
  FetchDataApiResponse,
  FetchDataData,
  FetchDataDataWrapped,
  GenericApiResponse,
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

interface AuthContextType {
  isAuth: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
// @ts-ignore
export const DataContext = createContext<DataContextType>();
// @ts-ignore
export const FunctionContext = createContext<FunctionContextType>();
// @ts-ignore
export const AuthContext = createContext<AuthContextType>();

function App() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const login = (username: string, password: string) => {
    return new Promise<void>((res, rej) => {
      const payload = {
        username,
        password,
      };
      fetch(APP_API_BASE_PATH + '/login', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
        .then((data) => data.json())
        .then((response: GenericApiResponse) => {
          if (response.status === 'err') throw new Error(response.message);
          setIsAuth(true);
          window.localStorage.setItem('auth', JSON.stringify({ isAuth: true }));
          toast.success('Uživatel přihlášen');
          res();
        })
        .catch((e: Error) => {
          console.error(e);
          rej(e);
        });
    });
  };
  const logout = () => {
    fetch(APP_API_BASE_PATH + '/logout', {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
    })
      .then((data) => data.json())
      .then((response: GenericApiResponse) => {
        if (response.status === 'err') throw new Error(response.message);
        setIsAuth(false);
        window.localStorage.setItem('auth', JSON.stringify({ isAuth: false }));
        toast.success('Uživatel odhlášen');
      })
      .catch((e: Error) => {
        console.error(e);
        toast.error(e.message);
      });
  };

  useEffect(() => {
    const auth = window.localStorage.getItem('auth');
    if (!auth) {
      setIsAuth(false);
      return;
    }
    const parsed = JSON.parse(auth);
    setIsAuth(!!parsed.isAuth);
  }, []);

  const [sensorList, setSensorList] = useState<Sensor[]>([]);
  const [groupList, setGroupList] = useState<SensorGroup[]>([]);

  const [sensorListLoading, setSensorListLoading] = useState(false);
  const [groupListLoading, setGroupListLoading] = useState(false);
  const [latestDataLoading, setLatestDataLoading] = useState(false);

  const [loaderVisible, setLoaderVisible] = useState(false);

  const fetchSensorList = useCallback(async (inBackground: boolean = false) => {
    if (!inBackground) setSensorListLoading(true);
    return new Promise<Sensor[]>((res, rej) =>
      fetch(APP_API_BASE_PATH + '/sensorlist', { credentials: 'include' })
        .then((data) => data.json())
        .then((response: SensorListApiResponse) => {
          if (response.status === 'err') throw new Error(response.message);

          const data = response.data.map((s) => {
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
        .catch((e: Error) => {
          console.error(e);
          toast.error(e.message);
        })
    );
  }, []);

  const fetchGroupList = useCallback((inBackground: boolean = false) => {
    if (!inBackground) setGroupListLoading(true);
    fetch(APP_API_BASE_PATH + '/grouplist', { credentials: 'include' })
      .then((data) => data.json())
      .then((response: GroupListApiResponse) => {
        if (response.status === 'err') throw new Error(response.message);

        setGroupList(response.data);
        if (!inBackground) setGroupListLoading(false);
      })
      .catch((e: Error) => {
        console.error(e);
        toast.error(e.message);
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

    return fetch(API_BASE_PATH + '/fetchdata' + query, {
      credentials: 'include',
    })
      .then((data) => data.json())
      .then((response: FetchDataApiResponse) => {
        if (response.status === 'err') throw new Error(response.message);

        setLatestSensorData(response.data.values);
        if (!inBackground) setLatestDataLoading(false);
      })
      .catch((e: Error) => {
        console.error(e);
        toast.error(e.message);
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
            console.log(
              'GETTING FROM CACHE',
              filteredValues,
              cachedSensorsRef.current
            );
            return filteredValues;
          }
        }
      }
      console.log('GETTING FROM SERVER');
      // console.log(cachedSensorsData);
      return new Promise<FetchDataDataWrapped>((res, rej) =>
        fetch(API_BASE_PATH + '/fetchdata' + query, { credentials: 'include' })
          .then((data) => data.json())
          .then((response: FetchDataApiResponse) => {
            if (response.status === 'err') throw new Error(response.message);

            const key = `${from}-${to}`;
            const values = response.data.values;
            setCachedSensorsData((oldCachedSensorData) => {
              const newCachedSensorData = { ...oldCachedSensorData };
              newCachedSensorData[key] = values;
              return newCachedSensorData;
            });
            res(values);
          })
          .catch((e: Error) => {
            console.error(e);
            toast.error(e.message);
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
    if (!isAuth) return;
    fetchSensorList().then((d) => {
      if (d.length === 0) return;
      fetchLatestSensorData(d.map((s) => s.sensor_id));
    });
    fetchGroupList();

    const poolingLoop = setInterval(() => {
      fetchSensorList(true).then((d) => {
        if (d.length === 0) return;
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
  }, [fetchGroupList, fetchSensorList, isAuth]);

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

  // Wait to get auth state from localstorage
  if (isAuth === null) return null;
  return (
    <div className="app">
      <AuthContext.Provider value={{ isAuth, login, logout }}>
        <DataContext.Provider value={dataContextValue}>
          <FunctionContext.Provider value={functionContextValue}>
            <BrowserRouter>
              <Routes>
                <Route
                  element={<LayoutWithNav loaderVisible={loaderVisible} />}
                >
                  <Route
                    index
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="map"
                    element={
                      <ProtectedRoute>
                        <Heatmap />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="sensors"
                    element={
                      <ProtectedRoute>
                        <Sensors />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="groups"
                    element={
                      <ProtectedRoute>
                        <Groups />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="chart"
                    element={
                      <ProtectedRoute>
                        <Chart />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="docs" element={<Docs />} />
                </Route>
                <Route element={<LayoutWithoutNav loaderVisible={false} />}>
                  <Route path="login" element={<LoginPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
            <ToastContainer style={{ zIndex: 999999 }} />
          </FunctionContext.Provider>
        </DataContext.Provider>
      </AuthContext.Provider>
    </div>
  );
}

export default App;
