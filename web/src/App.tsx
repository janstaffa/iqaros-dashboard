import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { BallTriangle } from 'react-loader-spinner';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Nav from './Nav';
import { APP_API_BASE_PATH, POOLING_INTERVAL } from './constants';
import Chart from './pages/Chart';
import Dashboard from './pages/Dashboard';
import Docs from './pages/Docs';
import Groups from './pages/Groups';
import Heatmap from './pages/Map';
import Sensors from './pages/Sensors';
import {
  GroupListApiResponse,
  Sensor,
  SensorGroup,
  SensorListApiResponse,
} from './types';

interface DataContextType {
  sensorList: Sensor[];
  groupList: SensorGroup[];
}

interface FunctionContextType {
  fetchSensorList: () => void;
  fetchGroupList: () => void;
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

  const [loaderVisible, setLoaderVisible] = useState(false);

  const fetchSensorList = useCallback((inBackground: boolean = false) => {
    if (!inBackground) setSensorListLoading(true);
    fetch(APP_API_BASE_PATH + '/sensorlist')
      .then((data) => data.json())
      .then((parsed_data: SensorListApiResponse) => {
        if (parsed_data.status === 'err') throw new Error(parsed_data.message);
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
      })
      .catch((e) => {
        throw e;
      });
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

  useEffect(() => {
    setLoaderVisible(sensorListLoading || groupListLoading);
  }, [sensorListLoading, groupListLoading]);

  useEffect(() => {
    fetchSensorList();
    fetchGroupList();

    const poolingLoop = setInterval(() => {
      fetchSensorList(true);
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
    }),
    [sensorList, groupList]
  );

  const functionContextValue = useMemo(
    () => ({
      fetchSensorList,
      fetchGroupList,
    }),
    [fetchSensorList, fetchGroupList]
  );

  return (
    <div className="app">
      <DataContext.Provider value={dataContextValue}>
        <FunctionContext.Provider value={functionContextValue}>
          <BrowserRouter>
            <Nav />
            <main>
              <>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="map" element={<Heatmap />} />
                  <Route path="sensors" element={<Sensors />} />
                  <Route path="groups" element={<Groups />} />
                  <Route path="chart" element={<Chart />} />
                  <Route path="docs" element={<Docs />} />
                  <Route path="*" element={<Dashboard />} />
                </Routes>
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
