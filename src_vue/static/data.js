// STATE MANAGEMENT ##################################################
// (1) graph: The application works on a graph as the main datastructure
// (1) vueData: it needs some duplicate parts of the graph for view-manipulation (while not changing the original ones)
// (3) d3Data: it derives from this main-graph-datastructure a d3-graph model for display in the DOM
//
// The naming scheme of the application uses graph and network-terminology interchangeable
// "A complex network is a graph in which a set of elements is associated with a set of entities, and in which the relation
// between the elements represents a relationship between the corresponding entities".
// Links = edges , nodes = vertices

let graph = {
  /**
   * This is the BASE-MODEL on which the two frameworks work
   * Some props also exist as duplicates in the VueAPP (where they can be changed)
   * for example: target-word here is immutable for this graph
   * BUT target-word in the vue-app can be changed by user (it is committed by create graph to this model)
   */

  nodes: [],
  links: [],
  singletons: [],
  clusters: [],
  props: {
    collection_key: "",
    start_year: "",
    end_year: "",
    target_word: "",
    senses: 0,
    edges: 0,
    graph_type: "",
  },
};

let d3Data = {
  node: "",
  circles: [],
  link: "",
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
  // Selected start-year out of all possible start years for the selected collection
  start_year: 0,
  // dropdown list: all possible start years per selected collection queried from the database after selection of collection
  start_years: [{ id: 1, text: "fetching data...", value: 0 }],
  // Selected end-year out of all possible end years for the selected collection
  end_year: 0,
  // dropdown_list all possible end years per selected collection queried from the database after selection of collection
  end_years: [{ id: 1, text: "fetching data...", value: 0 }],
  // The Graph-algos use the two key parameters n and d differently
  graph_type: "fetching data...",
  // all possible graph types displays dropdown listin frontend
  graph_types: ["fetching data..."],
  //  keys used for querying specific graph from backend
  // not used : "n & d Global Static (absolute nodes and dir. edges)" : "ngot_global",
  graph_type_keys: {
    "INTERVAL[n&d per i] (best for overview and time-diff)": "ngot_interval",
    "OVERLAY[n&d] (best for comparison)": "ngot_overlay",
    "OVERLAY[n] & GLOBAL[d total] (edge manipulation)": "scot",
    "GLOBAL[n*i] & GLOBAL[d total] (node & edge manipulation)": "ngot_global",
  },
  // User Values - Input
  target_word: "",
  // n - number of nearest neighbour nodes [as defined by graph algo]
  senses: 0,
  // d: density - [as defined by graph algo]
  edge_max_ratio: 0,
  // --------------------------
  // DUPLICATES OF MAIN-NETWORK-GRAPH-DATA FOR DISPLAY & MANIPULATION ---------------------
  // For display
  singletons: [],
  // is created in the frontend [is that useful?]
  clusters: [],
  // ADDITIONAL FIELDS FOR WORKING ON GRAPH
  // new clusters calculated by reclustering the graph
  newclusters: {},
  // -----------------------
  // An object for remembering which nodes are connected. The key is of the form "source, target"
  linkedByIndex: {},

  // GENERAL SVG VIEW SETTINGS -----------------------------------------------------------------------------------------
  // for setting the view port size for the graph
  viewport_height: screen.availHeight * 1,
  viewport_width: screen.availWidth * 1,
  // for setting the svg size for the graph
  svg_height: screen.availHeight * 1.5,
  svg_width: screen.availWidth * 1.5,
  // link thickness parameters
  link_thickness_scaled: "false",
  // scaled = "false" -> thickness = sqrt(value)
  link_thickness_value: 1,
  // scaled = "true" -> thickness = sqrt(weight * factor)
  link_thickness_factor: 0.003,
  // opacity of links base and reduced (for many functions)
  base_link_opacity: 0.2,
  reduced_link_opacity: 0.05,
  // radius of nodes
  radius: 5,
  // radius of cluter nodes
  clusterNodeRadius: 20,
  // dragging behaviour sticky_mode === "true" -> force, sticky_mode === "false" -> brush
  sticky_mode: "true",
  // simulation parameters
  charge: -50,
  linkdistance: 50,
  // WHILE RENDERING ----------------------------------------------------------
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
    { text: "Info", value: "graph_help" },
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
  cluster_search_limit: 1000,
  // d3 -> sidebar : edge-click information for data-query for sidebar
  active_edge: {
    time_ids: [1],
    weights: [1],
    source_text: "happiness/NN",
    target_text: "gladness/NN",
  },
  // sigebar right: holds edge context information (score, key, score2)
  simbim_object: [],
  // row_selected in edge Context
  row_selected_edge: [],
  // edge context sidebar is programmatically controlled
  context_mode: false,
  showSidebarRight1: false,
  // spinner while loading table data
  busy_right1: false,
  // table information for edge -context view sidebar
  fields_edges: [
    { key: "node1", label: "node1", sortable: true },
    { key: "edge", label: "context-word", sortable: true },
    { key: "node2", label: "node2", sortable: true },
  ],
  // --------------------------------- SIDEBAR RIGHT: NODE INFORMATION ----------------------------
  // d3-> Sidebar: node-click information for data-query for sidebar
  active_node: {
    time_ids: [1],
    weights: [1],
    source_text: "happiness/NN",
    target_text: "gladness/NN",
  },
  // sigebar right: holds node context information (score, key, score2)
  simbim_node_object: [],
  // node-year for context-information
  node_time_id: 1,
  // row_selected in Node-context
  row_selected: [],
  // node context sidebar
  context_mode3: false,
  showSidebarRight3: false,
  busy_right3: false,
  // table information for node -context view sidebar
  fields_nodes: [
    { key: "node1", label: "node1", sortable: true },
    { key: "edge", label: "context-word", sortable: true },
    { key: "node2", label: "node2", sortable: true },
  ],

  // -------------------------------- SIDEBAR left: cluster context --------------------------
  // cluster context sidebar
  context_mode2: false,
  showSidebarRight2: false,
  busy_right2: true,
  // table information for cluster -context view sidebar
  fields_cluster: [
    { key: "score", sortable: true },
    { key: "wort", sortable: true },
  ],
  // doc context sidebar
  context_mode4: false,
  // show sidebar
  showSidebarRight4: false,
  // spinner
  busy_right4: false,
  // table information for cluster -context view sidebar
  documents: [],
  fields_documents: [{ key: "doc", sortable: true }],

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
};
