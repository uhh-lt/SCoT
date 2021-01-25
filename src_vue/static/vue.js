/**
 * See:
 * Haase, Anwar, Yimam, Friedrich, Biemann (2021):SCoT - Sense Clustering over Time - EACL 2021
 *
 * The frontend of the scot-app version 2 [this version] is based on the architectural decision to use two frameworks to manage parts of the dom independently
 * vue.js -> works on the data (vue App) related to the dom-elements managed by vue [sidebars, navbar and modals]
 * These functions are part of this file
 * the d3.graph.js file offers all functions that work on the dom-elements manage by d3 [the graph in the centre] -id"#graph2"
 * (except for base vars that relate to the container such as viewbox etc.)
 * d3-functions are recognizable by their name and are called via the global scope from the file d3_graph.js
 * In the ongoing work on the next iteration of SCoT - d3 will be more strongly integrated into the vue Frameowork and the module system will be used (no global scope)
 * In addition, all connector functions, ie getting data from the backend with axios, are part of the connector.js file.
 */

let vueApp = new Vue({
  el: "#vue-app",
  /**
   * Note on data- from file data.js - vue Data has three sub-data-objects: vue-App, graph and d3Data
   * graph.xyz refers to the global graph-model
   * d3Data.xyz refers to specific data for d3 [mainly a deep copy of the links from the global graph model]
   * vueData.xyz to the [reactivity] data specific to the VueApp
   *
   */
  data: vueData,
  computed: {
    // general svg
    // shift viewbox left/right and up/down
    // increase -> shift right ()
    viewbox_pan_horizontal() {
      return -screen.width * 0.01;
    },
    // increase -> down
    viewbox_pan_vertical() {
      return -screen.height * 0.07;
    },
    // larger viewbox height and width -> zoom out / smaller viewbox - > zoom in
    viewbox_height() {
      return screen.height * 1.2;
    },
    viewbox_width() {
      return screen.width * 1.8;
    },
    // for setting the svg size for the graph
    // THIS IS THE VIEWPORT
    svg_height() {
      return screen.height * 1;
    },
    // it needs to be wider than screen.width - otherwise it does
    svg_width() {
      return screen.width * 1.3;
    },
    // ######################   SIDEBAR LEFT GRAPH-CREATION ------------------------------------------------------------------------------
    /**
     * Return number of interval selected
     */
    number_of_intervals() {
      let starts = [];
      let ends = [];

      for (let key in this.start_years) {
        starts.push(this.start_years[key]["value"]);
      }
      for (let key in this.end_years) {
        ends.push(this.end_years[key]["value"]);
      }

      let startst = this.start_year;
      let endst = this.end_year;

      let start = starts.indexOf(startst);
      let end = ends.indexOf(endst);

      return end - start + 1;
    },
    /**
     * Returns number of edges [type is determined by graph type]
     */
    edges() {
      this.e_edges = Math.round((this.density / 100) * this.max_dir_edges);
      return this.e_edges;
    },
    max_dir_edges() {
      // Scot dynamically scales the number of edges with the number of intervals selected

      if (
        this.graph_type_keys[this.graph_type] === "scot_scaled" ||
        this.graph_type_keys[this.graph_type] === "ngot_global"
      ) {
        return this.n_nodes * (this.n_nodes - 1) * this.number_of_intervals;
      } else {
        return this.n_nodes * (this.n_nodes - 1);
      }
    },
    node_info() {
      // explanation text sidebar left
      let grapht = this.graph_type_keys[this.graph_type];

      if (grapht == "ngot_interval") {
        return "N [number of static nodes per interval]";
      } else if (grapht == "ngot_overlay") {
        return "N [number of NGoT nodes]";
      } else if (grapht == "scot_scaled") {
        return "N [number of NGoT nodes]";
      } else if (grapht == "ngot_global") {
        return "N [number of static nodes globally - multiplied by I]";
      } else {
        return "N [number of NGoT nodes]";
      }
    },

    density_edge_info() {
      // explanation text sidebar left
      let grapht = this.graph_type_keys[this.graph_type];
      // derived props
      if (grapht == "ngot_interval") {
        return "static directed edges per interval";
      } else if (grapht == "ngot_overlay") {
        return "NGoT directed edges";
      } else if (grapht == "scot_scaled") {
        return "static directed edges globally";
      } else if (grapht == "ngot_global") {
        return "static directed edges globally";

        // => static edges and nodes need to be determined from graph
      } else {
        return "density";
      }

      // ("density in %: [{{edges}} of {{max_dir_edges}} dir");
    },

    // ############### RIGHT_SIDEBAR CLUSTER ANALYSIS -----------------------------------------------------------------------------------------
    /*
		Returns all the clusters as an array of objects of the form 
			{"text": cluster_name}, "value": {"cluster_id": some_id, "cluster_name": some_cluster_name, "colour": some_cluster_colour}
		to be used as the options when selecting a different cluster for a node.
    */
    clusters_no_singleton() {
      // Set filter TO >1 to eleminate single clusters
      let ret = this.graph_clusters; // .filter((d) => d.labels.length > 1);
      ret.sort(function (a, b) {
        return b.labels.length - a.labels.length;
      });

      return ret;
    },
    singletons_with_time() {
      let map_nodes = {};
      for (let node of graph.nodes) {
        map_nodes[node.id] = node;
      }
      let ret = [];
      for (let singleton of this.singletons) {
        ret.push(singleton + "  [" + map_nodes[singleton].time_ids + "]");
      }
      return ret;
    },
    cluster_options() {
      vueApp.new_assigned_cluster = {};
      let options = [];
      for (let i = 0; i < vueApp.graph_clusters.length; i++) {
        options.push({
          text: vueApp.graph_clusters[i].cluster_name,
          value: {
            cluster_id: vueApp.graph_clusters[i].cluster_id,
            cluster_name: vueApp.graph_clusters[i].cluster_name,
            colour: vueApp.graph_clusters[i].colour,
          },
        });
      }
      return options;
    },
    /*
		Returns all the possible start years for the small time diff interval
		(Only the start years between the start year and the end year of the graph)
		*/
    reducedStartYears() {
      let reducedStartYears = [];
      for (let i = 0; i < vueApp.start_years.length; i++) {
        if (
          this.start_years[i].value >= this.start_year &&
          this.end_year > this.start_years[i].value
        ) {
          reducedStartYears.push(this.start_years[i]);
        }
      }
      return reducedStartYears;
    },
    /*
		Returns all the possible end years for the small time diff interval.
		(The years small that the end year of the graph and larger than the start year of the small interval)
		Takes into account the selected start year of the small time diff interval.
		*/
    reducedEndYears() {
      let reducedEndYears = [];
      for (let i = 0; i < this.end_years.length; i++) {
        if (
          this.end_years[i].value <= this.end_year &&
          this.end_years[i].value > this.interval_start
        ) {
          reducedEndYears.push(this.end_years[i]);
        }
      }
      return reducedEndYears;
    },
    /*
		Returns a string showing the start and end year of a time slice
		*/
    time_slice_from_interval() {
      let start = this.start_years[this.interval_id - 1];
      let end = this.end_years[this.interval_id - 1];
      if (typeof start === "undefined") {
        start = "-";
      } else {
        start = start.text;
      }
      if (typeof end === "undefined") {
        end = "-";
      } else {
        end = end.text;
      }

      return start + " - " + end;
    },

    cluster_name_by_node_id() {
      let node_id;
      let tmpNode;
      let clusterId;
      let tmpCluster;
      // optional chaining... mit if
      node_id = vueApp.active_node.target_text;
      if (node_id) {
        tmpNode = vueApp.node_dic[node_id];
      }
      if (tmpNode) {
        clusterId = tmpNode.cluster_id;
      }
      if (clusterId) {
        tmpCluster = vueApp.cluster_dic[clusterId];
      }
      if (tmpCluster) {
        return tmpCluster.cluster_name;
      } else {
        return "unknown name";
      }
    },
  },
  methods: {
    /**
     * start
     */
    startExample() {
      let data_from_db = exampleJSON;

      // attach to graph - assign per nested object
      graph.nodes = data_from_db.nodes;
      graph.links = data_from_db.links;
      graph.singletons = data_from_db.singletons;
      graph.props = data_from_db.props;
      graph.clusters = data_from_db.clusters;
      graph.transit_links = data_from_db.transit_links;

      // new copy back to vue app props
      this.collection_key = graph.props["collection_key"];
      this.start_year = graph.props["start_year"];
      this.end_year = graph.props["end_year"];

      // user input: graph props
      this.target_word = graph.props["target_word"];
      this.graph_type_keys[this.graph_type] = graph.props["graph_type"];
      this.n_nodes = graph.props["n_nodes"];
      this.density = graph.props["density"];

      // clean up of data - python cannot use the reserved word "class"
      // execute mapping to node attribute "class" : "cluster_id" -> "class"
      for (let node of graph.nodes) {
        node.class = node.cluster_id;
      }
      // copy target and source to source-Text and target-text: d3 force is working on them
      for (let link of graph.links) {
        link.target_text = link.target;
        link.source_text = link.source;
      }
      // // link graph.singletons to app
      this.singletons = data_from_db.singletons;
      this.graph_clusters = data_from_db.clusters;
      // prep cluster data
      for (let cluster of this.graph_clusters) {
        if (!cluster.colour) {
          cluster.colour = color(cluster.cluster_id);
        } else {
          for (let node in graph.nodes) {
            if (node.cluster_id == cluster.cluster_id) {
              node.colour = cluster.colour;
            }
          }
        }
        cluster.opacity = this.node_fill_opacity;
      }

      // dictionaries
      for (let node of graph.nodes) {
        vueApp.node_dic[node.id] = node;
      }
      vueApp.link_dic = {};
      for (let link of graph.links) {
        vueApp.link_dic[link.id] = link;
      }
      vueApp.cluster_dic = {};
      for (let cluster of graph.clusters) {
        vueApp.cluster_dic[cluster.cluster_id] = cluster;
      }
      // update hidden
      for (let cluster of graph.clusters) {
        for (let link of graph.links) {
          if (
            cluster.add_cluster_node &&
            cluster.cluster_id == link.cluster_id
          ) {
            link.hidden = false;
          } else if (
            !cluster.add_cluster_node &&
            link.cluster_link &&
            cluster.cluster_id == link.cluster_id
          ) {
            link.hidden = true;
          }
        }
      }

      // and deep copy of links to d3 - it works on these data and modifies them
      d3Data.links = JSON.parse(JSON.stringify(graph.links));
      // update hidden of cluster links

      delete_graph();
      graph_init();
      graph_crud(graph.nodes, d3Data.links, this.graph_clusters);
      sticky_change_d3();
      this.graph_rendered = true;
      this.overlay_main = false;
    },

    /*
		/ ############ NAVBAR -----------------------------------------------------------------------------------------------------
		*/
    /*
		Reset the highlighting of the node search
		*/
    unsearch_nodes() {
      unsearch_nodes_d3();
    },
    /*
		Search a node in the graph using prefix matching
		*/
    search_node() {
      search_node_d3();
    },
    /*
		/ ############ SIDEBAR LEFT GRAPH CREATION -----------------------------------------------------------------------------------------------------
    */

    updateGraphPropsBasedonUserInput() {
      // user input: interval data props - basis of graph
      graph.props["collection_key"] = vueApp.collection_key;
      graph.props["start_year"] = vueApp.start_year;
      graph.props["end_year"] = vueApp.end_year;

      // user input: graph props
      graph.props["target_word"] = vueApp.target_word;
      graph.props["graph_type"] = vueApp.graph_type_keys[vueApp.graph_type];
      graph.props["n_nodes"] = vueApp.n_nodes;
      graph.props["density"] = vueApp.density;

      // resolved by frontend via computed properties
      graph.props["e_edges"] = vueApp.e_edges;
      graph.props["number_of_intervals"] = vueApp.number_of_intervals;

      // derived props
      if (graph.props.graph_type == "ngot_interval") {
        graph.props["number_of_ngot_nodes"] = null;
        graph.props["number_of_ngot_directed_edges"] = null;
        graph.props["number_of_static_nodes_per_interval"] = vueApp.n_nodes;
        graph.props["number_of_static_directed_edges_per_interval"] =
          vueApp.e_edges;
        graph.props["number_of_static_nodes_global"] =
          vueApp.n_nodes * vueApp.number_of_intervals;
        graph.props["number_of_static_directed_edges_global"] =
          vueApp.e_edges * vueApp.number_of_intervals;
        // the ngot nodes need to be determined once the graph has been calculated
      } else if (graph.props.graph_type == "ngot_overlay") {
        graph.props["number_of_ngot_nodes"] = vueApp.n_nodes;
        graph.props["number_of_ngot_directed_edges"] = vueApp.e_edges;
        graph.props["number_of_static_nodes_per_interval"] = null;
        graph.props["number_of_static_directed_edges_per_interval"] = null;
        graph.props["number_of_static_nodes_global"] = null;
        graph.props["number_of_static_directed_edges_global"] = null;
        // the global static and interval static nodes need to be determined once graph has been calc.
      } else if (graph.props.graph_type == "scot_scaled") {
        // scot scaled uses the overlay method mixed with a global scaled approach
        graph.props["number_of_ngot_nodes"] = vueApp.n_nodes;
        // => interval and global static need to be determined from graph
        graph.props["number_of_ngot_directed_edges"] = null;
        graph.props["number_of_static_nodes_per_interval"] = null;
        graph.props["number_of_static_directed_edges_per_interval"] = null;
        graph.props["number_of_static_nodes_global"] = null;
        // has been scaled already!
        graph.props["number_of_static_directed_edges_global"] = vueApp.e_edges;
        // => static edges per interval and ngot edges need to be determined from graph
      } else if (graph.props.graph_type == "ngot_global") {
        graph.props["number_of_static_nodes_global"] = vueApp.n_nodes;
        graph.props["number_of_static_directed_edges_global"] = vueApp.e_edges;

        // => static edges and nodes need to be determined from graph
      }

      // calculation for interval-mode later - irrelevant here but was included at thsi point in v1
      vueApp.start_years.forEach(function (d, i) {
        if (d.value === vueApp.start_year) {
          vueApp.min_time_id = i + 1;
        }
      });

      vueApp.end_years.forEach(function (d, i) {
        if (d.value === vueApp.end_year) {
          vueApp.max_time_id = i + 1;
        }
      });
    },

    // on change database in frontend - update function
    onChangeDb() {
      this.collection_key = this.collections[this.collection_name]["key"];
      this.target_word = this.collections[this.collection_name]["target"];
      this.n_nodes = this.collections[this.collection_name]["p"];
      this.density = this.collections[this.collection_name]["d"];
      this.collection_info = this.collections[this.collection_name]["info"];
      // console.log("in onchange db" + this.collection_key);
      // console.log("in onchange db" + this.collection_name);

      // async
      this.getStartYears();
      this.getEndYears();
    },
    // init graph_types
    getGraphTypes() {
      this.graph_types = Object.keys(this.graph_type_keys);
      this.graph_type = this.graph_types[0];
    },
    // init collections from axios
    getCollections() {
      getCollections_io();
    },
    getStartYears() {
      // Vue dropdown needs text and value
      this.start_years = this.collections[this.collection_name]["start_years"];
      this.start_year = this.start_years[0]["value"];
    },
    getEndYears() {
      this.end_years = this.collections[this.collection_name]["end_years"];
      this.end_year = this.end_years[this.end_years.length - 1]["value"];
    },

    /*
		Get the data from the BE according to the parameters entered in the FE and render the graph
		*/
    getDataAndRenderNew: async function () {
      // async start overlay with spinner
      vueApp.overlay_main = true;
      vueApp.graph_rendered = false;
      vueApp.wait_rendering = true;

      vueApp.updateGraphPropsBasedonUserInput();

      await getData_io();

      // Call D3 function to render new graph
      delete_graph();
      graph_init();
      graph_crud(graph.nodes, d3Data.links, vueApp.graph_clusters);
      sticky_change_d3();
      // update the cluster information in the Vue data variable after initializing the D3 graph

      // switch off overlay
      vueApp.graph_rendered = true;
      vueApp.overlay_main = false;
      vueApp.wait_rendering = false;
    },
    /*
		/ ############ SIDEBAR LEFT Graph-Menu - VIEW Functions ---------------------------------------------------------------------------------------------------
		*/
    // these functions mainly act as VUE event handlers (instaed of the d3 ones)
    resetZoom() {
      reset_zoom();
    },
    stickyChange(bool) {
      vueApp.sticky_mode = bool;
      sticky_change_d3();
    },

    // restart
    restart_change() {
      restart_change_d3();
    },

    // update the charge strength if the user moves the range input with the value from the Vue data variable charge and restart the simulation with the new value
    charge_change() {
      charge_change_d3();
    },
    // update the link distance if the user moves the range input with the value from the Vue data variable linkdistance and restart the simulation with the new value
    linkdistance_change() {
      linkdistance_change_d3();
    },

    nonevent(e) {
      //do nothing
    },

    // ############### SIDEBAR RIGHT CLUSTER ANAlySIS TIME_DIFF -----------------------------------------------------------------------------------------

    cluster_view_init() {
      // console.log("in cluster view init");
    },
    toggle_time_diff() {
      //  lazy change - ie state changes only after this function
      // console.log("inside toggle time diff START", this.time_diff);
      // wenn time-diff on -- dann gehen wir weg von time-diff daher
      if (this.time_diff && this.graph_rendered) {
        this.reset_time_diff_colours();
      }
      if (this.right_selected === "cluster_time") {
        this.time_diff = false;
      }
      // console.log("inside toggle time diff END", this.time_diff);
    },

    // reset the colour of the nodes to cluster colours
    reset_time_diff_colours() {
      vueApp.applyClusterSettings();
    },
    // /*
    // EXPERIMENTAL Deletes a complete time-group
    // */
    delete_multiple_nodes(labels) {
      delete_multiple_nodes_d3(labels);
    },
    /*
		################## SIDEBAR RIGHT CLUSTER-ANALYSIS CLUSTERS -------------------------------------------------------------------------
    */
    /*
		Set the opacity of nodes and links of a specific cluster via d3
		@param Object cluster: the entry for a specific cluster in the data letiable clusters.
		@param float opacity: some number between 0.0 and 1.0.
		@param float link_opacity: some number between 0.0 and 1.0.
    */

    set_cluster_opacity(cluster, opacity, link_opacity) {
      set_cluster_opacity_d3(cluster, opacity, link_opacity);
    },
    /*
		Send all the nodes and edges to the backend, recluster them, delete and restart graph
		*/
    recluster: async function () {
      vueApp.overlay_main = true;
      vueApp.graph_rendered = false;
      vueApp.wait_rendering = true;
      d_simulation.stop();
      await recluster_io();
      //delete_graph();
      //render_graph();
      graph_crud(graph.nodes, d3Data.links);
      d_simulation.restart();
      //vueApp.get_clusters();
      vueApp.graph_rendered = true;
      vueApp.overlay_main = false;
      vueApp.wait_rendering = false;
    },

    manual_recluster: async function () {
      vueApp.overlay_main = true;
      vueApp.graph_rendered = false;
      vueApp.wait_rendering = true;
      d_simulation.stop();
      await manual_recluster_io();
      //delete_graph();
      //render_graph();
      graph_crud(graph.nodes, d3Data.links);
      d_simulation.restart();
      //vueApp.get_clusters();
      vueApp.graph_rendered = true;
      vueApp.overlay_main = false;
      vueApp.wait_rendering = false;
    },

    /*
    Choose cluster for context analysis and display context information
    from axios
    */
    get_cluster_information_filtered(cluster) {
      graph.props.cluster_target_filter = true;
      get_cluster_information_axios(cluster);
    },
    get_cluster_information(cluster) {
      graph.props.cluster_target_filter = false;
      get_cluster_information_axios(cluster);
    },

    /*
    Generate a new, cluster id, that differs from the existing ones
    Function: new additional cluster
		*/
    generate_cluster_id() {
      let allIds = vueApp.graph_clusters.map((d) => Number(d.cluster_id));
      let maxi = Math.max(...allIds);
      console.log(maxi, allIds, maxi + 1);
      return maxi + 1;
    },
    /*
		Create a new cluster from scratch when using the node options to change the cluster of a node
		*/
    createNewCluster(event) {
      let new_cluster_id = vueApp.generate_cluster_id();
      console.log("in create new cluster d3", new_cluster_id);

      // find node
      let node_dic = {};
      for (let node of graph.nodes) {
        node_dic[node.id] = node;
      }
      let move_node = node_dic[vueApp.active_node.target_text];

      // change cluster value of node
      move_node.cluster_id = new_cluster_id;
      move_node.class = new_cluster_id;
      // move
      vueApp.manual_recluster();
    },

    /*
		Assigns the newly selected cluster id, cluster name and cluster colour to the selected node node.
		*/
    assignNewCluster() {
      let new_cluster_id;
      // find cluster
      for (let cluster of vueApp.graph_clusters) {
        if (cluster.cluster_id == vueApp.new_assigned_cluster.cluster_id) {
          new_cluster_id = cluster.cluster_id;
        }
      }
      // find node
      let node_dic = {};
      for (let node of graph.nodes) {
        node_dic[node.id] = node;
      }
      let move_node = node_dic[vueApp.active_node.target_text];

      // change cluster value of node
      move_node.cluster_id = new_cluster_id;
      move_node.class = new_cluster_id;
      // move
      vueApp.manual_recluster();
    },
    /*
		Return a list of all selected nodes as a list of objects
		An object depicts one selected node with slots for its colour, its cluster id, its cluster name and its id.
		The list is stored in the data letiable clicked_nodes.
		*/
    findSelectedNodes() {
      findSelectedNodes_d3();
    },
    /*
		Set the opacity of all the nodes and edges that are not in the inspected time slice to 0.2.
		*/
    skip_through_time_slices() {
      skip_through_time_slices_d3();
    },

    /*
		Apply changes in cluster name and colour to all the nodes in the graph (when pressing the "Apply" button in the edit column)
		Data Changes---
    */
    applyClusterSettings() {
      // needs node map
      let node_dic = {};
      for (let node of graph.nodes) {
        node_dic[node.id] = node;
      }
      // console.log("in apply cluster settings");
      // console.log("node_dic", node_dic);

      for (let cluster of vueApp.graph_clusters) {
        // apply name changes - name has twoway-binding
        // needs applying to cluster node (which is now in nodes)
        cluster.cluster_info_node.target_text = cluster.cluster_name;
        cluster.cluster_info_node.colour = cluster.colour;
        let tmp = node_dic[cluster.cluster_id];
        tmp.colour = cluster.colour;
        tmp.target_text = cluster.cluster_name;
        for (let node of cluster.cluster_nodes) {
          // apply colour changes
          // needs applying to cluster node and all nodes
          //console.log(node);
          tmp = node_dic[node];
          // console.log("tmp", tmp);
          tmp.colour = cluster.colour;
        }

        // apply cluster label visible

        for (let node of graph.nodes) {
          if (node.cluster_node && node.cluster_id == cluster.cluster_id) {
            node.hidden = !cluster.add_cluster_node;
          }
        }
        for (let link of d3Data.links) {
          if (link.cluster_link && link.cluster_id == cluster.cluster_id) {
            link.hidden = !cluster.add_cluster_node;
          }
        }
        console.log(cluster.add_cluster_node, cluster.cluster_id);
        // console.log(d3Data.links);
      }
      // needs applying to
      restart();
    },

    delete_cluster(cluster_id) {
      // console.log("delete cluster with id", cluster_id);
      // delete all links (auch intra-links that are connected to cluster nodes)
      // delete all links that are connected to nodes with this id
      let newlinks = [];
      for (let link of d3Data.links) {
        if (
          link.source.cluster_id != cluster_id &&
          link.target.cluster_id != cluster_id
        ) {
          newlinks.push(link);
        }
      }
      d3Data.links = newlinks;

      // delete all nodes with this clusterId
      let newnodes = graph.nodes.filter((d) => d.cluster_id != cluster_id);
      graph.nodes = newnodes;

      // delete cluster
      let index = vueApp.graph_clusters.findIndex(
        (d) => d.cluster_id == cluster_id
      );
      vueApp.graph_clusters.splice(index, 1);

      // restart
      restart();
    },
    // check the dictionary to see if nodes are linked
    isConnected(a, b) {
      // console.log("in is connected with a.id, b.id", a, b);
      return (
        vueApp.link_dic[a.id + "-" + b.id] ||
        vueApp.link_dic[b.id + "-" + a.id] ||
        a.id == b.id
      );
    },
    /*
		Returns an object with the connections in the graph
		*/
    calc_linkedByIndex() {
      vueApp.linkedByIndex = {};
      graph.links.forEach(function (d) {
        vueApp.linkedByIndex[d.source.id + "," + d.target.id] = 1;
      });
    },
    /*
		Delete one selected node
		*/
    delete_selected_nodes() {
      console.log("in delete selected");
      graph.nodes = graph.nodes.filter(
        (d) => d.id != vueApp.active_node.target_text
      );
      console.log(graph.nodes);
      d3Data.links = d3Data.links.filter(
        (d) =>
          d.target_text != vueApp.active_node.target_text &&
          d.source_text != vueApp.active_node.target_text
      );
      // console.log(d3Data.links);
      vueApp.manual_recluster();
    },
    /*
		Delete a node from the model
		*/
    deletenode(node_id) {
      // console.log("in vueApp.deleteNode node_id = ", node_id);

      // deletes the node
      for (let i = 0; i < graph.nodes.length; i++) {
        if (graph.nodes[i]["id"] === node_id) {
          graph.nodes.splice(i, 1);
        }
      }
    },
    /*
		Delete all the links connected to a specific node from the data
		*/
    deletelinks(node_id) {
      deletelinks_d3(node_id);
    },
    /*
		Check if a specific link is connected to a cluster node
		*/
    check_cluster_node_connection(link_endpoint) {
      check_cluster_node_connection_d3(link_endpoint);
    },
    /*
		Apply the changes the user made to the general settings - DEPRECATED
		*/
    update_general_settings() {
      update_general_settings_d3();
    },

    // #################### SIDEBAR RIGHT CLUSTER ANALYSIS - ADDITIONAL FUNCTIONS
    /*
    Refactored
    */
    findWobblyCandidates: function () {
      vueApp.wobblyCandidates = [];
      for (let node of graph.nodes) {
        let tmp = {};
        if (node.ngot_undir_links_with_each_cluster_is_balanced != null) {
          tmp["balanced"] = node.ngot_undir_links_with_each_cluster_is_balanced;
          let tmp_cc = [];
          let tmp_n = "";
          for (let key of Object.keys(node.neighbours_by_cluster)) {
            tmp_n +=
              String(key) +
              " (" +
              node.neighbours_by_cluster[key].length +
              ") ";
          }
          for (let key of Object.keys(node.neighbours_by_cluster)) {
            let tmp2 = {};
            tmp2["cluster_id"] = key;
            tmp2["neighbours"] = node.neighbours_by_cluster[key];
            tmp_cc.push(tmp2);
          }
          tmp["connected_clusters"] = tmp_n;
          tmp["neighbours"] = tmp_cc;
          tmp["text"] = node.id;
          vueApp.wobblyCandidates.push(tmp);
        }
      }
    },

    /*
  	Highlight the nodes with a balanced neighbourhood in the graph
		*/
    highlightWobblyCandidates: function () {
      highlightWobblyCandidates_d3();
    },
    /*
    /*
		Calculate how many nodes have a certain centrality score, so that the user has some reference when changing the thresholds
		*/
    calculateCentralityDistribution() {
      vueApp.centrality_score_distribution = [];
      vueApp.getCentralityScores();

      let group0 = 0;
      let group1 = 0;
      let group4 = 0;

      vueApp.centrality_scores.forEach(function (d) {
        //console.log(parseFloat(d));
        if (
          parseFloat(d["centrality_score"]) <=
          parseFloat(vueApp.centrality_threshold_s)
        ) {
          group0 += 1;
        } else if (
          parseFloat(d["centrality_score"]) <=
          parseFloat(vueApp.centrality_threshold_m)
        ) {
          group1 += 1;
        } else {
          group4 += 1;
        }
      });

      vueApp.centrality_score_distribution.push(
        {
          centrality_score: "x <= " + vueApp.centrality_threshold_s,
          number_of_nodes: group0,
        },
        {
          centrality_score:
            vueApp.centrality_threshold_s + "-" + vueApp.centrality_threshold_m,
          number_of_nodes: group1,
        },
        {
          centrality_score: "x > " + vueApp.centrality_threshold_m,
          number_of_nodes: group4,
        }
      );
    },
    /*
		For each node, get the centrality score
		Returns an array of objects {node: centrality_score}
		*/
    getCentralityScores() {
      vueApp.centrality_scores = [];
      // console.log(graph.nodes);
      for (let d of graph.nodes) {
        if (d["centrality_score"] != null) {
          vueApp.centrality_scores.push({
            node: d["id"],
            centrality_score: d["centrality_score"],
          });
        }
      }
      // console.log(vueApp.centrality_scores);
    },
    /*
		Reset all the nodes make to their original size
		*/
    resetCentralityHighlighting() {
      restart();
    },
    /*
		Highlight betweenness centrality in graph
		*/
    highlightCentralNodes(threshold_s, threshold_m) {
      highlightCentralNodes_d3(threshold_s, threshold_m);
    },

    // ############## SIDEBAR RIGHT CLUSTER-ANALYSIS TIME DIFF -----------------------------------------------------------
    /**
     * LEGACY V1:
     */
    time_diff_true() {
      this.time_diff = true;
      // console.log("time diff true");
    },

    time_diff_true_and_reset() {
      this.time_diff = true;
      // console.log("time diff true");
      this.reset_time_diff_colours();
    },

    selectIntervalWithActive() {
      // console.log("in selectIntervalwitactive" + this.active_edge.time_ids);
      return this.selectInterval(
        this.active_edge.time_ids,
        this.active_edge.weights
      ).slice(0, -4);
    },

    // creates the string of the tooltip
    selectInterval(time_ids, weights) {
      let intervalString = "";

      for (let index = 0; index < time_ids.length; index++) {
        let start = this.start_years[time_ids[index] - 1].text;
        let end = this.end_years[time_ids[index] - 1].text;
        intervalString +=
          start + " - " + end + " [" + weights[index] + "]" + "<br>";
      }
      return intervalString;
    },
    /*
		Color nodes depending on whether they started to occur in the selected small time interval, stopped to occur in said interval, or both.
		Basically comparing the graph time interval and the small time interval selected by the user.
		# INTERVAL COUNTING ALWAYS START FIRST ID IN DATABASE WITH 1
		*/
    show_time_diff() {
      show_time_diff_d3();
    },

    // ############################ SVG GENERAL TRIGGERED BY UI ----------------------------------------------------------

    /*
    Fetch the updated amount of nodes and edges as well as the singletons from the BE.
    DEPRECATED
		*/
    // update() {
    //   update_io();
    // },
    /*
		Reset the opacity of all nodes and edges to their original values (nodes: 1.0, edges: 0.6).
		*/
    reset_opacity() {
      reset_opacity_d3();
    },
    /*
		Fade in the nodes of a certain colour and the connecting links.
		The purpose of this function is to fade in only the red, yellow, green and grey nodes in the time diff mode.
		@param String CSS colour such as 'red'
		*/
    fade_in_nodes(colour) {
      fade_in_nodes_d3(colour);
    },

    // ################## SHARED FUNCTIONS SIDEBARS RIGHT EDGE AND NODE INFORMATION ---------------------------------------------------

    // returns selected row in table node-context information
    onRowSelected(items) {
      //this.selected = items
      // // console.log(items);
      this.row_selected = items;
    },

    // doc search function - searches for sentences that have been analyzed with a jo and a bim (regardless of time-id)
    //can be triggered from nodes - context OR edge-context

    docSearch: function (wort1, wort2) {
      docSearch_io(wort1, wort2);
    },

    /*
		/ ############## SIDEBAR RIGHT EDGE INFORMATION --------------------------------------------------------------------------------------
		/ You can click one row in node-context or edge-context
		/ and get sentences that contain a combination of one jo (paradigm) and one bim (syntagmatic context)
		/ in the following wort1 = jo und wort2=bim
		/ Various methods
    */
    // SIDEBAR RIGHT EDGE INFORMATION
    toggleSidebarContext() {
      this.context_mode3 = false;
      this.context_mode = !this.context_mode;
      // console.log("in toggle", this.context_mode);
    },

    // returns selected row in table node-context information
    onRowSelectedEdge(items) {
      //this.selected = items
      // console.log(items);
      this.row_selected_edge = items;
    },
    // function for button search N1/
    edgeContextSearchEdgeOne() {
      let wort1 = this.active_edge.source_text;
      if (
        this.row_selected_edge == null ||
        this.row_selected_edge["length"] == 0
      ) {
        //console.log("items is null")
        alert("Please select a row in the table to select a search term.");
      } else {
        let wort2 = this.row_selected_edge[0]["edge"];
        vueApp.docSearch(wort1, wort2);
      }
    },
    // function for button search N2
    edgeContextSearchEdgeTwo() {
      let wort1 = this.active_edge.target_text;
      if (
        this.row_selected_edge == null ||
        this.row_selected_edge["length"] == 0
      ) {
        //console.log("items is null")
        alert("Please select a row in the table to select a search term.");
      } else {
        let wort2 = this.row_selected_edge[0]["edge"];
        vueApp.docSearch(wort1, wort2);
      }
    },
    /*
		Get edge information, i.e. the feature-contexts words that are shared by paradigms
		Since we are using similarity - bims (ie contexts) - the function is called simbim
		*/
    getSimBims() {
      getSimBims_io();
    },

    /*
		/ ############## SIDEBAR RIGHT NODE INFORMATION ---------------------------------------------------------------------
		/ You can click one row in node-context or edge-context
		/ and get sentences that contain a combination of one jo (paradigm) and one bim (syntagmatic context)
		/ in the following wort1 = jo und wort2=bim
		/ Various methods
    */
    // SIDEBAR RIGHT NODE INFORMATION
    toggleSidebarContext3() {
      this.context_mode = false;
      this.context_mode3 = !this.context_mode3;
      // console.log("in toggle3", this.context_mode3);
    },

    // function for buttion search N1
    nodeContextSearchNodeOne() {
      let wort1 = this.active_node.source_text;
      if (this.row_selected == null || this.row_selected["length"] == 0) {
        //console.log("items is null")
        alert("Please select a row in the table to select a search term.");
      } else {
        let wort2 = this.row_selected[0]["edge"];
        vueApp.docSearch(wort1, wort2);
      }
    },
    // function for button search N2
    nodeContextSearchNodeTwo() {
      let wort1 = this.active_node.target_text;
      if (this.row_selected == null || this.row_selected["length"] == 0) {
        //console.log("items is null")
        alert("Please select a row in the table to select a search term.");
      } else {
        let wort2 = this.row_selected[0]["edge"];
        vueApp.docSearch(wort1, wort2);
      }
    },

    /*
		Get node-target word (invisible edge) information, i.e. the feature-contexts words that are shared by paradigms
		Since we are using similarity - bims (ie contexts) - the function is called simbim
		*/
    getSimBimsNodes() {
      getSimBimsNodes_io();
    },

    /*
    // ##################### LOAD AND SAVE MODAL

		Returns a json object with all the information needed to rerender a graph and saves it locally.
		*/
    saveGraph() {
      saveGraph_io();
    },
    /*
		Render the graph from a json file that the user has specified.
		*/
    loadGraph() {
      loadGraph_io();
    },

    closeForm(id) {
      document.getElementById(id).style.display = "none";
    },
    displayForm() {
      document.getElementById("loadpopup").style.display = "block";
    },
    /*
		/ ################ SIDEBAR LEFT CLUSTER INFO & DOC INFO -------------------------------------------------------------------------------------------
    */
    // CLUSTER INFO - ADDITIONAL

    toggleSidebarContext2() {
      this.context_mode2 = !this.context_mode2;
      // console.log("in toggle2", this.context_mode2);
    },
    // DOC INFO
    toggleSidebarContext4() {
      this.context_mode4 = !this.context_mode4;
      // console.log("in toggle4", this.context_mode4);
    },
  },
  // ######################   APP STATE  ------------------------------------------------------------------------------
  // gets collections from backend at startup and inits svg
  mounted() {
    this.getCollections();
  },
  created() {},
});
