from dataclasses import dataclass, field, asdict
from dataclasses_json import dataclass_json
from typing import List, Dict, Optional
from flask_sqlalchemy import SQLAlchemy

"""  
This defines the model of the clustered neighbourhood graph over time
It dynamically merges a number of static nodes and edges
The same model is used in the fronted
The transfer-format is JSON - dataclass-json decorators are used for serialization and deserialization
"""


@dataclass_json
@dataclass()
class NGOTNode:
    id: Optional[str] = None
    text: Optional[str] = None
    # max weight as main derived from weights
    weight: Optional[int] = None
    # overlay data information
    time_ids: List[int] = None
    weights: List[float] = None
    # calculated scores and clusters
    centrality_score: Optional[float] = None
    cluster_id: Optional[int] = None
    # display - values can be tweaked in frontend
    x: Optional[float] = None
    y: Optional[float] = None
    # fixed x and y
    fx: Optional[float] = None
    fy: Optional[float] = None
    # color and opacity can change during various interactions
    color: Optional[float] = None
    opacity: Optional[float] = None
    hidden: Optional[bool] = None


@dataclass_json
@dataclass()
class NGOTLink():
    # id is uuid - string
    id: Optional[str] = None
    # node is von source und target
    source: Optional[str] = None
    target: Optional[str] = None
    # max weight
    weight: Optional[float] = None
    # time ids and weights
    time_ids: List[int] = None
    weights: List[float] = None
    # color and opacity can change during various interactions
    color: Optional[float] = None
    opacity: Optional[float] = None
    hidden: Optional[bool] = None
    # No Positional data as these depend on nodes


@dataclass_json
@dataclass()
class NGOTCluster:
    id: Optional[int] = None
    # changeable by user
    name: Optional[str] = None
    # Display
    color: Optional[int] = None
    # data information with IDs [-> can be used as labels]
    cluster_nodes: List[str] = None
    # edges between cluster nodes with IDs [-> for coloring]
    cluster_links: List[str] = None
    # default: special cluster node for displaying cluster - IT IS STORED ONLY HERE!!!!
    label_node: Optional[NGOTNode] = None
    # connecting edges from the label_node to all cluster_nodes
    edges_label_node: List[NGOTLink] = None
    # show yes no
    show_label_node: bool = False


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
    # Do not change if not necessary
    remove_singletons: bool = False


@dataclass_json
@dataclass()
class NGOT():
    properties: NGOTProperties = None
    nodes: List[NGOTNode] = None
    links: List[NGOTLink] = None
    clusters: List[NGOTCluster] = None
    # list with ids of singleton nodes [they are part of nodes]
    singletons: List[str] = None
    # list with ids of transitlinks [they are part of links]
    transit_links: List[str] = None
