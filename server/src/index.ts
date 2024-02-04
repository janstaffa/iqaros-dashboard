import mqtt from 'mqtt';
import {
  BROKER_ADDRESS,
  DB_FILE,
  MAX_FILE_UPLOAD_SIZE,
  MQTT_RESPONSE_TOPIC,
  getFullRedisLatestDataKey,
} from './constants';

import express from 'express';
import sqlite from 'sqlite3';

import bodyParser from 'body-parser';
import cors from 'cors';

import fileUpload from 'express-fileupload';
import { createClient } from 'redis';
import { appApiController } from './rest/appApiController';
import { sensorApiController } from './rest/sensorApiController';
import { IQAROS_Response } from './types';
import { dataParameterToKey, parseSensor } from './utils';

// DATABASE
const db = new sqlite.Database(DB_FILE, (error) => {
  if (error) {
    return console.error(error.message);
  }
});

export const redisClient = createClient();

(async () => {
  db.serialize(() => {
    //   db.run('CREATE TABLE sensor_data (sensor_id INT, timestamp DATETIME, temperature FLOAT, relative_humidity FLOAT, rssi INT, )');
    //   db.run('CREATE TABLE sensors (sensor_id INT, sensor_name TEXT)');
  });

  // Connect to Redis
  redisClient.on('error', (err) => console.log('Redis Client Error', err));

  await redisClient.connect();
  console.log('Connected to Redis');

  // MQTT Client
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

          db.all(
            'SELECT * FROM sensors WHERE sensor_id = ? OR network_id = ?',
            [parsedSensor.sensorId, parsedSensor.networkId],
            (err, rows) => {
              if (err) return console.error(err);
              if (rows && rows.length === 0) {
                db.run(
                  'INSERT INTO sensors (sensor_id, network_id, sensor_name) VALUES (?, ?, ?)',
                  parsedSensor.sensorId,
                  parsedSensor.networkId,
                  `Sensor ${parsedSensor.sensorId}`
                );
              }
            }
          );
          if (
            parsedSensor.data.timestamp !== null &&
            parsedSensor.data.value !== null
          ) {
            const parameterKey = dataParameterToKey(parsedSensor.parameter);
            const redisKey = getFullRedisLatestDataKey(
              parsedSensor.sensorId,
              parameterKey
            );
            await redisClient.hSet(redisKey, {
              value: parsedSensor.data.value,
              timestamp: parsedSensor.data.timestamp,
            });
          }

          try {
            db.run(
              'INSERT INTO sensor_data (sensor_id, timestamp, parameter, value) VALUES (?, ?, ?, ?)',
              parsedSensor.sensorId,
              parsedSensor.data.timestamp,
              parsedSensor.parameter,
              parsedSensor.data.value
            );
          } catch (e) {
            console.error(e);
          }
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
  await sensorApiController(app, db);
  appApiController(app, db);

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
})();
