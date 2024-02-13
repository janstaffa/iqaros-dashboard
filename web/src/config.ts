const SERVER_HOST =
  process.env.NODE_ENV === 'production' ? 'localhost' : 'localhost';

const SERVER_PORT = process.env.NODE_ENV === 'production' ? 8080 : 4000;

export const API_BASE_PATH = `http://${SERVER_HOST}:${SERVER_PORT}/api`;
export const APP_API_BASE_PATH = `http://${SERVER_HOST}:${SERVER_PORT}/app`;
