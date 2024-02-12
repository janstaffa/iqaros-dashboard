import { useEffect, useRef, useState } from 'react';
import { MdZoomIn, MdZoomOut } from 'react-icons/md';
import { Bars } from 'react-loader-spinner';
import {
  APP_API_BASE_PATH,
  COLOR_SCHEME_TABLES,
  DEFAULT_ZOOM,
  HUMIDITY_RELATIVE_COLORS,
  MAX_ZOOM,
  MIN_ZOOM,
  RSSI_RELATIVE_COLORS,
  TEMPERATURE_RELATIVE_COLORS,
  VOLTAGE_RELATIVE_COLORS,
  ZOOM_FACTOR,
} from '../constants';
import {
  DisplayParameter,
  DisplayedSensor,
  MapColorScheme,
  SensorMap,
} from '../types';
import {
  displayParameterToKey,
  getColorGradient,
  getSensorValue,
} from '../utils';
import DisplayedSensorSVG from './DisplayedSensorSVG';

export interface InteractiveMapProps {
  map: SensorMap | null;
  displayedSensors?: DisplayedSensor[];
  displayParameter: DisplayParameter;
  colorScheme?: MapColorScheme;
  moveSensor?: (sensorId: number, newX: number, newY: number) => void;
  handleSensorClick?: (sensorId: number) => void;
  isLoading?: boolean;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  map,
  displayedSensors = [],
  displayParameter,
  colorScheme,
  moveSensor,
  handleSensorClick,
  isLoading = false,
}) => {
  const isEditable = moveSensor !== undefined;
  const mapRef = useRef<HTMLDivElement | null>(null);

  const [mouseDown, setMouseDown] = useState(false);
  const [startX, setStartX] = useState<number>(0);
  const [startY, setStartY] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [scrollTop, setScrollTop] = useState<number>(0);

  const [draggedSensor, setDraggedSensor] = useState<DisplayedSensor | null>(
    null
  );

  function computeZoomFactor(img_width: number, container_width: number) {
    const scale = container_width / img_width;
    if (scale < MIN_ZOOM) return MIN_ZOOM;
    if (scale > MAX_ZOOM) return MAX_ZOOM;
    return scale;
  }

  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    if (map === null) return;
    const containerWidth = mapRef.current!.clientWidth;
    setMapZoom(computeZoomFactor(map.image_width, containerWidth));
  }, [map]);

  type SensorColors = {
    [sensorId: number]: string;
  };

  const [sensorColors, setSensorColors] = useState<SensorColors>({});

  useEffect(() => {
    if (
      displayParameter === DisplayParameter.Name ||
      colorScheme === undefined
    ) {
      const colors: SensorColors = {};
      for (const s of displayedSensors) {
        colors[s.sensor.sensor_id] = 'black';
      }
      setSensorColors(colors);
      return;
    }

    const flatValues = displayedSensors
      .filter((s) => s.data !== undefined)
      .map((s) => getSensorValue(s.data!, displayParameter));

    const minVal = Math.min(...flatValues);
    const maxVal = Math.max(...flatValues);

    const colorGradient: SensorColors = {};

    const colors =
      displayParameter === DisplayParameter.Temperature
        ? TEMPERATURE_RELATIVE_COLORS
        : displayParameter === DisplayParameter.Humidity
        ? HUMIDITY_RELATIVE_COLORS
        : displayParameter === DisplayParameter.RSSI
        ? RSSI_RELATIVE_COLORS
        : VOLTAGE_RELATIVE_COLORS;

    for (const s of displayedSensors) {
      if (!s.data) continue;
      const val = s.data[displayParameterToKey(displayParameter)].value;
      if (colorScheme === MapColorScheme.Relative) {
        const i = (val - minVal) / (maxVal - minVal);

        colorGradient[s.sensor.sensor_id] = getColorGradient(
          colors[0],
          colors[1],
          i
        );
        continue;
      }

      let selectedColor = 'black';
      for (const [value, color] of COLOR_SCHEME_TABLES[displayParameter - 1]) {
        if (val < value) {
          selectedColor = color;
          break;
        }
      }
      colorGradient[s.sensor.sensor_id] = selectedColor;
    }
    setSensorColors(colorGradient);
  }, [displayedSensors, displayParameter, colorScheme]);

  if (isLoading)
    return (
      <div className="h-full relative flex flex-col p-2 bg-white border border-gray-300">
        <Bars
          height="80"
          width="80"
          color="#11547a"
          ariaLabel="Loading..."
          wrapperStyle={{}}
          wrapperClass="loader"
          visible={true}
        />
      </div>
    );
  if (!map) return null;
  return (
    <div className="h-full relative flex flex-col p-2 bg-white border border-gray-300">
      <div className="absolute top-3 right-3 z-20 flex flex-row gap-1">
        <button
          onClick={() => {
            setMapZoom(Math.min(mapZoom + ZOOM_FACTOR, MAX_ZOOM));
          }}
        >
          <MdZoomIn size={30} />
        </button>
        <button
          onClick={() => setMapZoom(Math.max(mapZoom - ZOOM_FACTOR, MIN_ZOOM))}
        >
          <MdZoomOut size={30} />
        </button>
      </div>
      <div
        className="w-full h-full overflow-auto cursor-grab relative z-10 flex-grow"
        ref={mapRef}
        onMouseMove={(e) => {
          const mapElement = mapRef.current;
          if (!mapElement) return;
          e.preventDefault();

          if (isEditable && draggedSensor) {
            const rect = mapElement.getBoundingClientRect();
            const newXPx = e.clientX - rect.left + mapElement.scrollLeft;
            const newYPx = e.clientY - rect.top + mapElement.scrollTop;

            const newX = (newXPx / (map.image_width * mapZoom)) * 100;
            const newY = (newYPx / (map.image_height * mapZoom)) * 100;

            moveSensor(draggedSensor.sensor.sensor_id, newX, newY);
            return;
          }

          if (mouseDown) {
            const x = e.pageX - mapElement.offsetLeft;
            const y = e.pageY - mapElement.offsetTop;

            const scrollHor = x - startX;
            const scrollVer = y - startY;
            mapElement.scrollLeft = scrollLeft - scrollHor;
            mapElement.scrollTop = scrollTop - scrollVer;
          }
        }}
        onMouseDown={(e) => {
          const mapElement = mapRef.current;
          if (!mapElement) return;
          setMouseDown(true);
          setStartX(e.pageX - mapElement.offsetLeft);
          setStartY(e.pageY - mapElement.offsetTop);
          setScrollLeft(mapElement.scrollLeft);
          setScrollTop(mapElement.scrollTop);
          mapElement.style.cursor = 'grabbing';
        }}
        onMouseUp={(e) => {
          if (!mapRef.current) return;
          setMouseDown(false);
          mapRef.current.style.cursor = 'grab';
          if (isEditable && draggedSensor) setDraggedSensor(null);
        }}
        onMouseLeave={(e) => {
          if (!mapRef.current) return;
          setMouseDown(false);
          mapRef.current.style.cursor = 'grab';
          if (isEditable && draggedSensor) setDraggedSensor(null);
        }}
      >
        <svg
          width={map.image_width * mapZoom}
          height={map.image_height * mapZoom}
          style={{zIndex: 9}}
          className='absolute top-0 left-0'
        >
          {displayedSensors.map((s, idx) => (
            <DisplayedSensorSVG
              onMouseDown={() => {
                if (isEditable) setDraggedSensor(s);
              }}
              onClick={() =>
                handleSensorClick && handleSensorClick(s.sensor.sensor_id)
              }
              sensor={s}
              color={sensorColors[s.sensor.sensor_id]}
              mapWidth={map.image_width * mapZoom}
              mapHeight={map.image_height * mapZoom}
              displayParameter={displayParameter}
              key={idx}
            />
          ))}
        </svg>
        <img
          src={APP_API_BASE_PATH + '/mapimage/' + map.map_id}
          alt="Map"
          width={map.image_width * mapZoom}
          height={map.image_height * mapZoom}
          className='absolute top-0 left-0 select-none pointer-events-none'
        />
      </div>
    </div>
  );
};

export default InteractiveMap;
