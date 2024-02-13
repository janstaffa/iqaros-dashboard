CREATE TABLE IF NOT EXISTS "sensors" (
	"sensor_id" INT UNIQUE,
	"network_id" INT UNIQUE,
	"sensor_name" TEXT,
	PRIMARY KEY("sensor_id")
);

CREATE TABLE IF NOT EXISTS "sensor_data" (
	"ID" BIGSERIAL UNIQUE,
	"sensor_id" INT,
	"timestamp" TIMESTAMPTZ,
	"parameter" TEXT,
	"value" REAL,
	PRIMARY KEY("ID"),
	FOREIGN KEY ("sensor_id") REFERENCES "sensors"("sensor_id")
);

CREATE TABLE IF NOT EXISTS "sensor_groups" (
	"group_id" SERIAL UNIQUE,
	"group_name" TEXT,
	"group_color" TEXT,
	PRIMARY KEY("group_id")
);

CREATE TABLE IF NOT EXISTS "sensors_in_groups" (
	"ID" SERIAL UNIQUE,
	"sensor_id" INTEGER,
	"group_id" INTEGER,
	PRIMARY KEY("ID"),
	FOREIGN KEY ("group_id") REFERENCES "sensor_groups"("group_id") ON DELETE CASCADE,
	FOREIGN KEY ("sensor_id") REFERENCES "sensors"("sensor_id")
);

CREATE TABLE IF NOT EXISTS "maps" (
	"map_id" SERIAL UNIQUE,
	"map_name" TEXT,
	"image_id" TEXT UNIQUE,
	"image_width" INTEGER,
	"image_height" INTEGER,
	"original_image_name" TEXT,
	"image_extension" TEXT,
	"timestamp" TIMESTAMPTZ,
	PRIMARY KEY("map_id")
);

CREATE TABLE IF NOT EXISTS "sensor_map_positions" (
	"ID" SERIAL UNIQUE,
	"sensor_id" INTEGER,
	"map_id" INTEGER,
	"pos_x" REAL,
	"pos_y" REAL,
	PRIMARY KEY("ID"),
	FOREIGN KEY ("map_id") REFERENCES "maps"("map_id") ON DELETE CASCADE,
	FOREIGN KEY ("sensor_id") REFERENCES "sensors"("sensor_id")
);

CREATE TABLE IF NOT EXISTS "dashboard_tiles" (
	"ID" SERIAL UNIQUE,
	"order" INTEGER,
	"title" TEXT,
	"arg1" INTEGER,
	"arg1_type" INTEGER,
	"arg1_value" INTEGER,
	"arg2" INTEGER,
	"arg2_type" INTEGER,
	"arg2_value" INTEGER,
	"operation" INTEGER,
	"parameter" INTEGER,
	"show_graphic" BOOLEAN DEFAULT false,
	PRIMARY KEY("ID")
);