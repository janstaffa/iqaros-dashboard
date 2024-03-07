const isProduction = process.env.NODE_ENV === 'production';

// Postgres
export const POSTGRES = {
  HOST: isProduction ? process.env.POSTGRES_HOST : 'localhost',
  USER: isProduction ? process.env.POSTGRES_DB : 'postgres',
  PASSWORD: isProduction ? process.env.POSTGRES_PASSWORD : 'postgres',
  DATABASE: isProduction ? process.env.POSTGRES_DATABASE : 'IQAROS',
  PORT: 5432,
};

// Redis
export const REDIS = {
  URL: isProduction ? process.env.REDIS_URL : 'redis://localhost',
  PASSWORD: isProduction ? process.env.REDIS_PASSWORD : undefined,
};

// MQTT
export const MQTT = {
  ADDRESS: isProduction ? process.env.MOSQUITTO_URL : 'mqtt://localhost',
  USERNAME: isProduction ? process.env.MOSQUITTO_USERNAME : 'admin',
  PASSWORD: isProduction ? process.env.MOSQUITTO_PASSWORD : 'admin',
};

export const SERVER_PORT = isProduction ? 8080 : 4000;
