import sys
import json
import urllib.parse
import urllib.request

from flask import Flask, jsonify, render_template, request, Response
from flask_cors import CORS
from pathlib import Path
from abc import ABC, abstractmethod
from typing import Dict, List

from persistence.documentdb import Documentdb
from persistence.db import Database
import services.chinese_whispers as chineseWhispers
from services.build_graphs import ngot_interval


# FLASK---------------------------------------------------------------------------------
# ---------- FLASK SUBCLASSING
class CustomFlask(Flask):
    jinja_options = Flask.jinja_options.copy()
    jinja_options.update(dict(
        variable_start_string='%%',  # Default is '{{', I'm changing this because Vue.js uses '{{' / '}}'
        variable_end_string='%%'
    ))

# ----------- FLASK PARAMETERS
DEBUG = True
PARAMETERS = {}
app = CustomFlask(__name__, 
        static_folder= "./static")  # This replaces your existing "app = Flask(__name__)"
app.config.from_object(__name__)
CORS(app)


# ----------------- HELPERS
def getDbFromRequest(collection:str)->(str):
	"""# Helper_method - 
		return collection-key - if valid or else:return "default"
	"""
	if collection != "" and collection != None and collection in config["collections_info_backend"]:
		return collection
	else:
		return "default"

# ------------ App REST-API Controller -----------------------------------------------------------------------
# Main Landing Page
@app.route('/')
def index():
	return render_template('index.html')

# ENDPOINTS and METHODS 1: COLLECTION INFORMATION ------------------------

@app.route('/api/collections')

def collections_info():
	"""compiles info about collections from config frontend information
	and collection-databases
	Returns:
		JSON - with all information - this is stored in the frontend as collections
	Precondition: start and end years are well ordered with ids beginning with 1 and ending with n
	"""
	with open('./config/config.json') as config_file:
			config = json.load(config_file)
	# add information about intervals
	config_fe = config["collections_info_frontend"]
	for collection in config_fe:
		key = config_fe[collection]["key"]
		db = Database(getDbFromRequest(key))
		config_fe[collection]['start_years'] = db.get_all_years("start_year")
		config_fe[collection]['end_years'] = db.get_all_years("end_year")
		
	return json.dumps(config_fe)


# Endpoints 2 and Methods: -------------------------------- GET CLUSTERED GRAPH --------------------------

# main graph projection and clustering algorith
# offers various projections and clustering-algos depending on graph-type
# Params: collection, target-word, start-year, end-year, density, paradigms, graph-type
def clusters(collection:str, target_word:str, start_year, end_year, paradigms,	density, graph_type	):
	"""[summary]

	Args:
		collection ([type]): [description]
		target_word ([type]): [description]
		start_year ([type]): [description]
		end_year ([type]): [description]
		paradigms ([type]): [description]
		density ([type]): [description]
		graph_type ([type]): [description]

	Returns:
		[type]: [description]
	"""
	db = Database(getDbFromRequest(collection))
	# Resolve start and end year -> time-ids
	time_ids = db.get_time_ids(start_year, end_year)
	## ------------------- new algos ----- start
	print(graph_type)
	# get additive nodes - ie the top paradigms from each selected time id
	# problem size of graph may vary between paradigm and time-id*paradigm
	if str(graph_type)=="ngot_interval":
		print("NGOT interval")
		# NGOT - Interval-based
		# fixes nodes and density in relation to interval-graph - classic overlay
		edges, nodes, singletons = ngot_interval(db, target_word, time_ids, paradigms, density)
	elif str(graph_type)=="ngot_overlay":
		print("NGOT overlay")
		# NGOT - Overlay-fixed (expands global nodes dynamically)
		# Edges in time, fixed global overlay edges, scaled
		nodes = db.get_nodes(target_word, paradigms, time_ids)
		edges, nodes, singletons = db.get_edges_in_time(nodes, density, time_ids)
	elif str(graph_type) == "ngot_global":
		print("NGOT global")
		# NOT IMPLEMENTED FULLY YET
		# background fixing dynamic for edges - static for nodes (currently)
		# Nodes not scaled yet for global algo - global searches for paradigms * |time-ids |
		nodes = db.get_nodes_global(target_word, paradigms, time_ids)
		edges, nodes, singletons = db.get_edges_in_time(nodes, density, time_ids)
	# ---- standard from here - but can change to db.get_edges_in_time to avoid implicit nodes
	else:
		# standard scot: nodes overlay, edges: global - static
		print("scot - nodes global fixed/data fixed - edges - global dyn - data fixed")
		nodes = db.get_nodes(target_word, paradigms, time_ids)
		edges, nodes, singletons = db.get_edges(nodes, density, time_ids)
	#print("nodes", len(nodes), "directed edges", len(edges), "singletons", len(singletons))
	## ------------------- experimental features ----- end
		
	return singletons, chineseWhispers.chinese_whispers(nodes, edges)


