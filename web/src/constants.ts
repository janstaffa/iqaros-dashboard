import { DataParameter } from './types';

export enum SensorStatus {
  Online,
  PoorSignal,
  BadSignal,
  Offline,
}

export const BAD_SIGNAL_THRESHOLD = -100;
export const OK_SIGNAL_THRESHOLD = -85;
export const GOOD_SIGNAL_THRESHOLD = -60;

export const CRITICAL_BATTERY_VOLTAGE = 2.5;

export const POOLING_INTERVAL = 10 * 1000;

export const ZOOM_FACTOR = 0.15;
export const DEFAULT_ZOOM = 1;
export const MAX_ZOOM = 10;
export const MIN_ZOOM = 0.1;

export const NOT_AVAILABLE_TEXT = 'N/A';

export const POOR_RESPONSE_THRESHOLD = 10 * 60 * 1000; // 10 minutes
export const OFFLINE_THRESHOLD = 60 * 60 * 1000; // 1 hour

// Relative color scheme
// [from, to] ([low, high])
export const TEMPERATURE_RELATIVE_COLORS = ['#0000ff', '#ff0000'];
export const HUMIDITY_RELATIVE_COLORS = ['#ff0000', '#0000ff'];
export const RSSI_RELATIVE_COLORS = ['#ff0000', '#00ff00'];
export const VOLTAGE_RELATIVE_COLORS = ['#ff0000', '#00ff00'];

// Absolute color scheme
export const TEMPERATURE_COLOR_TABLE: [number, string][] = [
  [0, '#0000ff'],
  [5, '#0373fc'],
  [10, '#5db5fc'],
  [15, '#ffcccc'],
  [20, '#e08f80'],
  [25, '#ff6666'],
  [999, '#fa0202'],
];

export const HUMIDITY_COLOR_TABLE: [number, string][] = [
  [20, '#fc9f9f'],
  [30, '#fcc5c5'],
  [50, '#bedcfa'],
  [70, '#6094fc'],
  [100, '#1966ff'],
];

export const RSSI_COLOR_TABLE: [number, string][] = [
  [BAD_SIGNAL_THRESHOLD, 'red'],
  [OK_SIGNAL_THRESHOLD, 'orange'],
  [GOOD_SIGNAL_THRESHOLD, 'green'],
  [999, 'lime'],
];
export const VOLTAGE_COLOR_TABLE: [number, string][] = [
  [CRITICAL_BATTERY_VOLTAGE, '#fa0202'],
  [999, '#62ff00'],
];

export const COLOR_SCHEME_TABLES = [
  TEMPERATURE_COLOR_TABLE,
  HUMIDITY_COLOR_TABLE,
  RSSI_COLOR_TABLE,
  VOLTAGE_COLOR_TABLE,
];

export const DATA_PARAMETER_KEYS: (
  | 'temperature'
  | 'humidity'
  | 'rssi'
  | 'voltage'
)[] = ['temperature', 'humidity', 'rssi', 'voltage'];

export const DATA_PARAMETER_VARIANTS = [
  DataParameter.Temperature,
  DataParameter.Humidity,
  DataParameter.RSSI,
  DataParameter.Voltage,
];
