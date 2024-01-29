import mqtt from 'mqtt';
import {
  BROKER_ADDRESS,
  DB_FILE,
  MAX_FILE_UPLOAD_SIZE,
  MQTT_RESPONSE_TOPIC,
} from './constants';

import express from 'express';
import sqlite from 'sqlite3';

import bodyParser from 'body-parser';
import cors from 'cors';

import fileUpload from 'express-fileupload';
import { WebSocketServer } from 'ws';
import { appApiController } from './rest/appApiController';
import { sensorApiController } from './rest/sensorApiController';
import { IQAROS_Response } from './types';
import { parseSensor } from './utils';

// DATABASE
const db = new sqlite.Database(DB_FILE, (error) => {
  if (error) {
    return console.error(error.message);
  }
});

(async () => {
  db.serialize(() => {
    //   db.run('CREATE TABLE sensor_data (sensor_id INT, timestamp DATETIME, temperature FLOAT, relative_humidity FLOAT, rssi INT, )');
    //   db.run('CREATE TABLE sensors (sensor_id INT, sensor_name TEXT)');
  });

  // Express.js endpoint
  const app = express();
  const port = 4000;

  app.use(cors());
  app.use(bodyParser.json());

  app.use(
    fileUpload({
      limits: { fileSize: MAX_FILE_UPLOAD_SIZE },
      debug: true,
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
  sensorApiController(app, db);
  appApiController(app, db);

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });

  const wss = new WebSocketServer({
    port: 4040,
  });

  wss.on('connection', function connection(ws) {
    console.log('WS client connected');
    ws.on('error', console.error);

    ws.on('message', function message(data) {
      console.log('received: %s', data);
    });
  });

  // MQTT Client
  const client = mqtt.connect(BROKER_ADDRESS, {
    clientId: 'IQAROS-KG-Client',
    clean: true,
    reconnectPeriod: 1000,
    keepalive: 1000,
  });

  client.on('connect', () => {
    console.log('Connected');
    client.subscribe(MQTT_RESPONSE_TOPIC);

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

    client.on('message', (topic, message) => {
      // message is Buffer
      const parsed_message = JSON.parse(message.toString()) as IQAROS_Response;
      console.log('data', JSON.stringify(parsed_message));
      const sensors = parsed_message.data.rsp.result.sensors;
      if (!sensors) return;

      for (const sensor of sensors) {
        const parsedSensor = parseSensor(sensor);
        console.log('sensor:', parsedSensor);
        try {
          db.run(
            'INSERT INTO sensor_data (sensor_id, timestamp, parameter, value) VALUES (?, ?, ?, ?)',
            parsedSensor.sensorId,
            parsedSensor.timestamp,
            parsedSensor.parameter,
            parsedSensor.value
          );
        } catch (e) {
          console.error(e);
        }
      }
    });

    client.on('reconnect', function () {
      console.log('Reconnecting...');
    });

    client.on('close', function () {
      console.log('Disconnected');
      db.close();
    });

    client.on('error', function (error) {
      console.log(error);
    });
  });
})();
