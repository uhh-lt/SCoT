
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
from elasticsearch.helpers import parallel_bulk
import urllib3
import logging

def parserthreadfunc(esserver, esport, esindex, indexfile, start, end, parsetype, workerid, step, filestartid):
    # settings
    es = Elasticsearch([{'host': esserver, 'port': esport}])
    # read docs & pushing to elasticsearch
    with open(indexfile, newline='', encoding="UTF-8") as f:
        reader = csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE)
        # move from filestartid to start
        # precondition start >= filestartid
        for i in range(start - filestartid):
            try:
                next(reader)
            except:
                continue
        # counter
        # idx is used for id
        idx = start
        # bulkcounter is used for logging and bulkindexing
        bulkcounter = 0
        # bulk  - list 
        bulki = []
        # count of succesfully uploaded bulks
        successes = 0
        
        for row in reader:
            # interval does not include end
            if idx >= end:
                break
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
            # de70 [1995, 1999]
            if parsetype=="de70":
                time_slice = row[4][1:5]+"-"+row[4][-5:-1]
            # fin 1995-1999
            else:
                time_slice = row[4]

            # no date field with these two txt files
        
            ######### index in es

            doc = { "_index": esindex,
                "_id": idx,
                "_source": {
                    'jobim': jobimsES,
                    'sentence': sentence,
                    'source': source,
                    'date': time_slice,
                    'time_slice': time_slice
                    }
                }
            
            #print (doc)
            
            ### bulk count and log
            bulkcounter += 1
            bulki.append(doc)

            if (bulkcounter == step):
                #now = datetime.now()
                #date_time = now.strftime("%m/%d/%Y, %H:%M:%S")
                print("indexing importfile " + str(indexfile) + "line number" + str(idx) + "to es index" + str(esindex))
                try:
                    response = bulk(client=es, actions=bulk, chunk_size=step, )
                    sucesses += 1
                except:
                    string = "Worker" + str(workerid) + " error at number " + str(start + successes)
                    print(string)
                bulkcounter = 0
                bulki = []

            idx += 1    
    
    # end of indexing
    string = "Worker" + str(workerid) + " hat indiziert und ist nun at " + str(start + successes)
    print(string)

def main(esserver, esport, esindex, indexfile, start, end, parstype, workers, logfile, step, filestartid):
    # Param: importfile - file to index - in line - tab format like finnews.txt
    # Param: start - line to start from file (just in case it has been stopped at some point)
    # param: indexname - elasticsearch index to use
    # not including the END
    # logging.basicConfig(filename=logfile, encoding='utf-8', level=logging.DEBUG)
    # set workers and docs to process
    workers = int(workers)
    step = int(step)
    filestartid = int(filestartid)
    interval = int(end) - int(start)
    # fit interval to workers nach oben
    if (interval % workers) != 0:
        interval += workers - (interval % workers)
    # workerinterval should be integer now
    workerinterval = int (interval / workers) 
    for work in range(workers):
        startw = int(start) + work * workerinterval
        endw = int(start) + (work +1) * workerinterval
        string = "worker starting with id" + str(workerid) + "parsing docs from to" + str(startw) + " " + str(endw)
        print(string)
        p = Process(target=parserthreadfunc, args=(esserver, esport, esindex, indexfile, startw, endw, parstype, workerid, step, filestartid))
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
    parser.add_argument('parstype',
                    help='deals with different dates in fin and de70')
    parser.add_argument('workers',
                    help='number of workers')
    parser.add_argument('logfile',
                    help='path to logfile ie dirfile.txt')
    parser.add_argument('step',
                    help='step = chunk_size for es bulk indexing')
    parser.add_argument('filestartid',
                    help='first id of file - usually 0, but may be higher for sliced files')
    
    
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
    print("parstype", parsed_args.parstype)
    # disable multiprocessing - and use thread-api
    parsed_args.workers = 1
    print("workers number", parsed_args.workers)
    print("logfile", parsed_args.logfile)
    #parsed_args.logfile = "C:/Users/hitec_c/Documents/finnews_log.txt"
    print("step", parsed_args.step)
    
        
    main(parsed_args.esserver, parsed_args.esport, parsed_args.esindex, parsed_args.indexfile, parsed_args.start, parsed_args.end, parsed_args.parstype, parsed_args.workers, parsed_args.logfile, parsed_args.step, parsed_args.filestartid)
