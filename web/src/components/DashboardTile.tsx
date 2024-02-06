import { IoMdTrash } from 'react-icons/io';
import { NOT_AVAILABLE_TEXT } from '../constants';
import {
  FetchDataDataWrapped,
  SensorGroup,
  Tile,
  TileArgumentType,
  TileArgumentValue,
  TileOperation,
} from '../types';
import { dataParameterToKey, formatSensorValue } from '../utils';

export interface TileProps {
  tile: Tile;
  sensorData: FetchDataDataWrapped;
  groupList: SensorGroup[];
  isEditing: boolean;
  remove: () => void;
}

const DashboardTile: React.FC<TileProps> = ({
  tile,
  sensorData,
  groupList,
  isEditing,
  remove,
}) => {
  let d1 = null;
  let d2 = null;
  const parameterKey = dataParameterToKey(tile.parameter);
  // Sensor
  if (tile.arg1_type === TileArgumentType.Sensor) {
    d1 = sensorData[tile.arg1][parameterKey].values[0];
  }
  //Group
  else {
    const group = groupList.find((g) => g.group_id === tile.arg1);
    if (group !== undefined && tile.arg1_value !== TileArgumentValue.Value) {
      const values = group.sensors
        .map((s) => sensorData[s.sensor_id][parameterKey].values[0])
        .filter((x) => x !== null) as number[];
      let v = null;
      switch (tile.arg1_value) {
        case TileArgumentValue.Average:
          const sum = values.reduce((acc, x) => acc + x, 0);
          v = sum / values.length;
          break;
        case TileArgumentValue.Min:
          v = Math.min(...values);
          break;
        case TileArgumentValue.Max:
          v = Math.max(...values);
          break;
      }
      d1 = v;
    }
  }

  if (
    tile.arg2 !== null &&
    tile.arg2_type !== null &&
    tile.arg1_value !== null
  ) {
    // Sensor
    if (tile.arg2_type === TileArgumentType.Sensor) {
      d2 = sensorData[tile.arg2][parameterKey].values[0];
    }
    // Group
    else {
      const group = groupList.find((g) => g.group_id === tile.arg2);
      if (group !== undefined && tile.arg2_value !== TileArgumentValue.Value) {
        const values = group.sensors
          .map((s) => sensorData[s.sensor_id][parameterKey].values[0])
          .filter((x) => x !== null) as number[];
        let v = null;
        switch (tile.arg2_value) {
          case TileArgumentValue.Average:
            const sum = values.reduce((acc, x) => acc + x, 0);
            v = sum / values.length;
            break;
          case TileArgumentValue.Min:
            v = Math.min(...values);
            break;
          case TileArgumentValue.Max:
            v = Math.max(...values);
            break;
        }
        d2 = v;
      }
    }
  }

  let display = NOT_AVAILABLE_TEXT;
  if (d1 !== null && !Number.isNaN(d1)) {
    if (tile.operation === TileOperation.Display) {
      display = formatSensorValue(d1, tile.parameter);
    } else if (
      tile.operation === TileOperation.Difference &&
      d2 !== null &&
      !Number.isNaN(d2)
    ) {
      const v = d1 - d2;
      display = formatSensorValue(v, tile.parameter);
    }
  }

  return (
    <div className="tile">
      <div className="tile_name">
        <span>{tile.title}</span>
        {isEditing && <IoMdTrash onClick={remove} />}
      </div>

      <div className="tile_data">
        <span>{display}</span>
      </div>
    </div>
  );
};

export default DashboardTile;
