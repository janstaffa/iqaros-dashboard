import {
  DATA_PARAMETER_KEYS,
  NOT_AVAILABLE_TEXT,
  OFFLINE_THRESHOLD,
} from './constants';
import {
  DataParameter,
  DisplayParameter,
  FetchData,
  SensorData,
  SensorDataAll,
} from './types';

export function formatSensorData(
  data: SensorData | undefined,
  parameter: DisplayParameter
) {
  if (data === undefined || data === null) return NOT_AVAILABLE_TEXT;
  switch (parameter) {
    case DisplayParameter.Temperature:
      return data.temperature !== null && data.temperature !== undefined
        ? Number(data.temperature.toFixed(2)) + '°C'
        : NOT_AVAILABLE_TEXT;
    case DisplayParameter.Humidity:
      return data.humidity !== null && data.humidity !== undefined
        ? Number(data.humidity.toFixed(2)) + '%'
        : NOT_AVAILABLE_TEXT;
    case DisplayParameter.RSSI:
      return data.rssi !== null && data.rssi !== undefined
        ? Number(data.rssi.toFixed(2)) + 'dB'
        : NOT_AVAILABLE_TEXT;
    case DisplayParameter.Voltage:
      return data.voltage !== null && data.voltage !== undefined
        ? Number(data.voltage.toFixed(2)) + 'V'
        : NOT_AVAILABLE_TEXT;
  }
}

export function formatSensorValue(
  value: number | null | undefined,
  parameter: DataParameter
) {
  if (value === null || value === undefined) return NOT_AVAILABLE_TEXT;
  switch (parameter) {
    case DataParameter.Temperature:
      return Number(value.toFixed(2)) + '°C';
    case DataParameter.Humidity:
      return Number(value.toFixed(2)) + '%';
    case DataParameter.RSSI:
      return Number(value.toFixed(2)) + 'dB';
    case DataParameter.Voltage:
      return Number(value.toFixed(3)) + 'V';
  }
}

export function parseDisplayParamter(value: number) {
  const values = [
    DisplayParameter.Name,
    DisplayParameter.Temperature,
    DisplayParameter.Humidity,
    DisplayParameter.RSSI,
    DisplayParameter.Voltage,
  ];
  if (value > values.length - 1) return;
  return values[value];
}

export function displayParameterToKey(value: DisplayParameter) {
  if (value === DisplayParameter.Name)
    throw new Error('DisplayParameter.Name not supported');

  return DATA_PARAMETER_KEYS[value - 1];
}

export function dataParameterToKey(value: DataParameter) {
  return DATA_PARAMETER_KEYS[value];
}

export const getSensorValue = (sensor: SensorDataAll, dp: DisplayParameter) =>
  sensor[displayParameterToKey(dp)].value;

export function displayParameterToName(value: DisplayParameter) {
  const names = ['Název senzoru', 'Teplota', 'Vlhkost', 'RSSI', 'Napětí'];
  return names[value];
}

export const dataParameterToName = (dp: DataParameter) =>
  displayParameterToName(dp + 1);

export function removeGaps(data: FetchData): FetchData | undefined {
  if (!data) return;
  let values = [];
  let timestamps = [];

  for (let i = 0; i < data.timestamps.length; i++) {
    if (i === 0) {
      values.push(data.values[i]);
      timestamps.push(data.timestamps[i]);
      continue;
    }
    const prevTimestamp = data.timestamps[i - 1];
    const thisTimestamp = data.timestamps[i];

    if (thisTimestamp - prevTimestamp > OFFLINE_THRESHOLD) {
      values.push(null);
      timestamps.push(prevTimestamp + 1);
      // values.push(0, 0);
      // timestamps.push(prevTimestamp + 1, thisTimestamp - 1);
    }
    values.push(data.values[i]);
    timestamps.push(data.timestamps[i]);
  }
  return { values, timestamps };
}

export const convertToISOWithTimezone = (d: number) =>
  new Date(d - new Date(d).getTimezoneOffset() * 60000).toISOString();

// ref: https://gist.github.com/bendc/76c48ce53299e6078a76
export function randomColor() {
  const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  var h = randomInt(0, 360);
  var s = randomInt(42, 98);
  var l = randomInt(40, 50);

  return `hsl(${h},${s}%,${l}%)`;
}

/**
 * @param i Floating point value from 0 to 1
 */

export function getColorGradient(color1: string, color2: string, i: number) {
  if (i < 0 || i > 1) throw new Error('Invalid argument i');

  const parsed1 = color1.trim().replace('#', '');
  const parsed2 = color2.trim().replace('#', '');

  const [r1, g1, b1] = [
    parseInt(parsed1.slice(0, 2), 16),
    parseInt(parsed1.slice(2, 4), 16),
    parseInt(parsed1.slice(4), 16),
  ];
  const [r2, g2, b2] = [
    parseInt(parsed2.slice(0, 2), 16),
    parseInt(parsed2.slice(2, 4), 16),
    parseInt(parsed2.slice(4), 16),
  ];

  const newR = Math.round(r1 + i * (r2 - r1));
  const newG = Math.round(g1 + i * (g2 - g1));
  const newB = Math.round(b1 + i * (b2 - b1));

  return (
    '#' +
    ('00' + newR.toString(16)).slice(-2) +
    ('00' + newG.toString(16)).slice(-2) +
    ('00' + newB.toString(16)).slice(-2)
  );
}

export function getColorByParameter(dp: DataParameter) {
  switch (dp) {
    case DataParameter.Temperature:
      return '#f5254e';
    case DataParameter.Humidity:
      return '#004bd6';
    case DataParameter.RSSI:
      return '#39e363';
    case DataParameter.Voltage:
      return '#f2dc50';
  }
}

export const getHomeTimestamp = (): [number, number] => {
  const now = new Date().getTime();
  return [now - 24 * 60 * 60 * 1000, now];
};

export const avgVal = (arr: number[]) =>
  arr.reduce((acc, val) => acc + val, 0) / arr.length;
export const minVal = (arr: number[]) => Math.min(...arr);
export const maxVal = (arr: number[]) => Math.max(...arr);
