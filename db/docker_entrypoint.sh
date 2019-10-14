#!/bin/sh
mysql -uroot -proot < /tmp/loadSchemaAndFiles.sql
mysql -uroot -proot scot -e "LOAD DATA INFILE '/var/lib/mysql-files/datahub/time_slices.csv' INTO TABLE time_slices FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n';"
mysql -uroot -proot scot -e "LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim1.csv' INTO TABLE similar_words FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';"
#mysql -uroot -proot scot -e "LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim2_10000.csv' INTO TABLE similar_words FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';"

#mysql -uroot -proot scot -e "LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim3_10000.csv' INTO TABLE similar_words FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';"

#mysql -uroot -proot scot -e "LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim4_10000.csv' INTO TABLE similar_words FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';"

#mysql -uroot -proot scot -e "LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim5_10000.csv' INTO TABLE similar_words FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';"

#mysql -uroot -proot scot -e "LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim6_10000.csv' INTO TABLE similar_words FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';"

#mysql -uroot -proot scot -e "LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim7_10000.csv' INTO TABLE similar_words FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';"

#mysql -uroot -proot scot -e "LOAD DATA INFILE '/var/lib/mysql-files/datahub/sim8_10000.csv' INTO TABLE similar_words FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';"

mysql -uroot -proot scot -e "CREATE INDEX word1_idx ON similar_words(word1);"
mysql -uroot -proot scot -e "CREATE INDEX word2_idx ON similar_words(word2);"
mysql -uroot -proot scot -e "CREATE INDEX time_id_idx ON similar_words(time_id);"