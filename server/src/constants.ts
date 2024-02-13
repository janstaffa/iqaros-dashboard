export const COOKIE_NAME = "sid";
export const MQTT_REQUEST_TOPIC = 'data_push';
export const MQTT_RESPONSE_TOPIC = 'data_pull';

export const SENSOR_ADDRESS_RANGE_OFFSET = 48 - 1;

export const NEW_GROUP_NAME_TEMPLATE = 'Nová skupina';
export const RANDOM_GROUP_COLORS = [
  '#b82e5e',
  '#b8520f',
  '#e3ce14',
  '#33e314',
  '#4114e3',
  '#a919c2',
  '#14c1c4',
];

export const MAX_FILE_UPLOAD_SIZE = 1024 * 1024 * 50; // 50 megabytes
export const FILEUPLOAD_DIRECTORY_PATH = './userdata/upload';
export const MAP_DIRECTORY_PATH = FILEUPLOAD_DIRECTORY_PATH + '/maps';

export const REDIS_LATEST_DATA_KEY = 'latest-data';
export const getFullRedisLatestDataKey = (
  sensorId: number,
  parameterKey: string
) => `${REDIS_LATEST_DATA_KEY}:${sensorId}:${parameterKey}`;

export const DATA_PARAMETER_KEYS: (
  | 'temperature'
  | 'humidity'
  | 'rssi'
  | 'voltage'
)[] = ['temperature', 'humidity', 'rssi', 'voltage'];
