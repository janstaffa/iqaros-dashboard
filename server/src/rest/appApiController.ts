import { Express, Request } from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import sqlite from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '..';
import {
  DATA_PARAMETER_KEYS,
  MAP_DIRECTORY_PATH,
  NEW_GROUP_NAME_TEMPLATE,
  getFullRedisLatestDataKey,
} from '../constants';
import { DashboardTilesDBObject, MapsDBObject, SensorDataAll } from '../types';
import { auth, generateRandomColor } from './utils';

export function appApiController(app: Express, db: sqlite.Database) {
  app.get('/', auth, (req, res) => {
    res.send('Homepage');
  });

  // === Sensors ===
  app.get('/app/sensorlist', (req, res) => {
    try {
      db.all('SELECT * FROM sensors', async (err, rows: any) => {
        const sensors: any[] = [];

        for (const row of rows) {
          const sensorId = row['sensor_id'];
          const groups = await new Promise<[]>((res, rej) => {
            db.all(
              `SELECT sensor_groups.group_id AS group_id, sensor_groups.group_name AS group_name, sensor_groups.group_color AS group_color
			 FROM sensors_in_groups
			 INNER JOIN sensor_groups
			 	ON sensors_in_groups.group_id = sensor_groups.group_id
			 WHERE sensors_in_groups.sensor_id = ?`,
              sensorId,
              (err, rows: any) => {
                if (err) return rej(err);
                res(rows);
              }
            );
          });

          const sensorData: SensorDataAll = {
            temperature: {
              value: null,
              timestamp: null,
            },
            humidity: {
              value: null,
              timestamp: null,
            },
            rssi: {
              value: null,
              timestamp: null,
            },
            voltage: {
              value: null,
              timestamp: null,
            },
          };

          // Get latest data
          for (const key of DATA_PARAMETER_KEYS) {
            const redisKey = getFullRedisLatestDataKey(sensorId, key);
            const latestData = await redisClient.hGetAll(redisKey);
            if (
              latestData.value !== undefined &&
              latestData.timestamp !== undefined
            ) {
              sensorData[key] = {
                value: parseFloat(latestData.value),
                timestamp: parseInt(latestData.timestamp),
              };
            }
          }

          const sensorObj = {
            ...row,
            data: sensorData,
            groups: [...groups],
          };

          sensors.push(sensorObj);
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

  // === Sensor groups ===
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
      db.all(
        'SELECT * FROM sensor_groups ORDER BY group_name;',
        async (err, rows: any) => {
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
        }
      );
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
          if (err) {
            console.log(err);
            res.json({ status: 'err', message: 'Failed to update group' });
          }
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

  // === Maps ===
  app.post('/app/newmap', (req: Request, res) => {
    try {
      const { mapName } = req.body;
      if (mapName == undefined || mapName.length == 0)
        return res.json({
          status: 'err',
          message: 'Map name cannot be empty.',
        });
      if (!req.files || !req.files.file) {
        return res.json({ status: 'err', message: 'No files were included.' });
      }

      if (Array.isArray(req.files.file) || req.files.file.truncated) {
        return res.json({
          status: 'err',
          message: 'Invalid file multi file uploads not supported.',
        });
      }

      const file = req.files.file;
      const originalFileName = file.name;

      let extension = '';
      if (file.name.indexOf('.') !== -1) {
        const dotArray = file.name.split('.');
        extension = dotArray[dotArray.length - 1];
      }

      const newFileUuid = uuidv4();

      const newFilePath = path.join(
        MAP_DIRECTORY_PATH,
        newFileUuid + '.' + extension
      );
      fs.writeFile(newFilePath, file.data, { encoding: 'binary' }, (err) => {
        sharp(newFilePath)
          .metadata()
          .then((meta) => {
            if (meta.width == undefined || meta.height == undefined)
              return res.json({
                status: 'err',
                message: 'Invalid image.',
              });

            const timestamp = new Date().getTime();
            db.run(
              'INSERT INTO maps (map_name, image_id, image_width, image_height, original_image_name, image_extension, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
              mapName,
              newFileUuid,
              meta.width,
              meta.height,
              originalFileName,
              extension,
              timestamp,
              (err: any) => {
                if (err)
                  res.json({
                    status: 'err',
                    message: 'Failed to insert into database.',
                  });

                res.json({
                  status: 'ok',
                });
              }
            );
            return;
          })
          .catch((err) => {
            res.json({
              status: 'err',
              message: 'Uploaded file must be an image.',
            });
            console.error(err);
          });
      });
      return;
    } catch (e) {
      return res.json({ status: 'err', message: e });
    }
  });

  app.get('/app/maplist', (req, res) => {
    db.all(
      'SELECT * FROM maps ORDER BY timestamp DESC',
      async (err, ms: MapsDBObject[]) => {
        if (err) {
          console.error(err);
          return res.json({ status: 'err', message: 'Failed to fetch maps.' });
        }

        const maps: any[] = [];

        for (const m of ms) {
          try {
            const sensors = await new Promise((res, rej) => {
              db.all(
                `SELECT sensors.sensor_id, sensors.network_id, sensors.sensor_name, sensor_map_positions.pos_x, sensor_map_positions.pos_y
               FROM sensor_map_positions
               INNER JOIN sensors
               ON sensor_map_positions.sensor_id = sensors.sensor_id
               WHERE map_id = ?`,
                m.map_id,
                async (
                  err,
                  sensors: {
                    sensor_id: number;
                    network_id: number;
                    sensor_name: string;
                    pos_x: number;
                    pos_y: number;
                  }[]
                ) => {
                  if (err) return rej(err);

                  const restructuredSensors = sensors.map(async (s) => {
                    const sensorData: SensorDataAll = {
                      temperature: {
                        value: null,
                        timestamp: null,
                      },
                      humidity: {
                        value: null,
                        timestamp: null,
                      },
                      rssi: {
                        value: null,
                        timestamp: null,
                      },
                      voltage: {
                        value: null,
                        timestamp: null,
                      },
                    };

                    // Get latest data
                    for (const key of DATA_PARAMETER_KEYS) {
                      const redisKey = getFullRedisLatestDataKey(
                        s.sensor_id,
                        key
                      );
                      const latestData = await redisClient.hGetAll(redisKey);
                      if (
                        latestData.value !== undefined &&
                        latestData.timestamp !== undefined
                      ) {
                        sensorData[key] = {
                          value: parseFloat(latestData.value),
                          timestamp: parseInt(latestData.timestamp),
                        };
                      }
                    }

                    return {
                      sensor: {
                        sensor_id: s['sensor_id'],
                        network_id: s['network_id'],
                        sensor_name: s['sensor_name'],
                      },
                      pos_x: s['pos_x'],
                      pos_y: s['pos_y'],
                      data: sensorData,
                    };
                  });
                  const resolvedSensors = await Promise.all(
                    restructuredSensors
                  );
                  res(resolvedSensors);
                }
              );
            });

            const map = {
              ...m,
              sensors,
            };
            maps.push(map);
          } catch (e) {
            console.log(e);
            return null;
          }
        }
        const response = {
          status: 'ok',
          data: maps,
        };
        return res.json(response);
      }
    );
    return;
  });

  app.get('/app/mapimage/:mapId', (req, res) => {
    const mapId = req.params.mapId;
    if (!mapId) res.json({ status: 'err', message: 'No map ID specified.' });
    db.all('SELECT * FROM maps WHERE map_id = ?', mapId, (err, rows) => {
      if (rows.length === 0)
        return res.json({
          status: 'err',
          message: 'Requested map does not exist.',
        });
      const result: any = rows[0];
      const reqFilePath = path.join(
        __dirname,
        '../..',
        MAP_DIRECTORY_PATH,
        result['image_id'] + '.' + result['image_extension']
      );
      return res.sendFile(reqFilePath);
    });
  });

  app.post('/app/removemap', (req, res) => {
    try {
      const { mapId } = req.body;

      db.all(
        `DELETE
		     FROM maps
	       WHERE map_id = ?
         RETURNING *`,
        mapId,
        (err, rows: MapsDBObject[]) => {
          if (!err && rows.length === 1) {
            const map = rows[0];

            const filePath = path.join(
              MAP_DIRECTORY_PATH,
              map.image_id + '.' + map.image_extension
            );
            fs.unlinkSync(filePath);
          }
        }
      );

      return res.json({ status: 'ok' });
    } catch (e) {
      return res.json({ status: 'err', message: e });
    }
  });

  app.post('/app/editmap', (req, res) => {
    try {
      const {
        mapId,
        newMapName,
        newSensors,
      }: {
        mapId: number;
        newMapName: string;
        newSensors: { sensorId: number; pos_x: number; pos_y: number }[];
      } = req.body;

      db.serialize(() => {
        db.run(
          `UPDATE maps
         SET map_name = ?
         WHERE map_id = ?`,
          newMapName,
          mapId
        );

        db.run(
          `DELETE FROM sensor_map_positions
         WHERE map_id = ?`,
          mapId
        );

        let rowValuePlaceholders = newSensors
          .map(() => '(?, ?, ?, ?)')
          .join(', ');
        let query =
          'INSERT INTO sensor_map_positions (sensor_id, map_id, pos_x, pos_y) VALUES ' +
          rowValuePlaceholders;

        const values = [];
        for (const s of newSensors)
          values.push(s.sensorId, mapId, s.pos_x, s.pos_y);

        db.run(query, values);
      });

      return res.json({ status: 'ok' });
    } catch (e) {
      return res.json({ status: 'err', message: e });
    }
  });

  // === Tiles ===
  app.post('/app/posttile', (req: Request, res) => {
    try {
      const {
        title,
        order,
        arg1,
        arg1_type,
        arg1_value,
        arg2,
        arg2_type,
        arg2_value,
        operation,
        parameter,
        show_graphic,
      } = req.body;

      if (
        title == undefined ||
        order == undefined ||
        arg1 == undefined ||
        arg1_type == undefined ||
        arg1_value == undefined ||
        operation == undefined ||
        parameter == undefined
      )
        return res.json({
          status: 'err',
          message: 'Invalid request',
        });

      db.run(
        `INSERT
         INTO dashboard_tiles (title, 'order', arg1, arg1_type, arg1_value, operation, parameter, arg2, arg2_type, arg2_value, show_graphic)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          order,
          arg1,
          arg1_type,
          arg1_value,
          operation,
          parameter,
          arg2 == undefined ? null : arg2,
          arg2_type == undefined ? null : arg2_type,
          arg2_value == undefined ? null : arg2_value,
          show_graphic,
        ],
        (err: any) => {
          if (err)
            return res.json({
              status: 'err',
              message: 'Failed to insert into database.',
            });

          return res.json({
            status: 'ok',
          });
        }
      );
      return;
    } catch (e) {
      return res.json({ status: 'err', message: e });
    }
  });

  app.get('/app/tilelist', (req, res) => {
    try {
      db.all(
        `SELECT *
         FROM dashboard_tiles`,
        (err, rows: DashboardTilesDBObject[]) => {
          if (err)
            return res.json({
              status: 'err',
              message: 'Failed to get tiles from DB',
            });

          return res.json({
            status: 'ok',
            data: rows.map((row: DashboardTilesDBObject) => ({
              ...row,
              show_graphic: !!row.show_graphic,
            })),
          });
        }
      );
      return;
    } catch (e) {
      return res.json({ status: 'err', message: e });
    }
  });

  app.post('/app/removetile', (req: Request, res) => {
    try {
      const { tileId } = req.body;

      if (tileId == undefined)
        return res.json({
          status: 'err',
          message: 'Invalid request',
        });

      db.run(
        `DELETE 
         FROM dashboard_tiles
         WHERE ID = ?`,
        tileId,
        (err: any) => {
          if (err)
            return res.json({
              status: 'err',
              message: 'Failed to remove from database.',
            });

          return res.json({
            status: 'ok',
          });
        }
      );
      return;
    } catch (e) {
      return res.json({ status: 'err', message: e });
    }
  });
}
