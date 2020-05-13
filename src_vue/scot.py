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
def simbim(collection="default"):
	if request.method == 'POST':
		data = json.loads(request.data)
		word1 = data["word1"]
		word2 = data["word2"]
		time_id = data["time_id"]
	print("debug getSimBim words received", word1, " ",  word2)
	res1_dic, res2_dic, res_set, max1, max2 = get_edge_info(collection, word1, word2, time_id)
	print("debug getSimbim len(contextWord2) len(contextWord2) len(intersection)", len(res1_dic), len(res2_dic), len(res_set))
	if len(res1_dic) == 0 or len(res2_dic) == 0 or len(res_set) == 0:
		return {"error":"zero values"}
	else:
		# calc return dictionary and normalize values
		# form dic = {"1": {"score": 34, "key": "wort", "score2": 34}, "2": ...}
		return_dic = {}
		index_count = 0
		for key in res_set:
			return_dic[str(index_count)] = {"score": res1_dic[key]/max1, "key" : key, "score2": res2_dic[key]/max2 }
			index_count += 1
	
		return_dic["error"] = "none"
		#print("anzahl same words", len(return_dic)-1)
		return return_dic

@app.route('/api/cluster_information', methods=['POST'])
# get_cluster_information on shared contexts of all nodes
# experimental - not yet implemented
# aktuelles problem geringer overlap bei einigen clustern - wirkliches ergebnis oder datenfehler?
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