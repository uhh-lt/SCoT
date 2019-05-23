# TODOs
# 1. Improve database query performance
# 2. Rework Flask architecture
# 3. How to include the target word 
# and show the relationships between words better?

from flask import Flask, jsonify, render_template, request, Response
from flask_cors import CORS

from db import Database
import chineseWhispers
import urllib.parse
import json

DEBUG = True
PARAMETERS = {}

app = Flask(__name__)
app.config.from_object(__name__)

#CORS(app, resources={r'/*':{'origins': '*'}})
@app.route('/')
def index():
	return render_template('index.html')

#/<target_word>/<int:start_year>/<int:end_year>/<int:direct_neighbours>/<int:indirect_neighbours>/<int:density>/<mode>
@app.route('/sense_graph/<path:target_word>/<int:start_year>/<int:end_year>/<int:direct_neighbours>/<int:density>/<mode>')
def get_clustered_graph(target_word, start_year, end_year, direct_neighbours, density, mode):
	target_word = str(urllib.parse.unquote(target_word))
	print(target_word)
	paradigms = direct_neighbours
	if mode == "False":
		time_diff = False
	else:
		time_diff = True

	def clusters(
		target_word,
		start_year,
		end_year,
		paradigms,
		density,
		time_diff
		):
		db = Database()
		time_ids = db.get_time_ids(start_year, end_year)
		#print(time_ids)
		nodes = db.get_nodes(time_diff, target_word, paradigms, time_ids)
		#print(nodes)
		edges = db.get_edges(time_diff, nodes, density, time_ids)
		return chineseWhispers.chinese_whispers(nodes, edges)

	clustered_graph = clusters(target_word,
		start_year,
		end_year,
		paradigms,
		density,
		time_diff)

	c_graph = json.dumps(clustered_graph, sort_keys=False, indent=4)
	
	return c_graph

if __name__ == '__main__':
	app.run()