@app.route('/api/collections/<string:collection>/sense_graph', methods=['POST'])
# Retrieves the clustered graph data according to the input parameters of the user and return it as json
# Param: target word: user selected target word out of all possible target words
# Param: selected_start_year: user selected start year out of all possible start years
# Param: selected_end_year: user selected end year out of all possible end years
# Param: max number of cumulated paradigms over time - the global graph will have paradigms up to this number
# Param: max_ed
# Param: collection
# Precondition: selected_start_year < selected_end_year
# Precondition: All Params not null
# Precondition: All Params valid (target word validity cannot be guaranteed by frontend?)
# Postcondition: valid graph in valid json-format

def get_clustered_graph(
		collection):
	if request.method == 'POST':
		data = json.loads(request.data)
		target_word = str(data["target_word"])
		start_year = int(data["start_year"])
		end_year = int(data["end_year"])
		nodes = int(data["senses"])
		edges = int(data["edges"])
		graph_type = str(data["graph_type"])
			

	
	singletons, clustered_graph = clusters(collection, target_word, start_year, end_year, nodes, edges, graph_type)
	#print(singletons)
	c_graph = json.dumps([clustered_graph, {'target_word': target_word}, {'singletons': singletons}], sort_keys=False, indent=4)
	
	#print(c_graph)
	return c_graph

@app.route('/api/reclustering', methods=['POST'])
# recluster the existing cumulated graph by running Chinese Whispers on it
# Param: nodes [names my be string or any other type]
# Param: edges with weights [weights may be int or float]
# No time-ids needed here: cumulated graph is clustered irrespective of time
# Note: Condition: for calling Chinese Whispers: type-safe FLOAT, type-safe STRING
# Note: Method guarantees type-safety by casting to float and string

def recluster():
	nodes = []
	links = []
	if request.method == 'POST':
		data = json.loads(request.data)
		#print(data)
		nodes = data["nodes"]
		links_list = data["links"]
		#Thprint(data)
		for item in links_list:
			links.append((str(item["source"]), str(item["target"]), {'weight': float(item["weight"])}))

		reclustered_graph = chineseWhispers.chinese_whispers(nodes, links)
		return json.dumps(reclustered_graph)

# ENDPOINTS & METHODS 3: ------------------------------------ FEATURE INFORMATION ---------------------------------------------------


def get_edge_info(collection: str, word1: str, word2: str, time_id: int):
	# See Mitra(2015)
	# get edge-score explanation = intersection of two word features in one time-id, from database
	# Param word1 (str, not null, valid)
	# Param word2 (str, not null, valid)
	# Param collection (str, not null, valid)
	# Param time_id(int, not null, valid)
	# Preconditions (see conditions after params)
	# RETURNS
	# dictionary1 word1: {"feature": score} (nullable - there may not be any data in this time-id), ordered by score desc
	# dictionary2 word2: {"feature": score} (nullable - there may not be anay data in this time-id), ordered by score desc
	# intersection set of keys (str) (nullable - there may not be any overlap)
	# max values 1 und 2 (nullable )

	db = Database(getDbFromRequest(collection))
	res1_dic = db.get_features(word1, time_id)
	res2_dic = db.get_features(word2, time_id)
	
	if len(res1_dic) > 0 and len(res2_dic) > 0:
		
		# put results into intersection-set of res1 and res2
		res_set = set(res1_dic.keys()).intersection(set(res2_dic.keys()))
		
		#print(res_set)
		# determine maxima (sets are ordered by db in desc - thus first is the maximum)
		max1 = list(res1_dic.values())[0]
		max2 = list(res2_dic.values())[0]
		return res1_dic, res2_dic, res_set, max1, max2
	
	else:
		return {},{}, set(),0,0


@app.route('/api/collections/<string:collection>/simbim', methods=['POST'])
# retrieve edge information, ie intersection between two words in one collection and one time-id
# Param: collection
# Param: word1, word2
# Param: time-id
# Returns_ dictionary with result-set error or Zero-code (in case result set is empty)
# the response_dictionary is limited to max 200

def simbim(collection="default"):
	if request.method == 'POST':
		data = json.loads(request.data)
		word1 = str(data["word1"])
		word2 = str(data["word2"])
		time_id = int(data["time_id"])
	
	# get intersection of node-contexts (res_set), context-dics and max values
	res1_dic, res2_dic, res_set, max1, max2 = get_edge_info(collection, word1, word2, time_id)
	
	if len(res1_dic) == 0 or len(res2_dic) == 0 or len(res_set) == 0:
		# check if zero-error
		return {"error":"zero values"}
	else:
		# calc return dictionary and normalize values
		# format of dic = {"1": {"score": 34, "key": "wort", "score2": 34}, "2": ...}
		return_dic = {}
		index_count = 0
		for key in res_set:
			return_dic[str(index_count)] = {"score": float(res1_dic[key]/max1), "key" : str(key), "score2": float(res2_dic[key]/max2) }
			index_count += 1
		# limit response dictionary by top 100 values for each score (ie max 200)
		res_dic_topn = {}
		topn = 100
		if (len(return_dic)>2*topn):
			# select topN for score1
			return_dic = {k:v for k,v in sorted(return_dic.items(), key=lambda item: item[1]["score"], reverse = True)}
			score1key = list(return_dic.keys())[:topn]
			for key in score1key:
				res_dic_topn[key] = return_dic[key]
			# now for score2
			return_dic = {k:v for k,v in sorted(return_dic.items(), key=lambda item: item[1]["score2"], reverse = True)}
			score2key = list(return_dic.keys())[:topn]
			for key in score2key:
				res_dic_topn[key] = return_dic[key]
			return_dic = res_dic_topn

		return_dic["error"] = "none"
		return return_dic



