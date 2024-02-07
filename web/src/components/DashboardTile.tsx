import { useEffect, useRef } from 'react';
import { IoMdTrash } from 'react-icons/io';
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
import {
  dataParameterToKey,
  formatSensorValue,
  getColorGradient,
} from '../utils';

interface MeterProps {
  value: number;
}
const Thermometer: React.FC<MeterProps> = ({ value }) => {
  const valueDiv = useRef<HTMLDivElement>(null);

  const ADJUST_PERCENT = 29.5;
  useEffect(() => {
    if (!valueDiv.current) return;
    let normalizedValue = value;
    if (value < 0) normalizedValue = 0;
    if (value > 40) normalizedValue = 40;

    const part = Math.min(normalizedValue / 40, 1.0);

    const percent = part * (100 - ADJUST_PERCENT);
    const adjustedPercent = percent + ADJUST_PERCENT;
    valueDiv.current.style.height = `${adjustedPercent}%`;
    const color = getColorGradient('#0088ff', '#ff0000', part);
    // valueDiv.current.style.backgroundImage = `linear-gradient(${topColor}, blue)`;
    valueDiv.current.style.backgroundColor = color;
  }, [value]);

  return (
    <div className="meter_wrap">
      <svg
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        imageRendering="optimizeQuality"
        fillRule="evenodd"
        clipRule="evenodd"
        viewBox="0 0 131.24 260.79"
        version="1.1"
        width="50px"
        height="100px"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs id="defs1" />
        <path
          id="rect1"
          style={{ fill: 'white' }}
          d="M 0.01171875 0.005859375 L 0.01171875 260.78125 L 131.25 260.78125 L 131.25 0.005859375 L 0.01171875 0.005859375 z M 57.875 24.183594 C 62.42747 24.239844 66.980469 27.068077 66.980469 32.498047 L 66.980469 171.31055 C 80.710385 175.26049 90.759766 187.91004 90.759766 202.91992 C 90.759766 221.0798 76.039027 235.80078 57.869141 235.80078 C 39.709249 235.80078 24.980469 221.0798 24.980469 202.91992 C 24.980469 187.91004 35.029615 175.26049 48.769531 171.31055 L 48.769531 32.498047 C 48.769531 26.843083 53.32253 24.127344 57.875 24.183594 z M 101.16992 26.75 L 126.40039 26.75 C 129.07039 26.75 131.24023 28.909854 131.24023 31.589844 C 131.24023 34.259829 129.07039 36.429688 126.40039 36.429688 L 101.16992 36.429688 L 101.16992 26.75 z M 101.16992 53.179688 L 126.40039 53.179688 C 129.07039 53.179688 131.24023 55.349543 131.24023 58.019531 C 131.24023 60.689523 129.07039 62.859375 126.40039 62.859375 L 101.16992 62.859375 L 101.16992 53.179688 z M 101.16992 79.609375 L 126.40039 79.609375 C 129.07039 79.609375 131.24023 81.779225 131.24023 84.449219 C 131.24023 87.11921 129.07039 89.289062 126.40039 89.289062 L 101.16992 89.289062 L 101.16992 79.609375 z M 101.16992 106.03906 L 126.40039 106.03906 C 129.07039 106.03906 131.24023 108.21086 131.24023 110.88086 C 131.24023 113.55086 129.07039 115.7207 126.40039 115.7207 L 101.16992 115.7207 L 101.16992 106.03906 z M 101.16992 132.4707 L 126.40039 132.4707 C 129.07039 132.4707 131.24023 134.64055 131.24023 137.31055 C 131.24023 139.99054 129.07039 142.15039 126.40039 142.15039 L 101.16992 142.15039 L 101.16992 132.4707 z "
        />
        <path
          id="path34"
          d="M 58.349609 0 C 49.669618 0 41.790307 3.5497713 36.070312 9.2597656 C 30.360318 14.97976 26.810547 22.859071 26.810547 31.539062 L 26.810547 154.08008 C 10.690563 164.35007 0 182.38994 0 202.91992 C 4.7369468e-15 234.87989 25.909173 260.78906 57.869141 260.78906 C 89.829109 260.78906 115.74023 234.87989 115.74023 202.91992 C 115.74023 182.79994 105.48038 165.08093 89.900391 154.71094 L 89.900391 31.539062 C 89.900391 22.859071 86.350854 14.97976 80.630859 9.2597656 C 74.920865 3.5497713 67.029601 0 58.349609 0 z M 58.349609 10.679688 C 64.079604 10.679687 69.300082 13.030551 73.080078 16.810547 C 76.860074 20.600543 79.210938 25.809068 79.210938 31.539062 L 79.210938 99.949219 L 79.210938 163.60938 C 93.140924 171.18937 102.58984 185.94994 102.58984 202.91992 C 102.58984 227.6099 82.569116 247.63086 57.869141 247.63086 C 33.169165 247.63086 13.160156 227.6099 13.160156 202.91992 C 13.160156 185.55994 23.040249 170.5096 37.490234 163.09961 L 37.490234 31.539062 C 37.490234 25.809068 39.839144 20.600543 43.619141 16.810547 C 47.409137 13.030551 52.619615 10.679688 58.349609 10.679688 z "
        />
      </svg>
      <div ref={valueDiv} className="thermometer_value"></div>
      <div className="thermometer_detail_fill"></div>
    </div>
  );
};
const Hygrometer: React.FC<MeterProps> = ({ value }) => {
  const rotationDiv = useRef<HTMLDivElement>(null);
  const colorDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rotationDiv.current || !colorDiv.current) return;

    const degrees = ((value - 100) / 100) * 180;
    rotationDiv.current.style.transform = `rotate(${degrees}deg)`;
    const color = getColorGradient('#ff0000', '#0000ff', value / 100);
    // valueDiv.current.style.backgroundImage = `linear-gradient(${topColor}, blue)`;
    colorDiv.current.style.backgroundColor = color;
  }, [value]);

  return (
    <div className="meter_wrap">
      <svg
        width="100px"
        // height="100mm"
        viewBox="0 0 200 100"
        version="1.1"
        id="svg1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs id="defs1" />
        {/* <path
          id="rect1"
          style={{ fill: '#ffffff' }}
          d="M 0 0 L 0 100.0001 A 100 100 0 0 1 100.0001 0 L 0 0 z M 100.0001 0 A 100 100 0 0 1 200.0002 100.0001 L 200.0002 0 L 100.0001 0 z M 100.0001 40.000142 A 60 60 0 0 0 40.000142 100.0001 L 160.00005 100.0001 A 60 60 0 0 0 100.0001 40.000142 z "
        /> */}
        <path
          id="rect1"
          style={{ fill: '#ffffff' }}
          d="M 0 0 L 0 100.0001 L 9.9999064 100.0001 A 90 90 0 0 1 10.357507 94.998853 L 40.437842 94.998853 A 60 60 0 0 0 40.000142 100.0001 L 160.00005 100.0001 A 60 60 0 0 0 159.56287 95.001436 L 189.84836 95.001436 A 90 90 0 0 1 189.99977 100.0001 L 200.0002 100.0001 L 200.0002 0 L 0 0 z M 100.0001 9.9999064 A 90 90 0 0 1 189.421 90.001225 L 159.12517 90.001225 A 60 60 0 0 0 100.0001 40.000142 A 60 60 0 0 0 40.875024 89.999158 L 10.715108 89.999158 A 90 90 0 0 1 100.0001 9.9999064 z "
        />
        <g id="layer1">
          <path
            id="path1"
            style={{ fill: '#000000' }}
            d="M 100.0001 0 A 100 100 0 0 0 0 100.0001 A 100 100 0 0 0 0.001550293 100.02232 L 5.0017619 100.02232 A 95 95 0 0 1 5.0002116 100.0001 A 95 95 0 0 1 100.0001 5.0002116 A 95 95 0 0 1 194.99998 100.0001 A 95 95 0 0 1 194.99843 100.02232 L 199.99968 100.02232 A 100 100 0 0 0 200.0002 100.0001 A 100 100 0 0 0 100.0001 0 z "
          />
          <path
            id="circle4"
            style={{ fill: '#000000' }}
            d="M 100.0001 44.999837 A 55 55 0 0 0 44.999837 100.0001 A 55 55 0 0 0 45.001388 100.02232 L 50.001599 100.02232 A 50 50 0 0 1 50.000049 100.0001 A 50 50 0 0 1 100.0001 50.000049 A 50 50 0 0 1 150.00015 100.0001 A 50 50 0 0 1 149.99963 100.02232 L 154.99829 100.02232 A 55 55 0 0 0 154.99984 100.0001 A 55 55 0 0 0 100.0001 44.999837 z "
          />
          <rect
            style={{ fill: '#000000' }}
            id="rect6"
            width="50"
            height="5"
            x="0.012867588"
            y="95"
          />
          <rect
            style={{ fill: '#000000' }}
            id="rect9"
            width="50"
            height="5"
            x="150"
            y="95"
          />
        </g>
        {/* <path
          id="rect12"
          style={{ fill: '#ffffff' }}
          d="M 0.011885579 0 C 0.0054076408 -7.8332324e-17 0 0.46654617 0 1.045931 L 0 98.954167 C 0 99.533551 0.0054076408 100.0001 0.011885579 100.0001 L 19.999813 100.0001 A 80 80 0 0 1 100.0001 19.999813 A 80 80 0 0 1 179.99987 100.0001 L 199.98831 100.0001 C 199.99479 100.0001 200.0002 99.533551 200.0002 98.954167 L 200.0002 1.045931 C 200.0002 0.46654617 199.99479 0 199.98831 0 L 0.011885579 0 z "
        />
        <path
          id="path1"
          style={{ fill: '#000000' }}
          d="M 100.0001 0 A 100 100 0 0 0 0 100.0001 L 9.9999064 100.0001 A 90 90 0 0 1 100.0001 9.9999064 A 90 90 0 0 1 189.99977 100.0001 L 200.0002 100.0001 A 100 100 0 0 0 100.0001 0 z "
        />
        <path
          id="circle2"
          style={{ fill: '#ffffff' }}
          d="M 100.0001 9.9999064 A 90 90 0 0 0 9.9999064 100.0001 L 19.999813 100.0001 A 80 80 0 0 1 100.0001 19.999813 A 80 80 0 0 1 179.99987 100.0001 L 189.99977 100.0001 A 90 90 0 0 0 100.0001 9.9999064 z "
        />
        <path
          id="circle4"
          style={{ fill: '#ffffff' }}
          d="M 100.0001 50.000049 A 50 50 0 0 0 50.000049 100.0001 L 150.00015 100.0001 A 50 50 0 0 0 100.0001 50.000049 z "
        />
        <path
          id="circle5"
          style={{ fill: '#000000' }}
          d="M 100.0001 59.999955 A 40 40 0 0 0 59.999955 100.0001 L 140.00024 100.0001 A 40 40 0 0 0 100.0001 59.999955 z "
        />
        <path
          id="circle6"
          style={{ fill: '#ffffff' }}
          d="M 100.0001 69.999862 A 30 30 0 0 0 69.999862 100.0001 L 129.99982 100.0001 A 30 30 0 0 0 100.0001 69.999862 z "
        />
        <rect
          style={{ fill: '#000000' }}
          id="rect7"
          width="61.984249"
          height="7.5660939"
          x="0"
          y="92.433907"
          ry="0.011693042"
          rx="0.011693042"
        />
        <rect
          style={{ fill: '#000000' }}
          id="rect8"
          width="61.984249"
          height="7.5660939"
          x="137.48659"
          y="92.433907"
          ry="0.011693042"
          rx="0.011693042"
        />
        <rect
          style={{ fill: '#ffffff' }}
          id="rect9"
          width="44.662636"
          height="7.5660939"
          x="14.693517"
          y="84.86689"
          ry="0.011693042"
          rx="0.011693042"
        />
        <rect
          style={{ fill: '#ffffff' }}
          id="rect10"
          width="44.662636"
          height="7.5660939"
          x="142.75168"
          y="84.86689"
          ry="0.011693042"
          rx="0.011693042"
        /> */}
      </svg>
      <div ref={rotationDiv} className="hygrometer_value">
        <div className="hygro1" ref={colorDiv}></div>
        <div className="hygro2"></div>
      </div>
      <div className="hygrometer_detail_fill"></div>
    </div>
  );
};

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

  let value = 0;
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
    <div className="tile">
      <div className="tile_name">
        <span>{tile.title}</span>
        {isEditing && <IoMdTrash onClick={remove} />}
      </div>
      <div className="tile_data">
        {tile.show_graphic &&
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
