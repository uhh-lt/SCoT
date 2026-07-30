<!-- # SCoT Installation Guide

This guide is designed to help you run SCoT on your own server or local machine. You can either run it in Docker or directly on your computer.

## Installation with Docker

Clone the repository from GitHub:

```bash
$ git clone git@github.com:uhh-lt/SCoT.git
$ cd SCoT
```

Build the Docker image:

```bash
$ docker build -t scot .
```

In the `SCoT/` directory, run:

```bash
$ docker-compose up
```

The application will be running and accessible at `0.0.0.0:10020` (or `127.0.0.1:10020` depending on your configuration).

### Configuring the Database with Docker

The database configuration is managed through YAML configuration files located in `src_vue/config/`.

Create or modify your configuration in `src_vue/config/config.yaml`. 
Sample of the configuration is provided in `config_sample.yaml` file:

```yaml
# Server Configuration
flask_host: "0.0.0.0"

# Environment-specific collections
environments:
  dev:
    - collection_name_1
    - collection_name_2

# Default values to avoid repetition
defaults:
  frontend_info:
    target: "word#POS"
    p: 30
    d: 15
  es_info:
    host: "localhost"
    port: 9200
    user: "USER"
    pwd: "PWD"
  db_url: "mysql+pymysql://user:pwd@localhost:3306"
  access: "public"

# Collection configurations
collections:
  collection_name_1:
    displayname: "Display Name for Collection"
    db: "DATABASE NAME"
    frontend_info: "default"
    es_info:
      index: "index name"
```


## Installation without Docker

You can also run SCoT locally on your machine. 

### Prerequisites

- Python 3.8 or higher
- MySQL/MariaDB
- Elasticsearch (optional, for full-text search features)

### Setup

Navigate to the `src_vue` directory:

```bash
$ cd src_vue
```

Create a virtual environment (recommended):

```bash
$ python -m venv venv
$ source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install the required dependencies:

```bash
$ pip install -r requirements.txt
```

Configure your local database in `src_vue/config/config.yaml`

### Running SCoT

Start the application:

```bash
$ python scot.py
```

Access it in your browser at `127.0.0.1:5006`.

## Creating a Database

Each configured collection points to one MySQL/MariaDB database. The app queries
these tables and columns:

```sql
CREATE TABLE time_slices (
  id SMALLINT UNSIGNED NOT NULL,
  start_year SMALLINT UNSIGNED NOT NULL,
  end_year SMALLINT UNSIGNED NOT NULL ) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE similar_words (
  word1 VARCHAR(256) COLLATE utf8_bin NOT NULL ,
  word2 VARCHAR(256) COLLATE utf8_bin NOT NULL,
  score SMALLINT UNSIGNED NOT NULL,
  time_id SMALLINT UNSIGNED NOT NULL ) ENGINE=MyISAM DEFAULT CHARSET=utf8;
CREATE INDEX word1_idx ON similar_words(word1)
CREATE INDEX word2_idx ON similar_words(word2)
CREATE INDEX time_id_idx ON similar_words(time_id)

CREATE TABLE word_features (
  word1 VARCHAR(256) COLLATE utf8_bin NOT NULL,
  feature LONGTEXT NOT NULL,
  score DOUBLE UNSIGNED NOT NULL,
  freq INT(10) UNSIGNED NOT NULL,
  norm_freq_feature FLOAT(4) UNSIGNED NOT NULL,
  norm_freq_word FLOAT(4) UNSIGNED NOT NULL,
  time_id SMALLINT UNSIGNED NOT NULL ) ENGINE=MyISAM DEFAULT CHARSET=utf8;
CREATE INDEX word_idx ON word_features(word1)
CREATE INDEX time_id_idx ON word_features(time_id)

CREATE TABLE word_counts (
  word1 VARCHAR(256) COLLATE utf8_bin NOT NULL,
  freq INT(10) UNSIGNED NOT NULL,
  ppm FLOAT(4) UNSIGNED NOT NULL,
  time_id SMALLINT UNSIGNED NOT NULL ) ENGINE=MyISAM DEFAULT CHARSET=utf8;
