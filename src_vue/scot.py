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

def getDbFromRequest(collection):
	if collection != "" and collection != None:
		return collection
	else:
		return "default"
	

@app.route('/')
def index():
	return render_template('index.html')

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
		
		return singletons, chineseWhispers.chinese_whispers(nodes, edges, target_word)
	
	singletons, clustered_graph = clusters(collection, target_word, start_year, end_year, paradigms, density)

	c_graph = json.dumps([clustered_graph, {'target_word': target_word}, {'singletons': singletons}], sort_keys=False, indent=4)
	
	return c_graph
	

if __name__ == '__main__':
	# use the config file to get host and database parameters
	with open('config.json') as config_file:
		config = json.load(config_file)
	app.run(host=config['host'])