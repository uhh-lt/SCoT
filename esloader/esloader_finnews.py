
import csv
from datetime import datetime
from elasticsearch import Elasticsearch
import json
import sys
import argparse
import os

# Single Thread loader - TOO SLOW

def main(importfile, start, indexname, logfile):
    # Param: importfile - file to index - in line - tab format like finnews.txt
    # Param: start - line to start from file (just in case it has been stopped at some point)
    # param: indexname - elasticsearch index to use

    # settings
    es = Elasticsearch([{'host': 'elasticsearch', 'port': 9200}])
    log = open(logfile, "a")
    
    # read docs use counter as additional id to start and stop pushing to elasticsearch
    docs = []

    with open(importfile, newline='', encoding="UTF-8") as f:
        reader = csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE)
        counter = 0
        printcounter = 0
        for row in reader:
            if counter >= start:
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
                    'jobim': jobimES,
                    'sentence': sentence,
                    'source': source,
                    'date': time_slice,
                    'time_slice': time_slice
                }
                es.index(index=indexname, body=doc)
        
            ##### count and log
            
            printcounter += 1
            if (printcounter == 1000):
                now = datetime.now()
                date_time = now.strftime("%m/%d/%Y, %H:%M:%S")
                log.write("indexing importfile ", importfile, "line number", counter, "to es index", indexname, date_time)
                printcounter = 0
        es.indices.refresh(index=indexname)

def create_arg_parser():
    # Creates and returns the ArgumentParser object

    parser = argparse.ArgumentParser(description='scot-helper loads tab-sep lines from txt-file and pushes to elasticsearch.')
    parser.add_argument('indexFile',
                    help='Path to the input file ie .\dir\file.txt.')
    parser.add_argument('start',
                    help='start indexing at line')
    parser.add_argument('esindex',
                    help='name of asticsearch index')
    parser.add_argument('logfile',
                    help='path to logfile ie \dir\file.txt')
    return parser

if __name__ == "__main__":
    # read file to index[1] and start[2]
    arg_parser = create_arg_parser()
    parsed_args = arg_parser.parse_args(sys.argv[1:])
    if os.path.exists(parsed_args.indexFile):
       print("File exist", parsed_args.indexFile)

    print("indexFile", parsed_args.indexFile)
    print("start", parsed_args.start)
    print("esindex", parsed_args.esindex)
    print("logfile", parsed_args.logfile)
    main(parsed_args_indexfile, parsed_args.start, parsed_args.esindex, parsed_args.logfile)
