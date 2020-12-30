from dataclasses import dataclass, field, asdict
from dataclasses_json import dataclass_json
from typing import List, Dict, Optional
from flask_sqlalchemy import SQLAlchemy

"""  
This defines the model of the clustered neighbourhood graph over time
The same model is used in the fronted
It is send back and forth and thereby updated
The transfer-format is JSON - dataclass-json decorators are used for serialization and deserialization
"""


@dataclass_json
@dataclass()
class NGOTNode:
    id: str = None
    # max weight as main derived from weights
    weight: int = None
    # overlay data information
    time_ids: List[int] = field(default_factory=[None])
    weights: List[float] = field(default_factory=[None])
    # calculated scores and clusters
    centrality_score: float = None
    cluster_id: int = None
    # display - values can be tweaked in frontend
    x: float = None
    y: float = None
    hidden: bool = None
    # fixed x and y
    fx: float = None
    fy: float = None
    # color and opacity can change during various interactions
    color: float = None
    opacity: float = None


@dataclass_json
@dataclass()
class NGOTLink():
    id: str = None
    # restraint - the time-ids of an edge must be within the time-ids of the nodes
    source: NGOTNode = None
    target: NGOTNode = None
    # max weight
    weight: float = None
    # time ids and weights
    time_ids: List[int] = field(default_factory=[None])
    weights: List[float] = field(default_factory=[None])
    # color and opacity can change during various interactions
    color: float = None
    opacity: float = None
    hidden: bool = None
    # No Positional data as these depend on nodes


@dataclass_json
@dataclass()
class NGOTCluster:
    id: int = None
    # changeable by user
    name: str = None
    # Display
    color: int = None
    # Display - special cluster node for displaying cluster - IT IS STORED ONLY HERE!!!!
    cluster_node: NGOTNode = None
    # data information with IDs [-> can be used as labels]
    nodes: List[NGOTNode] = field(default_factory=[None])
    # edges between cluster nodes with IDs [-> for coloring]
    edges: List[NGOTLink] = field(default_factory=[None])
    # edges that do not belong to a cluster can then also be specifically colored
    #


@dataclass_json
@dataclass()
class NGOTSingletons:
    # data information IDs only
    nodes: List[NGOTNode] = field(default_factory=[None])


@dataclass_json
@dataclass()
class NGOTTransitLinks:
    # data information IDs only
    edges: List[NGOTLink] = field(default_factory=[None])


@dataclass_json
@dataclass(frozen=True)
class NGOTProperties:
    # ngot/dynamic refers to the ngot - overlay/merging methods[an edge with several time-ids]
    # static refers to the static graph per interval [one static edge= in one interval]
    # data Props
    # parameter intervals= we need
    collection_key: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    # graph props
    target_word: Optional[str] = None
    number_of_intervals: Optional[int] = None
    selected_time_ids: List[int] = field(default_factory=[None])
    # graph params basic
    # parameter d
    density: Optional[float] = None
    # parameter n
    n_nodes: Optional[int] = None
    # parameter e - edges [precalculated from density in frontend according to graph-type]
    # this is resolved by graph-type to the more precise edge numbers below
    e_edges: Optional[int] = None
    # parameter graph type - determines what n and d refer to exactly
    graph_type: Optional[str] = None
    # resolved parameters per graph-type
    # parameter n - only one is set depending on graph-type
    number_of_static_nodes_per_interval: Optional[int] = None
    # scaled with i[ie this refers to the global total]
    number_of_static_nodes_global: Optional[int] = None
    # number
    number_of_ngot_nodes: Optional[int] = None
    # the number of edges is derived from density
    # only one parameter is set depending on graph-type
    number_of_static_directed_edges_per_interval: Optional[int] = None
    # scaled with i[ie this refers to the global total]
    number_of_static_directed_edges_global: Optional[int] = None
    # attention we count directed overlaid edges here -> they are later overlaid/simplified to an undirected graph
    number_of_ngot_directed_edges: Optional[int] = None
    # numbers derived from Graph
    # derived props for global and overlay [numbers can vary per interval...]
    number_of_interval_edges: List[int] = field(default_factory=[None])
    number_of_interval_links: List[int] = field(default_factory=[None])


@dataclass_json
@dataclass()
class NGOT():
    properties: NGOTProperties = None
    nodes: List[NGOTNode] = None
    links: List[NGOTLink] = None
    clusters: List[NGOTCluster] = None
    singletons: NGOTSingletons = None
    transit_links: NGOTTransitLinks = None
