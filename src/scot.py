# TODOs
# 1. Improve database query performance
# 2. Rework Flask architecture
# 3. Check CW implementation for WSI

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

from db import Database
import chineseWhispers
import json

DEBUG = True

app = Flask(__name__)
app.config.from_object(__name__)

#CORS(app, resources={r'/*':{'origins': '*'}})

@app.route('/', methods=['GET', 'POST'])
def get_clustered_graph(
	target_word="freedom/NN",
	start_year=1909,
	end_year=1972,
	paradigms=5,
	pparadigms=5,
	density=5,
	time_diff=False
	):
	#if request.method == "POST":
		# if time_diff == False
	def clusters(
		target_word,
		start_year,
		end_year,
		paradigms,
		pparadigms,
		density,
		time_diff
		):
		db = Database()
		time_ids = db.get_time_ids(start_year, end_year)
		nodes = db.get_nodes(time_diff, target_word, paradigms, pparadigms, time_ids)
		edges = db.get_edges(time_diff, nodes, density, time_ids)
		return chineseWhispers.chinese_whispers(nodes, edges)

	clustered_graph = clusters(target_word,
		start_year,
		end_year,
		paradigms,
		pparadigms,
		density,
		time_diff)

	return jsonify(clustered_graph)

if __name__ == '__main__':
	app.run()