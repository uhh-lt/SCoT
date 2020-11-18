from dataclasses import dataclass, field, asdict
from typing import List


@dataclass
class OverlayNode:
    id: str = None
    #data information
    time_ids: List[int] = None
    weights: List[float] = None
    # calculated scores and clusters
    centrality_score: float = None
    cluster_id: int = None
    #display
    x: float = None
    y: float = None
    hidden: bool = None
    

@dataclass
class OverlayLink:
    id: str = None
    #data information
    source: OverlayNode = None
    target: OverlayNode = None
    time_ids: List[int] = field(default_factory=[None])
    weights: List[float] = field(default_factory=[None])



@dataclass
class OverlayCluster:
    id: int = None
    # changeable by user
    name: str = None
    #data information
    nodes: List[OverlayNode] = None
    #edges between cluster nodes
    edges: List[OverlayLink] = None
    # Display
    cluster_color : int = None
    # Display - special cluster node for displaying cluster
    cluster_node : OverlayNode = None


@dataclass
class OverlaySingletons:
    #data information
    nodes: List[OverlayNode] = None



@dataclass
class InOutParameter:
    # Dependending on the graph-building-algorithm
    # different node and edges number can act as In-parameters
    # those that are in:none should ideally be filled by the backend
    # and then act as out_parameter to give a full picture of the graph
    #interval-data
    corpus_key: str = None
    selected_intervals: List[int] = None
    #Graph-Building-algorithm
    graph_builder : str = None
    # graph-data
    target_word: str = None
    density: float = None
    global_non_overlaid_edges: int = None
    global_non_overlaid_nodes: int = None
    global_overlaid_nodes: int = None
    global_overlaid_edges: int = None
    interval_non_overlaid_edges: List[int]  = None # number per selected interval
    interval_non_overlad_nodes: List[int]  = None # number per selected interval

@dataclass
class Graph:
    overlay_nodes: List[OverlayNode]  = None
    overlay_edges: List[OverlayLink] = None
    overlay_cluster: List[OverlayCluster] = None
    overlay_singletons: List[OverlayNode] = None
    in_out_parameter: InOutParameter = None

   




