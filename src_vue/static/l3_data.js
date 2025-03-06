// DATA ##################################################
// (1) graph: The whole application works on a graph as the main datastructure
// THIS MAIN MODEL IS GIVEN TO THE VARIOUS FRAMEWORKS IN THE BACKEND AND FRONTED AS (DEEP) COPIES AS THESE MANIPULATE THE DATA
// (1) Backend: networkX - requires a certain format and works on this
// (2) Frontend: vueData: it needs some duplicate parts of the graph for view-manipulation (while not changing the original ones)
// (3) Frontend: d3Data: it needs deep copies of the graph links as it changes the objects (ie resolves target and source to actual nodes)
//  (§) D3: AND it creates additional nodes and links vars with even more view information - thus D3 has TWO link arrays on its own seperate to the model!
//

// The naming scheme uses graph and network-terminology interchangeable
// "A complex network is a graph in which a set of elements is associated with a set of entities, and in which the relation
// between the elements represents a relationship between the corresponding entities".
// Links = edges , nodes = vertices
// the words ngot and static are used as antidotes - a static edge - one single edge in one interval
// ngot-node = dynamic edge aggreggated from various static

let graph = {
  /**
   * This is the BASE-MODEL -
   * Some props also exist as deep copies in the VueAPP and d3 for manipulation
   * for example: target-word here is immutable for this graph
   * BUT target-word in the vue-app can be changed by user (it is committed by create graph to this model)
   */

  nodes: [],
  links: [],
  singletons: [],
  clusters: [],
  transit_links: [],
  props: {
    // Interval-Data-Parameters
    collection_key: "",
    start_year: "",
    end_year: "",
    // Graph-Parameter
    target_word: "",
    // parameter d
    density: 0,
    // parameter n
    n_nodes: 0,
    // parameter graph type - determines which kind of edges are needed -this is the value in the key-value list of vue
    graph_type: "",
    // In addition, both cluster-shared words and the full graph can be target - filtered
    // this means that all only those features of all nodes and edges are used that are also features of bar
    cluster_target_filter: true,
    // ---------------------- DERIVED FROM ABOVE USER-INPUT, Graph-type AND GRAPH
    // resolved from graph-type by frontend
    e_edges: 0,
    // resolved by frontend
    number_of_intervals: 0,
    selected_time_ids: [],
    // parameter n - only one is set depending on graph-type
    number_of_static_nodes_per_interval: 0,
    // scaled with i [ie this refers to the global total]
    number_of_static_nodes_global: 0,
    // number
    number_of_ngot_nodes: 0,
    // only one parameter is set depending on graph-type
    number_of_static_directed_edges_per_interval: 0,
    // scaled with i [ie this refers to the global total]
    number_of_static_directed_edges_global: 0,
    // attention we count directed overlaid edges here -> they are later overlaid/simplified to an undirected graph
    number_of_ngot_directed_edges: 0,
    // number of edges in different intervals [for ngot-global derived from actual graph]
    number_of_interval_edges: [],
    number_of_interval_links: [],
    // removes singleton information in backend
    remove_singletons: false,
    target_counts_map:{},

  },
};

let d3Data = {
  // d3 changes the graph data by resolving
  // link ids to nodes - it thus needs it own data
  // link data to work on - these are the base links
  links: [],
  // in addition it creates further representations of the nodes and links - so called view nodes, view links
  node: "",
  circles: [],
  link: "",
  // further vars that need to be shared among the various functions
  svg: null,
  brush: null,
  drag_node: null,
  time_diff_tip: null,
  time_diff_tip_link: null,
  shiftKey: null,
  simulation: null,
};

