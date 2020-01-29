#python insertdb.py sorted_all_years.tsv
import csv
import MySQLdb
import sys

db = MySQLdb.connect(   host = "ltcpu1",
                        user = "root",
                        passwd = "root",
                        db = "scot")
cursor = db.cursor()
filename = sys.argv[1]
#query = 'INSERT INTO similar_words(word1,word2,score,time_id,feature) VALUES(%s, %s, %s, %s,%s)'
query = 'INSERT INTO similar_words(word1,word2,score,time_id) VALUES(%s, %s, %s, %s)'
my_data = []
count = 0
#with open('/srv/data/scot/uniq_sort_dup_1909_1953_sim.csv') as csvfile:
with open('/srv/data/scot/'+filename) as csvfile:
#    readCSV = csv.reader(csvfile, delimiter=',')
  readCSV = csv.reader(csvfile, delimiter='\t')

  for row in readCSV:
    count += 1
    my_data.append(tuple(row))
    if count % 1000000 == 0: # IT depends on your machine Memory
       print(count)
       cursor.executemany(query, my_data)
       my_data = []
       count = 0
   # for row in readCSV:
    #   if count >
     #  my_data.append(tuple(row))

print ("Start inserting...")
cursor.execute('SET autocommit = 0')
cursor.executemany(query, my_data)
cursor.close()
print ("Done")