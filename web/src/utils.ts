import { NOT_AVAILABLE_TEXT } from './constants';
import { DisplayParameter, SensorData } from './types';

export function formatSensorValue(
  data: SensorData | undefined,
  parameter: DisplayParameter
) {
  if (data === undefined || data === null) return NOT_AVAILABLE_TEXT;
  switch (parameter) {
    case DisplayParameter.Temperature:
      return data.temperature !== null && data.temperature !== undefined
        ? data.temperature.toFixed(2) + '°C'
        : NOT_AVAILABLE_TEXT;
    case DisplayParameter.Humidity:
      return data.humidity !== null && data.humidity !== undefined
        ? data.humidity + '%'
        : NOT_AVAILABLE_TEXT;
    case DisplayParameter.RSSI:
      return data.rssi !== null && data.rssi !== undefined
        ? data.rssi + 'dB'
        : NOT_AVAILABLE_TEXT;
    case DisplayParameter.Voltage:
      return data.voltage !== null && data.voltage !== undefined
        ? data.voltage + 'V'
        : NOT_AVAILABLE_TEXT;
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