let vueData = {
  // (1) GRAPH PARAMETERS DISPLAYED IN SLIDER LEFT ------------------------------------------
  // ATTENTION THESE PROPS ARE SEPARATE TO THE GRAPH MODEL - They can be changed here, but need to be consistent in model
  // all possible collection info queried from database via rest-api
  collections: {},
  //Selected User Values for frontend- suggestions from collections
  // the title for description in the frontend
  collection_name: "fetching data...",
  // dropdown list
  collections_names: ["fetching data..."],
  // Displayed in Info
  collection_info: "0",
  // stored in background: The key is unique identifier of the collection and is used for querying data from the backend
  collection_key: "0",
  is_ES_available: false,
   // short name for io functions purpose
  collection_name_short: "",
  // Selected start-year out of all possible start years for the selected collection
  start_year: 0,
  // dropdown list: all possible start years per selected collection queried from the database after selection of collection
  start_years: [{ id: 1, text: "fetching data...", value: 0 }],
  // Selected end-year out of all possible end years for the selected collection
  end_year: 0,
  // dropdown_list all possible end years per selected collection queried from the database after selection of collection
  end_years: [{ id: 1, text: "fetching data...", value: 0 }],
  // The Graph-algos use the two key parameters n and d differently
  // this refers to the KEYS of the dropdown
  graph_type: "fetching data...",
  // all possible graph type KEYS displays dropdown listin frontend
  graph_types: ["fetching data..."],
  //  KEY_VALUE used for querying specific graph from backend (in the backend and graph.props the VALUE is stored)
  // not used : "GLOBAL N*I & GLOBAL E scaled by I (node & edge manipulation)": "ngot_global",
  graph_type_keys: {
     "NGoT Fixed (best for comparison)": "ngot_overlay",
    "Interval Fixed (best for overview and time-diff)": "ngot_interval",
    "NGoT nodes & GLOBAL edges (for manipulation)": "scot_scaled",
  },
  // User Values - Input
  target_word: "",
  // n - number of nearest neighbour nodes [as defined by graph algo]
  n_nodes: 0,
  // d: density - [as defined by graph algo]
  density: 0,
  // derived from density
  e_edges: 0,
  // --------------------------
  // Deep Copies of MAIN-NETWORK-GRAPH-DATA FOR DISPLAY & MANIPULATION ---------------------
  // For display from main datastructure
  singletons: [],
  graph_clusters: [],
  // Shallow copies for various calculations node dic and link dic needed
  // form { id: {all_node/link_data}}
  node_dic: {},
  link_dic: {},
  cluster_dic: {},
//  target_word_counts:[],
  // ----------------------- LEGACY DATASTRUCTURES
  // LEGACY : is created in the frontend
  clusters: [],
  // LEGACY: used to store backend json
  newclusters: {},
  // LEGAcY: An object for remembering which nodes are connected. The key is of the form "source, target"
  linkedByIndex: {},

  // GENERAL SVG VIEW SETTINGS -----------------------------------------------------------------------------------------
  // ------------- target
  svg_target_text_opacity: 0.3,
  svg_target_text_font_size: "25px",
  // -----------------------------------------------------------
  // link thickness parameters
  link_thickness_scaled: "false",
  // scaled = "false" -> thickness = value
  link_thickness_value: 4,
  // scaled = "true" -> thickness = sqrt(weight * factor)
  link_thickness_factor: 0.003,
  // opacity of links base and reduced (for many functions)
  base_link_opacity: 0.2,
  reduced_link_opacity: 0.05,
  // ---------------------------------------------------------
  // opacity of nodes
  node_stroke_opacity: 0.2,
  node_fill_opacity: 1,
  // node stroke width
  node_stroke_width: 1.5,
  // base opacity node
  // reduced opacity for hovering over node
  node_reduced_opacity: 0.2,
  // font-size of displayed node text
  node_text_font_size: 12,
  // radius of cluter nodes
  clusterNodeRadius: 20,
  // radius of nodes
  radius: 8,
  activeNodeRadius:20,
  active_node_text_font_size: 20,

  // ------------------ SIMULATION ------------------------------------
  // dragging behaviour sticky-mode === "true" -> single-drag, sticky_mode === "false" -> multi-drag
  sticky_mode: "true",
  // simulation parameters
  charge: -40,
  linkdistance: 60,
  // SIDEBAR LOGIC MAIN FRAME VUE ----------------------------------------------------------
  //overlays central - displays overal while rendering
  overlay_main: false,
  // true, if a graph is rendered. Used in the HTML to only show buttons if a graph is rendered
  graph_rendered: false,
  // wait rendering - show blur over graph
  wait_rendering: false,
  // SAVED AND LOADED GRAPH-FILE - loading modal -------------------------------------------------------------------------
  // file from which a graph is to be loaded
  file: null,
  // graph loaded from file
  read_graph: null,

  // GLOBAL STATE SPECIFIC TO COMPONENTS ###############################################
  // ------------------------------- NAVBAR ---------------------------------------------------------------
  // PRESET title top-left
  title: "Sense Clustering over Time",
  // -------------------------------- SIDEBAR LEFT SENSE GRAPH OVER TIME -----------------------------------
  // ## SIDEBAR LEFT GRAPH
  left_selected: "graph_data",
  left_options: [
    { text: "Graph", value: "graph_data" },
    { text: "View", value: "graph_view" },
    { text: "Help", value: "graph_help" },
  ],
  // --------------------------------- RENDER GRAPH-FUNCTIONS
  // all settings are above
  // ------------------------------- SIDEBAR RIGHT: CLUSTER ANALYSIS ---------------------------------------
  // sigebar right: holds cluster context information (score, key, score2)
  cluster_shared_object: [],
  // the time id of the graph start year, user input for skipping through time slices
  min_time_id: 1,
  // the time_id of the graph end year, user input for skipping through time slices
  max_time_id: 10,
  // time ids for the time diff mode
  interval_start: 0,
  interval_end: 0,
  // user input: time slice id for skipping through time slices in time diff mode
  interval_id: 0,
  // display nodes in one time-slice
  time_slice_nodes: [],
  // accumulate which nodes are born, deceased, shortlived or normal
  time_diff_nodes: {},
  // true if a node is selected, for showing node option menu
  node_selected: false,
  // true if a link is selected
  link_selected: false,
  // check if selected node is cluster node, for options in the node option menu
  select_node_is_no_cluster_node: true,
  // array that holds information about all selected nodes
  clicked_nodes: [],
  // user input for assignment to different cluster (text, colour)
  new_assigned_cluster: {},
  // user input new cluster name
  created_cluster_name: "",
  // user input new cluster colour
  created_cluster_colour: "",
  // true if the user has selected a cluster
  // TODO implement functionality, currently buggy and not in use
  cluster_selected: false,
  // search term for searching a node in the graph
  searchterm: "",
  // betweenness centrality
  centrality_scores: [],
  // for table display
  centrality_fields: [
    { key: "node", sortable: true },
    { key: "centrality_score", sortable: true },
  ],

  // user input
  centrality_threshold_s: "0.01",
  centrality_threshold_m: "0.02",
  centrality_score_distribution: [],
  // toggling the edit column
  edit_column_open: false,
  // highlight balanced neighbourhood
  highlightWobblies: false,
  // highlight betweenness centrality
  hightlighInbetweennessCentrality: false,
  // balanced neighbourhood table fields
  wobblyCandidatesFields: [
    { key: "text", label: "Node", sortable: true },
    {
      key: "connected_clusters",
      label: "Connected Clusters",
      sortable: false,
    },
    { key: "balanced", label: "Balanced", sortable: true },
    { key: "show_details", label: "Show Details" },
  ],
  // array containing information about the neighbourhood of each node
  wobblyCandidates: [],

  // ## SIDEBAR right Cluster
  right_selected: "cluster_basic",
  right_selected_previous: "cluster_basic",
  right_options: [
    { text: "Cluster", value: "cluster_basic" },
    { text: "Time-Diff", value: "cluster_time" },
    { text: "Functions", value: "cluster_functions" },
  ],
  // controls node colors cluster or time-diff
  time_diff: false,
  // -------------------------------- SIDEBAR RIGHT:EDGE INFORMATION --------------------------
  // limits the size of clusters for context-information-search
  cluster_search_limit: 20,
  // d3 -> sidebar : edge-click information for data-query for sidebar
  active_edge: {
    time_ids: ["1"],
    time_slices:["0000"],
    weights: ["1"],
    source_counts_map:{}, target_counts_map:{},
    source_text: "0",
    target_text: "0",
    cluster_info_link: true,
    colour:"",
    dtype:"node",
  },
  // sigebar right: holds edge context information (score, key, score2)
  simbim_object: [],
  jobim_counts:[],
  // row_selected in edge Context
  row_selected_edge: [],
  // edge context sidebar is programmatically controlled
//  context_mode: false,
//  showSidebar_edge: false,
  // spinner while loading table data
//  busy_right_edge: false,
  // table information for edge -context view sidebar
//  fields_edges: [
//    { key: "node1", label: "node1", sortable: true },
//    { key: "edge", label: "context-word", sortable: true },
//    { key: "node2", label: "node2", sortable: true },
//  ],
  // --------------------------------- SIDEBAR RIGHT: NODE INFORMATION ----------------------------
  // d3-> Sidebar: node-click information for data-query for sidebar
  active_node: {
    time_ids: ["1"],
    time_slices:["0000"],
    weights: ["1"],
    weight_max: "1", weight_average:"1", weight_average_all:"1",
    counts_map:{},
    source_text: "0",
    target_text: "0",
    cluster_id: 0,
    cluster_name: "0",
    colour: "",
    dtype:"node",
  },
  // sigebar right: holds node context information (score, key, score2)
  simbim_node_object: [],
  // node-year for context-information
  node_time_id: 1,
  // row_selected in Node-context
  row_selected: [],
  feature_selected:false,
  // node context sidebar
//  context_mode3: false,
  showSidebar_node: false,
  busy_right_node: false,
  // table information for node -context view sidebar
//  fields_nodes: [
//    { key: "node1", label: "node1", sortable: true },
//    { key: "edge", label: "context-word", sortable: true },
//    { key: "node2", label: "node2", sortable: true },
//  ],
  bim_objects: [], //will point to either simbim_node_object or simbim_object
  bim_fields: [
    { key: "node1", label: "node1", sortable: true },
    { key: "edge", label: "context-word", sortable: true },
    { key: "node2", label: "node2", sortable: true },
  ],
  active_component: {source_text:"node1",
                    target_text:"node2",
                    time_slices:["0000"]},
  selected_bim:'',
  filter_bims:'',
  filter_bims_on:["edge"],
  // -------------------------------- SIDEBAR left: cluster context --------------------------
 showSidebar_right:false,
  // cluster context sidebar
//  context_mode2: false,
  showSidebar_cluster: false,
  busy_right_cluster: true,
  // table information for cluster -context view sidebar
  fields_cluster: [
    {key:"selected", label:"selected", stickyColumn:true, isRowHeader: true},
    { key: "score", label: "score", sortable: true },
    { key: "wort", label: "context-word", sortable: true },
  ],
  filter_clusterbims:'',
  filter_clusterbims_on:["wort"],
  cluster_contexts_freq:{},
  selected_contexts_cluster:[],
  table_records:[],
  selected_contexts_cluster_all:new Map(),
  cluster_feature_selected:false,
  selectAll:false,
  filter_clusterbims_changed:false,
  // doc context sidebar
//  context_mode4: false,
  // show sidebar
  showSidebar_docs: false,
  // spinner
  busy_right_docs: false,
  // table information for cluster -context view sidebar
  documents: [],
  fields_documents: [{ key: "doc", sortable: true }],
  filter_docs:"",
  filter_docs_on:["doc"],
  docs_loaded:false,

  // ############# DEPRECATED #########################
  // Deprecated
  data_from_db: {},
  // Deprecated: parameters for updating the graph
  update_senses: 150,
  update_edges: 50,
  // clipboard for data from db in update() and getData()
  // all the nodes in the updated graph
  updated_nodes: null,
  // all the links in the updated graph
  updated_links: null,
  selected_cluster:'', //selected cluster to show graph
  selected_clusters:[],
  allClustersSelected:false,
  clusters_for_graph:[],
  show_plot:false,
  show_plot_btn:"Show"
};
