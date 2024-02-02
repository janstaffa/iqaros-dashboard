import { FaEye } from 'react-icons/fa';
import { GrStatusGoodSmall } from 'react-icons/gr';
import {
  BAD_SIGNAL_THRESHOLD,
  GOOD_SIGNAL_THRESHOLD,
  NOT_AVAILABLE_TEXT,
  OFFLINE_THRESHOLD,
  OK_SIGNAL_THRESHOLD,
  POOR_RESPONSE_THRESHOLD,
  SensorStatus,
} from '../constants';
import { DisplayParameter, Sensor, SensorData } from '../types';
import { formatSensorData } from '../utils';
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
    signal > GOOD_SIGNAL_THRESHOLD
      ? 'lime'
      : signal > OK_SIGNAL_THRESHOLD
      ? 'green'
      : signal > BAD_SIGNAL_THRESHOLD
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
        {formatSensorData(sensorDataObject, DisplayParameter.Temperature)}
      </td>
      <td>{formatSensorData(sensorDataObject, DisplayParameter.Humidity)}</td>
      <td>{lastRecordDateText}</td>
      <td style={{ color: signalColor }}>
        {formatSensorData(sensorDataObject, DisplayParameter.RSSI)}
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
