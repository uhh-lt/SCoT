from persistence.documentdb import Documentdb
from persistence.db import Database, get_db
import json


def ngot_interval(db, target_word, time_ids, paradigms, density, remove_singletons):
    # creates overlay with interval-graphs per time_id in time-ids
    print("NGOT interval")
    # STEP 1: GET ALL NODES FROM EACH INTERVAl
    node_dic = {}
    for time_id in time_ids:
        result = db.get_nodes_interval(target_word, paradigms, time_id)

        for res in result:
            if res[0] not in node_dic:
                node_dic[res[0]] = res[1]
            else:
                # add time res[1]["time_ids"] zu node_dic[res[0]]["time_ids"]
                node_dic[res[0]]["time_ids"].append(res[1]["time_ids"][0])
                node_dic[res[0]]["weights"].append(res[1]["weights"][0])
    nodes = [[k, v] for k, v in node_dic.items()]
    print("total additiver graph nodes", len(nodes))
    # STEP 2 GET ALL EDGES
    edges, nodes, singletons = db.get_edges_per_time(
        nodes, paradigms, density, time_ids, remove_singletons)
    # STEP 3 RETURN OVERLAY
    return edges, nodes, singletons


def ngot_overlay_global(db, target_word, time_ids, paradigms, density, remove_singletons):
    # dynamic implementation of old scot-algorithm: nodes overlay, edges: global (scales with intervals)
    print("nodes global fixed/edges - global dyn - data fixed")
    nodes = db.get_nodes_overlay(target_word, paradigms, time_ids)
    edges, nodes, singletons = db.get_edges(
        nodes, density, time_ids, remove_singletons)
    return edges, nodes, singletons


def ngot_overlay(db, target_word, time_ids, paradigms, density, remove_singletons):
    print("NGOT overlay")
    # NGOT - Overlay-fixed (expands global nodes dynamically)
    # Edges in time, fixed global overlay edges, scaled
    nodes = db.get_nodes_overlay(target_word, paradigms, time_ids)
    edges, nodes, singletons = db.get_edges_in_time(
        nodes, density, time_ids, remove_singletons)
    return edges, nodes, singletons


def ngot_global(db, target_word, time_ids, paradigms, density, remove_singletons):
    print("NGOT global")
    # NOT IMPLEMENTED FULLY YET
    # background fixing dynamic for edges - static for nodes (currently)
    # Nodes not scaled yet for global algo - global searches for paradigms * |time-ids |
    nodes = db.get_nodes_global(target_word, paradigms, time_ids)
    edges, nodes, singletons = db.get_edges(
        nodes, density, time_ids, remove_singletons)
    return edges, nodes, singletons


def get_graph(config, collection, target_word, start_year, end_year, paradigms, density, graph_type, remove_singletons):
    # offers various projections and clustering-algos depending on graph-type
    # Retrieves the clustered graph data according to the input parameters of the user and return it as json
    # Param: target word: user selected target word out of all possible target words
    # Param: selected_start_year: user selected start year out of all possible start years
    # Param: selected_end_year: user selected end year out of all possible end years
    # Param: max number of cumulated paradigms over time - the global graph will have paradigms up to this number
    # Param: max_ed
    # Param: collection
    # Precondition: selected_start_year < selected_end_year
    # Precondition: All Params not null
    # Precondition: All Params valid (target word validity cannot be guaranteed by frontend?)
    # Postcondition: valid graph in valid json-format
    # Resolve start and end year -> time-ids
    db = Database(get_db(config, collection))
    time_ids = db.get_time_ids(start_year, end_year)
    # build neighbourhood graph over time
    if str(graph_type) == "ngot_interval":
        edges, nodes, singletons = ngot_interval(
            db, target_word, time_ids, paradigms, density, remove_singletons)
    elif str(graph_type) == "ngot_overlay":
        edges, nodes, singletons = ngot_overlay(
            db, target_word, time_ids, paradigms, density, remove_singletons)
    elif str(graph_type) == "ngot_global":
        edges, nodes, singletons = ngot_global(
            db, target_word, time_ids, paradigms, density, remove_singletons)
    # as default calls overlay_global (dynamic version of first SCoT-algorithm)
    else:
        edges, nodes, singletons = ngot_overlay_global(
            db, target_word, time_ids, paradigms, density, remove_singletons)
    return edges, nodes, singletons
