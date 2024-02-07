import { useContext, useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { DataContext, FunctionContext } from '../App';
import { ChartedSensor, FetchDataDataWrapped } from '../types';
import {
  convertToISOWithTimezone,
  dataParameterToKey,
  dataParameterToName,
  getHomeTimestamp,
  removeGaps,
} from '../utils';

export interface InteractivePlotProps {
  chartedSensors: ChartedSensor[];
  dataRange?: [number, number];
  onRangeChange?: (from: number, to: number) => void;
  showLegend?: boolean;
  includeSensorNameInTraceName?: boolean;
}

const InteractivePlot: React.FC<InteractivePlotProps> = ({
  chartedSensors,
  dataRange,
  onRangeChange,
  showLegend = false,
  includeSensorNameInTraceName = true,
}) => {
  const dataProvider = useContext(DataContext);
  const functionsProvider = useContext(FunctionContext);

  const defaultTimestamp = getHomeTimestamp();
  const [localRange, setLocalRange] =
    useState<[number, number]>(defaultTimestamp);

  useEffect(() => {
    if (!dataRange) return;
    setLocalRange(dataRange);
  }, [dataRange]);

  const [sensorData, setSensorData] = useState<FetchDataDataWrapped | null>(
    null
  );

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
    functionsProvider
      .getSensorDataInPeriod(
        sensorsWithoutDuplicates.map((s) => s.sensor_id),
        localRange[0],
        localRange[1]
      )
      .then((d) => {
        setSensorData(d);
      });
  }, [chartedSensors, localRange, functionsProvider]);

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
        name: includeSensorNameInTraceName
          ? `${parameterName} - ${sensor.sensor_name}`
          : parameterName,
        // name: sensor.sensor_name,
        hoverlabel: { namelength: -1 },
        // x: temperatureData.timestamps.map(convertToISOWithTimezone),
        x: d.timestamps.map((t) => convertToISOWithTimezone(t)),
        y: d.values,
        // fill: 'toself',
        marker: { color: s.color },
        hovertemplate: `<i>${parameterName}</i>: %{y:.2f}<br>%{x}<br>`,
        ...globalPlotOptions,
      });
    }
    setChartData(traces);
  }, [dataProvider, sensorData, chartedSensors]);

  return (
    <div className="chart">
      {chartData && (
        <Plot
          onRelayout={(e) => {
            const from = e['xaxis.range[0]'];
            const to = e['xaxis.range[1]'];
            if (from === undefined || to === undefined) return;

            const newTimestampFrom = new Date(from).getTime();
            const newTimestampTo = new Date(to).getTime();

            setLocalRange([newTimestampFrom, newTimestampTo]);
            onRangeChange?.(newTimestampFrom, newTimestampTo);
          }}
          data={chartData}
          useResizeHandler={true}
          className={chartedSensors.length === 0 ? 'disabled' : ''}
          layout={{
            // title: 'Senzor 1',
            // xaxis: { ticktext: chartLabels, tickvals: chartLabelVals },
            xaxis: {
              title: 'Čas',
              range: localRange,
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
            showlegend: showLegend,
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
  );
};

export default InteractivePlot;
