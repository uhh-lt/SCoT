# python duplicate.py ../gbooks/1520_1908_sim
import re
import sys
import traceback
import os
duplinefilename = sys.argv[1]

outfile = open("dup_"+os.path.basename(duplinefilename), "w")
for line in open(duplinefilename, "r"):
    try:
       l = line.split("\t") # whole line
       f =  l[2].strip() # this is the score
       if float(f)>1.0 : # filter those lines with score less than 2
           outfile.write(line.strip()+"\n") # write the line as it is
           outfile.write(l[1].strip()+"\t"+l[0].strip()+"\t"+l[2].strip()+"\t"+l[3].strip()+"\n") # swap the first and second columns (word2, word1)
    except Exception:
        print(traceback.format_exc())
        print("line " + line + " is wrong\n")
        continue
outfile.close()