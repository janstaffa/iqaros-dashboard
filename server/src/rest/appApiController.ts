import { Express } from 'express';
import sqlite from 'sqlite3';
import { NEW_GROUP_NAME_TEMPLATE } from '../constants';
import { auth, generateRandomColor } from './utils';

export function appApiController(app: Express, db: sqlite.Database) {
  app.get('/', auth, (req, res) => {
    res.send('Homepage');
  });
  app.get('/app/sensorlist', (req, res) => {
    try {
      db.all('SELECT * FROM sensors', async (err, rows: any) => {
        const sensors: any[] = [];

        for (const row of rows) {
          const groups = await new Promise<[]>((res, rej) => {
            db.all(
              `SELECT sensor_groups.group_id AS group_id, sensor_groups.group_name AS group_name, sensor_groups.group_color AS group_color
			 FROM sensors_in_groups
			 INNER JOIN sensor_groups
			 	ON sensors_in_groups.group_id = sensor_groups.group_id
			 WHERE sensors_in_groups.sensor_id = ?`,
              row['sensor_id'],
              (err, rows: any) => {
                if (err) return rej(err);
                res(rows);
              }
            );
          });
          const sensor_data = {
            ...row,
            groups: [...groups],
          };

          sensors.push(sensor_data);
        }
        const response = {
          status: 'ok',
          data: sensors,
        };

        res.json(response);
      });
      return;
    } catch (e) {
      return res.json({ status: 'err', message: e });
    }
  });

  app.post('/app/edit_sensor', (req, res) => {
    const { sensorId, newSensorName, newCheckedGroups } = req.body;
    try {
      db.run(
        'UPDATE sensors SET sensor_name = ? WHERE sensor_id = ?',
        newSensorName,
        sensorId
      );

      db.all(
        'SELECT * FROM sensors_in_groups WHERE sensor_id = ?',
        sensorId,
        (err: Error, rows: any) => {
          const to_remove = [];
          let to_add = [...newCheckedGroups];

          for (const row of rows) {
            // Sensor should stay in this group
            if (newCheckedGroups.includes(row.group_id)) {
              to_add = to_add.filter((x) => x !== row.group_id);
            }
            // Sensor should be removed from this group
            else {
              to_remove.push(row.group_id);
            }
          }

          if (to_remove.length > 0) {
            const removeQueryPlaceholders = new Array(to_remove.length)
              .fill('?')
              .join(',');
            const remove_query = `DELETE FROM sensors_in_groups WHERE sensor_id = ? AND group_id IN (${removeQueryPlaceholders})`;
            db.run(remove_query, sensorId, ...to_remove);
          }

          if (to_add.length > 0) {
            let rowValuePlaceholders = to_add.map(() => '(?, ?)').join(', ');
            let query =
              'INSERT INTO sensors_in_groups (sensor_id, group_id) VALUES ' +
              rowValuePlaceholders;

            const values = [];
            for (const gId of to_add) values.push(sensorId, gId);

            db.run(query, values);
          }
        }
      );
      return res.json({ status: 'ok' });
    } catch (e) {
      console.error(e);
      return res.json({ status: 'err', message: e });
    }
  });

  const getUniqueGroupName = async (name: string) => {
    return new Promise((res, rej) => {
      db.all('SELECT group_name from sensor_groups', (err, rows: any) => {
        if (err) return rej(err);

        let finalName = name;
        let num = 1;
        while (rows.find((x: any) => x['group_name'] == finalName)) {
          ++num;
          finalName = name + ' ' + num;
        }
        res(finalName);
      });
    });
  };

  app.get('/app/grouplist', (req, res) => {
    try {
      db.all('SELECT * FROM sensor_groups;', async (err, rows: any) => {
        const groups: any[] = [];

        for (const row of rows) {
          const sensors = await new Promise<[]>((res, rej) => {
            db.all(
              `SELECT sensors.sensor_id AS sensor_id, sensors.network_id as network_id, sensors.sensor_name AS sensor_name
			   FROM sensors_in_groups
			   INNER JOIN sensors
			   	ON sensors_in_groups.sensor_id = sensors.sensor_id
			   WHERE sensors_in_groups.group_id = ?`,
              row['group_id'],
              (err, rows2: any) => {
                if (err) return rej(err);
                res(rows2);
              }
            );
          });
          const group_data = { ...row, sensors };
          groups.push(group_data);
        }
        const response = {
          status: 'ok',
          data: groups,
        };

        res.json(response);
      });
      return;
    } catch (e) {
      return res.json({ status: 'err', message: e });
    }
  });
  app.post('/app/newgroup', async (req, res) => {
    const newGroupName = await getUniqueGroupName(NEW_GROUP_NAME_TEMPLATE);
    const newGroupColor = generateRandomColor();
    db.all(
      'INSERT INTO sensor_groups (group_name, group_color) VALUES (?, ?) RETURNING *',
      newGroupName,
      newGroupColor,
      (err: any, rows: any) => {
        res.json({
          status: 'ok',
          data: { ...rows[0], sensors: [] },
        });
      }
    );
  });

  app.post('/app/removegroup', (req, res) => {
    try {
      const { groupId } = req.body;

      db.run(
        `DELETE
		 FROM sensor_groups
	     WHERE sensor_groups.group_id = ?`,
        groupId
      );
      db.run(
        `DELETE
		 FROM sensors_in_groups
	     WHERE group_id = ?`,
        groupId
      );

      return res.json({ status: 'ok' });
    } catch (e) {
      return res.json({ status: 'err', message: e });
    }
  });
  app.post('/app/editgroup', (req, res) => {
    const { groupId, newName, newColor } = req.body;

    try {
      db.all(
        'UPDATE sensor_groups SET group_name = ?, group_color = ? WHERE group_id = ? RETURNING *',
        newName,
        newColor,
        groupId,
        (err: any, rows: any) => {
          if (err) throw err;
          res.json({
            status: 'ok',
            data: { ...rows[0] },
          });
        }
      );
      return;
    } catch (e) {
      return res.json({ status: 'err', message: e });
    }
  });
}
