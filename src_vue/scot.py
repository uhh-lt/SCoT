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
def recluster():
	nodes = []
	links = []
	if request.method == 'POST':
		data = json.loads(request.data)
		nodes = data["nodes"]
		links_list = data["links"]
		for item in links_list:
			links.append((item["source"], item["target"], {'weight': int(item["weight"])}))

		reclustered_graph = chineseWhispers.chinese_whispers(nodes, links)
		return json.dumps(reclustered_graph)

@app.route('/api/collections')
def databases_info():
	with open('config.json') as config_file:
			config = json.load(config_file)
	return json.dumps(config["collections_info"])


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


@app.route('/api/collections/<string:collection>/sense_graph/<path:target_word>/<int:start_year>/<int:end_year>/<int:direct_neighbours>/<int:density>')
# retrieve the clustered graph data according to the input parameters of the user and return it as json
def get_clustered_graph(
		collection,
		target_word,
		start_year,
		end_year,
		direct_neighbours,
		density):
	#target_word = str(urllib.parse.unquote(target_word))
	target_word = str(target_word)
	paradigms = direct_neighbours

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

def get_edge_info(collection, word1, word2, time_id=0):
	word1part1  = word1.split("/")[0]
	word1part2 = word1.split("/")[1]
	word2part1 = word2.split("/")[0]
	word2part2 = word2.split("/")[1]
	url1 = "http://ltmaggie.informatik.uni-hamburg.de/jobimviz/ws/api/google/jo/bim/score/" + word1part1 + "%23" + word1part2 + "?format=json"
	url2 = "http://ltmaggie.informatik.uni-hamburg.de/jobimviz/ws/api/google/jo/bim/score/"+ word2part1 + "%23" + word2part2 + "?format=json"
	#print(url1)
	
	with urllib.request.urlopen(url1) as url:
		data1 = json.loads(url.read().decode())
		#print(data1)
	with urllib.request.urlopen(url2) as url:
		data2 = json.loads(url.read().decode())
	results1 = data1["results"]
	results2 = data2["results"]
	# put results into dictionaries and set
	res1_dic = {}
	res2_dic = {}
	res_set = set()
	for result in results1:
		res1_dic[result["key"]] = result["score"]
	keys1 = res1_dic.keys()
	for result in results2:
		res2_dic[result["key"]] = result["score"]
		if result["key"] in keys1:
			res_set.add(result["key"])
	
	#print(res_set)
	# determine maxima
	res1_dic = {k: v for k, v in sorted(res1_dic.items(), reverse = True, key=lambda item: item[1])}
	res2_dic = {k: v for k, v in sorted(res2_dic.items(), reverse = True, key=lambda item: item[1])}
	max1 = list(res1_dic.values())[0]
	max2 = list(res2_dic.values())[0]
	return res1_dic, res2_dic, res_set, max1, max2


@app.route('/api/collections/<string:collection>/simbim/<path:word1>/simbim/<path:word2>')
def getSimBims(collection="default", word1='liberty/NN', word2='independence/NN'):
# template method for new data-pipeline
# method is in the backend as it may be swapped out for a database at some point
# current provisional data-provider jo-bim-api-google-books
	print(word1, " ",  word2)
	res1_dic, res2_dic, res_set, max1, max2 = get_edge_info(collection, word1, word2, 0)
	
	# calc return dictionary and normalize values
	# form dic = {"1": {"score": 34, "key": "wort", "score2": 34}, "2": ...}
	return_dic = {}
	index_count = 0
	for key in res_set:
		return_dic[str(index_count)] = {"score": res1_dic[key]/max1, "key" : key, "score2": res2_dic[key]/max2 }
		index_count += 1
	

	print("anzahl same words", len(return_dic))
	return return_dic

@app.route('/api/cluster_information', methods=['POST'])
# get_cluster_information on shared contexts of all nodes
# needs two edges
# experimental - not yet implemented
def cluster_information():
	
	edges = []
	if request.method == 'POST':
		data = json.loads(request.data)
		for edge in data["edges"]:
			edges.append(edge)
	
	edge_arr = []
	setList = []
	for edge in edges:
		res1_dic, res2_dic, res_set, max1, max2 = get_edge_info(data["collection"], edge["source"], edge["target"], edge["time_id"])
		edge_arr.append({"res1": res1_dic, "res2": res2_dic, "res_set": res_set, "max1": max1, "max2": max2})
		setList.append(res_set)
	
	superset = edge_arr[0]["res_set"]
	print("anzal sets", len(setList))
	index = 0
	for seti in setList:
		supersetTmp = set()
		supersetTmp = superset.intersection(seti)
		if len(supersetTmp) > 10:
			superset = supersetTmp
			print("good mit overlap", edges[index])
		else:
			print("killer ohne overlap", edges[index] )
		index+=1
	print("laenge intersection", len(superset))
	print(superset)
	

	return {}


if __name__ == '__main__':
	# use the config file to get host and database parameters
	with open('config.json') as config_file:
		config = json.load(config_file)
	app.run(host=config['host'])