
import csv
from datetime import datetime
from elasticsearch import Elasticsearch
import json

def main():
    # settings
    es = Elasticsearch([{'host': '127.0.0.1', 'port': 9292}])
    indexname = "fi_news_dep"
    importfile = "C:/Users/hitec_c/Documents/finnews_dep_wft.txt"
    # start and end rows are included in the dataset
    start = 25000
    end = 25000
    
    # read docs use counter as additional id to start and stop pushing to elasticsearch
    docs = []

    with open(importfile, newline='', encoding="UTF-8") as f:
        reader = csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE)
        counter = 0
        for row in reader:
            if counter >= start:
                ############### parse
                josi = row[0]
                jos = josi.split("<>")
                #print("jos", jos)
                bimsi = row[1]
                bims = bimsi.split("<>")
                #print("bims", bims)
                source = row[2]
                #print("source", source)
                sentence = row[3]
                #print("sentence", sentence)
                time_slice = row[4]
                #print("time_slice", time_slice)
        
                ######### index in es
                doc = {
                    'jos': jos,
                    'bims': bims,
                    'sentence': sentence,
                    'source': source,
                    'date': time_slice,
                    'time_slice': time_slice
                }
                es.index(index=indexname, body=doc)
        
            ##### count and break
            if counter >=end:
                break
            counter += 1
        es.indices.refresh(index=indexname)


if __name__ == "__main__":
    main()
