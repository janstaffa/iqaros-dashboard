const isProduction = process.env.NODE_ENV === 'production';

// Postgres
export const POSTGRES = {
  HOST: isProduction ? 'db' : 'localhost',
  USER: isProduction ? process.env.DB_USER : 'postgres',
  PASSWORD: isProduction ? process.env.DB_PASSWORD : "postgres",
  DATABASE: isProduction ? process.env.DB_DATABASE : 'IQAROS',
  PORT: 5432,
};

// Redis
export const REDIS = {
  URL: isProduction ? 'redis://redis' : 'redis://localhost',
  PASSWORD: isProduction ? process.env.REDIS_PASSWORD : undefined,
};

// MQTT
export const MQTT = {
  ADDRESS: isProduction ? 'mqtt://mosquitto' : 'mqtt://localhost',
};

export const SERVER_PORT = isProduction ? 8080 : 4000;
