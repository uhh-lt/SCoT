from datetime import datetime
from elasticsearch import Elasticsearch
from elasticsearch.helpers import scan
import json
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

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

    def __init__(self, el_host, el_port, el_auth):

        try:
            self.es = Elasticsearch(f"https://{el_host}:{el_port}",
                                    basic_auth=el_auth,
                                    verify_certs=False,
                                    request_timeout=30, max_retries=3, retry_on_timeout=True)

        except Exception as ex:
            print("in documentdb init exception occurred in es")
            print("Exception: ", ex)

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
