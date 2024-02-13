import { Express } from 'express';
import { Pool, QueryResult } from 'pg';
import { redisClient } from '..';
import { DATA_PARAMETER_KEYS, getFullRedisLatestDataKey } from '../constants';
import {
  FetchDataData,
  SensorDBObject,
  SensorDataDBObject,
  SensorDataParameter,
} from '../types';

export function sensorApiController(app: Express, dbClient: Pool) {
  app.get('/api/sensorlist', async (req, res) => {
    try {
      const sensorsResult: QueryResult<SensorDBObject> = await dbClient.query(
        'SELECT * FROM sensors'
      );
      const sensors: any[] = [];

      for (const row of sensorsResult.rows) {
        const sensor_data = {
          sensorId: row.sensor_id,
          networkId: row.network_id,
          sensorName: row.sensor_name,
        };

        sensors.push(sensor_data);
      }
      const response = {
        serverTime: new Date(),
        sensors,
      };

      res.json(response);
    } catch (e) {
      console.error(e);
      res.json({ status: 'err', message: 'Failed to get sensor list' });
    }
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

      // Check if exists
      const sensorsResult = await dbClient.query(
        `SELECT * FROM sensors WHERE sensor_id = ANY($1::int[])`,
        [parsedSensorIds]
      );

      if (sensorsResult.rowCount !== parsedSensorIds.length)
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
        return res.send({ status: 'ok', data: { values: d } });
      }

      // Return data over period
      else {
        const realFrom = new Date(parseInt(from as string));

        const now = new Date();
        if (realFrom > now)
          return res.json({
            status: 'err',
            message:
              'Impossible request: "from" cannot be larger than current timestamp',
          });

        let realTo = now;
        if (to !== undefined) {
          const parsedTo = new Date(parseInt(to as string));
          if (to < from)
            return res.json({
              status: 'err',
              message: 'Impossible request: "to" cannot be smaller than "from"',
            });
          realTo = parsedTo;
        }

        const sensorDataResult: QueryResult<SensorDataDBObject> =
          await dbClient.query(
            `
            SELECT sensor_id, value, parameter, timestamp
              FROM sensor_data
              WHERE sensor_id = ANY($1::int[]) AND (timestamp > $2 AND timestamp < $3) ORDER BY timestamp ASC`,
            [parsedSensorIds, realFrom, realTo]
          );

        // Create object with sensorIds as keys
        const data: { [key: string]: FetchDataData } = parsedSensorIds.reduce(
          (accumulator, value) => {
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
          },
          {}
        );

        for (const v of sensorDataResult.rows) {
          let push;
          const temp = data[v.sensor_id.toString()];
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
            push.timestamps.push(v.timestamp.getTime());
          }
        }
        res.send({
          status: 'ok',
          data: {
            values: data,
            timestamp_from: realFrom,
            timestamp_to: realTo,
          },
        });
      }
    } catch (e) {
      console.error(e);
      res.json({ status: 'err', message: 'Failed to get sensor list' });
    }
  });
}
