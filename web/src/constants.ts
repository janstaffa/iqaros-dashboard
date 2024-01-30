export const API_BASE_PATH = 'http://localhost:4000/api';
export const APP_API_BASE_PATH = 'http://localhost:4000/app';

export const WS_URL = 'ws://localhost:4040';

export enum SensorStatus {
  Online,
  PoorSignal,
  BadSignal,
  Offline,
}

export const POOLING_INTERVAL = 10 * 1000;

export const ZOOM_FACTOR = 0.15;
export const DEFAULT_ZOOM = 1;
export const MAX_ZOOM = 10;
export const MIN_ZOOM = 0.1;

export const NOT_AVAILABLE_TEXT = 'N/A';

export const POOR_RESPONSE_THRESHOLD = 10 * 60 * 1000; // 10 minutes
export const OFFLINE_THRESHOLD = 60 * 60 * 1000; // 1 hour
