import { Express } from 'express';
import sqlite from 'sqlite3';
import { redisClient } from '..';
import { DATA_PARAMETER_KEYS, getFullRedisLatestDataKey } from '../constants';
import {
  FetchDataData,
  SensorDataDBObject,
  SensorDataParameter,
} from '../types';

export async function sensorApiController(app: Express, db: sqlite.Database) {
  app.get('/api/sensorlist', (req, res) => {
    db.all('SELECT * FROM sensors', async (err, rows: any) => {
      const sensors: any[] = [];

      for (const row of rows) {
        const sensor_data = {
          sensorId: row['sensor_id'],
          networkId: row['network_id'],
          sensorName: row['sensor_name'],
        };

        sensors.push(sensor_data);
      }
      const response = {
        serverTime: new Date(),
        sensors,
      };

      res.json(response);
    });
  });

  ///api/fetch_data?sensorId=x&from=a&to=b
  app.get('/api/fetchdata', async (req, res) => {
    try {
      const query = req.query;

      const sensorId = query['sensorId'] as string;
      if (sensorId === undefined || sensorId.length === 0)
        return res.json({
          status: 'err',
          message: 'Missing query parameter "sensorId"',
        });

      const from = query['from'];
      const to = query['to'];

      const parsedSensorIds = sensorId
        .split(',')
        .filter((s) => s.length > 0)
        .map((s) => parseInt(s));

      // Check if sensor exists
      const sensorsIdsPlaceholders = new Array(parsedSensorIds.length)
        .fill('?')
        .join(',');
      const sensorsExistQuery = `SELECT COUNT(1) FROM sensors WHERE sensor_id IN (${sensorsIdsPlaceholders})`;
      const exists: boolean = await new Promise((res, rej) =>
        db.get(sensorsExistQuery, [...parsedSensorIds], (err, row: any) => {
          if (err) return rej(err);
          res(row['COUNT(1)'] === parsedSensorIds.length);
        })
      );

      if (!exists)
        return res.json({
          status: 'err',
          message: `Unknow sensor ID: ${sensorId}`,
        });

      // Return latest data
      if (from === undefined) {
        if (to !== undefined)
          return res.json({
            status: 'err',
            message: 'No "from" parameter specified',
          });

        // Create object with sensorIds as keys
        const d: { [key: string]: FetchDataData } = {};

        for (const sId of parsedSensorIds) {
          d[sId.toString()] = {
            temperature: {
              values: [],
              timestamps: [],
            },
            humidity: {
              values: [],
              timestamps: [],
            },
            rssi: {
              values: [],
              timestamps: [],
            },
            voltage: {
              values: [],
              timestamps: [],
            },
          };

          for (const key of DATA_PARAMETER_KEYS) {
            const redisKey = getFullRedisLatestDataKey(sId, key);
            const sensorData = await redisClient.hGetAll(redisKey);
            if (
              sensorData.value !== undefined &&
              sensorData.timestamp !== undefined
            ) {
              d[sId.toString()][key] = {
                values: [parseFloat(sensorData.value)],
                timestamps: [parseInt(sensorData.timestamp)],
              };
            }
          }
        }
        return res.send({ status: 'ok', data: d });
      }

      // Return data over period
      else {
        const realFrom = parseInt(from as string);

        const now = new Date().getTime();
        if (realFrom > now)
          return res.json({
            status: 'err',
            message:
              'Impossible request: "from" cannot be larger than current timestamp',
          });

        let realTo = now;
        if (to !== undefined) {
          const parsedTo = parseInt(to as string);
          if (to < from)
            return res.json({
              status: 'err',
              message: 'Impossible request: "to" cannot be smaller than "from"',
            });
          realTo = parsedTo;
        }

        const getSensorDataQuery = `SELECT sensor_id, value, parameter, timestamp FROM sensor_data WHERE sensor_id IN (${sensorsIdsPlaceholders})AND (timestamp > ? AND timestamp < ?) ORDER BY timestamp ASC`;
        const data: { [key: string]: FetchDataData } = await new Promise(
          (res, rej) =>
            db.all(
              getSensorDataQuery,
              [...parsedSensorIds, realFrom, realTo],
              (err, data: SensorDataDBObject[]) => {
                if (err) return rej(err);

                // Create object with sensorIds as keys
                const d: { [key: string]: FetchDataData } =
                  parsedSensorIds.reduce((accumulator, value) => {
                    return {
                      ...accumulator,
                      [value]: {
                        temperature: {
                          values: [],
                          timestamps: [],
                        },
                        humidity: {
                          values: [],
                          timestamps: [],
                        },
                        rssi: {
                          values: [],
                          timestamps: [],
                        },
                        voltage: {
                          values: [],
                          timestamps: [],
                        },
                      },
                    };
                  }, {});

                for (const v of data) {
                  let push;
                  const temp = d[v.sensor_id.toString()];
                  switch (parseInt(v.parameter)) {
                    case SensorDataParameter.Temperature:
                      push = temp.temperature;
                      break;
                    case SensorDataParameter.Humidity:
                      push = temp.humidity;
                      break;
                    case SensorDataParameter.RSSI:
                      push = temp.rssi;
                      break;
                    case SensorDataParameter.Voltage:
                      push = temp.voltage;
                      break;
                  }
                  if (push) {
                    push.values.push(v.value);
                    push.timestamps.push(v.timestamp);
                  }
                }
                res(d);
              }
            )
        );
        return res.send({ status: 'ok', data });
      }
    } catch (e) {
      console.log(e);
    }
    return;
  });
}
