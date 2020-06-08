from flask import Flask, jsonify, render_template, request, Response
from flask_cors import CORS

from db import Database
import chineseWhispers
import urllib.parse
import json
import urllib.request

DEBUG = True
PARAMETERS = {}

class CustomFlask(Flask):
    jinja_options = Flask.jinja_options.copy()
    jinja_options.update(dict(
        variable_start_string='%%',  # Default is '{{', I'm changing this because Vue.js uses '{{' / '}}'
        variable_end_string='%%'
    ))

app = CustomFlask(__name__, 
        static_folder= "./static")  # This replaces your existing "app = Flask(__name__)"
app.config.from_object(__name__)
CORS(app)

def getDbFromRequest(collection):
	if collection != "" and collection != None:
		return collection
	else:
		return "default"
	

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/api/reclustering', methods=['POST'])
# recluster the existing graph by running Chinese Whispers on it again
# precondition: source - target str - weight float not guaranteed
# thus ensure type-safety for backend by casting
def recluster():
	nodes = []
	links = []
	if request.method == 'POST':
		data = json.loads(request.data)
		nodes = data["nodes"]
		links_list = data["links"]
		for item in links_list:
			links.append((str(item["source"]), str(item["target"]), {'weight': float(item["weight"])}))

		reclustered_graph = chineseWhispers.chinese_whispers(nodes, links)
		return json.dumps(reclustered_graph)

@app.route('/api/collections')
def databases_info():
	with open('config.json') as config_file:
			config = json.load(config_file)
	return json.dumps(config["collections_info_frontend"])


@app.route('/api/collections/<string:collection>/interval/<int:start>/<int:end>')
# retrieve the time id(s) of a certain interval between a specified start and end year
def interval(start, end, collection):
	db = Database(getDbFromRequest(collection))
	interval = db.get_time_ids(start, end)
	return json.dumps(interval)


@app.route('/api/collections/<string:collection>/start_years')
# retrieve all possible start years from the database
def get_start_years(collection):
	db = Database(getDbFromRequest(collection))
	start_years = db.get_all_years("start_year")
	return json.dumps(start_years)


@app.route('/api/collections/<string:collection>/end_years')
# retrieve all possible end years from the database
def get_end_years(collection):
	db = Database(getDbFromRequest(collection))
	end_years = db.get_all_years("end_year")
	return json.dumps(end_years)


@app.route('/api/collections/<string:collection>/sense_graph', methods=['POST'])
# retrieve the clustered graph data according to the input parameters of the user and return it as json
def get_clustered_graph(
		collection):
	if request.method == 'POST':
		data = json.loads(request.data)
		target_word = str(data["target_word"])
		start_year = int(data["start_year"])
		end_year = int(data["end_year"])
		paradigms = int(data["senses"])
		density = int(data["edges"])
			

	def clusters(
		collection, 
		target_word,
		start_year,
		end_year,
		paradigms,
		density):
		db = Database(getDbFromRequest(collection))
		time_ids = db.get_time_ids(start_year, end_year)
		nodes = db.get_nodes(target_word, paradigms, time_ids)
		edges, nodes, singletons = db.get_edges(nodes, density, time_ids)
		
		return singletons, chineseWhispers.chinese_whispers(nodes, edges)
	
	singletons, clustered_graph = clusters(collection, target_word, start_year, end_year, paradigms, density)
	c_graph = json.dumps([clustered_graph, {'target_word': target_word}, {'singletons': singletons}], sort_keys=False, indent=4)
	
	return c_graph


def get_edge_info(collection, word1, word2, time_id):
	# get feature info from database
	# db returns dictionary {"feature": score}
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
# retrieve edge information
# pre-condition: collection, word1, word2, time_id not empty
# post-condition: returns dictionary with error-code (in case result set is empty)
# the response is limited to max 200
def simbim(collection="default"):
	if request.method == 'POST':
		data = json.loads(request.data)
		word1 = str(data["word1"])
		word2 = str(data["word2"])
		time_id = int(data["time_id"])
	
	# get intersection of node-contexts (res_set), context-dics and max values
	res1_dic, res2_dic, res_set, max1, max2 = get_edge_info(collection, word1, word2, time_id)
	
	if len(res1_dic) == 0 or len(res2_dic) == 0 or len(res_set) == 0:
		# check if error in results
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
# get_cluster_information based on occurences of words in edges (pairwise comparison -> occurence frequencies -> normalized freq)
# precondition: post data with edges and collection
# postcondition: returns dictionary of words shared pairwise, score = number of occurences in cluster edges / total of cluster edges
# the response is limited to max 200
def cluster_information():
	import time
	start_time = time.time()
	from collections import defaultdict
	edges = []
	nodes = set()
	if request.method == 'POST':
		data = json.loads(request.data)
		for edge in data["edges"]:
			edges.append(edge)
			nodes.add((edge["source"], edge["time_id"]))
			nodes.add((edge["target"], edge["time_id"]))
	print("in cluster info (1) anzahl unique nodes - alle nodes ", len(nodes), len(edges)*2)

	# get features for all unique nodes
	db = Database(getDbFromRequest(data["collection"]))
	feature_dic = {}
	for node in nodes:
		feature_dic[node] = db.get_features(node[0], node[1])
	
	print(" in cluster info (2) after db query --- %s seconds ---" % (time.time() - start_time))

	res_dic_all = defaultdict(int)
	for edge in edges:
		node1_features = set(feature_dic[(edge["source"], edge["time_id"])].keys())
		node2_features = set(feature_dic[(edge["target"], edge["time_id"])].keys())
		res_set = node1_features.intersection(node2_features)
		for word in res_set:
			res_dic_all[word] += 1	
	
	for k,v in res_dic_all.items():
		res_dic_all[k] = float(v/len(edges))
	res_dic_all = {k:v for k,v in sorted(res_dic_all.items(), key = lambda x: x[1], reverse = True)}
	
	# limit response dictionary to topn
	topn = 200
	dic_res = {}
	keys = list(res_dic_all.keys())[:topn]
	for index in range(len(keys)):
		dic_res[keys[index]] = res_dic_all[keys[index]]

	print(" cluster info (3) after algo --- %s seconds ---" % (time.time() - start_time))
	#print("dictionary cluster ", dic_res)
	
	return dic_res


if __name__ == '__main__':
	# use the config file to get host and database parameters
	with open('config.json') as config_file:
		config = json.load(config_file)
	app.run(host=config['host'])