@app.route('/api/cluster_information', methods=['POST'])

# get_cluster_information based on nodes [ie significance of context word for node] - 
# use all occurrences of node in selected time-id [max strength time id]
# calculate score by adding all significances + dividing by number of nodes
# Params: nodes with time-ids
# Returns dictionary of words with Score: averaged normalized over all nodes based on max-time-id
# Precondition: data not null and valid
# Postcondition: the response is limited to max 200
def cluster_information():
	# measure execution time of db-queries
	import time
	start_time = time.time()
	# algo
	from collections import defaultdict
	nodes = set()
	if request.method == 'POST':
		data = json.loads(request.data)
		for node in data["nodes"]:
			nodes.add((node["label"], node["time_id"]))
	#print("nodes", nodes)
	print("-------------------------------------------------------")
	print("in cluster info (1) anzahl unique nodes - alle nodes ", len(nodes))
	# get features (ie context word2 and score) for all unique nodes in all time-ids
	#print("collection", data["collection"])
	db = Database(getDbFromRequest(data["collection"]))
	feature_dic = {}
	for node in nodes:
		feature_dic[node] = db.get_features(node[0], node[1])
	print("-------------------------------------------------------")
	print(" in cluster info (2) after db query --- %s seconds ---" % (time.time() - start_time))
	#print("feature_dic", feature_dic)
	res_dic_all = defaultdict(int)
	for k, v in feature_dic.items():
		for k, v2 in v.items():
			res_dic_all[k] += v2
	print("-------------------------------------------------------")
	#print("res_dic_all", res_dic_all)	
	# normalize and sort significance values
	res_dic_all = {k:v for k,v in sorted(res_dic_all.items(), key = lambda x: x[1], reverse = True)}
	maxi = list(res_dic_all.values())[0]
	for k,v in res_dic_all.items():
		res_dic_all[k] = float(v/maxi)
	# limit response dictionary to topn
	topn = 200
	dic_res = {}
	keys = list(res_dic_all.keys())[:topn]
	for index in range(len(keys)):
		dic_res[keys[index]] = res_dic_all[keys[index]]

	print(" cluster info (3) after algo --- %s seconds ---" % (time.time() - start_time))
	#print("dictionary cluster ", dic_res)
	
	return dic_res

# ENDPOINTS 4: GET TEXT INFORMATION FROM DOCUMENT DB -------------------------------------------------------------------------------------

@app.route('/api/collections/<string:collection>/documents', methods=['POST'])
# retrieves sentences which contain one jo and one bim [also called wort1=jo, wort2=bim]
# Param: collection_key
# Param: jo [wort1], bim [wort2]
# [Param: time-id - not implemented yet]
# Returns_ elasticsearch response
# the response_dictionary is limited to max 200

def documents(collection="default"):
	if request.method == 'POST':
		data = json.loads(request.data)
		jo = str(data["jo"])
		bim = str(data["bim"])
		# time_id = int(data["time_id"])
		collection_key = str(data["collection_key"])
	print(jo, bim, collection_key)

	# get host, port and index from config
	with open('./config/config.json') as config_file:
		config = json.load(config_file)
	es_host = config["collections_info_elastic"][collection_key]["es_host"]
	es_port = config["collections_info_elastic"][collection_key]["es_port"]
	es_index = config["collections_info_elastic"][collection_key]["es_index"]
	print(es_index, es_host, es_port)

	# init with host, port 
	documentdb = Documentdb(es_host, es_port)

	# Todo search with specific index instead of collection_key
	ret = []
	res = documentdb.search(jo, bim, es_index)
	ret_set = set()
	for hit in res["hits"]["hits"]:
		text = hit["_source"]["date"][:10]+ " [" + str(hit["_source"]["time_slice"])+ "] : " \
		+ hit["_source"]["sentence"] + " [" + hit["_source"]["source"] + "] "
		ret_set.add(text)
	ret_list = list(ret_set)
	ret_list.sort()
	#print(ret_list)
	if ret_list != None and len(ret_list) > 0:
		for text in ret_list:
			ret.append({"doc": text })
	else:
		ret.append({"doc": "No Results."})

	return {"docs": ret}

# CLASS - START UP ----------------------------------------------------------------------------------------------------------

if __name__ == '__main__':
	# init packaging system parent
	# this is not permanent (this is why we do it again and again ...)
	sys.path.append(str(Path(__file__).parent.absolute()))
	# use the config file to get host and database parameters
	with open('./config/config.json') as config_file:
		config = json.load(config_file)
	app.run(host=config['flask_host'])
