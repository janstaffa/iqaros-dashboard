import { useContext, useEffect, useState } from 'react';
import { GrStatusGoodSmall } from 'react-icons/gr';
import { toast } from 'react-toastify';
import { DataContext, FunctionContext } from '../../App';
import { APP_API_BASE_PATH, DATA_PARAMETER_VARIANTS } from '../../constants';
import {
  ChartedSensor,
  DataParameter,
  FetchDataData,
  GenericApiResponse,
  Sensor,
} from '../../types';
import { formatSensorValue, getColorByParameter } from '../../utils';
import CustomModal from '../CustomModal';
import InteractivePlot from '../InteractivePlot';

export interface SensorModalProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  sensor: Sensor;
  onClose?: () => void;
}

const SensorModal: React.FC<SensorModalProps> = ({
  isOpen,
  setIsOpen,
  sensor,
  onClose,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [checkedGroups, setCheckedGroups] = useState<number[]>([]);

  const [chartedData, setChartedData] = useState<ChartedSensor[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setChartedData([]);
      return;
    }

    setNameInput(sensor.sensor_name);
    setCheckedGroups(sensor.groups.map((g) => g.group_id));

    const data: ChartedSensor[] = DATA_PARAMETER_VARIANTS.map((parameter) => ({
      color: getColorByParameter(parameter),
      parameter,
      sensor_id: sensor.sensor_id,
    }));
    setChartedData(data);
  }, [sensor, isOpen]);

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
        .then((response: GenericApiResponse) => {
          if (response.status === 'err') throw new Error(response.message);
          res(null);
        })
        .catch((e: Error) => {
          console.error(e);
          toast.error(e.message);
          throw e;
        });
    });
  }

  const data = useContext(DataContext);
  const functions = useContext(FunctionContext);

  const [latestData, setLatestData] = useState<FetchDataData | null>(null);
  useEffect(() => {
    const sensorData = data.latestSensorData[sensor.sensor_id];
    if (sensorData === undefined) return;
    setLatestData(sensorData);
  }, [data, sensor]);

  return (
    <>
      <CustomModal
        isOpen={isOpen}
        handleClose={() => setIsOpen(false)}
        onClose={onClose}
        title={`Senzor - ${sensor.sensor_name}`}
        content={
          <>
            <div className="flex-shrink h-full flex flex-col">
              <div className="flex-shrink flex flex-row justify-start">
                <table>
                  <tbody>
                    <tr>
                      <td className="font-bold pr-5 border p-2">Název</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-5 border p-2">ID</td>
                      <td className="border p-2">{sensor.sensor_id}</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-5 border p-2">Síťové ID</td>
                      <td className="border p-2">{sensor.network_id}</td>
                    </tr>
                    <tr>
                      <td className="font-bold pr-5 border p-2">
                        Poslední zpráva
                      </td>
                      <td className="border p-2">
                        {new Date(sensor.last_response).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex-grow overflow-y-hidden flex flex-col">
                <h5 className="text-xl mt-2 mb-1">Skupiny</h5>
                <div className="h-full flex flex-col overflow-y-auto flex-grow border p-2">
                  {data.groupList.map((g, idx) => {
                    const elementId = `group_${g.group_id}`;
                    return (
                      <div key={idx} className="min-w-60 flex flex-row gap-1">
                        <input
                          type="checkbox"
                          id={elementId}
                          checked={checkedGroups.includes(g.group_id)}
                          onChange={(e) => {
                            if (e.target.checked === true) {
                              if (!checkedGroups.includes(g.group_id)) {
                                setCheckedGroups([
                                  ...checkedGroups,
                                  g.group_id,
                                ]);
                              }
                            } else {
                              const index = checkedGroups.findIndex(
                                (x) => x === g.group_id
                              );
                              if (index > -1) {
                                const newCheckedGroups = [...checkedGroups];
                                newCheckedGroups.splice(index, 1);
                                setCheckedGroups(newCheckedGroups);
                              }
                            }
                          }}
                        />
                        <label
                          htmlFor={elementId}
                          className="flex flex-row items-center"
                        >
                          <GrStatusGoodSmall color={g.group_color} />
                          {g.group_name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex-grow flex flex-col pt-5">
              <div className="flex flex-row justify-evenly w-full flex-shrink gap-4">
                {latestData && (
                  <>
                    <div className="text-center">
                      <span className="font-bold">Teplota</span>
                      <div className="flex flex-row justify-center items-center gap-5 mt-2">
                        {/* <Thermometer value={latestData.temperature.values[0]} /> */}
                        <span>
                          {formatSensorValue(
                            latestData.temperature.values[0],
                            DataParameter.Temperature
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="font-bold">Vlhkost</span>
                      <div className="flex flex-row justify-center items-center gap-5 mt-2">
                        {/* <Hygrometer value={latestData.humidity.values[0]} /> */}
                        <span>
                          {formatSensorValue(
                            latestData.humidity.values[0],
                            DataParameter.Humidity
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="font-bold">RSSI</span>
                      <div className="mt-2">
                        <span>
                          {formatSensorValue(
                            latestData.rssi.values[0],
                            DataParameter.RSSI
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="font-bold">Napětí</span>
                      <div className="mt-2">
                        <span>
                          {formatSensorValue(
                            latestData.voltage.values[0],
                            DataParameter.Voltage
                          )}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex-grow flex flex-col">
                  <InteractivePlot
                    chartedSensors={chartedData}
                    showLegend={true}
                    includeSensorNameInTraceName={false}
                  />
              </div>
            </div>
          </>
        }
        footer={
          <button
            onClick={async () => {
              await postEditedSensor(
                sensor.sensor_id,
                nameInput,
                checkedGroups
              );
              toast.success('Změny byly uloženy');
              setIsOpen(false);
              functions.fetchSensorList();
              functions.fetchGroupList();
            }}
          >
            Uložit
          </button>
        }
      />
    </>
  );
};

export default SensorModal;
