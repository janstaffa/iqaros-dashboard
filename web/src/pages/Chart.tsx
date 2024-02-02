import { useContext, useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { DataContext, FunctionContext } from '../App';
import { API_BASE_PATH } from '../constants';
import {
  DisplayParameter,
  FetchDataApiResponse,
  FetchDataDataWrapped,
} from '../types';
import {
  displayParameterToKey,
  displayParameterToName,
  parseDisplayParamter,
  randomColor,
  removeGaps,
} from '../utils';

function Chart() {
  const dataProvider = useContext(DataContext);
  const functions = useContext(FunctionContext);

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

  const [displayedSensors, setDisplayedSensors] = useState<number[]>([]);

  const now = new Date().getTime();
  const [timestampFrom, setTimestampFrom] = useState<number>(
    now - 24 * 60 * 60 * 1000
  );
  const [timestampTo, setTimestampTo] = useState<number>(now);

  useEffect(() => {
    functions.fetchSensorList();
    if (displayedSensors.length === 0) {
      setSensorData(null);
      setChartData([]);
    }
    fetchSensorData(displayedSensors, timestampFrom, timestampTo);
  }, [functions, displayedSensors, timestampFrom, timestampTo]);

  const [chartData, setChartData] = useState<any[]>();

  const [displayParameter, setDisplayParameter] = useState<DisplayParameter>(
    DisplayParameter.Temperature
  );

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
    for (const [sensorId, data] of Object.entries(sensorData)) {
      const d = removeGaps(data[displayParameterToKey(displayParameter)]);
      if (!d) continue;
      // const humidityData = removeGaps(data.humidity);
      // const rssiData = removeGaps(data.rssi);
      // const voltageData = removeGaps(data.voltage);

      const sensor = dataProvider.sensorList.find(
        (s) => s.sensor_id === parseInt(sensorId)
      );
      if (!sensor) continue;

      const parameterName = displayParameterToName(displayParameter);
      traces.push({
        name: `${parameterName} - ${sensor.sensor_name}`,
        // x: temperatureData.timestamps.map(convertToISOWithTimezone),
        x: d.timestamps.map((t) => new Date(t).toISOString()),
        y: d.values,
        // fill: 'tonexty',
        marker: { color: randomColor() },
        ...globalPlotOptions,
      });

      // console.log(temperatureData.timestamps);
      // setChartData([
      //   {
      //     name: 'Teplota',
      //     // x: temperatureData.timestamps.map(convertToISOWithTimezone),
      //     x: temperatureData.timestamps.map((t) => new Date(t).toISOString()),
      //     y: temperatureData.values,
      //     fill: 'tonexty',
      //     marker: { color: 'red' },
      //     ...globalPlotOptions,
      //   },
      //   {
      //     name: 'Vlhkost',
      //     // x: humidityData.timestamps.map(convertToISOWithTimezone),
      //     x: humidityData.timestamps.map((t) => new Date(t).toISOString()),
      //     y: humidityData.values,
      //     fill: 'tonexty',
      //     marker: { color: 'green' },
      //     ...globalPlotOptions,
      //   },
      //   {
      //     name: 'Signál',
      //     // x: rssiData.timestamps.map(convertToISOWithTimezone),
      //     x: rssiData.timestamps.map((t) => new Date(t).toISOString()),
      //     y: rssiData.values,
      //     marker: { color: 'orange' },
      //     ...globalPlotOptions,
      //   },
      //   {
      //     name: 'Napětí',
      //     // x: voltageData.timestamps.map(convertToISOWithTimezone),
      //     x: voltageData.timestamps.map((t) => new Date(t).toISOString()),
      //     y: voltageData.values,
      //     marker: { color: 'black' },
      //     ...globalPlotOptions,
      //   },
      // ]);
    }
    setChartData(traces);
  }, [sensorData, dataProvider, displayParameter]);

  // useEffect(() => {
  //   console.log(chartData);
  // }, [chartData]);
  const dateForDateTimeInputValue = (datetime: number) =>
    new Date(
      new Date(datetime).getTime() + new Date().getTimezoneOffset() * -60 * 1000
    )
      .toISOString()
      .slice(0, 16);
  return (
    <div>
      <div className="chart_header">
        <div>Test</div>
        <div className="chart_tools">
          <div>
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
            -
            <input
              type="datetime-local"
              value={dateForDateTimeInputValue(timestampTo)}
              onChange={(e) =>
                setTimestampTo(new Date(e.target.value).getTime())
              }
              min={dateForDateTimeInputValue(timestampFrom)}
            />
          </div>
          <div>
            <select
              value={displayParameter}
              onChange={(e) => {
                const parsedDisplayParameter = parseDisplayParamter(
                  parseInt(e.target.value)
                );
                if (parsedDisplayParameter !== undefined)
                  setDisplayParameter(parsedDisplayParameter);
              }}
            >
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
      </div>
      <div className="chart_wrap">
        <div className="sensor_list">
          <table>
            <tbody>
              {dataProvider.sensorList.map((s, idx) => {
                const checkboxId = 'show-on-map_' + s.sensor_id;
                const displayedSensorIdx = displayedSensors.findIndex(
                  (x) => x === s.sensor_id
                );
                return (
                  <tr key={idx} draggable>
                    <td
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          'sensorid',
                          s.sensor_id.toString()
                        );
                      }}
                    >
                      <input
                        type="checkbox"
                        id={checkboxId}
                        checked={displayedSensorIdx !== -1}
                        onChange={(e) => {
                          let newDisplayedSensors: number[] = [
                            ...displayedSensors,
                          ];
                          if (e.target.checked) {
                            newDisplayedSensors.push(s.sensor_id);
                          } else {
                            newDisplayedSensors.splice(displayedSensorIdx, 1);
                          }
                          setDisplayedSensors(newDisplayedSensors);
                        }}
                      />
                      <label htmlFor={checkboxId}>{s.sensor_name}</label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="chart">
          {chartData && (
            <Plot
              data={chartData}
              useResizeHandler={true}
              layout={{
                // title: 'Senzor 1',
                // xaxis: { ticktext: chartLabels, tickvals: chartLabelVals },
                xaxis: {
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
                  rangeslider: {
                    range: [
                      '2015-02-17',
                      dateForDateTimeInputValue(new Date().getTime()),
                    ],
                  },
                  type: 'date',
                },
                yaxis: { zeroline: false, fixedrange: true },
                dragmode: 'pan',
                autosize: true,
              }}
              config={{
                displaylogo: false,
                displayModeBar: false,
                scrollZoom: true,
                responsive: true,
                autosizable: true,
              }}
              style={{ width: '100%', height: '500px' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Chart;
