import { DisplayParameter, DisplayedSensor, SensorData } from '../types';
import { formatSensorData } from '../utils';

export interface DisplayedSensorSVGProps {
  sensor: DisplayedSensor;
  mapWidth: number;
  mapHeight: number;
  displayParameter: DisplayParameter;
  color: string;
  onClick?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

const DisplayedSensorSVG: React.FC<DisplayedSensorSVGProps> = ({
  sensor,
  mapWidth,
  mapHeight,
  displayParameter,
  color,
  onClick,
  onMouseDown,
}) => {
  const relativePosX = mapWidth * (sensor.pos_x / 100);
  const relativePosY = mapHeight * (sensor.pos_y / 100);

  const sensorDataObject: SensorData = {
    temperature: sensor.data?.temperature.value,
    humidity: sensor.data?.humidity.value,
    rssi: sensor.data?.rssi.value,
    voltage: sensor.data?.voltage.value,
  };

  let displayText =
    displayParameter === DisplayParameter.Name
      ? sensor.sensor.sensor_name
      : formatSensorData(sensorDataObject, displayParameter);

  return (
    <g onClick={onClick} onMouseDown={onMouseDown} className="cursor-pointer select-none">
      <circle
        cx={relativePosX}
        cy={relativePosY}
        r="20"
        fill={displayParameter === DisplayParameter.Name ? 'black' : color}
      />
      <text
        x={relativePosX}
        y={relativePosY}
        textAnchor="middle"
        fill="white"
        fontSize={11}
        strokeWidth="0.3px"
        stroke="black"
        fontWeight="bold"
        dy=".3em"
        style={{ background: 'black' }}
      >
        {displayText}
      </text>
    </g>
  );
};

export default DisplayedSensorSVG;
