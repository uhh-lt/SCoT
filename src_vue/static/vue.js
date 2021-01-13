let vueApp = new Vue({
  el: "#vue-app",

  data: vueData,
  /**
   * Note on vueData - vue Data has three sub-data-objects: vue-App, graph and d3
   * graph.xyz refers to the global graph-model
   * d3Data.xyz refers to specific data for d3
   * vueData.xyz to the data specific to the VueApp
   *
   */
  computed: {
    // general svg
    // aim of method
    // info needed cluster.colour
    // cluster_opacity = start
    // naming scheme - datastructure: cluster.id /hier cluster.cluster_id
    // naming scheme - cluster.cluster_nodes = hier cluster.labels

    clusters_no_singleton() {
      // console.log("in clusters no single", this.graph_clusters);
      // SET TO >1 to eleminate single clusters
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

    viewbox_height() {
      return screen.height * 1;
    },
    viewbox_width() {
      return screen.width * 1;
    },
    // for setting the svg size for the graph
    // THIS IS THE VIEWPORT
    svg_height() {
      return screen.height * 1;
    },
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
  },
  methods: {
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
      //this.get_clusters();
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
    is_normal_node: function () {
      var normal_node;
      var selected_node = d3.selectAll(".selected").select("circle");

      selected_node.each(function (d) {
        var n = d3.select(this);
        if (n.attr("cluster_node") === "true") {
          normal_node = false;
        } else {
          normal_node = true;
        }
      });

      return normal_node;
    },

    set_cluster_opacity(cluster, opacity, link_opacity) {
      let cluster_id = cluster.cluster_id;
      let cluster_nodes = [];

      for (let i = 0; i < cluster.labels.length; i++) {
        cluster_nodes.push(cluster.labels[i].text);
      }
      // console.log("cluster opacity point 1", cluster_nodes);

      let svg = d3.select("#svg");
      let nodes = svg.selectAll(".node");
      let links = svg.selectAll(".link");

      nodes.selectAll("g").each(function (d, i) {
        let childnodes = this.childNodes;
        let node_text;
        let node_cluster_id;
        childnodes.forEach(function (d, i) {
          if (d.tagName === "circle") {
            node_cluster_id = d.getAttribute("cluster_id");
          }
          if (d.tagName === "text") {
            node_text = d.getAttribute("text");
          }
        });
        if (!cluster_nodes.includes(node_text)) {
          this.style.strokeOpacity = opacity;
          this.style.fillOpacity = opacity;
        }
      });

      links.each(function (d, i) {
        let childnodes = this.childNodes;
        childnodes.forEach(function (d, i) {
          let source = d.getAttribute("source");
          let target = d.getAttribute("target");
          if (
            !cluster_nodes.includes(source) ||
            !cluster_nodes.includes(target)
          ) {
            //d.setAttribute("style", "stroke-opacity:" + link_opacity);
            d.style.strokeOpacity = link_opacity;
          }
          //if (cluster_nodes.includes(source) && cluster_nodes.includes(target)) {
          //if (opacity < 1) {
          //	d.setAttribute("style", "stroke:" + cluster.colour);
          //} else {
          //		d.setAttribute("style", "stroke:" + cluster.colour);
          //}
          //}
        });
      });
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
    get_cluster_information(cluster) {
      // console.log("in get cluster information", cluster);
      let jsonReq = {
        nodes: [],
        collection: this.collection_key,
      };
      // node dic
      // needs node map
      let node_dic = {};
      for (let node of graph.nodes) {
        node_dic[node.id] = node;
      }
      // needs link map

      // required: label + single time-id
      // the function queries the features whcih are stored
      // per node per time-id
      // get time-ids for nodes from global
      // needs to choose a time id from all edges
      cluster.cluster_nodes.forEach(function (nodeid) {
        // all time ids
        node_dic[nodeid]["time_ids"].forEach(function (timeid) {
          jsonReq["nodes"].push({
            label: nodeid,
            time_id: timeid,
          });
        });
      });
      // console.log(jsonReq);

      if (jsonReq["nodes"].length > this.cluster_search_limit) {
        alert(
          "You clicked on cluster-context information. " +
            "Currently, you can only query clusters with 5 or less nodes. " +
            "Reason: cluster information is extracted from over 1 billion features which takes long for mysql."
        );
      } else {
        // console.log("cluster info continue with less than six");
        vueApp.busy_right2 = true;
        vueApp.context_mode2 = true;

        let url = "./api/cluster_information";
        axios
          .post(url, jsonReq)
          .then((res) => {
            // console.log(res.data);
            let ret = [];
            for (let key in res.data) {
              let retObj = {};
              retObj.wort = key;
              retObj.score = parseFloat(res.data[key]).toFixed(5);
              ret.push(retObj);
            }
            this.cluster_shared_object = ret;
            //console.log(this.cluster_shared_object)
            this.busy_right2 = false;
          })
          .catch((error) => {
            console.error(error);
          });
      }
    },
    /*
		Generate a new, cluster id, that differs from the existing ones
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
		Find the colour of a given node_id
		*/
    findColour(node_id) {
      findColour_d3(node_id);
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
        console.log(d3Data.links);
      }
      // needs applying to
      restart();
    },

    showEditMask() {
      if (vueApp.time_diff === "false") {
        //update clusters before fading in the column, keep the old clusters in time diff mode though, so that the user can still see the information about clusters
        //vueApp.get_clusters();
      }
      if (vueApp.edit_column_open === false) {
        vueApp.edit_column_open = true;
        document.getElementById("edit_clusters_popup").style.display = "block";
      } else if (vueApp.edit_column_open === true) {
        vueApp.edit_column_open = false;
        document.getElementById("edit_clusters_popup").style.display = "none";
      }
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
      return (
        vueApp.linkedByIndex[a.id + "," + b.id] ||
        vueApp.linkedByIndex[b.id + "," + a.id] ||
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
      console.log(d3Data.links);
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
    /*
		Get the name of a cluster via its id
		*/
    getClusterNameFromID(id) {
      let cluster_name;

      for (let i = 0; i < vueApp.graph_clusters.length; i++) {
        if (id == vueApp.graph_clusters[i].cluster_id) {
          cluster_name = vueApp.graph_clusters[i].cluster_name;
        }
      }

      return cluster_name;
    },
    /*
		Get the id of the cluster that a specific node belongs to
		*/
    findClusterId(node_id) {
      // console.log("in find cluster id mit node id", node_id);
      var cluster_id;
      // console.log(vueApp.graph_clusters);

      for (var i = 0; i < vueApp.graph_clusters.length; i++) {
        var labels = [];
        var cluster = vueApp.graph_clusters[i];

        for (var j = 0; j < cluster.labels.length; j++) {
          labels.push(cluster.labels[j].text);
        }

        if (labels.includes(node_id)) {
          cluster_id = cluster.cluster_id;
        }
      }
      // console.log("found cluster id", cluster_id);
      return cluster_id;
    },
    /*
    LEGACY METHODS FROM V1 THAT WORKS ON THE DOM AND TAKES THE STATE FROM THE DOM (oh no ;) has been refactored to work with new datastructure
    Get the clusters to which a node is connected and the amount of nodes per cluster
		Returns an object with the {cluster_id : amount of nodes} and a string containing the cluster names and the number of nodes
		*/
    findNeighbourhoodClusters: function (node) {
      // console.log("in find neighbour clusters with node", node);
      let neighbourhoodClusters = {};
      let links = d3.selectAll(".link");

      links.each(function (d) {
        let children = this.childNodes;
        let neighbour_cluster;

        children.forEach(function (p) {
          let source = p.getAttribute("source_text");
          let target = p.getAttribute("target_text");
          let cluster_info_link = p.getAttribute("cluster_info_link");
          // console.log("before if", source, target, cluster_info_link);
          if (cluster_info_link === "false" && source === node) {
            neighbour_cluster = vueApp.findClusterId(target);
            if (neighbour_cluster !== undefined) {
              // if the cluster has been encountered before ...
              if (
                neighbourhoodClusters.hasOwnProperty(
                  neighbour_cluster.toString()
                )
              ) {
                neighbourhoodClusters[neighbour_cluster] += 1;
              } else {
                neighbourhoodClusters[neighbour_cluster] = 1;
              }
            }
          }
          // we are only counting undirected and thus say that s-t and t-s are one
          // if (cluster_info_link === "false" && target === node) {
          //   neighbour_cluster = vueApp.findClusterId(source);
          //   if (neighbour_cluster !== undefined) {
          //     if (
          //       neighbourhoodClusters.hasOwnProperty(
          //         neighbour_cluster.toString()
          //       )
          //     ) {
          //       neighbourhoodClusters[neighbour_cluster] += 1;
          //     } else {
          //       neighbourhoodClusters[neighbour_cluster] = 1;
          //     }
          //   }
          // }
        });
      });

      let neighbourhoodClusters_str = [];
      // Get the cluster name to each cluster id in the neighbourhood
      // console.log("before object keys", neighbourhoodClusters);
      Object.keys(neighbourhoodClusters).forEach(function (d) {
        let name = vueApp.getClusterNameFromID(d);
        // build a list with the cluster names and number of nodes for display in the frontend
        neighbourhoodClusters_str.push(
          name + "(" + neighbourhoodClusters[d] + ")"
        );
      });
      return [neighbourhoodClusters, neighbourhoodClusters_str.join(", ")];
    },
    /*
		Check if the neighbourhood of a node is balanced 
		*/
    is_balanced: function (clusterDistr) {
      let balanced = false;
      let b = "no";

      // only worth checking if there are at least two neighbourhood clusters
      if (Object.keys(clusterDistr).length > 1) {
        var max = 0;
        var mean = 0;

        let clusterDistrValues = Object.values(clusterDistr);

        clusterDistrValues.forEach(function (d) {
          mean += d;
        });

        // the mean number of connections per cluster
        mean = mean / clusterDistrValues.length;

        // the max number of connections to a cluster
        max = Math.max(...clusterDistrValues);

        // get rid of the cluster with the maximum connections
        let clusterDistrWithoutMax = clusterDistr;
        for (let cluster in clusterDistrWithoutMax) {
          if (clusterDistrWithoutMax[cluster] === max) {
            delete clusterDistrWithoutMax[cluster];
            break;
          }
        }

        // check if the heuristic holds
        Object.values(clusterDistrWithoutMax).forEach(function (d) {
          // heuristic
          if (max - d < mean / 2) {
            balanced = true;
            b = "yes";
          }
        });
      }
      return [balanced, b];
    },
    /*
    LEGACY METHODS FROM V1 THAT WORKS ON THE DOM
		For a specific node return an array containg an object for each neighbouring cluster with the cluster id and the neighbouring nodes per cluster
		*/
    findNeighboursAndClusters: function (node) {
      var neighbours = [];
      var links = d3.selectAll(".link");

      links.each(function (d) {
        var children = this.childNodes;

        children.forEach(function (p) {
          var source = p.getAttribute("source_text");
          var target = p.getAttribute("target_text");

          if (source === node) {
            var target_cluster_id = vueApp.findClusterId(target);
            if (target_cluster_id !== undefined) {
              var exists = false;
              for (var i = 0; i < neighbours.length; i++) {
                // if there the cluster exists in neighbours already, just push the target to the array of neighbours
                if (neighbours[i]["cluster_id"] === target_cluster_id) {
                  neighbours[i]["neighbours"].push(target);
                  exists = true;
                }
              }
              if (exists === false) {
                neighbours.push({
                  cluster_id: target_cluster_id,
                  neighbours: [target],
                });
              }
            }
          }
          // we remove the duplicate counting (there are nearly always 2 dir edges)
          //  else if (target === node) {
          //   var source_cluster_id = vueApp.findClusterId(source);
          //   if (source_cluster_id !== undefined) {
          //     var exists = false;
          //     for (var i = 0; i < neighbours.length; i++) {
          //       if (neighbours[i]["cluster_id"] === source_cluster_id) {
          //         neighbours[i]["neighbours"].push(source);
          //         exists = true;
          //       }
          //     }
          //     if (exists === false) {
          //       neighbours.push({
          //         cluster_id: source_cluster_id,
          //         neighbours: [source],
          //       });
          //     }
          //   }
          // }
        });
      });
      return neighbours;
    },
    // Not quite there yet. Save cluster_selected for every cluster
    // Otherwise weird behaviour when selecting different cluster
    select_cluster(cluster) {
      select_cluster_d3(cluster);
    },
    // #################### SIDEBAR RIGHT CLUSTER ANALYSIS - ADDITIONAL FUNCTIONS
    /*
    LEGACY METHODS FROM V1 THAT WORKS ON THE DOM
		For each node, check if their neighbourhood is balanced and find neighbouring nodes
		*/
    findWobblyCandidates: function () {
      vueApp.wobblyCandidates = [];

      if (vueApp.hightlighInbetweennessCentrality === true) {
        vueApp.resetCentralityHighlighting();
        vueApp.hightlighInbetweennessCentrality = false;
      }

      let nodes = d3.selectAll(".node").selectAll("g");

      nodes.each(function (d, i) {
        let children = this.childNodes;
        let node_text;
        let candidate = {};
        let is_cluster_node;
        let is_cluster_link;

        children.forEach(function (p) {
          if (p.tagName === "text") {
            node_text = p.getAttribute("text");
          }
          if (p.tagName === "circle") {
            is_cluster_node = p.getAttribute("cluster_node");
          }
        });

        if (vueApp.singletons.includes(node_text)) {
          return;
        }

        if (is_cluster_node === "false") {
          // console.log("find wobbly in cluster node false");
          let result = vueApp.findNeighbourhoodClusters(node_text);
          let neighbourClusterDistr = result[0];
          let neighbourClusterDistr_string = result[1];

          let b = vueApp.is_balanced(neighbourClusterDistr)[1];

          candidate["text"] = node_text;
          candidate["connected_clusters"] = neighbourClusterDistr_string;
          candidate["balanced"] = b;
          candidate["neighbours"] = vueApp.findNeighboursAndClusters(node_text);

          vueApp.wobblyCandidates.push(candidate);

          // console.log("in find wobbly candidate", candidate);
        }
      });
    },
    /*
    LEGACY METHODS FROM V1 THAT WORKS ON THE DOM
		Highlight the nodes with a balanced neighbourhood in the graph
		*/
    highlightWobblyCandidates: function () {
      if (vueApp.hightlighInbetweennessCentrality === true) {
        vueApp.resetCentralityHighlighting();
        vueApp.hightlighInbetweennessCentrality = false;
      }
      // console.log("in highlight wobbly");
      vueApp.highlightWobblies = true;
      let nodes = d3.selectAll(".node").selectAll("g");

      nodes.each(function (d, i) {
        let children = this.childNodes;
        let node_text;
        let is_cluster_node;

        children.forEach(function (p) {
          if (p.tagName === "text") {
            node_text = p.getAttribute("text");
          }
          if (p.tagName === "circle") {
            is_cluster_node = p.getAttribute("cluster_node");
          }
        });

        if (is_cluster_node != "true") {
          let neighbourClusterDistr = vueApp.findNeighbourhoodClusters(
            node_text
          )[0];
          let balanced = vueApp.is_balanced(neighbourClusterDistr)[0];

          // if a node has a balanced neighbourhood, make it large
          if (balanced === true) {
            children.forEach(function (p) {
              if (p.tagName === "circle") {
                p.setAttribute("r", vueApp.radius * 3);
                // text.style("font-size", vueApp.node_text_font_size * 2);
              }
            });
          }

          // if node is connected to more than one cluster, make it medium-sized
          else if (Object.keys(neighbourClusterDistr).length > 1) {
            children.forEach(function (p) {
              if (p.tagName === "circle") {
                p.setAttribute("r", vueApp.radius * 2);
                // text.style("font-size", vueApp.node_text_font_size * 1.5);
              }
            });
          }
        }
      });
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

    selectInterval(time_ids, weights) {
      let intervalString = "";
      if (time_ids !== null && typeof time_ids !== "undefined") {
        if (typeof time_ids === "string") {
          time_ids = time_ids.split(",");
        }
      }
      if (weights !== null && typeof weights !== "undefined") {
        if (typeof weights === "string") {
          weights = weights.split(",");
        }
      }
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
      let big_time_interval = [];
      let startindex = this.start_years.find(
        (startindex) => startindex.value === this.start_year
      )["id"];
      let endindex = this.end_years.find(
        (endindex) => endindex.value === this.end_year
      )["id"];

      for (let ind = startindex; ind <= endindex; ind++) {
        big_time_interval.push(ind);
      }

      // console.log("in startindx", vueApp.interval_start, vueApp.interval_end);
      let small_time_interval = [];
      let startindex2 = this.start_years.find(
        (startind) => startind.text === vueApp.interval_start
      )["id"];
      // console.log("start id", startindex2);
      let endindex2 = this.end_years.find(
        (endind) => endind.text === vueApp.interval_end
      )["id"];

      for (let ind = startindex2; ind <= endindex2; ind++) {
        small_time_interval.push(ind);
      }

      let period_before = [];
      let period_after = [];

      let small_interval_start_time_id = Math.min(...small_time_interval);
      let small_interval_end_time_id = Math.max(...small_time_interval);
      // console.log("nall intervall start time id", small_interval_start_time_id);
      // console.log("small end time", small_interval_end_time_id);
      // console.log("big time intervall", big_time_interval);

      for (let i = 0; i < big_time_interval.length; i++) {
        if (big_time_interval[i] < small_interval_start_time_id) {
          period_before.push(big_time_interval[i]);
        } else if (big_time_interval[i] > small_interval_end_time_id) {
          period_after.push(big_time_interval[i]);
        }
        // console.log("big", big_time_interval);
        // console.log("before", period_before);
        // console.log("after", period_after);
      }

      let time_diff_nodes = {
        born_in_interval: [],
        deceases_in_interval: [],
        exists_only_in_interval: [],
        exists_only_before: [],
        exists_throughout: [],
        exists_only_after: [],
        exists_before_and_after: [],
      };

      let nodes = d3.selectAll(".node").selectAll("g");

      nodes.each(function (d) {
        let childnodes = this.childNodes;
        let node_text;

        childnodes.forEach(function (d) {
          if (d.tagName === "text") {
            node_text = d.getAttribute("text");
          }
        });

        childnodes.forEach(function (d) {
          if (d.tagName === "circle") {
            if (d.getAttribute("cluster_node") === "false") {
              let time_ids = d.getAttribute("time_ids");

              if (time_ids !== null && typeof time_ids !== "undefined") {
                time_ids = time_ids.split(",");
                time_ids = time_ids.map((x) => parseInt(x));
                // console.log("in time ids", time_ids, node_text);
                node_text = node_text + " [" + time_ids.sort() + "]";
                let in_interval = false;
                let before_interval = false;
                let after_interval = false;

                for (let i = 0; i < time_ids.length; i++) {
                  let t = time_ids[i];

                  if (period_before.includes(t)) {
                    before_interval = true;
                  }
                  if (small_time_interval.includes(t)) {
                    in_interval = true;
                  }
                  if (period_after.includes(t)) {
                    after_interval = true;
                  }
                }

                if (!before_interval && in_interval && !after_interval) {
                  d.setAttribute("fill", "yellow");
                  time_diff_nodes.exists_only_in_interval.push(node_text);
                } else if (!before_interval && in_interval && after_interval) {
                  d.setAttribute("fill", "#28a745");
                  time_diff_nodes.born_in_interval.push(node_text);
                } else if (before_interval && in_interval && !after_interval) {
                  d.setAttribute("fill", "#dc3545");
                  time_diff_nodes.deceases_in_interval.push(node_text);
                } else if (before_interval && in_interval && after_interval) {
                  d.setAttribute("fill", "#343a41");
                  time_diff_nodes.exists_throughout.push(node_text);
                  // console.log("pushed throughout");
                } else if (before_interval && !in_interval && !after_interval) {
                  d.setAttribute("fill", "#dc3546");
                  time_diff_nodes.exists_only_before.push(node_text);
                } else if (!before_interval && !in_interval && after_interval) {
                  d.setAttribute("fill", "#28a746");
                  time_diff_nodes.exists_only_after.push(node_text);
                } else if (before_interval && !in_interval && after_interval) {
                  d.setAttribute("fill", "#343a40");
                  time_diff_nodes.exists_before_and_after.push(node_text);
                }
              }
            }
            // would be good to see exactly the time slices of the respective nodes
          }
        });
      });

      vueApp.time_diff_nodes = time_diff_nodes;
      // console.log(time_diff_nodes);
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
      this.busy_right3 = true;
      let retArray = [];
      let data = {};
      data["word1"] = this.target_word;
      data["word2"] = this.active_node.target_text;
      data["time_id"] = this.active_node.time_ids[0];
      this.node_time_id = this.active_node.time_ids[0];

      let url = "./api/collections/" + this.collection_key + "/simbim";
      // console.log(url);
      axios
        .post(url, data)
        .then((res) => {
          let ret = [];
          if (res.data["error"] == "none") {
            for (let key in res.data) {
              if (key != "error") {
                let dati = res.data[key];
                let retObj = {};
                retObj.node1 = parseFloat(dati["score"]).toFixed(5);
                retObj.edge = dati["key"];
                retObj.node2 = parseFloat(dati["score2"]).toFixed(5);
                ret.push(retObj);
              }
            }
          }

          this.simbim_node_object = ret;
          this.busy_right3 = false;
        })
        .catch((error) => {
          console.error(error);
        });
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
});
