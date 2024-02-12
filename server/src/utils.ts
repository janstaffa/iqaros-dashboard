import { DATA_PARAMETER_KEYS, SENSOR_ADDRESS_RANGE_OFFSET } from './constants';
import {
  FetchDataData,
  MQTTSensorData,
  SensorData,
  SensorDataAll,
  SensorDataParameter,
} from './types';

function getParameter(parameterStr: string): SensorDataParameter | null {
  switch (parameterStr) {
    case 'TEMPERATURE':
      return SensorDataParameter.Temperature;
    case 'RELATIVE_HUMIDITY':
      return SensorDataParameter.Humidity;
    case 'RSSI':
      return SensorDataParameter.RSSI;
    case 'EXTRA_LOW_VOLTAGE':
      return SensorDataParameter.Voltage;
  }
  return null;
}

export function parseSensor(MQTTsensorData: MQTTSensorData): SensorData {
  const sensor = MQTTsensorData.sensor;
  if (!sensor) throw 'No sensor';
  const parameter = getParameter(sensor.id);
  if (parameter == null) throw 'Unknown input: ' + sensor.id;
  const sensorData: SensorData = {
    sensorId: MQTTsensorData.nAdr - SENSOR_ADDRESS_RANGE_OFFSET,
    networkId: MQTTsensorData.nAdr,
    data: {
      value: MQTTsensorData.sensor.value,
      timestamp: null,
    },
    parameter,
  };

  return sensorData;
}

export function dataParameterToKey(value: SensorDataParameter) {
  return DATA_PARAMETER_KEYS[value];
}

export const DataAllToFetchData = (
  data: SensorDataAll | undefined
): FetchDataData => ({
  temperature: {
    values: data?.temperature.value ? [data.temperature.value] : [],
    timestamps: data?.temperature.timestamp ? [data.temperature.timestamp] : [],
  },
  humidity: {
    values: data?.humidity.value ? [data.humidity.value] : [],
    timestamps: data?.humidity.timestamp ? [data.humidity.timestamp] : [],
  },
  rssi: {
    values: data?.rssi.value ? [data.rssi.value] : [],
    timestamps: data?.rssi.timestamp ? [data.rssi.timestamp] : [],
  },
  voltage: {
    values: data?.voltage.value ? [data.voltage.value] : [],
    timestamps: data?.voltage.timestamp ? [data.voltage.timestamp] : [],
  },
});
