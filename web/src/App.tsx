import {
  createContext,
  useCallback,
  useMemo,
  useState
} from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Nav from './Nav';
import { APP_API_BASE_PATH } from './constants';
import Chart from './pages/Chart';
import Docs from './pages/Docs';
import Groups from './pages/Groups';
import Home from './pages/Home';
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

  const fetchSensorList = useCallback(() => {
    fetch(APP_API_BASE_PATH + '/sensorlist')
      .then((data) => data.json())
      .then((parsed_data) => {
        setSensorList((parsed_data as SensorListApiResponse).data);
      })
      .catch((e) => {
        throw e;
      });
  }, []);

  const fetchGroupList = useCallback(() => {
    return fetch(APP_API_BASE_PATH + '/grouplist')
      .then((data) => data.json())
      .then((parsed_data) => {
        const response = parsed_data as GroupListApiResponse;
        setGroupList(response.data);
      })
      .catch((e) => {
        throw e;
      });
  }, []);

  // useEffect(() => {
  //   fetchSensorList();
  //   fetchGroupList();
  // }, [fetchSensorList, fetchGroupList]);

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
    <>
      <DataContext.Provider value={dataContextValue}>
        <FunctionContext.Provider value={functionContextValue}>
          <BrowserRouter>
            <Nav />
            <main>
              <Routes>
                <Route index element={<Home />} />
                <Route path="heatmap" element={<Heatmap />} />
                <Route path="sensors" element={<Sensors />} />
                <Route path="groups" element={<Groups />} />
                <Route path="chart" element={<Chart />} />
                <Route path="docs" element={<Docs />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </main>
          </BrowserRouter>
          <ToastContainer />
        </FunctionContext.Provider>
      </DataContext.Provider>
    </>
  );
}

export default App;
