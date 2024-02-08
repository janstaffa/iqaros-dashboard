import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { DataContext, FunctionContext } from '../../App';
import { APP_API_BASE_PATH } from '../../constants';
import {
  ChartedSensor,
  DataParameter,
  GenericApiResponse,
  SensorGroup,
} from '../../types';
import {
  avgVal,
  formatSensorValue,
  getColorByParameter,
  maxVal,
  minVal,
} from '../../utils';
import CustomModal from '../CustomModal';
import InteractivePlot from '../InteractivePlot';

export interface GroupModalProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  displayedGroup: SensorGroup;
}

const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  setIsOpen,
  displayedGroup,
}) => {
  const data = useContext(DataContext);
  const functions = useContext(FunctionContext);

  const [groupNameInput, setGroupNameInput] = useState<string>('');
  const [groupColorInput, setGroupColorInput] = useState<string>('');

  const [chartedData, setChartedData] = useState<ChartedSensor[]>([]);
  const [chartedParameter, setChartedParameter] = useState<DataParameter>(
    DataParameter.Temperature
  );

  useEffect(() => {
    if (!isOpen) {
      setChartedData([]);
      return;
    }

    setGroupNameInput(displayedGroup.group_name);
    setGroupColorInput(displayedGroup.group_color);
  }, [displayedGroup, isOpen]);

  async function postEditedGroup(
    groupId: number,
    newName: string,
    newColor: string
  ) {
    return new Promise((res, rej) => {
      const payload = {
        groupId,
        newName,
        newColor,
      };
      fetch(APP_API_BASE_PATH + '/editgroup', {
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
        });
    });
  }

  const [latestGroupData, setLatestGroupData] = useState<{
    temperature: number[];
    humidity: number[];
    rssi: number[];
    voltage: number[];
  } | null>(null);

  useEffect(() => {
    const groupSensorData = {
      temperature: [] as number[],
      humidity: [] as number[],
      rssi: [] as number[],
      voltage: [] as number[],
    };

    for (const [sId, values] of Object.entries(data.latestSensorData)) {
      const isInGroup = displayedGroup.sensors.find(
        (s) => s.sensor_id === parseInt(sId)
      );
      if (isInGroup) {
        groupSensorData.temperature.push(
          ...(values.temperature.values.filter((v) => v !== null) as number[])
        );
        groupSensorData.humidity.push(
          ...(values.humidity.values.filter((v) => v !== null) as number[])
        );
        groupSensorData.rssi.push(
          ...(values.rssi.values.filter((v) => v !== null) as number[])
        );
        groupSensorData.voltage.push(
          ...(values.voltage.values.filter((v) => v !== null) as number[])
        );
      }
    }

    setLatestGroupData(groupSensorData);
    const chartedSensors: ChartedSensor[] = displayedGroup.sensors.map((s) => ({
      sensor_id: s.sensor_id,
      parameter: chartedParameter,
      color: getColorByParameter(chartedParameter),
    }));
    setChartedData(chartedSensors);
  }, [data, displayedGroup, chartedParameter]);

  enum DisplayType {
    Matrix,
    Chart,
  }
  const [displayType, setDisplayType] = useState<DisplayType>(
    DisplayType.Matrix
  );

  return (
    <CustomModal
      isOpen={isOpen}
      handleClose={() => setIsOpen(false)}
      title={`Skupina - ${displayedGroup?.group_name}`}
      content={
        <>
          <div className="flex-shrink h-full flex flex-col gap-2">
            <div className="flex-shrink">
              <table>
                <tbody>
                  <tr>
                    <td className="font-bold pr-5 border p-2">Název</td>
                    <td className="pr-5 border p-2">
                      <input
                        type="text"
                        value={groupNameInput}
                        onChange={(e) => setGroupNameInput(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-5 border p-2">Barva</td>
                    <td className="pr-5 border p-2">
                      <input
                        type="color"
                        value={groupColorInput}
                        onChange={(e) => setGroupColorInput(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold pr-5 border p-2">Počet senzorů</td>
                    <td className="pr-5 border p-2">
                      {displayedGroup.sensors.length}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex-grow overflow-hidden flex flex-col">
              <h5 className="text-xl mt-2 mb-1">Senzory</h5>
              <div className="overflow-y-auto flex-grow border p-2">
                {displayedGroup.sensors.map((s) => (
                  <div>{s.sensor_name}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col flex-grow">
            <div className="w-full flex flex-row justify-end gap-3">
              {displayType === DisplayType.Chart && (
                <select
                  onChange={(e) =>
                    setChartedParameter(parseInt(e.target.value))
                  }
                >
                  <option value={DataParameter.Temperature}>Teplota</option>
                  <option value={DataParameter.Humidity}>Vlhkost</option>
                  <option value={DataParameter.RSSI}>RSSI</option>
                  <option value={DataParameter.Voltage}>Napětí</option>
                </select>
              )}
              <select
                onChange={(e) => setDisplayType(parseInt(e.target.value))}
              >
                <option value={DisplayType.Matrix} selected>
                  Hodnoty
                </option>
                <option value={DisplayType.Chart}>Graf</option>
              </select>
            </div>
            <div className="flex flex-row justify-center flex-grow">
              {displayType === DisplayType.Matrix ? (
                latestGroupData && (
                  <table className="group_data_matrix w-full h-96 mt-8">
                    <thead>
                      <tr>
                        <td></td>
                        <td className="font-bold">Průměr</td>
                        <td className="font-bold">Nejnižší</td>
                        <td className="font-bold">Nejvyšší</td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-bold">Teplota</td>
                        <td>
                          {formatSensorValue(
                            avgVal(latestGroupData.temperature),
                            DataParameter.Temperature
                          )}
                        </td>
                        <td>
                          {formatSensorValue(
                            minVal(latestGroupData.temperature),
                            DataParameter.Temperature
                          )}
                        </td>
                        <td>
                          {formatSensorValue(
                            maxVal(latestGroupData.temperature),
                            DataParameter.Temperature
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="font-bold">Vlhkost</td>
                        <td>
                          {formatSensorValue(
                            avgVal(latestGroupData.humidity),
                            DataParameter.Humidity
                          )}
                        </td>
                        <td>
                          {formatSensorValue(
                            minVal(latestGroupData.humidity),
                            DataParameter.Humidity
                          )}
                        </td>
                        <td>
                          {formatSensorValue(
                            maxVal(latestGroupData.humidity),
                            DataParameter.Humidity
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="font-bold">RSSI</td>
                        <td>
                          {formatSensorValue(
                            avgVal(latestGroupData.rssi),
                            DataParameter.RSSI
                          )}
                        </td>
                        <td>
                          {formatSensorValue(
                            minVal(latestGroupData.rssi),
                            DataParameter.RSSI
                          )}
                        </td>
                        <td>
                          {formatSensorValue(
                            maxVal(latestGroupData.rssi),
                            DataParameter.RSSI
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="font-bold">Napětí</td>
                        <td>
                          {formatSensorValue(
                            avgVal(latestGroupData.voltage),
                            DataParameter.Voltage
                          )}
                        </td>
                        <td>
                          {formatSensorValue(
                            minVal(latestGroupData.voltage),
                            DataParameter.Voltage
                          )}
                        </td>
                        <td>
                          {formatSensorValue(
                            maxVal(latestGroupData.voltage),
                            DataParameter.Voltage
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )
              ) : (
                <InteractivePlot
                  chartedSensors={chartedData}
                  showLegend={true}
                  includeSensorNameInTraceName={true}
                />
              )}
            </div>
          </div>
        </>
      }
      footer={
        <button
          onClick={async () => {
            if (displayedGroup) {
              try {
                await postEditedGroup(
                  displayedGroup.group_id,
                  groupNameInput,
                  groupColorInput
                );
                toast.success('Změny byly uloženy');
              } catch (_) {
                return;
              }
              functions.fetchGroupList();
            }
            setIsOpen(false);
          }}
        >
          Uložit
        </button>
      }
    />
  );
};

export default GroupModal;
