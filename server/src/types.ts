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
}
export interface SensorData {
  sensorId: number;
  networkId: number;
  parameter: SensorDataParameter;
  value: number;
  timestamp: number;
}
