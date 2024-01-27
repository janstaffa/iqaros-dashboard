# API

1. Získej poslední naměřenou hodnotu

```
/api/fetch_latest?sensorId=x,y,z...
```

2. Získej data v rozmezí

```ts
/api/fetch_data?sensorId=x,y,z...&from=a&to=b
(a/b = unix timestamp)


{
	serverTime: Date;
	from: Date;
	to: Date;
	sensors: [
		{
			sensorId: number;
			sensorName: string;
			sensorTemperatures: {}[];
			sensorHumidity: number;
			sensorRSSI: number;
			sensorVoltage: number;
		}
		...
	]
}
```

3. Získej seznam senzorů

```ts
/api/sensorlist

{
	serverTime: Date;
	sensors: [
		{
			sensorId: number;
			networkId: number;
			sensorName: string;
			sensorTemperature: number;
			sensorHumidity: number;
			sensorRSSI: number;
			sensorVoltage: number;
		}
		...
	]
}
```
