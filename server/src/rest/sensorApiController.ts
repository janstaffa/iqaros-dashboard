import { Express } from 'express';
import sqlite from 'sqlite3';

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
}
