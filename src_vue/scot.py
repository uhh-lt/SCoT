import sys
import json
import urllib.parse
import urllib.request

from flask import Flask, jsonify, render_template, request, Response
from flask_cors import CORS
from pathlib import Path
from typing import Dict, List
from dataclasses_json import dataclass_json
from dataclasses import dataclass

from services.cluster import chinese_whispers
from services.graphs import get_graph
from services.info import collections_info, get_edge_info, simbim, cluster_information, documents
from model.ngot_model import NGOT, NGOTCluster, NGOTLink, NGOTProperties, NGOTNode, NGOTSingletons, NGOTTransitLinks


class CustomFlask(Flask):
    jinja_options = Flask.jinja_options.copy()
    jinja_options.update(dict(
        # Default is '{{', I'm changing this because Vue.js uses '{{' / '}}'
        variable_start_string='%%',
        variable_end_string='%%'
    ))


# FLASK PARAMETERS
DEBUG = True
PARAMETERS = {}
app = CustomFlask(__name__,
                  static_folder="./static")  # This replaces your existing "app = Flask(__name__)"
app.config.from_object(__name__)
CORS(app)

# App REST-API Controller ---------------------
# Get config


def get_config():
    with open('./config/config.json') as config_file:
        return json.load(config_file)


@app.route('/')
def index():
    return render_template('index.html')

# ENDPOINTS 1: COLLECTION INFORMATION


@app.route('/api/collections')
def info():
    return collections_info(get_config())

# Endpoints 2: GET CLUSTERED GRAPH


@app.route('/api/collections/<string:collection>/sense_graph', methods=['POST'])
# calls main algorithms for building a neighbour graph over time (NGOT)
def get_clustered_graph(collection):
    ngot = NGOT()
    if request.method == 'POST':
        ngot.properties = NGOTProperties.from_json(request.data)
    props = ngot.properties
    print(props)
    # TODO: use ngot as main parameter and keep working on it
    remove_singletons = False
    edges, nodes, singletons = get_graph(
        get_config(), collection, props.target_word, props.start_year, props.end_year, props.n_nodes, props.e_edges, props.graph_type, remove_singletons)
    clustered_graph = chinese_whispers(nodes, edges)
    # TODO update NGOT datastructure with all information and return
    c_graph = json.dumps([clustered_graph, {'target_word': props.target_word}, {
                         'singletons': singletons}], sort_keys=False, indent=4)

    return c_graph


@app.route('/api/reclustering', methods=['POST'])
# recluster the existing cumulated graph by running Chinese Whispers on it
def recluster_graph():
    # extract data
    if request.method == 'POST':
        data = json.loads(request.data)
    nodes = []
    links = []
    nodes = data["nodes"]
    links_list = data["links"]
    for item in links_list:
        links.append((str(item["source"]), str(item["target"]), {
                     'weight': float(item["weight"])}))
    # recluster
    reclustered_graph = chinese_whispers(nodes, links)
    # return
    return json.dumps(reclustered_graph)


# ENDPOINTS3: ADDITIONAL INFORMATION ---------------------------------------------------


@app.route('/api/collections/<string:collection>/simbim', methods=['POST'])
# get information why a certain edge exists - (An edge symbolises SIM ilarity)
# this requires information on shared syntagmatic contexts which are also called BIMs in JoBim-parlance
# Thus the method is called simbim
def simbim_get(collection="default"):
    if request.method == 'POST':
        data = json.loads(request.data)
        word1 = str(data["word1"])
        word2 = str(data["word2"])
        time_id = int(data["time_id"])

    return simbim(get_config(), collection, data, word1, word2, time_id)


@app.route('/api/cluster_information', methods=['POST'])
# get_cluster_information based on nodes [ie significance of context word for node] -
def cluster_information_get():
    if request.method == 'POST':
        data = json.loads(request.data)

    return cluster_information(get_config(), data)


@app.route('/api/collections/<string:collection>/documents', methods=['POST'])
# get example sentences
def documents_get(collection="default"):
    if request.method == 'POST':
        data = json.loads(request.data)

    return documents(collection, data)


if __name__ == '__main__':
    # init packaging system parent
    # this is not permanent (this is why we do it again and again ...)
    sys.path.append(str(Path(__file__).parent.absolute()))
    # use the config file to get host and database parameters
    config = get_config()
    app.run(host=config['flask_host'])
