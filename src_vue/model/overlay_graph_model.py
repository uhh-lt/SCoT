from dataclasses import dataclass, field, asdict
from typing import List, Dict
from flask_sqlalchemy import SQLAlchemy

"""  
This defines the model of the overlay-graph and its subclasses
"""

#------------- JSON GRAPH ELEMENTS
# create Nodes first
@dataclass
class OverlayNode:
    id: str = None
    #overlay data information
    time_ids: List[int] = None
    weights: List[float] = None
     # calculated scores and clusters
    centrality_score: float = None
    cluster_id: int = None
    #display - values can be tweaked in frontend
    x: float = None
    y: float = None
    hidden: bool = None
    # color and opacity can change during various interactions
    color: float = None
    opacity: float = None

# links depend on nodes
@dataclass
class OverlayLink():
    # restraint - the time-ids of an edge must be within the time-ids of the nodes
    source: OverlayNode = None
    target: OverlayNode = None
    time_ids: List[int] = field(default_factory=[None])
    weights: List[float] = field(default_factory=[None])

# Calculated Cluster of Nodes and Edges
@dataclass
class OverlyCluster:
    id: int = None
    # changeable by user
    name: str = None
    # Display
    cluster_color : int = None
    # Display - special cluster node for displaying cluster
    cluster_node : OverlayNode = None
    #data information
    nodes: List[OverlayNode] = None
    #edges between cluster nodes
    edges: List[OverlayLink] = None
    
# -------- SINGLETON-GRAPHS - nodes not in clusters

@dataclass
class OverlaySingletons:
    #data information
    nodes: List[OverlayNode] = None

# -------- PARAMETERS OF THE GRAPH 

@dataclass(frozen =True)
class InOutParameter:
    # Dependending on the graph-building-algorithm
    # and graphtype [overlay graph - interval graph]
    # different node and edges number can act as In-parameters
    # those that are in:none should ideally be filled by the backend
    # and then act as out_parameter to give a full picture of the graph
    #interval-data
    corpus_key: str = None
    selected_intervals: List[int] = None
    #Graph-Building-algorithm
    graph_algorithm: str = None
    # graph-data
    target_word: str = None
    density: float = None
    # Global approach - number of nodes and edges is fixed across intervals
    global_interval_edges: int = None
    global_interval_nodes: int = None
    # overlay approach - number of overlaid nodes and edges is fixed
    global_overlaid_nodes: int = None
    global_overlaid_edges: int = None
    # interval -appraoch - number of nodes and edges per selected interval
    interval_edges: List[int]  = None
    interval_nodes: List[int]  = None

# ----------- RESULTING GRAPHS
@dataclass(frozen=True)
class OverlayGraph():
    in_out_parameter: InOutParameter = None
    overlay_nodes: List[OverlayNode]  = None
    overlay_edges: List[OverlayLink] = None
    overlay_cluster: List[OverlayCluster] = None
    overlay_singletons: List[OverlayNode] = None


