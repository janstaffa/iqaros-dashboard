import { DisplayParameter, DisplayedSensor } from '../types';
import { formatSensorValue } from '../utils';

export interface DisplayedSensorSVGProps {
  data: DisplayedSensor;
  mapWidth: number;
  mapHeight: number;
  displayParameter: DisplayParameter;
  onClick?: (e: React.MouseEvent) => void; 
  onMouseDown?: (e: React.MouseEvent) => void; 
}

const DisplayedSensorSVG: React.FC<DisplayedSensorSVGProps> = ({
  data,
  mapWidth,
  mapHeight,
  displayParameter,
  onClick,
  onMouseDown
}) => {
  const relativePosX = mapWidth * (data.pos_x / 100);
  const relativePosY = mapHeight * (data.pos_y / 100);

  let displayText =
    displayParameter === DisplayParameter.Name
      ? data.sensor.sensor_name
      : formatSensorValue(data.data, displayParameter);

  return (
    <g
      onClick={onClick}
	  onMouseDown={onMouseDown}
      className="displayed_sensor"
    >
      <circle cx={relativePosX} cy={relativePosY} r="15" fill={displayParameter === DisplayParameter.Name ? "blackd" : data.color}/>
      <text
        x={relativePosX}
        y={relativePosY}
        textAnchor="middle"
        stroke="white"
        fill="white"
        fontSize={10}
        strokeWidth="1px"
        dy=".3em"
      >
        {displayText}
      </text>
    </g>
  );
};

export default DisplayedSensorSVG;
