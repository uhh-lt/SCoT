#Installation Guide

This guide is designed to help you run SCoT on your own server or local machine. You can either run it in Docker or just plain directly on your computer.

## Installation with Docker
Just clone the repository from GitHub. In the SCoT/ directory type
```
$ docker-compose up
```
into your console and the whole things should be running.

## Configuring the Database with Docker
For test purposes you can use the dump.sql in the db/ directory as your database.
For this, provide this file as an entrypoint for Docker database in the `docker-compose.yml` and provide a directory in which the Docker volume will be stored on your local machine (here it's ./db/data).
```yaml
 db:
    image: mariadb:10.4.6
    volumes:
      - ./db/dump.sql:/docker-entrypoint-initdb.d/dump.sql
      - ./db/data:/var/lib/mysql
      # "database" : "mysql://user:password@db/scot" (config.json)
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: scot
      MYSQL_USER: user
      MYSQL_PASSWORD: password
    networks:
      scot-net:
```
Your config.json should look like this:
```json
{
	"host" : "0.0.0.0",
	"database" : "mysql://user:password@db/scot"
}
```
Feel free to connect your own database to SCoT. Make sure to follow the `schema.sql` when creating your database.

One trick to create a dump.sql is to build an .sql file yourself identical to the provided dump.sql, if your data - like mine - is distributed across multiple databases. You can then use that .sql file as an entrypoint for Docker and create a new volume from it.


## Installation without Docker
You can also run SCoT locally on your machine. This is especially nice vor development purposes. Install the `requirements.txt` via `pip` on your computer or create a venv to run SCoT in and only install the dependencies there.

## Configuring the Database without Docker
You can specify your local MySQL database via the config.json. This is my config.json for connecting to by local development database:
```json
{
	"host" : "0.0.0.0",
	"database" : "mysql://inga@0.0.0.0/scot"
}
```

## Creating a Database
In order for your database to work with SCoT it needs to follow a certain shema:
```sql
DROP DATABASE IF EXISTS scot;
CREATE DATABASE scot;

USE scot;

DROP TABLE IF EXISTS time_slices;
CREATE TABLE time_slices (
	id INT UNSIGNED NOT NULL AUTO_INCREMENT,
	start_year SMALLINT UNSIGNED NOT NULL,
	end_year SMALLINT UNSIGNED NOT NULL,
	PRIMARY KEY (id)
);

DROP TABLE IF EXISTS similar_words;
CREATE TABLE similar_words (
	word1 VARCHAR(64) NOT NULL,
	word2 VARCHAR(64) NOT NULL,
	score INT UNSIGNED NOT NULL,
	time_id INT UNSIGNED NOT NULL REFERENCES time_slices(id),
	PRIMARY KEY (id)
);

CREATE INDEX word1_idx ON similar_words(word1);
CREATE INDEX word2_idx ON similar_words(word2);
```
When creating an sql dump for creating a Docker volume you do not need to include the first three lines - Docker does that for you.

As for the data: you need collocations of the target word and the collocations of the target word's collocations. You also need time slices for when these collocations occur as well as a score (e.g. number of occurrance) between them. In the table "time_slices", the start and end years are numbers like *1520*. A row in the "similar_words" table would look like this *('bahamas', 'crisis', 1, 1)*. For an edge to appear in the graph between *bahamas* and one of its collocations, there needs to be an entry with *bahamas* as word2.

## Some Remarks to the Tech Stack
### D3.js
### Vue.js
### Flask
### Records