import { useContext, useEffect, useState } from 'react';
import { FaHome, FaTimes } from 'react-icons/fa';
import { GoDash } from 'react-icons/go';
import { GrStatusGoodSmall } from 'react-icons/gr';
import Plot from 'react-plotly.js';
import { DataContext } from '../App';
import { API_BASE_PATH } from '../constants';
import {
  ChartedSensor,
  DataParameter,
  FetchDataApiResponse,
  FetchDataDataWrapped,
} from '../types';
import {
  convertToISOWithTimezone,
  dataParameterToKey,
  dataParameterToName,
  getColorByParameter,
  removeGaps,
} from '../utils';

function Chart() {
  const dataProvider = useContext(DataContext);

  const [sensorData, setSensorData] = useState<FetchDataDataWrapped | null>(
    null
  );

  function fetchSensorData(
    sensorId: number | number[],
    from?: number,
    to?: number
  ) {
    let query = `?sensorId=${
      typeof sensorId === 'number' ? sensorId : sensorId.join(',')
    }`;
    if (from !== undefined) query += `&from=${from}`;
    if (from !== undefined && to !== undefined) query += `&to=${to}`;

    return fetch(API_BASE_PATH + '/fetchdata' + query)
      .then((data) => data.json())
      .then((parsed_data) => {
        const response = parsed_data as FetchDataApiResponse;
        setSensorData(response.data);
      })
      .catch((e) => {
        throw e;
      });
  }

  const [chartedSensors, setChartedSensors] = useState<ChartedSensor[]>([]);

  const getHomeTimestamp = () => {
    const now = new Date().getTime();
    return [now - 24 * 60 * 60 * 1000, now];
  };

  const defaultTimestamp = getHomeTimestamp();
  const [timestampFrom, setTimestampFrom] = useState<number>(
    defaultTimestamp[0]
  );
  const [timestampTo, setTimestampTo] = useState<number>(defaultTimestamp[1]);

  useEffect(() => {
    const chS = window.localStorage.getItem('chartedSensors');
    if (chS !== null) {
      setChartedSensors(JSON.parse(chS));
    }
  }, []);

  // useEffect(() => {
  //   console.log(chartedSensors);
  // }, [chartedSensors]);

  useEffect(() => {
    if (chartedSensors.length === 0) {
      setSensorData(null);
      setChartData([]);
      return;
    }
    const sensorsWithoutDuplicates = chartedSensors.filter(
      (val, idx) =>
        chartedSensors.findIndex((v) => v.sensor_id === val.sensor_id) === idx
    );
    fetchSensorData(
      sensorsWithoutDuplicates.map((s) => s.sensor_id),
      timestampFrom,
      timestampTo
    );
  }, [chartedSensors, timestampFrom, timestampTo]);

  const [chartData, setChartData] = useState<any[]>();

  useEffect(() => {
    if (!sensorData) return;

    // const firstEntryTimestamp = Math.min(
    //   ...temperatureData.timestamps,
    //   ...humidityData.timestamps,
    //   ...rssiData.timestamps,
    //   ...voltageData.timestamps
    // );
    // const lastEntryTimestamp = Math.max(
    //   ...temperatureData.timestamps,
    //   ...humidityData.timestamps,
    //   ...rssiData.timestamps,
    //   ...voltageData.timestamps
    // );

    // const labels: string[] = [];
    // const labelVals: number[] = [];
    // const timeframe = lastEntryTimestamp - firstEntryTimestamp;
    // const labelCount = 10;
    // const labelLength = timeframe / labelCount;

    // for (let i = 0; i < labelCount; i++) {
    //   const labeltimestampValue = firstEntryTimestamp + i * labelLength;
    //   const labelValue = new Date(labeltimestampValue).toISOString();
    //   labels.push(labelValue);
    //   labelVals.push(labeltimestampValue);
    // }

    const globalPlotOptions = {
      type: 'scatter',
      mode: 'lines',
      connectgaps: false,
    };

    const traces = [];

    for (const s of chartedSensors) {
      const data = sensorData[s.sensor_id];
      if (!data) continue;

      const d = removeGaps(data[dataParameterToKey(s.parameter)]);
      if (!d) continue;

      const sensor = dataProvider.sensorList.find(
        (sn) => sn.sensor_id === s.sensor_id
      );

      if (!sensor) continue;

      const parameterName = dataParameterToName(s.parameter);
      traces.push({
        name: `${sensor.sensor_name}`,
        // name: sensor.sensor_name,
        hoverlabel: { namelength: -1 },
        // x: temperatureData.timestamps.map(convertToISOWithTimezone),
        x: d.timestamps.map((t) => convertToISOWithTimezone(t)),
        y: d.values,
        // fill: 'toself',
        marker: { color: getColorByParameter(s.parameter) },
        hovertemplate: `<i>${parameterName}</i>: %{y:.2f}<br>%{x}<br>`,
        ...globalPlotOptions,
      });
    }
    setChartData(traces);
  }, [dataProvider, sensorData, chartedSensors]);

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
            value={dateForDateTimeInputValue(timestampFrom)}
            onChange={(e) =>
              setTimestampFrom(new Date(e.target.value).getTime())
            }
            max={dateForDateTimeInputValue(
              Math.min(timestampTo, new Date().getTime())
            )}
          />
          <GoDash />
          <input
            type="datetime-local"
            value={dateForDateTimeInputValue(timestampTo)}
            onChange={(e) => setTimestampTo(new Date(e.target.value).getTime())}
            min={dateForDateTimeInputValue(timestampFrom)}
          />

          <button
            onClick={() => {
              const homeTimestamp = getHomeTimestamp();
              setTimestampFrom(homeTimestamp[0]);
              setTimestampTo(homeTimestamp[1]);
            }}
          >
            <FaHome size={20} />
          </button>
        </div>
      </div>
      <div className="chart_wrap">
        <div className="chart">
          {chartData && (
            <Plot
              onRelayout={(e) => {
                const from = e['xaxis.range[0]'];
                const to = e['xaxis.range[1]'];
                if (from === undefined || to === undefined) return;

                const newTimestampFrom = new Date(from).getTime();
                const newTimestampTo = new Date(to).getTime();

                setTimestampFrom(newTimestampFrom);
                setTimestampTo(newTimestampTo);
              }}
              data={chartData}
              useResizeHandler={true}
              className={chartedSensors.length === 0 ? 'disabled' : ''}
              layout={{
                // title: 'Senzor 1',
                // xaxis: { ticktext: chartLabels, tickvals: chartLabelVals },
                xaxis: {
                  title: 'Čas',
                  range: [timestampFrom, timestampTo],
                  rangeselector: {
                    buttons: [
                      {
                        count: 30,
                        label: '30m',
                        step: 'minute',
                        stepmode: 'backward',
                      },
                      {
                        count: 1,
                        label: '1h',
                        step: 'hour',
                        stepmode: 'backward',
                      },
                      {
                        count: 1,
                        label: '1d',
                        step: 'day',
                        stepmode: 'backward',
                      },
                      {
                        count: 7,
                        label: '7d',
                        step: 'day',
                        stepmode: 'backward',
                      },
                      {
                        count: 14,
                        label: '14d',
                        step: 'day',
                        stepmode: 'backward',
                      },
                      {
                        count: 1,
                        label: '1M',
                        step: 'month',
                        stepmode: 'backward',
                      },
                      {
                        count: 1,
                        label: '1Y',
                        step: 'year',
                        stepmode: 'backward',
                      },
                      { step: 'all', label: 'vše' },
                    ],
                  },
                  // rangeslider: {
                  //   range: [
                  //     '2015-02-17',
                  //     dateForDateTimeInputValue(new Date().getTime()),
                  //   ],
                  // },
                  type: 'date',
                },
                yaxis: {
                  zeroline: false,
                  fixedrange: true,
                  // title: displayParameterToName(displayParameter),
                  rangemode: 'tozero',
                },
                dragmode: 'pan',
                autosize: true,
                showlegend: false,
                // legend: {
                //   xanchor: 'right',
                //   bgcolor: 'rgba(255,255,255,0.8)',
                // },
              }}
              config={{
                displaylogo: false,
                displayModeBar: false,
                scrollZoom: true,
                responsive: true,
                autosizable: true,
              }}
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>
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
                        size={25}
                        color={getColorByParameter(s.parameter)}
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
    </>
  );
}

export default Chart;
