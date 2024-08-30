from dataclasses import dataclass, field, asdict
from dataclasses_json import dataclass_json
from typing import List, Dict, Optional, Set

"""  
This defines the model of the clustered neighbourhood graph over time
It dynamically merges a number of static nodes and edges
The same model is used in the fronted
The transfer-format is JSON - dataclass-json decorators are used for serialization and deserialization
Deep copies of the model are provided to different additional frameworks for manipulation (ie d3 and networkx)
"""


@dataclass_json
@dataclass()
class NGOTNode:
    # new format for nodes - this is compatible to all usages in Python, networkx, Vue, D3
    # networkx requires an array-dic-format:mapping->
    # [[node.id, dataclasses.asdict(node)] for node in ngot_nodes]
    id: Optional[str] = None
    target_text: Optional[str] = None
    # Time Ids and weights over time ---------------------------------------------------
    # max weight as main derived from weights
    weight: Optional[int] = None
    # time interval data information
    time_ids: Optional[List[int]] = None
    weights: Optional[List[float]] = None
    # Graph score ---------------------------------------------------------------------
    centrality_score: Optional[float] = None
    # clusters ids and scores ----------------------------------------------------------
    cluster_id: Optional[int] = None
    # Cluster Metrics are computed
    # cluster max size is needed for balance score of nodes
    # A node has a balanced_cluster_connection if at least two clusters in its neigbourhood fulfil the following condition
    # max_links_to_one_connected_cluster - links_to_connected_cluster_i < mean_links_to_any_cluster /2
    # metric refers ngot directed links from and to each cluster
    # for number of undir links per cluster use neighbours by cluster lenght
    ngot_undir_links_with_each_cluster_max: Optional[int] = None
    ngot_undir_links_with_each_cluster_mean: Optional[int] = None
    ngot_undir_links_with_each_cluster_is_balanced: Optional[bool] = None
    # dictionary of neighbours by cluster {cluster: [neighbour_id_1, ...]}
    neighbours_by_cluster: Optional[Dict[int, List[str]]] = None
    # display - values are set and tweaked in frontend by D3 force -------------------
    # crucial for memorizing position - for recluster etc. pp.
    x: Optional[float] = None
    y: Optional[float] = None
    # fixed x and y - are fixed by user drag + fix
    fx: Optional[float] = None
    fy: Optional[float] = None
    # color and opacity can change during various interactions
    # colore relates in the frontend to the dom svg-circle element only
    colour: Optional[str] = None
    # opacity however relates to the dom svg g ".node", with the svg-els circle and text [and circle's stroke]
    opacity: Optional[float] = None
    # Feature - Different type ---------------------------------------------------------
    # ngot nodes can be used as well as nodes for cluster info
    # (they should be another type, but since d3 only uses one type of node - they go here)
    cluster_node: bool = False
    # info nodes are usually hidden
    hidden: bool = False


@dataclass_json
@dataclass()
class NGOTLink():
    # new format for links - this is compatible to all usages in Python, networkx, Vue, D3
    # networkx and d3 require a dic-format
    # easy mapping puts all these elements into array/dictionary. use following function
    # [link.source, link.target, dataclasses.asdict(link)] for link in ngot_links]
    # id is source + "-" + target String [diese kombination kann nur einmal pro Graph vorkommen - da ngot links overlaid sind]
    id: Optional[str] = None
    # node is s von source und target
    source: Optional[str] = None
    target: Optional[str] = None
    # time-ids and weigths over time ---------------------------------------------------------
    # max weight
    weight: Optional[float] = None
    # time ids and weights
    time_ids: Optional[List[int]] = None
    weights: Optional[List[float]] = None
    # cluster information --------------------------------------------------------------------
    # belongs to cluster [if none = transitlink , ansonsten id]
    cluster_id: Optional[int] = None
    # frontend display ------------------------------------------------------------------------
    # color and opacity can change during various interactions
    colour: Optional[str] = None
    opacity: Optional[float] = None
    # feature info type ----------------------------------------------------------------------
    # ngot links can be used as well as links for cluster info
    # then they may be hidden
    cluster_link: bool = False
    hidden: bool = False


@dataclass_json
@dataclass()
class NGOTCluster:
    # cluster - id and data -----------------------------
    cluster_id: Optional[int] = None
    # changeable by user
    cluster_name: Optional[str] = None
    # data information with IDs [-> can be used as labels] - length = clustersize
    cluster_nodes: Optional[List[str]] = None
    # edges between cluster nodes with IDs [-> for coloring]
    cluster_links: Optional[List[str]] = None
    # FRONTEND - DISPLAY -------------------------------
    colour: Optional[str] = None
    opacity: Optional[float] = None
    # default: special cluster node for displaying cluster
    cluster_info_node: Optional[NGOTNode] = None
    # connecting edges from the label_node to all cluster_nodes
    # now stored in normal links
    cluster_info_links: Optional[List[NGOTLink]] = None
    # show yes no
    add_cluster_node: bool = False
    # frontend -display - liste of objects of the form
    # nested structure of every label object
    # cluster_nodes = add
    # text = cluster_node id
    # text2 = cluster_node id + time_ids
    labels: Optional[List[None]] = None


