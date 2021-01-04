from persistence.documentdb import Documentdb
from persistence.db import Database, get_db
from model.ngot_model import NGOTLink, NGOTNode
from model.ngot_mapper import map_nodes, map_edges
import dataclasses

import json
import uuid


def ngot_interval(ngot, db):
    # creates overlay with interval-graphs per time_id in time-ids
    # params: from ngot
    print("NGOT interval")
    ngot = db.get_nodes_interval(ngot)
    # STEP 2 GET ALL EDGES
    edges, nodes, singletons, ngot = db.get_edges_per_time(ngot)
    # STEP 3 RETURN OVERLAY
    return edges, nodes, singletons, ngot


def ngot_overlay(db, target_word, time_ids, paradigms, density, remove_singletons):
    print("NGOT dynamic")
    # NGOT - Overlay-fixed (expands global nodes dynamically)
    # Edges in time, fixed global overlay edges, scaled
    nodes = db.get_nodes_overlay(target_word, paradigms, time_ids)
    edges, nodes, singletons = db.get_edges_in_time(
        nodes, density, time_ids, remove_singletons)
    return edges, nodes, singletons


def ngot_overlay_global(db, target_word, time_ids, paradigms, density, remove_singletons):
    # dynamic implementation of old scot-algorithm: nodes overlay, edges: global (scales with intervals)
    print("nodes global fixed/edges - global dyn - data fixed")
    nodes = db.get_nodes_overlay(target_word, paradigms, time_ids)
    edges, nodes, singletons = db.get_edges(
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
    db = Database(get_db(config, props.collection_key))
    # derive props time_ids from start and end year
    props.selected_time_ids = []
    props.selected_time_ids.extend(
        db.get_time_ids(props.start_year, props.end_year))
    # build neighbourhood graph over time
    if props.graph_type == "ngot_interval":
        edges, nodes, singletons, ngot = ngot_interval(ngot, db)
    elif props.graph_type == "ngot_overlay":
        edges, nodes, singletons = ngot_overlay(
            db, props.target_word, props.selected_time_ids, props.n_nodes, props.e_edges, props.remove_singletons)
    # global is not implemented yet
    elif props.graph_type == "ngot_global":
        edges, nodes, singletons = ngot_global(
            db, props.target_word, props.selected_time_ids, props.n_nodes, props.e_edges, props.remove_singletons)
    # as default calls overlay_global (dynamic version of first SCoT-algorithm)
    else:
        edges, nodes, singletons = ngot_overlay_global(
            db, props.target_word, props.selected_time_ids, props.n_nodes, props.e_edges, props.remove_singletons)
    # map graph (nodes, edges, singletons) to ngot
    ngot.nodes = map_nodes(nodes, ngot)
    ngot.links = map_edges(edges, ngot)
    ngot.singletons = singletons

    return edges, nodes,  ngot
