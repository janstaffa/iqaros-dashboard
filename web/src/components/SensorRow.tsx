import { FaEye } from 'react-icons/fa';
import { GrStatusGoodSmall } from 'react-icons/gr';
import {
  NOT_AVAILABLE_TEXT,
  OFFLINE_THRESHOLD,
  POOR_RESPONSE_THRESHOLD,
  SensorStatus,
} from '../constants';
import { DisplayParameter, Sensor, SensorData } from '../types';
import { formatSensorValue } from '../utils';
interface SensorCardProps {
  sensor: Sensor;
  openModal: () => void;
}
function SensorCard({ sensor, openModal }: SensorCardProps) {
  const timeSinceLastResponse = new Date().getTime() - sensor.last_response;
  const sensorStatus =
    timeSinceLastResponse < POOR_RESPONSE_THRESHOLD
      ? SensorStatus.Online
      : timeSinceLastResponse < OFFLINE_THRESHOLD
      ? SensorStatus.PoorSignal
      : SensorStatus.Offline;

  const statusDisplayColor =
    sensorStatus === SensorStatus.Online
      ? 'limegreen'
      : sensorStatus === SensorStatus.PoorSignal
      ? 'orange'
      : 'red';

  const statusDisplayTitle =
    sensorStatus === SensorStatus.Online
      ? 'online'
      : sensorStatus === SensorStatus.PoorSignal
      ? 'špatný signál'
      : 'offline';

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const sensorLastRecordDate = new Date(sensor.last_response);
  const timeString = `${('00' + sensorLastRecordDate.getHours()).slice(-2)}:${(
    '00' + sensorLastRecordDate.getMinutes()
  ).slice(-2)}:${('00' + sensorLastRecordDate.getSeconds()).slice(-2)}`;

  const timeDisplay =
    sensorLastRecordDate > todayMidnight
      ? timeString
      : `${sensorLastRecordDate.getDate()}. ${
          sensorLastRecordDate.getMonth() + 1
        }. ${sensorLastRecordDate.getFullYear()}, ${timeString}`;

  const lastRecordDateText =
    sensor.last_response === 0 ? NOT_AVAILABLE_TEXT : timeDisplay;

  const sensorDataObject: SensorData = {
    temperature: sensor.data.temperature.value,
    humidity: sensor.data.humidity.value,
    rssi: sensor.data.rssi.value,
    voltage: sensor.data.voltage.value,
  };

  const signal = sensor.data.rssi.value;
  const signalColor =
    signal > -60
      ? 'lime'
      : signal > -85
      ? 'green'
      : signal > -100
      ? 'orange'
      : 'red';
  return (
    <tr className="table_row">
      <td style={{ color: statusDisplayColor }}>
        <GrStatusGoodSmall title={statusDisplayTitle} />
      </td>
      <td>{sensor.sensor_id}</td>
      {/* <td>{sensor.network_id}</td> */}
      <td>{sensor.sensor_name}</td>
      <td>
        {formatSensorValue(sensorDataObject, DisplayParameter.Temperature)}
      </td>
      <td>{formatSensorValue(sensorDataObject, DisplayParameter.Humidity)}</td>
      <td>{lastRecordDateText}</td>
      <td style={{ color: signalColor }}>
        {formatSensorValue(sensorDataObject, DisplayParameter.RSSI)}
      </td>
      <td className="table_row_options">
        <FaEye
          title="Zobrazit detaily"
          onClick={openModal}
          style={{ cursor: 'pointer', fontSize: 26 }}
        />
      </td>
    </tr>
  );
}

export default SensorCard;
