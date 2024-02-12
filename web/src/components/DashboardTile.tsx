import { IoMdTrash } from 'react-icons/io';
import { MdEdit } from 'react-icons/md';
import { NOT_AVAILABLE_TEXT } from '../constants';
import {
  DataParameter,
  FetchDataDataWrapped,
  SensorGroup,
  Tile,
  TileArgumentType,
  TileArgumentValue,
  TileOperation,
} from '../types';
import { dataParameterToKey, formatSensorValue } from '../utils';
import { Hygrometer, Thermometer } from './Graphics';

export interface TileProps {
  tile: Tile;
  sensorData: FetchDataDataWrapped;
  groupList: SensorGroup[];
  isEditing: boolean;
  handleRemove: () => void;
  handleEdit: () => void;
}

const DashboardTile: React.FC<TileProps> = ({
  tile,
  sensorData,
  groupList,
  isEditing,
  handleRemove,
  handleEdit,
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

  let value = null;
  let display = NOT_AVAILABLE_TEXT;
  if (d1 !== null && !Number.isNaN(d1)) {
    if (tile.operation === TileOperation.Display) {
      display = formatSensorValue(d1, tile.parameter);
      value = d1;
    } else if (
      tile.operation === TileOperation.Difference &&
      d2 !== null &&
      !Number.isNaN(d2)
    ) {
      const v = d1 - d2;
      display = formatSensorValue(v, tile.parameter);
      value = v;
    }
  }

  return (
    <div className="w-64 min-h-32 bg-white border border-gray-500 border-solid rounded flex flex-col select-none p-2 relative">
      <div className="flex-shrink text-center align-middle text-xl p-1">
        <span>{tile.title}</span>
        {isEditing && (
          <div className="flex flex-row absolute bottom-2 right-2 z-10 gap-1">
            <button onClick={handleRemove}>
              <IoMdTrash />
            </button>
            <button onClick={handleEdit}>
              <MdEdit />
            </button>
          </div>
        )}
      </div>
      <div
        className="flex-grow flex flex-row justify-evenly items-center gap-2 text-3xl py-3"
        style={{ opacity: isEditing ? 0.3 : 1 }}
      >
        {tile.show_graphic &&
          value !== null &&
          (tile.parameter === DataParameter.Temperature ? (
            <Thermometer value={value} />
          ) : tile.parameter === DataParameter.Humidity ? (
            <Hygrometer value={value} />
          ) : null)}
        <span>{display}</span>
      </div>
    </div>
  );
};

export default DashboardTile;
