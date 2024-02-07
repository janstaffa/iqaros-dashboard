import { useContext, useEffect, useRef, useState } from 'react';
import { FaHome, FaTimes } from 'react-icons/fa';
import { GoDash } from 'react-icons/go';
import { GrStatusGoodSmall } from 'react-icons/gr';
import { DataContext } from '../App';
import InteractivePlot from '../components/InteractivePlot';
import { ChartedSensor, DataParameter } from '../types';
import { dataParameterToName, getColorByParameter, getHomeTimestamp } from '../utils';

function Chart() {
  const dataProvider = useContext(DataContext);

  const [chartedSensors, setChartedSensors] = useState<ChartedSensor[]>([]);

  const defaultTimestamp = getHomeTimestamp();
  const [dataRange, setDataRange] =
    useState<[number, number]>(defaultTimestamp);

  useEffect(() => {
    const chS = window.localStorage.getItem('chartedSensors');
    if (chS !== null) {
      setChartedSensors(JSON.parse(chS));
    }
  }, []);

  const dateForDateTimeInputValue = (datetime: number) =>
    new Date(
      new Date(datetime).getTime() + new Date().getTimezoneOffset() * -60 * 1000
    )
      .toISOString()
      .slice(0, 16);

  const [selectedSensor, setSelectedSensor] = useState<number | null>(null);
  const [selectedParameter, setSelectedParameter] = useState<DataParameter>(
    DataParameter.Temperature
  );

  const [editedTrace, setEditedTrace] = useState<number | null>(null);

  const colorPickerRef = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <div className="page_header">
        <div className="page_options">
          <select
            onChange={(e) => {
              setSelectedSensor(parseInt(e.target.value));
            }}
            defaultValue={-1}
          >
            <option disabled hidden value={-1}>
              -- vyberte --
            </option>
            {dataProvider.sensorList.map((s, idx) => {
              return (
                <option key={idx} value={s.sensor_id}>
                  {s.sensor_name}
                </option>
              );
            })}
          </select>
          <select
            value={selectedParameter}
            onChange={(e) => setSelectedParameter(parseInt(e.target.value))}
          >
            <option value={DataParameter.Temperature}>
              {dataParameterToName(DataParameter.Temperature)}
            </option>
            <option value={DataParameter.Humidity}>
              {dataParameterToName(DataParameter.Humidity)}
            </option>
            <option value={DataParameter.RSSI}>
              {dataParameterToName(DataParameter.RSSI)}
            </option>
            <option value={DataParameter.Voltage}>
              {dataParameterToName(DataParameter.Voltage)}
            </option>
          </select>
          <button
            onClick={() => {
              if (selectedSensor === null) return;
              const exists = chartedSensors.find(
                (s) =>
                  s.sensor_id === selectedSensor &&
                  s.parameter === selectedParameter
              );
              if (exists) return;

              let newChartedSensors: ChartedSensor[] = [...chartedSensors];
              newChartedSensors.push({
                sensor_id: selectedSensor,
                parameter: selectedParameter,
                color: getColorByParameter(selectedParameter),
              });
              setChartedSensors(newChartedSensors);
              window.localStorage.setItem(
                'chartedSensors',
                JSON.stringify(newChartedSensors)
              );
            }}
          >
            Přidat
          </button>
        </div>
        <div className="page_tools">
          <input
            type="datetime-local"
            value={dateForDateTimeInputValue(dataRange[0])}
            onChange={(e) =>
              setDataRange((old) => [
                new Date(e.target.value).getTime(),
                old[1],
              ])
            }
            max={dateForDateTimeInputValue(
              Math.min(dataRange[1], new Date().getTime())
            )}
          />
          <GoDash />
          <input
            type="datetime-local"
            value={dateForDateTimeInputValue(dataRange[1])}
            onChange={(e) =>
              setDataRange((old) => [
                old[0],
                new Date(e.target.value).getTime(),
              ])
            }
            min={dateForDateTimeInputValue(dataRange[0])}
          />

          <button
            onClick={() => {
              const homeTimestamp = getHomeTimestamp();
              setDataRange(homeTimestamp);
            }}
          >
            <FaHome size={20} />
          </button>
        </div>
      </div>
      <div className="chart_wrap">
        <InteractivePlot
          chartedSensors={chartedSensors}
          dataRange={dataRange}
          onRangeChange={(newFrom, newTo) => setDataRange([newFrom, newTo])}
        />
        <div className="sensor_list">
          <table>
            <tbody>
              {chartedSensors.map((s, idx) => {
                const sensor = dataProvider.sensorList.find(
                  (sn) => sn.sensor_id === s.sensor_id
                );
                if (sensor === undefined) return null;

                return (
                  <tr key={idx}>
                    <td>
                      <GrStatusGoodSmall
                        className="clickable_status"
                        size={25}
                        color={s.color}
                        onClick={() => {
                          if (!colorPickerRef.current) return;
                          setEditedTrace(s.sensor_id);
                          colorPickerRef.current.click();
                        }}
                      />
                    </td>
                    <td>{sensor.sensor_name}</td>
                    <td>{dataParameterToName(s.parameter)}</td>
                    <td>
                      <FaTimes
                        size={15}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          let newChartedSensors: ChartedSensor[] = [
                            ...chartedSensors,
                          ];
                          const chartedSensorIdx = chartedSensors.findIndex(
                            (x) =>
                              x.sensor_id === s.sensor_id &&
                              x.parameter === s.parameter
                          );
                          newChartedSensors.splice(chartedSensorIdx, 1);
                          setChartedSensors(newChartedSensors);

                          window.localStorage.setItem(
                            'chartedSensors',
                            JSON.stringify(newChartedSensors)
                          );
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <input
        type="color"
        hidden
        ref={colorPickerRef}
        onChange={(e) => {
          if (editedTrace === null) return;
          const newChartedSensors = [...chartedSensors];
          const idx = newChartedSensors.findIndex(
            (s) => s.sensor_id === editedTrace
          );
          if (idx !== -1) {
            newChartedSensors[idx].color = e.target.value;
            setChartedSensors(newChartedSensors);

            window.localStorage.setItem(
              'chartedSensors',
              JSON.stringify(newChartedSensors)
            );
          }
        }}
      />
    </>
  );
}

export default Chart;
