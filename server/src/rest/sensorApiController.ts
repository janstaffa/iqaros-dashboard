import { Express } from 'express';
import sqlite from 'sqlite3';
import {
  FetchDataData,
  SensorDataDBObject,
  SensorDataParameter,
} from '../types';

export function sensorApiController(app: Express, db: sqlite.Database) {
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
          await new Promise((res, rej) =>
            db.all(
              `SELECT temp.value AS temperature, temp.timestamp AS temperature_timestamp, humidity.value AS humidity, humidity.timestamp AS humidity_timestamp, rssi.value AS rssi, rssi.timestamp AS rssi_timestamp, voltage.value AS voltage, voltage.timestamp AS voltage_timestamp
              FROM
              (SELECT value, timestamp FROM sensor_data WHERE sensor_id = ? AND parameter = 0 ORDER BY timestamp DESC LIMIT 1) temp
                FULL JOIN
              (SELECT value, timestamp FROM sensor_data WHERE sensor_id = ? AND parameter = 1 ORDER BY timestamp DESC LIMIT 1) humidity
                FULL JOIN
              (SELECT value, timestamp FROM sensor_data WHERE sensor_id = ? AND parameter = 2 ORDER BY timestamp DESC LIMIT 1) rssi
                FULL JOIN
              (SELECT value, timestamp FROM sensor_data WHERE sensor_id = ? AND parameter = 4 ORDER BY timestamp DESC LIMIT 1) voltage`,
              // ON (temp.sensor_id = humidity.sensor_id AND humidity.sensor_id = rssi.sensor_id AND rss.sensor_id = voltage.sensor_id);`,
              [sId, sId, sId, sId],
              (err, data) => {
                if (err) return rej(err);

                if (data.length === 0) return res(null);
                const {
                  temperature,
                  temperature_timestamp,
                  humidity,
                  humidity_timestamp,
                  rssi,
                  rssi_timestamp,
                  voltage,
                  voltage_timestamp,
                } = data[0] as any;

                d[sId.toString()] = {
                  temperature: {
                    values: [temperature],
                    timestamps: [temperature_timestamp],
                  },
                  humidity: {
                    values: [humidity],
                    timestamps: [humidity_timestamp],
                  },
                  rssi: {
                    values: [rssi],
                    timestamps: [rssi_timestamp],
                  },
                  voltage: {
                    values: [voltage],
                    timestamps: [voltage_timestamp],
                  },
                };
                res(null);
              }
            )
          );
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
                    case SensorDataParameter.ExtraLowVoltage:
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
