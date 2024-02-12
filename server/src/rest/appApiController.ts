import { Express, Request } from 'express';
import fs from 'fs';
import path from 'path';
import { Client as PostgresClient, QueryResult } from 'pg';
import format from 'pg-format';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '..';
import {
  DATA_PARAMETER_KEYS,
  MAP_DIRECTORY_PATH,
  NEW_GROUP_NAME_TEMPLATE,
  getFullRedisLatestDataKey,
} from '../constants';
import { DashboardTilesDBObject, MapsDBObject, SensorDataAll } from '../types';
import { generateRandomColor } from './utils';

export function appApiController(app: Express, dbClient: PostgresClient) {
  // === Sensors ===
  app.get('/app/sensorlist', async (req, res) => {
    try {
      const sensor_rows = await dbClient.query('SELECT * FROM sensors');
      const sensors: any[] = [];

      for (const row of sensor_rows.rows) {
        const sensorId = row['sensor_id'];
        const groups = await dbClient.query(
          `SELECT sensor_groups.group_id AS group_id, sensor_groups.group_name AS group_name, sensor_groups.group_color AS group_color
			 FROM sensors_in_groups
			 INNER JOIN sensor_groups
			 	ON sensors_in_groups.group_id = sensor_groups.group_id
			 WHERE sensors_in_groups.sensor_id = $1`,
          [sensorId]
        );

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
          groups: [...groups.rows],
        };

        sensors.push(sensorObj);
      }

      const response = {
        status: 'ok',
        data: sensors,
      };

      res.json(response);
    } catch (e) {
      console.error(e);
      res.json({ status: 'err', message: 'Failed to get sensor list' });
    }
  });

  app.post('/app/edit_sensor', async (req, res) => {
    const { sensorId, newSensorName, newCheckedGroups } = req.body;
    try {
      dbClient.query(
        'UPDATE sensors SET sensor_name = $1 WHERE sensor_id = $2',
        [newSensorName, sensorId]
      );

      const group_rows = await dbClient.query(
        'SELECT * FROM sensors_in_groups WHERE sensor_id = $1',
        [sensorId]
      );
      const to_remove = [];
      let to_add = [...newCheckedGroups];

      for (const row of group_rows.rows) {
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
        dbClient.query(
          `DELETE FROM sensors_in_groups WHERE sensor_id = $1 AND group_id = ANY($2::int[])`,
          [sensorId, to_remove]
        );
      }

      if (to_add.length > 0) {
        const values = [];
        for (const gId of to_add) values.push([sensorId, gId]);

        const query = format(
          `INSERT INTO sensors_in_groups (sensor_id, group_id) VALUES %L`,
          values
        );
        dbClient.query(query);
        // db.run(query, values);
      }
      res.json({ status: 'ok' });
    } catch (e) {
      console.error(e);
      res.json({ status: 'err', message: 'Failed to edit sensor' });
    }
  });

  // === Sensor groups ===
  const getUniqueGroupName = async (name: string) => {
    try {
      const groupNames = await dbClient.query(
        'SELECT group_name from sensor_groups'
      );
      let finalName = name;
      let num = 1;
      while (groupNames.rows.find((x: any) => x['group_name'] == finalName)) {
        ++num;
        finalName = name + ' ' + num;
      }
      return finalName;
    } catch (e) {
      throw e;
    }
  };

  app.get('/app/grouplist', async (req, res) => {
    try {
      const groupRows = await dbClient.query(
        'SELECT * FROM sensor_groups ORDER BY group_name ASC'
      );
      const groups: any[] = [];
      for (const row of groupRows.rows) {
        const sensors = await dbClient.query(
          `SELECT sensors.sensor_id AS sensor_id, sensors.network_id as network_id, sensors.sensor_name AS sensor_name
			     FROM sensors_in_groups
			     INNER JOIN sensors
			   	 ON sensors_in_groups.sensor_id = sensors.sensor_id
			     WHERE sensors_in_groups.group_id = $1`,
          [row['group_id']]
        );
        const group_data = { ...row, sensors: sensors.rows };
        groups.push(group_data);
      }
      const response = {
        status: 'ok',
        data: groups,
      };

      res.json(response);
    } catch (e) {
      console.error(e);
      res.json({ status: 'err', message: 'Failed to list messages' });
    }
  });

  app.post('/app/newgroup', async (req, res) => {
    try {
      const newGroupName = await getUniqueGroupName(NEW_GROUP_NAME_TEMPLATE);
      const newGroupColor = generateRandomColor();
      const newGroup = await dbClient.query(
        'INSERT INTO sensor_groups (group_name, group_color) VALUES ($1, $2) RETURNING *',
        [newGroupName, newGroupColor]
      );
      res.json({
        status: 'ok',
        data: { ...newGroup.rows[0], sensors: [] },
      });
    } catch (e) {
      console.error(e);
      res.json({
        status: 'err',
        message: 'Failed to create new group',
      });
    }
  });

  app.post('/app/removegroup', async (req, res) => {
    try {
      const { groupId } = req.body;

      await dbClient.query(
        `DELETE FROM sensor_groups WHERE sensor_groups.group_id = $1`,
        [groupId]
      );
      //   db.run(
      //     `DELETE
      //  FROM sensors_in_groups
      //    WHERE group_id = ?`,
      //     groupId
      //   );

      res.json({ status: 'ok' });
    } catch (e) {
      console.error(e);
      res.json({ status: 'err', message: 'Failed to remove group' });
    }
  });
  app.post('/app/editgroup', async (req, res) => {
    const { groupId, newName, newColor } = req.body;

    try {
      dbClient.query(
        `UPDATE sensor_groups SET group_name = $1, group_color = $2 WHERE group_id = $3`,
        [newName, newColor, groupId]
      );
      res.json({
        status: 'ok',
      });
    } catch (e) {
      console.error(e);
      res.json({ status: 'err', message: 'Failed to edit group' });
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
          .then(async (meta) => {
            if (meta.width == undefined || meta.height == undefined)
              return res.json({
                status: 'err',
                message: 'Invalid image.',
              });

            const timestamp = new Date();

            try {
              await dbClient.query(
                `INSERT INTO maps (map_name, image_id, image_width, image_height, original_image_name, image_extension, timestamp)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  mapName,
                  newFileUuid,
                  meta.width,
                  meta.height,
                  originalFileName,
                  extension,
                  timestamp,
                ]
              );
              res.json({
                status: 'ok',
              });
            } catch (e) {
              console.error(e);
              res.json({ status: 'err', message: 'Failed to create new map' });
            }
          })
          .catch((err) => {
            console.error(err);
            res.json({
              status: 'err',
              message: 'Uploaded file must be an image.',
            });
          });
      });
    } catch (e) {
      console.error(e);
      res.json({ status: 'err', message: 'Failed to create new map' });
    }
  });

  app.get('/app/maplist', async (req, res) => {
    try {
      const mapRows = await dbClient.query(
        'SELECT * FROM maps ORDER BY timestamp DESC'
      );

      const maps: any[] = [];

      for (const m of mapRows.rows) {
        try {
          const sensors: QueryResult<{
            sensor_id: number;
            network_id: number;
            sensor_name: string;
            pos_x: number;
            pos_y: number;
          }> = await dbClient.query(
            `SELECT sensors.sensor_id, sensors.network_id, sensors.sensor_name, sensor_map_positions.pos_x, sensor_map_positions.pos_y
               FROM sensor_map_positions
               INNER JOIN sensors
               ON sensor_map_positions.sensor_id = sensors.sensor_id
               WHERE map_id = $1`,
            [m.map_id]
          );
          const restructuredSensors = sensors.rows.map(async (s) => {
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
              const redisKey = getFullRedisLatestDataKey(s.sensor_id, key);
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
                sensor_id: s.sensor_id,
                network_id: s.network_id,
                sensor_name: s.sensor_name,
              },
              pos_x: s.pos_x,
              pos_y: s.pos_y,
              data: sensorData,
            };
          });

          const resolvedSensors = await Promise.all(restructuredSensors);

          const map = {
            ...m,
            sensors: resolvedSensors,
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
      res.json(response);
    } catch (e) {
      console.error(e);
      res.json({ status: 'err', message: 'Failed to get map list' });
    }
  });

  app.get('/app/mapimage/:mapId', async (req, res) => {
    const mapId = req.params.mapId;
    if (!mapId) res.json({ status: 'err', message: 'No map ID specified' });
    try {
      const map: QueryResult<MapsDBObject> = await dbClient.query(
        'SELECT * FROM maps WHERE map_id = $1',
        [mapId]
      );
      if (map.rowCount === 0)
        return res.json({
          status: 'err',
          message: 'Requested map does not exist',
        });
      const result = map.rows[0];
      const reqFilePath = path.join(
        __dirname,
        '../..',
        MAP_DIRECTORY_PATH,
        result.image_id + '.' + result.image_extension
      );
      res.sendFile(reqFilePath);
    } catch (e) {
      console.error(e);
      res.json({ status: 'err', message: 'Failed to get map' });
    }
  });

  app.post('/app/removemap', async (req, res) => {
    try {
      const { mapId } = req.body;

      const mapResult: QueryResult<MapsDBObject> = await dbClient.query(
        `DELETE FROM maps WHERE map_id = $1 RETURNING *`,
        [mapId]
      );
      if (mapResult.rowCount === 0)
        return res.json({
          status: 'err',
          message: 'Failed to remove map, map does not exist',
        });

      const map = mapResult.rows[0];

      const filePath = path.join(
        MAP_DIRECTORY_PATH,
        map.image_id + '.' + map.image_extension
      );
      fs.unlinkSync(filePath);
      res.json({ status: 'ok' });
    } catch (e) {
      console.error(e);
      res.json({ status: 'err', message: 'Failed to remove map' });
    }
  });

  app.post('/app/editmap', async (req, res) => {
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

      await dbClient.query(`UPDATE maps SET map_name = $1 WHERE map_id = $2`, [
        newMapName,
        mapId,
      ]);
      await dbClient.query(
        `DELETE FROM sensor_map_positions WHERE map_id = $1`,
        [mapId]
      );

      const values = [];
      for (const s of newSensors)
        values.push([s.sensorId, mapId, s.pos_x, s.pos_y]);

      const query = format(
        `INSERT INTO sensor_map_positions (sensor_id, map_id, pos_x, pos_y) VALUES %L`,
        values
      );
      await dbClient.query(query);

      res.json({ status: 'ok' });
    } catch (e) {
      console.error(e);
      res.json({ status: 'err', message: 'Failed to edit map' });
    }
  });

  // === Tiles ===
  app.post('/app/posttile', async (req: Request, res) => {
    try {
      const {
        ID,
        title,
        arg1,
        arg1_type,
        arg1_value,
        arg2,
        arg2_type,
        arg2_value,
        operation,
        parameter,
        show_graphic,
        order,
      } = req.body;

      if (
        title == undefined ||
        title.length === 0 ||
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

      if (ID !== undefined && ID !== null) {
        const tileResponse = await dbClient.query(
          `SELECT * FROM dashboard_tiles WHERE "ID" = $1`,
          [ID]
        );
        if (tileResponse.rowCount === 0)
          return res.json({
            status: 'err',
            message: 'Tile with this ID doesnt exist',
          });

        await dbClient.query(
          `UPDATE dashboard_tiles 
                SET title = $1, arg1 = $2, arg1_type = $3, arg1_value = $4, operation = $5, parameter = $6, arg2 = $7, arg2_type = $8, arg2_value = $9, show_graphic = $10
                WHERE "ID" = $11`,
          [
            title,
            arg1,
            arg1_type,
            arg1_value,
            operation,
            parameter,
            arg2,
            arg2_type,
            arg2_value,
            show_graphic,
            ID,
          ]
        );
        res.json({
          status: 'ok',
        });
      } else {
        await dbClient.query(
          `INSERT
            INTO dashboard_tiles (title, arg1, arg1_type, arg1_value, operation, parameter, arg2, arg2_type, arg2_value, show_graphic)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            title,
            arg1,
            arg1_type,
            arg1_value,
            operation,
            parameter,
            arg2 == undefined ? null : arg2,
            arg2_type == undefined ? null : arg2_type,
            arg2_value == undefined ? null : arg2_value,
            show_graphic,
          ]
        );
        res.json({
          status: 'ok',
        });
      }
    } catch (e) {
      console.error(e);
      res.json({ status: 'err', message: 'Failed to post tile' });
    }
  });

  app.get('/app/tilelist', async (req, res) => {
    try {
      const tilesResult: QueryResult<DashboardTilesDBObject> =
        await dbClient.query(`SELECT * FROM dashboard_tiles`);

      res.json({
        status: 'ok',
        data: tilesResult.rows.map((row: DashboardTilesDBObject) => ({
          ...row,
          show_graphic: !!row.show_graphic,
        })),
      });
    } catch (e) {
      console.error(e);
      res.json({
        status: 'err',
        message: 'Failed to get tiles',
      });
    }
  });

  app.post('/app/removetile', async (req: Request, res) => {
    try {
      const { tileId } = req.body;

      if (tileId == undefined)
        return res.json({
          status: 'err',
          message: 'Invalid request',
        });

      await dbClient.query(`DELETE FROM dashboard_tiles WHERE "ID" = $1`, [
        tileId,
      ]);

      res.json({
        status: 'ok',
      });
    } catch (e) {
      console.error(e);
      res.json({
        status: 'err',
        message: 'Failed to remove tile from database',
      });
    }
  });
}
