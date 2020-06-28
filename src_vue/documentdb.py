from datetime import datetime
from elasticsearch import Elasticsearch
import json


class Documentdb:

    def __init__(self):
        try:
            self.es = Elasticsearch()
        except:
            print("exceptino occured in es")

    def search(self, word1, word2, collection="corona_news"):
        self.es.indices.refresh(index=collection)
        query = word1 + " " + word2
        res = self.es.search(index=collection, 
                body={"query": 
                      {"match": 
                       {"text": 
                        {"query": query, "operator": "and"}
                       }
                      }
                     }
               )
        #print(res)
        return res