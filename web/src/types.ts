export interface GenericSensorApiResponse {
  server_time: string;
}
export interface GenericApiResponse {
  status: string;
  message?: string;
  data?: any;
}

export interface SensorListApiResponse extends GenericApiResponse {
  data: Sensor[];
}

export interface BaseSensor {
  sensor_id: number;
  network_id: number;
  sensor_name: string;
}
export interface Sensor extends BaseSensor {
  data: SensorDataAll;
  groups: SensorGroup[];
  last_response: number;
}

export interface GroupListApiResponse extends GenericApiResponse {
  data: SensorGroup[];
}

export interface MapListApiResponse extends GenericApiResponse {
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

export interface SensorDataAll {
  temperature: SensorDataPayload;
  humidity: SensorDataPayload;
  rssi: SensorDataPayload;
  voltage: SensorDataPayload;
}

export interface SensorDataPayload {
  value: number;
  timestamp: number;
}

export interface SortHead {
  columnName: string;
  sortPath: string;
}
export interface SortOptions {
  sortPath: string;
  sort: Sort;
}

export enum Sort {
  Ascending,
  Descending,
  None,
}

export interface FetchDataApiResponse extends GenericApiResponse {
  data: FetchDataData;
}
export interface FetchDataData {
  temperature: FetchData;
  humidity: FetchData;
  rssi: FetchData;
  voltage: FetchData;
}
interface FetchData {
  values: number[];
  timestamps: number[];
}
