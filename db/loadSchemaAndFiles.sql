DROP DATABASE IF EXISTS scot;
CREATE DATABASE scot CHARACTER SET utf8 COLLATE utf8_general_ci;

USE scot;

DROP TABLE IF EXISTS time_slices;
CREATE TABLE time_slices (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    start_year SMALLINT UNSIGNED NOT NULL,
    end_year SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (id)
);

# SET MYSQL-ENGINE googlen -> MysISAM ist wohl schneller

#LOAD DATA INFILE '/var/lib/mysql-files/datahub/time_slices.csv' 
#INTO TABLE time_slices 
#FIELDS TERMINATED BY ',' 
#ENCLOSED BY '"'
#LINES TERMINATED BY '\n';

DROP TABLE IF EXISTS similar_words;
CREATE TABLE similar_words (
    word1 VARCHAR(64) NOT NULL,
    word2 VARCHAR(64) NOT NULL,
    score INT UNSIGNED NOT NULL,
    time_id INT UNSIGNED NOT NULL
);

#LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim1.csv' 
#INTO TABLE similar_words 
#FIELDS TERMINATED BY ',' 
#ENCLOSED BY '"'
#LINES TERMINATED BY '\n';

#LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim2.csv' 
#INTO TABLE similar_words 
#FIELDS TERMINATED BY ',' 
#ENCLOSED BY '"'
#LINES TERMINATED BY '\n';

#LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim3.csv' 
#INTO TABLE similar_words 
#FIELDS TERMINATED BY ',' 
#ENCLOSED BY '"'
#LINES TERMINATED BY '\n';

#LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim4.csv' 
#INTO TABLE similar_words 
#FIELDS TERMINATED BY ',' 
#ENCLOSED BY '"'
#LINES TERMINATED BY '\n';

#LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim5.csv' 
#INTO TABLE similar_words 
#FIELDS TERMINATED BY ',' 
#ENCLOSED BY '"'
#LINES TERMINATED BY '\n';

#LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim6.csv' 
#INTO TABLE similar_words 
#FIELDS TERMINATED BY ',' 
#ENCLOSED BY '"'
#LINES TERMINATED BY '\n';

#LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim7.csv' 
#INTO TABLE similar_words 
#FIELDS TERMINATED BY ',' 
#ENCLOSED BY '"'
#LINES TERMINATED BY '\n';

#LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim8.csv' 
#INTO TABLE similar_words 
#FIELDS TERMINATED BY ',' 
#ENCLOSED BY '"'
#LINES TERMINATED BY '\n';


#CREATE INDEX word1_idx ON similar_words(word1);
#CREATE INDEX word2_idx ON similar_words(word2);

#CREATE INDEX time_id_idx ON similar_words(time_id);