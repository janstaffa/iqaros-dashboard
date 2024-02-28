import mqtt from 'mqtt';
import {
  COOKIE_NAME,
  MAX_FILE_UPLOAD_SIZE,
  MQTT_RESPONSE_TOPIC,
  getFullRedisLatestDataKey,
} from './constants';

import express from 'express';

import bodyParser from 'body-parser';
import cors from 'cors';

import RedisStore from 'connect-redis';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import session from 'express-session';
import fs from 'fs';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { MQTT, POSTGRES, REDIS, SERVER_PORT } from './config';
import { appApiController } from './rest/appApiController';
import { authController } from './rest/authController';
import { sensorApiController } from './rest/sensorApiController';
import { IQAROS_Response } from './types';
import { dataParameterToKey, parseSensor } from './utils';

dotenv.config();

export const redisClient = createClient({
  url: REDIS.URL,
  password: REDIS.PASSWORD,
});

(async () => {
  // Connect to PostgresDB
  const dbClient = new Pool({
    host: POSTGRES.HOST,
    port: POSTGRES.PORT,
    user: POSTGRES.USER,
    password: POSTGRES.PASSWORD,
    database: POSTGRES.DATABASE,
  });
  dbClient.on('error', (err) => console.log('Postgres Client Error', err));
  await dbClient.connect();
  console.log('Connected to PostgresDB');

  try {
    const query = fs.readFileSync('./sql/init_db.sql', 'utf-8');
    await dbClient.query(query);
  } catch (e) {
    console.error('ERROR when creating tables: ', e);
  }

  // Connect to Redis
  redisClient.on('error', (err) => console.log('Redis Client Error', err));

  await redisClient.connect();
  console.log('Connected to Redis');

  // Connect to MQTT Client
  const mqttClient = mqtt.connect(MQTT.ADDRESS, {
    clientId: 'IQAROSDASH-Client',
    username: MQTT.USERNAME,
    password: MQTT.PASSWORD,
    clean: true,
    reconnectPeriod: 1000,
    keepalive: 1000,
  });

  mqttClient.on('connect', (e) => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe(MQTT_RESPONSE_TOPIC);

    // setInterval(() => {
    //   client.publish(
    //     MQTT_REQUEST_TOPIC,
    //     `{
    //       "mType": "iqrfSensor_Frc",
    //       "data": {
    //         "msgId": "testEmbedSensor",
    //         "req": {
    //           "nAdr": 48,
    //           "param": {
    //             "sensorType": 1,
    //             "sensorIndex": 0,
    //             "frcCommand": 144,
    //             "getExtraResult": true,
    //             "selectedNodes": [
    //               1
    //             ]
    //           }
    //         },
    //         "returnVerbose": true
    //       }
    //     }`
    //   );
    // }, 5000);

    mqttClient.on('message', async (topic, message) => {
      const messageTimestamp = new Date();

      const parsed_message = JSON.parse(message.toString()) as IQAROS_Response;

      const sensors = parsed_message.data.rsp.result.sensors;

      console.log(
        new Date(
          messageTimestamp.getTime() -
            messageTimestamp.getTimezoneOffset() * 60000
        ).toISOString() + '>',
        parsed_message.data.msgId
      );
      // if (parsed_message.mType == 'iqrfEmbedFrc_SendSelective')
      //   console.log(JSON.stringify(parsed_message));
      if (!sensors) return;

      for (const sensor of sensors) {
        if (!sensor || sensor.nAdr === undefined || !sensor.sensor) continue;
        try {
          const parsedSensor = parseSensor(sensor);

          const res = await dbClient.query(
            'SELECT sensor_id FROM sensors WHERE sensor_id = $1',
            [parsedSensor.sensorId]
          );
          if (res.rowCount === 0) {
            await dbClient.query(
              'INSERT INTO sensors (sensor_id, network_id, sensor_name) VALUES ($1, $2, $3)',
              [
                parsedSensor.sensorId,
                parsedSensor.networkId,
                `Sensor ${parsedSensor.sensorId}`,
              ]
            );
            console.log(
              `Inserting new sensor - nAdr: ${parsedSensor.networkId}`
            );
          }

          if (parsedSensor.data.value !== null) {
            const parameterKey = dataParameterToKey(parsedSensor.parameter);
            const redisKey = getFullRedisLatestDataKey(
              parsedSensor.sensorId,
              parameterKey
            );

            await redisClient.hSet(redisKey, {
              value: parsedSensor.data.value,
              timestamp: messageTimestamp.getTime(),
            });
          }

          await dbClient.query(
            'INSERT INTO sensor_data (sensor_id, timestamp, parameter, value) VALUES ($1, $2, $3, $4)',
            [
              parsedSensor.sensorId,
              messageTimestamp,
              parsedSensor.parameter,
              parsedSensor.data.value,
            ]
          );
        } catch (e) {
          console.log(e);
        }
      }
    });

    mqttClient.on('reconnect', function () {
      console.log('Reconnecting...');
    });

    mqttClient.on('close', function () {
      console.log('Disconnected');
    });

    mqttClient.on('error', function (error) {
      console.log(error);
    });
  });

  // Express app
  const app = express();

  app.use(cors({ origin: true, credentials: true }));

  // Session
  const redisSStore = new RedisStore({
    client: redisClient,
  });

  app.use(
    session({
      name: COOKIE_NAME,
      secret: process.env.SESSION_SECRET || 'SESSION_SECRET_12345',
      resave: false,
      saveUninitialized: false,
      store: redisSStore,
      // cookie: {
      //   maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      //   httpOnly: true,
      //   secure: false,
      //   sameSite: 'lax',
      // },
    })
  );

  app.use(bodyParser.json());

  app.use(
    fileUpload({
      limits: { fileSize: MAX_FILE_UPLOAD_SIZE },
      // debug: true,
      limitHandler: (req, res) => {
        res.send({
          status: 'err',
          message: 'Maximum file upload size is 50MB.',
        });
      },
      abortOnLimit: true,
    })
  );

  // Add rest endpoints
  authController(app);
  sensorApiController(app, dbClient);
  appApiController(app, dbClient);

  app.listen(SERVER_PORT, () => {
    console.log(`Listening on port ${SERVER_PORT}`);
  });
})();