@dataclass_json
@dataclass()
class NGOTStats:
    min_score:(float,str)=(0, '0000', 'node')
    max_score:(float,str)=(0, '0000', 'node')
    mean_score:float=0

    def __init__(self, min_score=None, max_score=None, mean_score=0):
        self.min_score = min_score
        self.max_score = max_score
        self.mean_score = mean_score



@dataclass_json
@dataclass()
class NGOTProperties:
    # NGOT Parameters managed by front- and back-end
    # All parameters, except those labelled as "result" are managed by the front-end
    # Result refers to the results of NGoT-building
    #  Definition:
    # ngot/dynamic refers to the ngot - merging methods[an edge with several time-ids]
    # static refers to the static graph per interval [one static edge= in one interval]
    # parameter interval-data
    collection_key: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    # graph props
    target_word: Optional[str] = None
    number_of_intervals: Optional[int] = None
    selected_time_ids: Optional[List[int]] = None
    # field(default_factory=[None])
    # graph params basic
    # parameter d - only relevant in frontend where it is resolved to e
    density: Optional[float] = None
    # parameter n
    n_nodes: Optional[int] = None
    # parameter e - edges [precalculated from density in frontend according to graph-type]
    # e is used in backend
    e_edges: Optional[int] = None
    # parameter graph type - determines what n and d refer to exactly
    graph_type: Optional[str] = None
    # In addition, both cluster-shared words and the full graph can be target - filtered
    # this means that all only those features of all nodes and edges are used that are also features of bar
    cluster_target_filter: Optional[bool] = None
    # ---------------------------------------------------------------
    # set and resulting parameters per graph-type
    # depending on graph-type some parameters are either used as in-param
    # or out-param
    # ---------------------------
    # ngot-interval: set [computed array for global and dynamic - see below]
    number_of_static_nodes_per_interval: Optional[int] = None
    number_of_static_directed_edges_per_interval: Optional[int] = None
    # derived props for global and overlay [numbers can vary per interval...]
    number_of_interval_nodes: Optional[List[int]] = None
    number_of_interval_links: Optional[List[int]] = None
    # ----------------------------
    # ngot-global: set, ngot-dynamic: result, ngot-interval: result
    # scaled with i[ie this refers to the global total]
    number_of_static_nodes_global: Optional[int] = None
    number_of_static_directed_edges_global: Optional[int] = None
    # ----------------------------
    # ngot-dynamic: set, ngot-global: result, ngot-interval: result
    number_of_ngot_nodes: Optional[int] = None
    # attention we count directed overlaid edges here!
    number_of_ngot_directed_edges: Optional[int] = None
    # max and min expected for ngot for testing
    # if graph = interval then number of static nodes per int. <= number of ngot nodes <= number of static nodes p. int * i
    # if graph = interval then number of satic edges per int. <= number of ngot edges <= number of static edges p. int * i
    # if graph = global then number of static nodes global / i <= number of ngot nodes <= number of static nodes global
    # if graph = global then number of static edges global / i <= number of ngot edges <= number of static edges global
    weight_stats:Optional[NGOTStats] = None
    # SPECIAL SETTING ------------------------------------------------
    # Do not change if not necessary
    remove_singletons: bool = False


@dataclass_json
@dataclass()
class NGOT():
    # the central properties of the graph - managed by Vue and by python
    props: Optional[NGOTProperties] = None
    # the main node list as managed by python and the vue-framework and d3 and sent via json
    nodes: Optional[List[NGOTNode]] = None
    # array of dics [node-id, {node-data}, ...] - conversion networkx and python - no frontend use
    nodes_dic: Optional[List[None]] = None
    # the main link list as managed by python and the vue-framework and d3 and sent via json
    links: Optional[List[NGOTLink]] = None
    # array of dics [link-id, {link-data}, ...] - conversion networkx and python - no frontend use
    links_dic: Optional[List[None]] = None
    # list with ids of singleton nodes [they are part of nodes] managed by python and vue
    singletons: Optional[List[str]] = None
    # the main datastructure for clusters managed by python and vue
    clusters: Optional[List[NGOTCluster]] = None
    # list with ids of transitlinks - they connect nodes of different clusters
    # used for balance score calc - the connected external clusters of any node can be calculated based on transit-links
    transit_links: Optional[List[str]] = None
