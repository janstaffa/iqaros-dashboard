export interface GenericSensorApiResponse {
  server_time: string;
}
export interface GenericAppApiResponse {
  status: string;
  message?: string;
  data?: any;
}

export interface SensorListApiResponse extends GenericAppApiResponse {
  data: Sensor[];
}

export interface BaseSensor {
  sensor_id: number;
  network_id: number;
  sensor_name: string;
}
export interface Sensor extends BaseSensor {
  groups: SensorGroup[];
}

export interface GroupListApiResponse extends GenericAppApiResponse {
  data: SensorGroup[];
}

export interface MapListApiResponse extends GenericAppApiResponse {
  data: SensorMap[];
}

export interface SensorGroup {
  group_id: number;
  group_name: string;
  group_color: string;
  sensors: BaseSensor[];
}

export interface SensorMap {
  map_id: number;
  map_name: string;
  image_id: string;
  image_width: number;
  image_height: number;
  original_image_name: string;
  image_extension: string;
  sensors: DisplayedSensor[];
}

export interface DisplayedSensor {
  sensor: BaseSensor;
  pos_x: number;
  pos_y: number;
  data?: SensorData;
  color?: string;
}

export interface SensorData {
  temperature?: number;
  humidity?: number;
  rssi?: number;
  voltage?: number;
}

export enum DisplayParameter {
  Name,
  Temperature,
  Humidity,
  RSSI,
  Voltage,
}
