
import csv
from datetime import datetime
from elasticsearch import Elasticsearch
import json
import sys
import argparse
import os
from multiprocessing import Process

def parserthreadfunc(indexfile, start, end, esindex, logfile):
    # settings
    es = Elasticsearch([{'host': '127.0.0.1', 'port': 9292}])
    #log = open(logfile, "a")
    
    # read docs & pushing to elasticsearch
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
                jobimsES.append({"jo": jo, "bim": bim})
            # source field
            source = row[2]
            # text field
            sentence = row[3]
            #time-slice field = date field with this text file
            time_slice = row[4]
            # no date field with these two txt files
        
            ######### index in es
            doc = {
                'jobim': jobimsES,
                'sentence': sentence,
                'source': source,
                'date': time_slice,
                'time_slice': time_slice
                }
            es.index(index=esindex, id=counter, body=doc)
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

def main(indexfile, start, end, esindex, logfile, workers):
    # Param: importfile - file to index - in line - tab format like finnews.txt
    # Param: start - line to start from file (just in case it has been stopped at some point)
    # param: indexname - elasticsearch index to use
    interval = int(end) - int(start)
    workerinterval = int (interval / workers)
    for work in range(workers):
        startw = int(start) + work * workerinterval
        endw = int(start) + (work +1) * workerinterval +1
        print(startw, endw)
        p = Process(target=parserthreadfunc, args=(indexfile, startw, endw, esindex, logfile))
        p.start()
    

def create_arg_parser():
    # Creates and returns the ArgumentParser object
    parser = argparse.ArgumentParser(description='scot-helper loads tab-sep lines from txt-file and pushes to elasticsearch.')
    #parser.add_argument('indexfile',
    #                help='Path to the input file file.txt.')
    parser.add_argument('start',
                    help='start indexing at line')
    parser.add_argument('end',
                    help='end indexing at line')
    #parser.add_argument('esindex',
    #                help='name of asticsearch index')
    #parser.add_argument('logfile',
    #                help='path to logfile ie \dir\file.txt')
    #parser.add_argument('workers',
    #                help='number of workers')
    return parser

if __name__ == "__main__":
    
    # read file to index[1] and start[2]
    arg_parser = create_arg_parser()
    parsed_args = arg_parser.parse_args(sys.argv[1:])
    #if os.path.exists(parsed_args.indexfile):
     #  print("File exist", parsed_args.indexfile)
    #print("indexfile", parsed_args.indexfile)
    indexfile = "C:/Users/hitec_c/Documents/finnews_dep_wft.txt"
    print("start", parsed_args.start)
    print("end", parsed_args.end)
    #print("esindex", parsed_args.esindex)
    esindex = "test3"
    #print("logfile", parsed_args.logfile)
    logfile = "C:/Users/hitec_c/Documents/finnews_log.txt"
    #print("workers number", parsed_args.workers)
    workers = 50
    main(indexfile, parsed_args.start, parsed_args.end, esindex, logfile, workers)
