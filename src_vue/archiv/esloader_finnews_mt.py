
import csv
from datetime import datetime
#from elasticsearch import Elasticsearch
import json
import sys
import argparse
import os
from threading import Thread

class parsingWorker(Thread):

    def __init__(self):
        Thread.__init__(self)
        

    def run(self, start, end, importfile):
        self.start = start
        self.end = end
        self.importfile = importfile
           # settings
        #es = Elasticsearch([{'host': 'elasticsearch', 'port': 9200}])
        #log = open(logfile, "a")
    
        # read docs use counter as additional id to start and stop pushing to elasticsearch
        #docs = []

        with open(self.importfile, newline='', encoding="UTF-8") as f:
            reader = csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE)
            counter = 0
            printcounter = 0
            for row in reader:
                if counter >= self.start:
                    ############### parse
                    #josi = row[0]
                    #jos = josi.split("<>")
                    #print("jos", jos)
                    jobimsdb = row[1]
                    jobims = jobimsdb.split("<>")
                    jobimsES = []
                    for jobim in jobims:
                        jo = jobim.split("@")[0]
                        bim = jobim.split("@")[1]
                        jobimsES.append({"jo": jo, "bim": bim})
                    #print("bims", bims)
                    source = row[2]
                    #print("source", source)
                    sentence = row[3]
                    #print("sentence", sentence)
                    time_slice = row[4]
                    #print("time_slice", time_slice)
        
                    ######### index in es
                    doc = {
                        'jobim': jobimsES,
                        'sentence': sentence,
                        'source': source,
                        'date': time_slice,
                        'time_slice': time_slice
                    }
                    #es.index(index=indexname, body=doc)
                    print (doc)
                ##### count and log
            
                printcounter += 1
                if (printcounter == 1000):
                    now = datetime.now()
                    date_time = now.strftime("%m/%d/%Y, %H:%M:%S")
                    #log.write("indexing importfile ", importfile, "line number", counter, "to es index", indexname, date_time)
                    print("indexing importfile ", self.importfile, "line number", counter, date_time)
                    printcounter = 0
                 # es.indices.refresh(index=indexname)



def main(importfile, start, end):
    # Param: importfile - file to index - in line - tab format like finnews.txt
    # Param: start - line to start from file (just in case it has been stopped at some point)
    # param: indexname - elasticsearch index to use
    interval = int(end) - int(start)
    workers = int(2)
    workerinterval = int (interval / workers)
    for work in range(workers):
        startw = int(start) + work * workerinterval
        endw = int(start) + (work +1) * workerinterval
        print(startw, endw, importfile)
        worker = parsingWorker(importfile, startw, endw)
        worker.daemon = True
        worker.start()
 
       

def create_arg_parser():
    # Creates and returns the ArgumentParser object

    parser = argparse.ArgumentParser(description='scot-helper loads tab-sep lines from txt-file and pushes to elasticsearch.')
    parser.add_argument('indexfile',
                    help='Path to the input file file.txt.')
    parser.add_argument('start',
                    help='start indexing at line')
    parser.add_argument('end',
                    help='end indexing at line')
    #parser.add_argument('esindex',
    #                help='name of asticsearch index')
    #parser.add_argument('logfile',
    #                help='path to logfile ie \dir\file.txt')
    return parser

if __name__ == "__main__":
    # read file to index[1] and start[2]
    arg_parser = create_arg_parser()
    parsed_args = arg_parser.parse_args(sys.argv[1:])
    #if os.path.exists(parsed_args.indexfile):
     #  print("File exist", parsed_args.indexfile)

    print("indexfile", parsed_args.indexfile)
    print("start", parsed_args.start)
    print("end", parsed_args.end)
    #print("esindex", parsed_args.esindex)
    #print("logfile", parsed_args.logfile)
    main(parsed_args.indexfile, parsed_args.start, parsed_args.end)
