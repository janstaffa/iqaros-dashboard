import mqtt from 'mqtt';
import {
  BROKER_ADDRESS,
  MAX_FILE_UPLOAD_SIZE,
  MQTT_RESPONSE_TOPIC,
  getFullRedisLatestDataKey
} from './constants';

import express from 'express';

import bodyParser from 'body-parser';
import cors from 'cors';

import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import { Client as PostgresClient } from 'pg';
import { createClient } from 'redis';
import { appApiController } from './rest/appApiController';
import { sensorApiController } from './rest/sensorApiController';
import { webServerController } from './rest/webServerController';
import { IQAROS_Response } from './types';
import { dataParameterToKey, parseSensor } from './utils';

dotenv.config();

// DATABASE
// const db = new sqlite.Database(DB_FILE, (error) => {
//   if (error) {
//     return console.error(error.message);
//   }
// });

export const redisClient = createClient();

(async () => {
  // Connect to PostgresDB
  const dbClient = new PostgresClient({
    user: 'postgres',
    password: 'admin',
    database: 'IQAROS',
  });
  dbClient.on('error', (err) => console.log('Postgres Client Error', err));
  await dbClient.connect();
  console.log('Connected to PostgresDB');

  try {
    await dbClient.query(
      `CREATE TABLE IF NOT EXISTS "sensors" (
        "sensor_id"	INT UNIQUE,
        "network_id"	INT UNIQUE,
        "sensor_name"	TEXT,
        PRIMARY KEY("sensor_id")
       );`
    );
    await dbClient.query(
      `CREATE TABLE IF NOT EXISTS "sensor_data" (
        "ID"	BIGSERIAL UNIQUE,
        "sensor_id"	INT,
        "timestamp"	TIMESTAMPTZ ,
        "parameter"	TEXT,
        "value"	REAL,
        PRIMARY KEY("ID"),
        FOREIGN KEY ("sensor_id") REFERENCES "sensors"("sensor_id")
      );`
    );
    await dbClient.query(
      `CREATE TABLE IF NOT EXISTS "sensor_groups" (
        "group_id"	SERIAL UNIQUE,
        "group_name"	TEXT,
        "group_color"	TEXT,
        PRIMARY KEY("group_id")
      );`
    );
    await dbClient.query(
      `CREATE TABLE IF NOT EXISTS "sensors_in_groups" (
        "ID"	SERIAL UNIQUE,
        "sensor_id"	INTEGER,
        "group_id"	INTEGER,
        PRIMARY KEY("ID"),
        FOREIGN KEY ("group_id") REFERENCES "sensor_groups"("group_id") ON DELETE CASCADE,
        FOREIGN KEY ("sensor_id") REFERENCES "sensors"("sensor_id")
      );`
    );
    await dbClient.query(
      `CREATE TABLE IF NOT EXISTS "maps" (
        "map_id"	SERIAL UNIQUE,
        "map_name"	TEXT,
        "image_id"	TEXT UNIQUE,
        "image_width"	INTEGER,
        "image_height"	INTEGER,
        "original_image_name"	TEXT,
        "image_extension"	TEXT,
        "timestamp"	TIMESTAMPTZ ,
        PRIMARY KEY("map_id")
      );`
    );
    await dbClient.query(
      `CREATE TABLE IF NOT EXISTS "sensor_map_positions" (
        "ID"	SERIAL UNIQUE,
        "sensor_id"	INTEGER,
        "map_id"	INTEGER,
        "pos_x"	REAL,
        "pos_y"	REAL,
        PRIMARY KEY("ID"),
        FOREIGN KEY ("map_id") REFERENCES "maps"("map_id") ON DELETE CASCADE,
        FOREIGN KEY ("sensor_id") REFERENCES "sensors"("sensor_id")
      );`
    );
    await dbClient.query(
      `CREATE TABLE IF NOT EXISTS "dashboard_tiles" (
        "ID"	SERIAL UNIQUE,
        "order"	INTEGER,
        "title"	TEXT,
        "arg1"	INTEGER,
        "arg1_type"	INTEGER,
        "arg1_value"	INTEGER,
        "arg2"	INTEGER,
        "arg2_type"	INTEGER,
        "arg2_value"	INTEGER,
        "operation"	INTEGER,
        "parameter"	INTEGER,
        "show_graphic"	BOOLEAN DEFAULT false,
        PRIMARY KEY("ID")
      );`
    );
  } catch (e) {
    console.error('ERROR when creating tables: ', e);
  }

  // Connect to Redis
  redisClient.on('error', (err) => console.log('Redis Client Error', err));

  await redisClient.connect();
  console.log('Connected to Redis');

  // Connect to MQTT Client
  const mqttClient = mqtt.connect(BROKER_ADDRESS, {
    clientId: 'IQAROS-KG-Client',
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
      // message is Buffer
      const parsed_message = JSON.parse(message.toString()) as IQAROS_Response;
      // console.log('data', JSON.stringify(parsed_message));
      const sensors = parsed_message.data.rsp.result.sensors;

      console.log(parsed_message.mType, parsed_message.data.msgId);
      if (parsed_message.mType == 'iqrfEmbedFrc_SendSelective')
        console.log(JSON.stringify(parsed_message));
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

          // db.all(
          //   'SELECT * FROM sensors WHERE sensor_id = ? OR network_id = ?',
          //   [parsedSensor.sensorId, parsedSensor.networkId],
          //   (err, rows) => {
          //     if (err) return console.error(err);
          //     if (rows && rows.length === 0) {
          //       db.run(
          //         'INSERT INTO sensors (sensor_id, network_id, sensor_name) VALUES (?, ?, ?)',
          //         parsedSensor.sensorId,
          //         parsedSensor.networkId,
          //         `Sensor ${parsedSensor.sensorId}`
          //       );
          //     }
          //   }
          // );
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
          // db.run(
          //   'INSERT INTO sensor_data (sensor_id, timestamp, parameter, value) VALUES (?, ?, ?, ?)',
          //   parsedSensor.sensorId,
          //   parsedSensor.data.timestamp,
          //   parsedSensor.parameter,
          //   parsedSensor.data.value
          // );
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

  // Express.js endpoint
  const app = express();
  const port = 4000;

  app.use(cors());
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

  // Add all rest API endpoints
  await sensorApiController(app, dbClient);
  appApiController(app, dbClient);
  webServerController(app);

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
})();
