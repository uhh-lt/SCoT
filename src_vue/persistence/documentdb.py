from datetime import datetime
from elasticsearch import Elasticsearch
from elasticsearch.helpers import scan
import json


def construct_query(jo, bim, time_slices=None):
    if time_slices is None:
        return {
                     "nested": {
                         "path": "jobim",
                         "query": {
                             "bool": {
                                 "must": [
                                     {"match": {"jobim.jo": jo}},
                                     {"match": {"jobim.bim": bim}}
                                 ]
                             }
                         }
                     }
             }
    else:
        return {
                "bool": {
                  "must": [
                    {
                      "nested": {
                        "path": "jobim",
                        "query": {
                             "bool": {
                                 "must": [
                                     {"match": {"jobim.jo": jo}},
                                     {"match": {"jobim.bim": bim}},
                                 ]
                             }
                         }
                      }
                    },
                    {
                      "bool": {
                          "should":[{"match":{"time_slice":time_slice}} for time_slice in time_slices]
                        }
                    }
                  ]
                }
             }


class Documentdb:

    def __init__(self, el_host, el_port):

        try:
            self.es = Elasticsearch([{'host': el_host, 'port': el_port}],
                                    timeout=30, max_retries=3, retry_on_timeout=True)
        except:
            print("in documentdb init exception occured in es")

    def search(self, jo, bim, time_slices=None, es_index="corona_news"):

        query = construct_query(jo, bim, time_slices)

        self.es.indices.refresh(index=es_index)
        res = self.es.search(index=es_index,
                             body={"size":5000,
                             "query":query}
                             )
        # print(res)
        return res

    def scroll(self, jo, bim, time_slices=None, es_index="corona_news"):

        query = construct_query(jo, bim, time_slices)
        self.es.indices.refresh(index=es_index)
        res = []
        d = 0
        for hit in scan(self.es, index=es_index, query={"query": query}):
            res.append(hit)
            # d += 1
          # print(hit["_source"]['date'])
          #   yield hit["_source"]
        # print(res)
        return res
