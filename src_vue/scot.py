import sys
import json
import yaml
from pathlib import Path

from flask import Flask, jsonify, render_template, request, Response
from flask_cors import CORS
from flask_session import Session

from services.cluster import chinese_whispers, manual_recluster
from services.graphs import get_graph
from services.info import collections_info, get_edge_info, simbim, cluster_information, documents, documents_scroll, \
    add_target_weight_stats, wordfeature_counts, add_cluster_stats
from model.ngot_model import NGOT, NGOTCluster, NGOTLink, NGOTProperties, NGOTNode
from model.ngot_mapper import map_ngot_links_2_dic, map_ngot_nodes_2_dic
from persistence.db import Database

class CustomFlask(Flask):
    jinja_options = Flask.jinja_options.copy()
    jinja_options.update(dict(
        # Default is '{{', I'm changing this because Vue.js uses '{{' / '}}'
        variable_start_string='%%',
        variable_end_string='%%'
    ))


# FLASK PARAMETERS
# DEBUG = True
app = CustomFlask(__name__, static_folder="./static")  # This replaces your existing "app = Flask(__name__)"
app.config.from_object(__name__)

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"

CORS(app)
Session(app)


# App REST-API Controller ---------------------

# Get config
def apply_defaults(configs):
    """Apply default values where 'frontend_info' or 'es_info' is set to 'default'"""
    defaults = configs.get("defaults", {})
    for key in configs["available_collections"]:
        collection = configs["collections"][key]
        # collection overrides defaults if specified
        collection_frontend = collection.get("frontend_info")
        if collection_frontend == "default" or collection_frontend is None:
            collection["frontend_info"] = defaults.get("frontend_info", {}).copy()
        else:
            merged_frontend = defaults.get("frontend_info", {}).copy()
            merged_frontend.update(collection_frontend)
            collection["frontend_info"] = merged_frontend

        collection_es = collection.get("es_info")
        if isinstance(collection_es, dict):
            merged_es = defaults.get("es_info", {}).copy()
            merged_es.update(collection_es)
            collection["es_info"] = merged_es
        # print(f'{collection}--{collection["es_info"]}')
    return configs


@app.route('/api/config')
def get_config():
    CONFIG_PATHS = {
        "ltdocker": 'config/config.yaml',  # for development/final demo
        "local": 'config/config_local.yaml',  # local
    }

    server = "local"
    env = "dev"

    config_path = CONFIG_PATHS[server]
    print(f"Configuration file: {config_path}")
    if config_path.endswith(".yaml"):
        with open(config_path) as config_file:
            configs = yaml.safe_load(config_file)  #
    elif config_path.endswith(".json"):
        with open(config_path) as config_file:
            configs = json.load(config_file)

    configs["available_collections"] = configs["environments"][env]
    configs = apply_defaults(configs)
    return configs

# # Load and cache config globally
# CONFIG_CACHE = load_config()
#
# @app.route('/api/config')
# def get_config():
#     return CONFIG_CACHE


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
    # print("ngot.props:", ngot.props)
    ngot = get_graph(get_config(), ngot)
    ngot.props.weight_stats = add_target_weight_stats(ngot.nodes)
    # print(ngot.props)
    # for n in ngot.nodes:
    #     print(n)
    old_graph, ngot = chinese_whispers(ngot)
    ngot = add_cluster_stats(ngot)
    # delete information that was only used for the backend
    ngot.nodes_dic = None
    ngot.links_dic = None
    # serialize dataclass-structure to json
    ngot_json = ngot.to_json()
    # print(ngot_json)
    return ngot_json


@app.route('/api/reclustering', methods=['POST'])
# recluster the existing cumulated graph by running Chinese Whispers on it
def recluster_graph():
    # extract data
    ngot = NGOT()
    if request.method == 'POST':
        ngot = NGOT.from_json(request.data)
    # create links dic and nodes dic
    ngot.nodes_dic = map_ngot_nodes_2_dic(ngot)
    ngot.links_dic = map_ngot_links_2_dic(ngot)
    # recluster
    reclustered_graph, ngot = chinese_whispers(ngot)
    ngot = add_cluster_stats(ngot)
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
    ngot = add_cluster_stats(ngot)
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


@app.route('/api/collections/<string:collection>/wordfeaturecounts', methods=['POST'])
# get word feature counts
def wordfeaturecounts_get(collection="default"):
    if request.method == 'POST':
        data = json.loads(request.data)
        word1 = str(data["word1"])
        word2 = str(data["word2"])
        feature = str(data["feature"])
        return wordfeature_counts(get_config(), collection, word1, word2, feature)

# @app.route('/autocomplete/<string:collection>', methods=['GET'])

@app.route('/api/collections/<string:collection>/autocomplete', methods=['POST'])
# autocomplete for target_word input
def autocomplete_target(collection="default"):
    if request.method == 'POST':
        data = json.loads(request.data)
        query_text = data.get("query", "").strip()
        # print(f"query text:{query_text}")
        if not query_text:
            return jsonify([])

        config = get_config()
        db = Database(collection, config["collections"][collection]["db"])
        suggestions = db.get_word_suggestions(query_text)
        return jsonify(suggestions)



if __name__ == '__main__':
    # init packaging system parent
    # this is not permanent (this is why we do it again and again ...)
    sys.path.append(str(Path(__file__).parent.absolute()))
    # use the config file to get host and database parameters
    # app.run(host=get_config()['flask_host'])
    app.run(port=5001, debug=False)