CREATE INDEX word_idx ON word_counts(word1)
CREATE INDEX time_id_idx ON word_counts(time_id)
```

The exact column types can be adapted to your corpus, but the names above must
exist. The frontend will only be useful when `similar_words`, `word_features`,
and `word_counts` contain data for the configured target words and time slices. 

The time_slices table defines the time periods used in the graph. Each row has an id, start_year, and end_year, for example (1, 1520, 1843).

The similar_words table stores word similarity relations. It contains word1, word2, score, and time_id. For example, ('bahamas', 'crisis', 1, 5) means that bahamas and crisis are related in time slice 5 with score 1. These relations are used as graph edges.

The word_counts table stores how frequent each word is in each time slice. It contains word1, freq, ppm, and time_id. Here, freq is the raw count and ppm is the normalized frequency per million words.

The word_features table stores contextual features of words. It contains word1, feature, score, freq, and time_id. These features help explain why two words are similar, for example when they share similar dependency/context features.


## Optional Elasticsearch Index

Set `es_info: null` for a collection if you do not have document examples.
Graph exploration still works without Elasticsearch.

If `es_info` is configured, SCoT expects:

- HTTPS Elasticsearch access with basic authentication
- `host`, `port`, `user`, `pwd`, and `index` in the collection config
- Documents with `date`, `sentence`, `source`, and `time_slice`
- A nested `jobim` field containing `jo` and `bim` values

Example:

```yaml
es_info:
  host: "localhost"
  port: 9200
  user: "USER"
  pwd: "PWD"
  index: "demo_collection"
```

## Using the Sample Database

SCoT provides a small sample database dump for testing the installation.
The sample database can be found in: `../en_google_sample.sql.gz`

It contains the required SCoT tables. The sample data is only for testing. It is much smaller than the full production databases.

#### Running the Sample Database:
1) Install or start MariaDB/MySQL

Make sure MariaDB or MySQL is installed and running on your machine. You should be able to log in with: `mysql -u root -p`

2) Import the sample database

From the root directory of the SCoT repository, run: `gunzip -c db/en_google_sample.sql.gz | mysql -u root -p`. This creates a new local database called: **"en_google_sample"**

3) Configure SCoT to use the sample database

Open the SCoT configuration file: src_vue/config/config.yaml

For the sample database, use a configuration like this:
```yaml
flask_host: "0.0.0.0"

environments:
  dev:
    - en_google

defaults:
  db_url: "mysql+pymysql://root:YOUR_PASSWORD@localhost:3306"
  access: "public"

collections:
  en_google:
    displayname: "EN--Google Books Sample"
    db: "en_google_sample"
    frontend_info:
      target: "bar/NN"
      p: 10
      d: 30
    es_info: null
