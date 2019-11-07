# TODOs
# 1. How to include the target word 
# 2. Gravity
# 3. Time Diff Graph
# 4. Integrate Graph in vue.js to make it better editable?
# and show the relationships between words better?

from flask import Flask, jsonify, render_template, request, Response
from flask_cors import CORS

from db import Database
import chineseWhispers
import urllib.parse
import json

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

@app.route('/')
def index():
	return render_template('index.html')


@app.route('/interval/<int:start>/<int:end>')
# retrieve the time id(s) of a certain interval between a specified start and end year
def interval(start, end):
	print(start,end)
	db = Database()
	interval = db.get_time_ids(start, end)
	return json.dumps(interval)


@app.route('/reclustering', methods=['POST'])
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

		reclustered_graph = chineseWhispers.reclustering(nodes, links)
		return json.dumps(reclustered_graph)


@app.route('/start_years')
# retrieve all possible start years from the database
def get_start_years():
	db = Database()
	start_years = db.get_all_years("start_year")
	return json.dumps(start_years)


@app.route('/end_years')
# retrieve all possible end years from the database
def get_end_years():
	db = Database()
	end_years = db.get_all_years("end_year")
	return json.dumps(end_years)


@app.route('/sense_graph/<path:target_word>/<int:start_year>/<int:end_year>/<int:direct_neighbours>/<int:density>')
# retrieve the clustered graph data according to the input parameters of the user and return it as json
def get_clustered_graph(
		target_word,
		start_year,
		end_year,
		direct_neighbours,
		density):
	#target_word = str(urllib.parse.unquote(target_word))
	target_word = str(target_word)
	print("------------------------------- target word: " + target_word)
	paradigms = direct_neighbours

	def clusters(
		target_word,
		start_year,
		end_year,
		paradigms,
		density):
		db = Database()
		time_ids = db.get_time_ids(start_year, end_year)
		nodes = db.get_nodes(target_word, paradigms, time_ids)
		edges, nodes, singletons = db.get_edges(nodes, density, time_ids)

		return singletons, chineseWhispers.chinese_whispers(nodes, edges, target_word)

	singletons, clustered_graph = clusters(target_word,
		start_year,
		end_year,
		paradigms,
		density)

	c_graph = json.dumps([clustered_graph, {'target_word': target_word}, {'singletons': singletons}], sort_keys=False, indent=4)
	
	return c_graph
	

if __name__ == '__main__':
	# use the config file to get host and database parameters
	with open('config.json') as config_file:
		config = json.load(config_file)
	app.run(host=config['host'])