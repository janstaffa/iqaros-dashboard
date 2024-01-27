interface GenericSensorApiResponse {
  server_time: string;
}
interface GenericAppApiResponse {
  status: string;
  message?: string;
  data?: any;
}

interface SensorListApiResponse extends GenericAppApiResponse {
  data: Sensor[];
}

interface BaseSensor {
  sensor_id: number;
  network_id: number;
  sensor_name: string;
}
interface Sensor extends BaseSensor {
  groups: SensorGroup[];
}

interface GroupListApiResponse extends GenericAppApiResponse {
  data: SensorGroup[];
}
interface SensorGroup {
  group_id: number;
  group_name: string;
  group_color: string;
  sensors: BaseSensor[];
}