```

Replace YOUR_PASSWORD with your local MariaDB/MySQL password.

The final database connection will become: 
`mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/en_google_sample`


## Some Remarks on the Tech Stack

In the image below you can see the overall architecture of SCoT.

![Architecture](./images/architecture.png)


For rendering and manipulating the graph in the frontend, D3.js in combination with Vue.js is used. 

[D3.js (Data Driven Documents)](https://d3js.org/) is a JavaScript library for creating custom interactive visualizations through direct manipulation of DOM elements. It provides methods to bind data to the DOM and many different ways to manipulate the DOM elements. For SCoT, a force simulation network is used to render the graph.

For building the user interface, the JavaScript framework [Vue.js](https://vuejs.org) is used. It is incrementally adaptable and easy to get started with. Vue.js provides directives to reactively interact with the HTML, e.g. data entered via an input field can be directly modeled by or bound to JavaScript variables.
For styling the frontend [Bootstrap-Vue](https://bootstrap-vue.js.org/) has been used, a Bootstrap version developed especially for the Vue.js framework.

The backend is implemented in Python and MySQL. For accessibility reasons Python [records](https://github.com/kennethreitz/records) has been used to query the database. Records is an easy-to-use library to access most relational database types. Since SCoT only queries the database, records is sufficient.
The REST API is implemented with [Flask](https://palletsprojects.com/p/flask/), a lightwight WSGI web application framework. For deploying the Flask app, a combination of [uWSGI and nginx](https://github.com/tiangolo/uwsgi-nginx-flask-docker) is used in the Dockerfile.
To calculate the clusters in the graph, we apply the [Chinese Whispers](https://www.inf.uni-hamburg.de/en/inst/ab/lt/publications/2006-biemann-cw-textgraph.pdf) algorithm.

To calculate the similarities between words you can use e.g. [JoBimText](http://ltmaggie.informatik.uni-hamburg.de/jobimtext/).

## Troubleshooting

- **Port conflicts**: If port 10020 (Docker) or 5006 (local) is already in use, modify the configuration accordingly. Similarly, Port 3306 is the default port used by MySQL/MariaDB. If your database server uses a different port, replace 3306 with the correct port number in the db_url.
- **Database connection errors**: Verify credentials and host/port in your YAML configuration
- **Elasticsearch connection issues**: Ensure Elasticsearch is running and accessible at the configured host/port
- **Missing dependencies**: Run `pip install -r requirements.txt` again or check Python version compatibility
-->

# SCoT Installation Guide

This guide explains how to install and run SCoT on a local machine or server. SCoT can be started either with Docker or directly through a local Python environment.

Before running the application, the required services and configuration files must be prepared. This includes setting up a MySQL/MariaDB database, optionally configuring Elasticsearch, and defining the available collections in the SCoT configuration file.

Contents:
* 1) [Tech Stack](#tech-stack)
* 2) [Installation Instructions](#installation)
* 3) [Troubleshooting](#troubleshooting)

## 1) Tech Stack {#tech-stack}
In the image below you can see the overall architecture of SCoT.

![Architecture](./images/architecture.png)


For rendering and manipulating the graph in the frontend, D3.js in combination with Vue.js is used. 

[D3.js (Data Driven Documents)](https://d3js.org/) is a JavaScript library for creating custom interactive visualizations through direct manipulation of DOM elements. It provides methods to bind data to the DOM and many different ways to manipulate the DOM elements. For SCoT, a force simulation network is used to render the graph.

For building the user interface, the JavaScript framework [Vue.js](https://vuejs.org) is used. It is incrementally adaptable and easy to get started with. Vue.js provides directives to reactively interact with the HTML, e.g. data entered via an input field can be directly modeled by or bound to JavaScript variables.
For styling the frontend [Bootstrap-Vue](https://bootstrap-vue.js.org/) has been used, a Bootstrap version developed especially for the Vue.js framework.

The backend is implemented in Python and MySQL. For accessibility reasons Python [records](https://github.com/kennethreitz/records) has been used to query the database. Records is an easy-to-use library to access most relational database types. Since SCoT only queries the database, records is sufficient.
The REST API is implemented with [Flask](https://palletsprojects.com/p/flask/), a lightwight WSGI web application framework. For deploying the Flask app, a combination of [uWSGI and nginx](https://github.com/tiangolo/uwsgi-nginx-flask-docker) is used in the Dockerfile.
To calculate the clusters in the graph, we apply the [Chinese Whispers](https://www.inf.uni-hamburg.de/en/inst/ab/lt/publications/2006-biemann-cw-textgraph.pdf) algorithm.

To calculate the similarities between words you can use e.g. [JoBimText](https://jobimtext.demo.hcds.uni-hamburg.de/).

## 2) Installation Instructions {#installation}

### 2.1 Prerequisites {#prerequisites}

Before running SCoT, make sure the following requirements are available either on your local machine or on a server:

- Python 3.8 or higher
- MySQL or MariaDB
- Elasticsearch

SCoT requires at least one configured MySQL/MariaDB database. Elasticsearch is optional. If Elasticsearch is not available, graph exploration still works, but document/example-sentence search features will not be available.

### 2.2 Clone the Repository {#clone-the-repository}

Clone the SCoT repository from GitHub:

```bash
$ git clone git@github.com:uhh-lt/SCoT.git
$ cd SCoT
```

### 2.3 Setting up the Configuration file {#config-file}

After cloning the repository, create or modify your configuration in `src_vue/config/config.yaml`.

The configuration file defines: the Flask host, available collections,
database and Elastic Search settings and frontend defaults. 

Sample of the configuration is provided in `config_sample.yaml` file:

```yaml
# Server Configuration
flask_host: "0.0.0.0" (for Docker)   #localhost otherwise

