# IQAROSDASH

## O aplikaci

Cílem aplikace je zobrazit velké množství dat nasbíraných senzory IQAROS inteligentně, efektivně a přehledně. Je myšlena jak pro administrátory, tak pro koncové uživatele, ale i pro vývojáře dalšího softwaru, díky tomu, že nabízí jednoduché a zdokumentované REST API. Aplikace se primárně soustředí na intuitivní uživatelské rozhraní.
[více](./IQAROSDASH.pdf)

## Jak spustit (pomocí Dockeru)

### 1. Nainstalovat Docker

- [Docker desktop Windows](https://docs.docker.com/desktop/install/windows-install/)
- [Docker desktop Linux](https://docs.docker.com/desktop/install/linux-install/)
- [Docker engine](https://docs.docker.com/engine/install/)

<br/>

### 2. Spustit

_Pozor, Docker aplikace vyžaduje procesor s podporou AVX! (Kromě Intel Celeron a Pentium skoro všechny)_

```sh
# cd to project root
cd iqaros-dashboard

# run Docker app
docker compose up -d

# show logs (optional)
docker compose logs -f
```

<br/>
<br/>

## Jak spustit (samostatně)

### 1. Nainstalovat a spustit potřebný software

- a) PostgreSQL DB - [download](https://www.postgresql.org/download/) (defaultní port, vytvořit uživatele - v dalším kroku budou potřeba údaje)
- b) Redis - [download](https://redis.io/docs/install/install-redis/) (defaultní port, heslo - bude potřeba v dalším kroku)
- c) Mosquitto - [download](https://mosquitto.org/download/)
	- vytvořit `mosquitto_password` soubor s heslem a zadat jeho cestu do `mosquitto/mosquitto.conf` místo `/etc/mosquitto/mosquitto_passwd` [více](https://mosquitto.org/documentation/authentication-methods/)
	- spustit: `mosquitto -c mosquitto/mosquitto.conf -v`

### 2. Nastavit enviromental variables serveru

- a) Přejmenovat soubor `/server/.env.example` na `/server/.env` a vyplnit proměnné
- b) Přidat `NODE_ENV=production`
- c) Přidat `POSTGRES_DB=?`, `POSTGRES_PASSWORD=?`, `POSTGRES_USER=?`, `REDIS_PASSWORD=?, MOSQUITTO_USERNAME=?, MOSQUITTO_PASSWORD=?` (místo ? přihlašovací údaje Postgres, Redis a Mosquitto)

### 3. Spustit server

```sh
cd server

mkdir -p /server/userdata/upload/maps

npm install

npm run build

node dist/index.js
```

### 4. Spustit webovou aplikace

Nastavit v [config.ts](https://github.com/janstaffa/iqaros-dashboard/blob/d1eefed88d049612d303f7d911edf8efcd695f13/web/src/config.ts#L3) SERVER_HOST/SERVER_PORT na správné hodnoty (server defaultně běží na portu 8080) 
```sh
cd web

npm install

npm run start # lokální server (pouze pro vývoj)
```

<br/>

**Spuštění na webovém serveru**

- Nginx
- Xampp

```sh
npm run build
```

Zkopírovat `web/build` do webové složky serveru (př. Apache = htdocs)
