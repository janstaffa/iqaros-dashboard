import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { API_BASE_PATH } from '../constants';
import { FetchDataApiResponse, FetchDataData } from '../types';

function Chart() {
  const [sensorData, setSensorData] = useState<FetchDataData | null>(null);
  function fetchSensorData(sensorId: number, from?: number, to?: number) {
    let query = `?sensorId=${sensorId}`;
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
  useEffect(() => {
    fetchSensorData(1, 170690655983);
  }, []);

  const [chartData, setChartData] = useState<any[]>();

  useEffect(() => {
    if (!sensorData) return;
    const temperatureData = sensorData.temperature;
    const humidityData = sensorData.humidity;
    const rssiData = sensorData.rssi;
    const voltageData = sensorData.voltage;

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

    const globalPlotOptions = { type: 'scatter', mode: 'lines' };
    setChartData([
      {
        name: 'Teplota',
        x: temperatureData.timestamps.map((d) => new Date(d).toISOString()),
        y: temperatureData.values,
        fill: 'tonexty',
        marker: { color: 'red' },
        ...globalPlotOptions,
      },
      {
        name: 'Vlhkost',
        x: humidityData.timestamps.map((d) => new Date(d).toISOString()),
        y: humidityData.values,
        fill: 'tonexty',
        marker: { color: 'green' },
        ...globalPlotOptions,
      },
      {
        name: 'Signál',
        x: rssiData.timestamps.map((d) => new Date(d).toISOString()),
        y: rssiData.values,
        marker: { color: 'orange' },
        ...globalPlotOptions,
      },
      {
        name: 'Napětí',
        x: voltageData.timestamps.map((d) => new Date(d).toISOString()),
        y: voltageData.values,
        marker: { color: 'black' },
        ...globalPlotOptions,
      },
    ]);
  }, [sensorData]);

  return (
    <div>
      <h1>Graf</h1>
      <div className="chart_wrap">
        {chartData && (
          <Plot
            data={chartData}
            useResizeHandler={true}
            layout={{
              title: 'Senzor 1',
              // xaxis: { ticktext: chartLabels, tickvals: chartLabelVals },
              yaxis: { zeroline: false },
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
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
    </div>
  );
}

export default Chart;
