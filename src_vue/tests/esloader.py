
import csv
from datetime import datetime
from elasticsearch import Elasticsearch
import json

def main():
    # settings
    es = Elasticsearch([{'host': '127.0.0.1', 'port': 9200}])
    indexname = "corona_news"
    importfile = "./news.csv"
    
    # read docs
    docs = []
    with open(importfile, newline='', encoding="UTF-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if (row['publish_date'][:2]=="20"):
                docs.append([row['publish_date'], row['title'], row['url']])
    print(docs[0])
    # put docs into time-ids collections
    timedocs={}
    timedocs[1] = [(x[0], x[1], x[2]) for x in docs[100:2100]]
    timedocs[2] = [(x[0], x[1], x[2]) for x in docs[2100:4100]]
    timedocs[3] = [(x[0], x[1], x[2]) for x in docs[4100:6100]]
    time_slices = ["20200126-20200323", "20200324-20200411", "20200412-20200428"]

    # push to elasticsearch
    
    for k in timedocs.keys():
        for dok in timedocs[k]:
            doc = {
                'jos': dok[1],
                'bims': dok[1],
                'sentence': dok[1],
                'source': dok[2],
                'date': dok[0],
                'time_slice': time_slices[k-1]
            }
            es.index(index=indexname, body=doc)
    es.indices.refresh(index=indexname)


if __name__ == "__main__":
    main()