# Environment-specific collections
environments:
  dev:
    - collection_name_1
    - collection_name_2

# Default values to avoid repetition
defaults:
  frontend_info:
    target: "word#POS"   # <- Target word as stored in the DB; how the corpus was dependency-parsed, this can be word/POS, word#POS, or simply word.
    p: 30
    d: 15
  es_info:
    host: "localhost"
    port: 9200
    user: "USER"
    pwd: "PWD"
  db_url: "mysql+pymysql://user:pwd@localhost:3306"
  access: "public"

# Collection configurations
collections:
  collection_name_1:
    displayname: "Display Name for Collection"
    db: "database name"
    frontend_info: "default"
    es_info:
      index: "ES index name"
```

### 2.4 Prepare the Database {#prepare-the-database}

Each configured collection points to one MySQL/MariaDB database. The app queries
these tables and columns:

```sql
CREATE TABLE time_slices (
  id SMALLINT UNSIGNED NOT NULL,
  start_year SMALLINT UNSIGNED NOT NULL,
  end_year SMALLINT UNSIGNED NOT NULL ) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE similar_words (
  word1 VARCHAR(256) COLLATE utf8_bin NOT NULL ,
  word2 VARCHAR(256) COLLATE utf8_bin NOT NULL,
  score SMALLINT UNSIGNED NOT NULL,
  time_id SMALLINT UNSIGNED NOT NULL ) ENGINE=MyISAM DEFAULT CHARSET=utf8;
CREATE INDEX word1_idx ON similar_words(word1)
CREATE INDEX word2_idx ON similar_words(word2)
CREATE INDEX time_id_idx ON similar_words(time_id)

CREATE TABLE word_features (
  word1 VARCHAR(256) COLLATE utf8_bin NOT NULL,
  feature LONGTEXT NOT NULL,
  score DOUBLE UNSIGNED NOT NULL,
  freq INT(10) UNSIGNED NOT NULL,
  norm_freq_feature FLOAT(4) UNSIGNED NOT NULL,
  norm_freq_word FLOAT(4) UNSIGNED NOT NULL,
  time_id SMALLINT UNSIGNED NOT NULL ) ENGINE=MyISAM DEFAULT CHARSET=utf8;
CREATE INDEX word_idx ON word_features(word1)
CREATE INDEX time_id_idx ON word_features(time_id)

CREATE TABLE word_counts (
  word1 VARCHAR(256) COLLATE utf8_bin NOT NULL,
  freq INT(10) UNSIGNED NOT NULL,
  ppm FLOAT(4) UNSIGNED NOT NULL,
  time_id SMALLINT UNSIGNED NOT NULL ) ENGINE=MyISAM DEFAULT CHARSET=utf8;
