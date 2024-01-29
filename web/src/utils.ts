import { DisplayParameter, SensorData } from "./types";

const NOT_AVAILABLE_TEXT = 'N/A';
export function formatSensorValue(
  data: SensorData | undefined,
  parameter: DisplayParameter
) {
  if (data === undefined) return NOT_AVAILABLE_TEXT;
  switch (parameter) {
    case DisplayParameter.Temperature:
      return data.temperature ? data.temperature + '°C' : NOT_AVAILABLE_TEXT;
    case DisplayParameter.Humidity:
      return data.humidity ? data.humidity + '%' : NOT_AVAILABLE_TEXT;
    case DisplayParameter.RSSI:
      return data.rssi ? data.rssi + 'dB' : NOT_AVAILABLE_TEXT;
    case DisplayParameter.Voltage:
      return data.voltage ? data.voltage + 'V' : NOT_AVAILABLE_TEXT;
  }
}


export function parseDisplayParamter(value: number) {
	const values = [DisplayParameter.Name, DisplayParameter.Temperature, DisplayParameter.Humidity, DisplayParameter.RSSI, DisplayParameter.Voltage];
	if(value > values.length - 1) return; 
	return values[value];
}