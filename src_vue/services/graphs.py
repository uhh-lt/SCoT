import time
from persistence.documentdb import Documentdb
from persistence.db import Database, get_db
from model.ngot_model import NGOTLink, NGOTNode
from model.ngot_mapper import map_nodes_dic_2_ngot, map_edges_dic_2_ngot
import dataclasses

import json
import uuid


def ngot_interval(db, ngot):
    # creates overlay with interval-graphs per time_id in time-ids
    print("NGOT interval")
    ngot = db.get_nodes_interval(ngot)
    print('%' * 25)
    print(time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(time.time())))
    print('%' * 25)
    ngot = db.get_edges_interval(ngot)
    return ngot


def ngot_dynamic(db, ngot):
    # NGOT - dynamic-fixed (expands global nodes dynamically)
    # Edges in time, fixed global overlay edges, scaled
    print("NGOT dynamic")
    ngot = db.get_nodes_overlay(ngot)
    print('%' * 25)
    print(time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(time.time())))
    print('%' * 25)
    ngot = db.get_edges_overlay(ngot)
    return ngot


def ngot_dynamic_global(db, ngot):
    # dynamic implementation of old scot-algorithm: nodes overlay, edges: global (scales with intervals)
    print("nodes global fixed/edges - global dyn - data fixed")
    ngot = db.get_nodes_overlay(ngot)
    ngot = db.get_edges_global_scaled(ngot)
    return ngot


# def ngot_global(db, target_word, time_ids, paradigms, density, remove_singletons, ngot):
#     print("NGOT global")
#     # NOT IMPLEMENTED FULLY YET
#     # background fixing dynamic for edges - static for nodes (currently)
#     # Nodes not scaled yet for global algo - global searches for paradigms * |time-ids |
#     nodes = db.get_nodes_global(target_word, paradigms, time_ids)
#     ngot = db.get_edges_global_scaled(ngot)
#     return ngot


def get_graph(config, ngot):
    # offers various projections and clustering-algos depending on graph-type
    # Retrieves the clustered graph data according to the input parameters of the user and return it as json
    # Param: ngot - model
    # Param: config with db setting
    # Precondition: selected_start_year < selected_end_year
    # Precondition: All Params not null
    # Precondition: All Params valid (target word validity cannot be guaranteed by frontend?)
    # Postcondition: valid graph in valid json-format
    # Resolve start and end year -> time-ids
    props = ngot.props
    db = Database(config, get_db(config, props.collection_key))
    # derive props time_ids from start and end year
    props.selected_time_ids = []
    props.selected_time_ids.extend(
        db.get_time_ids(props.start_year, props.end_year))
    start = time.time()
    print('%'*25)
    print(time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(start)))
    print('%' * 25)
    # build neighbourhood graph over time
    if props.graph_type == "ngot_interval":
        # ngot mapping included
        ngot = ngot_interval(db, ngot)
    elif props.graph_type == "ngot_overlay":
        # ngot mapping included
        ngot = ngot_dynamic(
            db, ngot)
    # elif props.graph_type == "ngot_global":
    #     # global is not implemented yet
    #     edges, nodes, singletons = ngot_global(
    #         db, props.target_word, props.selected_time_ids, props.n_nodes, props.e_edges, props.remove_singletons, ngot)
    #     # map graph (nodes, edges, singletons) to ngot
    #     ngot.nodes = map_nodes_dic_2_ngot(nodes)
    #     ngot.links = map_edges_dic_2_ngot(edges)
    #     ngot.singletons = singletons
    else:
        # as default calls overlay-nodes-global-edges (dynamic version of first SCoT-algorithm)
        ngot = ngot_dynamic_global(db, ngot)
    print('%' * 25)
    print(time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(time.time())))
    print('%' * 25)
    return ngot
