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

  ///api/fetch_data?sensorId=x,y,z...&from=a&to=b
  app.get('/api/fetchdata', async (req, res) => {
    const query = req.query;

    const sensorId = query['sensorId'];
    if (sensorId === undefined)
      return res.json({
        status: 'err',
        message: 'Missing query parameter "sensorId"',
      });

    const from = query['from'];
    const to = query['to'];

    // Check if sensor exists
    const exists: boolean = await new Promise((res, rej) =>
      db.get(
        'SELECT COUNT(1) FROM sensors WHERE sensor_id = ?',
        sensorId,
        (err, row: any) => {
          if (err) return rej(err);
          res(row['COUNT(1)'] === 1);
        }
      )
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

      const data = await new Promise((res, rej) =>
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
          [sensorId, sensorId, sensorId, sensorId],
          (err, data) => {
            if (err) return rej(err);
            if (data.length === 0) return rej();
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

            res({
              temperature: {
                value: temperature,
                timestamp: temperature_timestamp,
              },
              humidity: {
                value: humidity,
                timestamp: humidity_timestamp,
              },
              rssi: {
                value: rssi,
                timestamp: rssi_timestamp,
              },
              voltage: {
                value: voltage,
                timestamp: voltage_timestamp,
              },
            });
          }
        )
      );

      return res.send({ status: 'ok', data });
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

      const data = await new Promise((res, rej) =>
        db.all(
          `SELECT value, parameter, timestamp FROM sensor_data WHERE sensor_id = ? AND (timestamp > ? AND timestamp < ?) ORDER BY timestamp ASC`,
          [sensorId, realFrom, realTo],
          (err, data: SensorDataDBObject[]) => {
            if (err) return rej(err);
            if (data.length === 0) return rej();

            const d: FetchDataData = {
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

            for (const v of data) {
              let push;
              switch (parseInt(v.parameter)) {
                case SensorDataParameter.Temperature:
                  push = d.temperature;
                  break;
                case SensorDataParameter.Humidity:
                  push = d.humidity;
                  break;
                case SensorDataParameter.RSSI:
                  push = d.rssi;
                  break;
                case SensorDataParameter.ExtraLowVoltage:
                  push = d.voltage;
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
  });
}