CREATE INDEX word_idx ON word_counts(word1)
CREATE INDEX time_id_idx ON word_counts(time_id)
```

The exact column types can be adapted to your corpus, but the names above must
exist. The frontend will only be useful when `similar_words`, `word_features`,
and `word_counts` contain data for the configured target words and time slices. 

The time_slices table defines the time periods used in the graph. Each row has an id, start_year, and end_year, for example (1, 1520, 1843).

The similar_words table stores word similarity relations. It contains word1, word2, score, and time_id. For example, ('bahamas', 'crisis', 1, 5) means that bahamas and crisis are related in time slice 5 with score 1. These relations are used as graph edges.

The word_counts table stores how frequent each word is in each time slice. It contains word1, freq, ppm, and time_id. Here, freq is the raw count and ppm is the normalized frequency per million words.

The word_features table stores contextual features of words. It contains word1, feature, score, freq, and time_id. These features help explain why two words are similar, for example when they share similar dependency/context features.

SCoT provides a small sample database dump for testing the installation. [Use Sample Database](#using-the-sample-database)

## Installation with Docker

After the database and configuration file are prepared, SCoT can be started with Docker.

Build the Docker image:

```bash
$ docker build -t scot .
```

In the `SCoT/` directory, run:

```bash
$ docker-compose up
```

The application will be running and accessible at `0.0.0.0:10020` (or `127.0.0.1:10020` depending on your configuration).

## Installation without Docker

You can also run SCoT locally on your machine. 


Navigate to the `src_vue` directory:

```bash
$ cd src_vue
```

Create a virtual environment (recommended):

```bash
$ python -m venv venv
$ source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install the required dependencies:

```bash
$ pip install -r requirements.txt
```


#### Running SCoT

Start the application:

```bash
$ python scot.py
```

Access it in your browser at `127.0.0.1:5000`.



## Optional Elasticsearch Index

Set `es_info: null` for a collection if you do not have document examples.
Graph exploration still works without Elasticsearch.

If `es_info` is configured, SCoT expects:

- HTTPS Elasticsearch access with basic authentication
- `host`, `port`, `user`, `pwd`, and `index` in the collection config
- Documents with `date`, `sentence`, `source`, and `time_slice`
- A nested `jobim` field containing `jo` and `bim` values

Example:

```yaml
es_info:
  host: "localhost"
  port: 9200
  user: "USER"
  pwd: "PWD"
  index: "demo_collection"
```

## Using the Sample Database {#using-the-sample-database}

SCoT provides a small sample database dump for testing the installation.
The sample database can be found in: `../en_google_sample.sql.gz`

It contains the required SCoT tables. The sample data is only for testing. It is much smaller than the full production databases.

#### Running the Sample Database:
1) Install or start MariaDB/MySQL

Make sure MariaDB or MySQL is installed and running on your machine. You should be able to log in with: `mysql -u root -p`

2) Import the sample database

From the root directory of the SCoT repository, run: `gunzip -c en_google_sample.sql.gz | mysql -u root -p`. This creates a new local database called: **"en_google_sample"**

3) Configure SCoT to use the sample database

Open the SCoT configuration file: src_vue/config/config.yaml

For the sample database, use a configuration like this:
```yaml
flask_host: "0.0.0.0" (for Docker)   #localhost otherwise

environments:
  dev:
    - en_google

defaults:
  db_url: "mysql+pymysql://USER:YOUR_PASSWORD@localhost:3306"
  access: "public"

collections:
  en_google:
    displayname: "EN--Google Books Sample"
    db: "en_google_sample"
    frontend_info:
      target: "bar/NN"
      p: 10
      d: 30
    es_info: null
```

Replace USER and YOUR_PASSWORD with your local MariaDB/MySQL user & password.

The final database connection will become: 
`mysql+pymysql://USER:YOUR_PASSWORD@localhost:3306/en_google_sample`


## Troubleshooting

- **Port conflicts**: If port 10020 (Docker) or 5000 (local) is already in use, modify the configuration accordingly. Similarly, Port 3306 is the default port used by MySQL/MariaDB. If your database server uses a different port, replace 3306 with the correct port number in the db_url.
- **Database connection errors**: Verify credentials and host/port in your YAML configuration
- **Elasticsearch connection issues**: Ensure Elasticsearch is running and accessible at the configured host/port
- **Missing dependencies**: Run `pip install -r requirements.txt` again or check Python version compatibility
