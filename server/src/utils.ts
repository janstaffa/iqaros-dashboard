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
  }
  return null;
}

export function parseSensor(MQTTsensorData: MQTTSensorData): SensorData {
  const sensor = MQTTsensorData.sensor;
  const parameter = getParameter(sensor.id);
  if (parameter == null) throw 'Unknown input';
  const sensorData: SensorData = {
    timestamp: new Date().getTime(),
    sensorId: MQTTsensorData.nAdr - SENSOR_ADDRESS_RANGE_OFFSET,
    networkId: MQTTsensorData.nAdr,
    value: MQTTsensorData.sensor.value,
    parameter,
  };

  return sensorData;
}
