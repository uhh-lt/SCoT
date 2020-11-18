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
class IntervalNode:
    # this is non-overlayd node
    # from one time-interval
    id: str = None
    #data information
    time_id: int = None
    weight: float = None
    # calculated scores and clusters
    # in the interval it exists
    centrality_score: float = None
    # this cluster-id relates to an intervalCluster
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
class IntervalLink:
    id: str = None
    #data information
    source: IntervalNode = None
    target: IntervalNode = None
    time_id: int = None
    weight: float = None


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
class IntervalCluster:
    id: int = None
    # changeable by user
    name: str = None
    # interval
    time_id: int = None
    #data information
    nodes: List[IntervalNode] = None
    #edges between cluster nodes
    edges: List[IntervalLink] = None
    # Display
    cluster_color : int = None
    # Display - special cluster node for displaying cluster
    cluster_node : IntervalNode = None


@dataclass
class OverlaySingletons:
    #data information
    nodes: List[OverlayNode] = None

@dataclass
class IntervalSingletons:
    #data information
    nodes: List[IntervalNode] = None
    time_id: int = None


@dataclass
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

@dataclass
class OverlayGraph:
    overlay_nodes: List[OverlayNode]  = None
    overlay_edges: List[OverlayLink] = None
    overlay_cluster: List[OverlayCluster] = None
    overlay_singletons: List[OverlayNode] = None
    in_out_parameter: InOutParameter = None

@dataclass
class IntervalGraph:
    interval_nodes: List[IntervalNode]  = None
    interval_edges: List[IntervalLink] = None
    interval_cluster: List[IntervalCluster] = None
    interval_singletons: List[IntervalNode] = None
    in_out_parameter: InOutParameter = None
   




