from datetime import datetime
from elasticsearch import Elasticsearch
import json


class Documentdb:

    def __init__(self, el_host, el_port):
        
        try:
            self.es = Elasticsearch([{'host': el_host, 'port': el_port}])
        except:
            print("in documentdb init exception occured in es")

    def search(self, jo, bim, es_index="corona_news"):
        self.es.indices.refresh(index=es_index)
        jobim = jo + "@" + bim
        res = self.es.search(index=es_index, 
            body={
                "query": {
                    "bool":{
                        "must":{
                            "match": {
                                "bims":
                                {"query": jobim,
                                }
                            }
                        }
                    }
                }
            }
        )
        #print(res)
        return res