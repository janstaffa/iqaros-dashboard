import { SENSOR_ADDRESS_RANGE_OFFSET } from './constants';
import { MQTTSensorData, SensorData, SensorDataParameter } from './types';

function getParameter(parameterStr: string): SensorDataParameter | null {
  switch (parameterStr) {
    case 'TEMPERATURE':
      return SensorDataParameter.Temperature;
    case 'RELATIVE_HUMIDITY':
      return SensorDataParameter.Humidity;
    case 'RSSI':
      return SensorDataParameter.RSSI;
    case 'VOLTAGE':
      return SensorDataParameter.Voltage;
    case 'EXTRA_LOW_VOLTAGE':
      return SensorDataParameter.ExtraLowVoltage;
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
      timestamp: new Date().getTime(),
    },
    parameter,
  };

  return sensorData;
}
