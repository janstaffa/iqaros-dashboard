import { useEffect, useRef, useState } from 'react';
import { MdZoomIn, MdZoomOut } from 'react-icons/md';
import {
  APP_API_BASE_PATH,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_FACTOR,
} from '../constants';
import { DisplayParameter, DisplayedSensor, SensorMap } from '../types';
import DisplayedSensorSVG from './DisplayedSensorSVG';

export interface InteractiveMapProps {
  map: SensorMap;
  displayedSensors?: DisplayedSensor[];
  displayParameter: DisplayParameter;
  moveSensor?: (sensorId: number, newX: number, newY: number) => void;
  handleSensorClick?: (sensorId: number) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  map,
  displayedSensors = [],
  displayParameter,
  moveSensor,
  handleSensorClick,
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
    const containerWidth = mapRef.current!.clientWidth;
    setMapZoom(computeZoomFactor(map.image_width, containerWidth));
  }, [map]);

  return (
    <div className="interactive_map_wrap">
      <div className="interactive_map_controls">
        <button
          onClick={() => {
            setMapZoom(Math.min(mapZoom + ZOOM_FACTOR, MAX_ZOOM));
          }}
        >
          <MdZoomIn />
        </button>
        <button
          onClick={() => setMapZoom(Math.max(mapZoom - ZOOM_FACTOR, MIN_ZOOM))}
        >
          <MdZoomOut />
        </button>
      </div>
      <div
        className="interactive_map"
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
        >
          {displayedSensors.map((s, idx) => (
            <DisplayedSensorSVG
              onMouseDown={() => {
                if (isEditable) setDraggedSensor(s);
              }}
              onClick={() =>
                handleSensorClick && handleSensorClick(s.sensor.sensor_id)
              }
              data={s}
              mapWidth={map.image_width * mapZoom}
              mapHeight={map.image_height * mapZoom}
              displayParameter={displayParameter}
              key={idx}
            />
          ))}
        </svg>
        <img
          src={APP_API_BASE_PATH + '/mapimage/' + map.map_id}
          alt=""
          width={map.image_width * mapZoom}
          height={map.image_height * mapZoom}
        />
      </div>
    </div>
  );
};

export default InteractiveMap;
