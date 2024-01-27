import { FaEye } from 'react-icons/fa';
import { GrStatusGoodSmall } from 'react-icons/gr';
import { SensorStatus } from '../constants';
interface SensorCardProps {
  sensorStatus: SensorStatus;
  sensorId: number;
  networkId: number;
  sensorName: string;
  sensorTemperature: number;
  sensorHumidity: number;
  sensorLastRecord: Date;
  sensorSignal: number;
  openModal: () => void;
}
function SensorCard({
  sensorStatus,
  sensorId,
  networkId,
  sensorName,
  sensorTemperature,
  sensorHumidity,
  sensorLastRecord,
  sensorSignal,
  openModal,
}: SensorCardProps) {
  const statusDisplayColor =
    sensorStatus === SensorStatus.Online ? 'limegreen' : 'red';

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  sensorLastRecord = new Date();
  sensorLastRecord.setDate(2);
  const timeString = `${('00' + sensorLastRecord.getHours()).slice(-2)}:${(
    '00' + sensorLastRecord.getMinutes()
  ).slice(-2)}:${('00' + sensorLastRecord.getSeconds()).slice(-2)}`;
  const timeDisplay =
    sensorLastRecord > todayMidnight
      ? timeString
      : `${sensorLastRecord.getDate()}. ${
          sensorLastRecord.getMonth() + 1
        }. ${sensorLastRecord.getFullYear()}, ${timeString}`;

  return (
    <tr className="table_row">
      <td style={{ color: statusDisplayColor }}>
        <GrStatusGoodSmall
          title={sensorStatus === SensorStatus.Online ? 'online' : 'offline'}
        />
      </td>
      <td>{sensorId}</td>
      <td>{networkId}</td>
      <td>{sensorName}</td>
      <td>{sensorTemperature}°C</td>
      <td>{sensorHumidity}%</td>
      <td>{timeDisplay}</td>
      <td>{sensorSignal}dB</td>
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
