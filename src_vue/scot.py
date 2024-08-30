import sys
import json

from flask import Flask, jsonify, render_template, request, Response
from flask_cors import CORS

from pathlib import Path

from services.cluster import chinese_whispers, manual_recluster
from services.graphs import get_graph
from services.info import collections_info, get_edge_info, simbim, cluster_information, documents, documents_scroll, \
    compute_weight_stats
from model.ngot_model import NGOT, NGOTCluster, NGOTLink, NGOTProperties, NGOTNode
from model.ngot_mapper import map_ngot_links_2_dic, map_ngot_nodes_2_dic


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


@app.route('/api/config')
def get_config():
    config_path = './config/config_test.json' # for ltdocker
    config_path = './config/config_test_small_local.json' # for local machine
    print(f"Reading configurations form: {config_path}")
    with open(config_path) as config_file:
        return json.load(config_file)


@app.route('/')
def index():
    return render_template('index.html')


# ENDPOINTS 1: COLLECTION INFORMATION


@app.route('/api/collections')
def info():
    return collections_info(get_config())


# Endpoints 2: GET CLUSTERED GRAPH


@app.route('/api/collections/sense_graph', methods=['POST'])
# calls main algorithms for building a clustered neighbourhood graph over time (NGOT)
def get_clustered_graph():
    ngot = NGOT()
    if request.method == 'POST':
        ngot.props = NGOTProperties.from_json(request.data)
    # print("request.data:",request.data)
    ngot = get_graph(get_config(), ngot)
    ngot.props.weight_stats = compute_weight_stats(ngot.nodes)
    # print("*"*100)
    # print(ngot.props.weight_stats)
    # for n in ngot.nodes:
    #     print(n.id, n.weight, n.weights)
    old_graph, ngot = chinese_whispers(ngot)
    # delete information that was only used for the backend
    ngot.nodes_dic = None
    ngot.links_dic = None
    # serialize dataclass-structure to json
    ngot_json = ngot.to_json()
    # print(ngot_json.keys())
    # print(ngot_json.props)
    return ngot_json


@app.route('/api/reclustering', methods=['POST'])
# recluster the existing cumulated graph by running Chinese Whispers on it
def recluster_graph():
    # extract data
    ngot = NGOT()
    if request.method == 'POST':
        ngot = NGOT.from_json(request.data)
    # print(ngot)
    # create links dic and nodes dic
    ngot.nodes_dic = map_ngot_nodes_2_dic(ngot)
    ngot.links_dic = map_ngot_links_2_dic(ngot)
    # recluster
    reclustered_graph, ngot = chinese_whispers(ngot)
    # delete information that was only used for the backend
    ngot.nodes_dic = None
    ngot.links_dic = None
    # serialize dataclass-structure to json
    ngot_json = ngot.to_json()
    return ngot_json


@app.route('/api/manualreclustering', methods=['POST'])
# the graph has been manually reclustered in the frontend
# however, it needs a new mapping with new values from the be
# the names of the clusters should be preserved (TODO)
def manual_recluster_graph():
    # print(request.data)
    # extract data
    ngot = NGOT()
    if request.method == 'POST':
        ngot = NGOT.from_json(request.data)
    # create links dic and nodes dic
    ngot.nodes_dic = map_ngot_nodes_2_dic(ngot)
    ngot.links_dic = map_ngot_links_2_dic(ngot)
    # print("before manual_recluster_graph")
    # for n in ngot.nodes_dic:
    #     print(n)
    # recluster
    reclustered_graph, ngot = manual_recluster(ngot)
    # delete information that was only used for the backend
    # print('------------------------------')
    # print("after manual_recluster_graph")
    # for n in ngot.nodes_dic:
    #     print(n)

    ngot.nodes_dic = None
    ngot.links_dic = None
    # serialize dataclass-structure to json
    ngot_json = ngot.to_json()
    return ngot_json


# ENDPOINTS3: ADDITIONAL INFORMATION ---------------------------------------------------


@app.route('/api/collections/<string:collection>/simbim', methods=['POST'])
# get information why a certain edge exists - (An edge symbolises SIMilarity)
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
        return documents(get_config(), data)


@app.route('/api/collections/<string:collection>/documents_scroll', methods=['POST'])
# get example sentences
def documents_scroll_get(collection="default"):
    if request.method == 'POST':
        data = json.loads(request.data)
        return documents_scroll(get_config(), data)


if __name__ == '__main__':
    # init packaging system parent
    # this is not permanent (this is why we do it again and again ...)
    sys.path.append(str(Path(__file__).parent.absolute()))
    # use the config file to get host and database parameters
    # config = get_config()
    # app.run(host=config['flask_hostq'])
    app.run(port=5000, debug=True)
