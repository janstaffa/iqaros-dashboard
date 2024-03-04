const SERVER_HOST = window.location.host; // process.env.NODE_ENV === 'production' ? 'SERVER_HOST' : 'localhost';

const SERVER_PORT = process.env.NODE_ENV === 'production' ? 80 : 4000; // 8080

export const API_BASE_PATH = `http://${SERVER_HOST}:${SERVER_PORT}/api`;
export const APP_API_BASE_PATH = `http://${SERVER_HOST}:${SERVER_PORT}/app`;
