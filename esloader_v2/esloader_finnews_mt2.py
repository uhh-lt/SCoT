
import csv
from datetime import datetime
from elasticsearch import Elasticsearch
import json
import sys
import argparse
import os
from multiprocessing import Process
from elasticsearch.helpers import bulk
from elasticsearch.helpers import streaming_bulk
import tqdm
import urllib3

def parserthreadfunc(esserver, esport, esindex, indexfile, start, end, workerid):
   
    
    # read docs & pushing to elasticsearch
    def generate():
        with open(indexfile, newline='', encoding="UTF-8") as f:
            reader = csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE)
            # skip first rows until start
            for i in range(start):
                next(reader)
            counter = start
            #printcounter = 0
            for row in reader:
                ############### parse
                # jo - field is ignored (duplicate information to jobim field)
                #josi = row[0]
                #jos = josi.split("<>")
                # jobim field is parsed into jo-bims (seperatedly searchable)
                jobimsdb = row[1]
                jobims = jobimsdb.split("<>")
                jobimsES = []
                for jobim in jobims:
                    #print(jobim, counter)
                    jobs = jobim.split("@") 
                    jo = jobs[0]
                    if len(jobs)>1:
                        bim = jobs[1]
                    else:
                        bim = ""
                    jobimsES.append({"jo": jo, "bim": bim})
                # source field
                source = row[2]
                # text field
                sentence = row[3]
                #time-slice field = date field with this text file
                time_slice = row[4]
                # no date field with these two txt files
        
                ######### index in es

                doc = { "_index": esindex,
                "_id": counter,
                "_doc": {
                    'jobim': jobimsES,
                    'sentence': sentence,
                    'source': source,
                    'date': time_slice,
                    'time_slice': time_slice
                    }
                }
            
                #print (doc)
            
            ##### count and log
            #printcounter += 1
            #if (printcounter == 10):
                #now = datetime.now()
                #date_time = now.strftime("%m/%d/%Y, %H:%M:%S")
                #print("indexing importfile ", indexfile, "line number", counter, "to es index", esindex)
                #string = "indexing importfile " + indexfile + " line number " + str(counter) + "\n"
                #log.write(string)
                #printcounter = 0
            #es.indices.refresh(index=esindex)
                counter += 1
                if counter >= end:
                    break
                
                yield doc
                
     # settings
    es = Elasticsearch([{'host': esserver, 'port': esport}])
    #log = open(logfile, "a")
    print("Worker", workerid, "indexing documents...")
    successes = 0
    for ok, action in streaming_bulk(
        client=es, actions=generate(),
    ):
        successes += ok
    print("worker", workerid, "indiziert", successes)

def main(esserver, esport, esindex, indexfile, start, end, workers):
    # Param: importfile - file to index - in line - tab format like finnews.txt
    # Param: start - line to start from file (just in case it has been stopped at some point)
    # param: indexname - elasticsearch index to use
    interval = int(end) - int(start)
    workerinterval = int (interval / workers)
    workerid = 0
    for work in range(workers):
        startw = int(start) + work * workerinterval
        endw = int(start) + (work +1) * workerinterval +1
        print("workerid", workerid, startw, endw)
        p = Process(target=parserthreadfunc, args=(esserver, esport, esindex, indexfile, startw, endw, workerid))
        p.start()
        workerid += 1
    

def create_arg_parser():
    # Creates and returns the ArgumentParser object
    parser = argparse.ArgumentParser(description='scot-helper loads tab-sep lines from txt-file and pushes to elasticsearch.')
    parser.add_argument('esserver',
                    help='elastic host address or name')
    parser.add_argument('esport',
                    help='elastic port')
    parser.add_argument('esindex',
                    help='name of asticsearch index')
    parser.add_argument('indexfile',
                    help='Path to the input file file.txt.')
    parser.add_argument('start',
                    help='start indexing at line')
    parser.add_argument('end',
                    help='end indexing at line')
    #parser.add_argument('logfile',
    #                help='path to logfile ie \dir\file.txt')
    #parser.add_argument('workers',
    #                help='number of workers')
    
    return parser

if __name__ == "__main__":
    # user needs to enter elastic_server[dockername or Ip], es-index-name, file-to-indes, start, end
    # read file to index[1] and start[2]
    arg_parser = create_arg_parser()
    parsed_args = arg_parser.parse_args(sys.argv[1:])
    print("esserver", parsed_args.esserver)
    # eserver = "elasticsearch"
    print("esport", parsed_args.esport)
    # esport = "9200"
    print("esindex", parsed_args.esindex)
    #esindex = "test3"
    print("indexfile", parsed_args.indexfile)
    #indexfile = "C:/Users/hitec_c/Documents/finnews_dep_wft.txt"
    print("start", parsed_args.start)
    print("end", parsed_args.end)
    #print("logfile", parsed_args.logfile)
    # logfile = "C:/Users/hitec_c/Documents/finnews_log.txt"
    #print("workers number", parsed_args.workers)
    workers = 50
    main(parsed_args.esserver, parsed_args.esport, parsed_args.esindex, parsed_args.indexfile, parsed_args.start, parsed_args.end, workers)
