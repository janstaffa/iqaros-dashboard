export interface IQAROS_Response {
  mType: string;
  data: {
    msgId: string;
    rsp: {
      nAdr: number;
      hwpId: number;
      rCode: number;
      dpaVal: number;
      result: {
        sensors: MQTTSensorData[];
      };
    };
    raw: MQTTRawData[];
    insId: string;
    statusStr: string;
    status: number;
  };
}

export interface MQTTSensorData {
  nAdr: number;
  sensor: {
    id: string;
    type: number;
    name: string;
    shortName: string;
    value: number;
    unit: string;
    decimalPlaces: number;
  };
}

interface MQTTRawData {
  request: string;
  requestTs: Date;
  confirmation: string;
  confirmationTs: Date;
  response: string;
  responseTs: Date;
}

export enum SensorDataParameter {
  Temperature,
  Humidity,
  RSSI,
  Voltage,
  ExtraLowVoltage,
}
export interface SensorData {
  sensorId: number;
  networkId: number;
  parameter: SensorDataParameter;
  data: SensorDataPayload;
}

export interface MapsDBObject {
  map_id: number;
  map_name: string;
  image_id: string;
  image_width: number;
  image_height: number;
  original_image_name: string;
  image_extension: string;
  timestamp: number;
}

export interface SensorMapPositionsDBObject {
  ID: number;
  sensor_id: number;
  map_id: number;
  pos_x: number;
  pos_y: number;
}

export interface SensorDBObject {
  sensor_id: number;
  network_id: number;
  sensor_name: string;
}

export interface SensorDataAll {
  temperature: SensorDataPayload;
  humidity: SensorDataPayload;
  rssi: SensorDataPayload;
  voltage: SensorDataPayload;
}

export interface SensorDataPayload {
  value: number;
  timestamp: number;
}
