let vueApp = new Vue({
  el: "#vue-app",
  /**
   * The app follows a MVVM pattern with two VM frameworks.
   * There is a global model [the graph and additional information accessed through the connector],
   * and two MV-frameworks [vue and d3], which link the model to the UI-view
   * that work on two seperate viewModels [the d3 links and vue VieModel-data]
   * These 3 contexts, are clearly distinguished in the code
   * graph.xyz refers to the global graph-model outside of the two frameworks,
   * d3Data.links to the MV-model - managed by D3-framework which contains ui info etc., and
   * vueApp.graph_type to the MV-model-data managed by Vue
   *
   */
  data: vueData,
  computed: {
    // general svg
    // for setting the view port size for the graph
    viewport_height() {
      return screen.availHeight * 1;
    },
    viewport_width() {
      return screen.availWidth * 1;
    },
    // for setting the svg size for the graph
    svg_height() {
      return screen.availHeight * 1.5;
    },
    svg_width() {
      return screen.availWidth * 1.5;
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

    // ############### RIGHT_SIDEBAR CLUSTER ANALYSIS -----------------------------------------------------------------------------------------
    /*
		Returns all the clusters as an array of objects of the form 
			{"text": cluster_name}, "value": {"cluster_id": some_id, "cluster_name": some_cluster_name, "colour": some_cluster_colour}
		to be used as the options when selecting a different cluster for a node.
		*/
    cluster_options() {
      vueApp.new_assigned_cluster = {};
      let options = [];
      for (let i = 0; i < vueApp.clusters.length; i++) {
        options.push({
          text: vueApp.clusters[i].cluster_name,
          value: {
            cluster_id: vueApp.clusters[i].id,
            cluster_name: vueApp.clusters[i].cluster_name,
            colour: vueApp.clusters[i].colour,
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
    node_info() {
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
      console.log("in onchange db" + this.collection_key);
      console.log("in onchange db" + this.collection_name);

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
      render_graph();

      // update the cluster information in the Vue data variable after initializing the D3 graph
      vueApp.get_clusters();
      // switch off overlay
      vueApp.graph_rendered = true;
      vueApp.overlay_main = false;
      vueApp.wait_rendering = false;

      console.log(vueApp.clusters);
      // returns Promis.resolve("ok")
      return "ok";
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

    toggle_time_diff() {
      //  lazy change - ie state changes only after this function
      console.log("inside toggle time diff START", this.time_diff);
      // wenn time-diff on -- dann gehen wir weg von time-diff daher
      if (this.time_diff && this.graph_rendered) {
        this.reset_time_diff_colours();
      }
      if (this.right_selected === "cluster_time") {
        this.time_diff = false;
      }
      console.log("inside toggle time diff END", this.time_diff);
    },

    // reset the colour of the nodes to cluster colours
    reset_time_diff_colours() {
      reset_time_diff_colours_d3();
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
		Set the opacity of nodes and links of a specific cluster.
		@param Object cluster: the entry for a specific cluster in the data letiable clusters.
		@param float opacity: some number between 0.0 and 1.0.
		@param float link_opacity: some number between 0.0 and 1.0.
		*/
    set_cluster_opacity(cluster, opacity, link_opacity) {
      let cluster_id = cluster.cluster_id;
      let cluster_nodes = [];

      for (let i = 0; i < cluster.labels.length; i++) {
        cluster_nodes.push(cluster.labels[i].text);
      }

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
		Send all the nodes and edges to the backend, recluster them and change the nodes in the graph accordingly (cluster id, cluster name, colour)
		*/
    recluster() {
      vueApp.overlay_main = true;
      if (vueApp.highlightWobblies === true) {
        vueApp.resetCentralityHighlighting();
        vueApp.highlightWobblies = false;
      }
      //document.getElementById("edit_clusters_popup").style.display = "none";

      let svg = d3.select("#svg");
      let nodes = svg.selectAll(".node");
      let links = svg.selectAll(".link");

      let data = {};

      // accumulate all the graph nodes
      let nodes_array = [];
      nodes.selectAll("g").each(function (d, i) {
        let childnodes = this.childNodes;

        let is_cluster_node;
        childnodes.forEach(function (d, i) {
          if (d.tagName === "circle") {
            is_cluster_node = d.getAttribute("cluster_node");
          }
        });

        if (is_cluster_node === "false") {
          childnodes.forEach(function (d, i) {
            if (d.tagName === "text") {
              nodes_array.push(d.getAttribute("text"));
            }
          });
        }
      });

      // accumulate all the links
      let link_array = [];

      links.each(function (d, i) {
        let childnodes = this.childNodes;
        childnodes.forEach(function (d, i) {
          let link = {};
          let source = d.getAttribute("source");
          let target = d.getAttribute("target");

          if (nodes_array.includes(source) && nodes_array.includes(target)) {
            link["source"] = source;
            link["target"] = target;
            link["weight"] = d.getAttribute("weight");

            link_array.push(link);
          }
        });
      });

      // store all the nodes and links in a data object to be sent to the BE
      data["nodes"] = nodes_array;
      data["links"] = link_array;

      axios
        .post("./api/reclustering", data)
        .then(function (response) {
          this.newclusters = response.data;

          let colour = d3.scaleOrdinal(d3.schemePaired);

          let newClusteredNodes = this.newclusters.nodes;

          let texts = nodes.selectAll("g").select("text");
          let circles = nodes.selectAll("g").select("circle");

          for (let i = 0; i < newClusteredNodes.length; i++) {
            let node_id = newClusteredNodes[i].id;
            let node_new_cluster = newClusteredNodes[i].class;
            //let node_centr_score = newClusteredNodes[i].centrality_score;
            // assign the updated attributes to the nodes
            // Careful, data is not bound to DOM!
            texts.each(function (d, i) {
              let t = d3.select(this);
              if (t.attr("text") === node_id) {
                let circle = d3.select(circles.nodes()[i]);
                //circle.attr("centrality_score", node_centr_score)
                circle.attr("cluster", node_new_cluster);
                circle.attr("fill", function () {
                  return colour(node_new_cluster);
                });
                circle.attr("cluster_id", node_new_cluster);
                circle.attr("cluster_node", false);
              }
            });
          }
          // update the data letiable clusters
          vueApp.get_clusters();

          //let links = d3.selectAll(".link");

          links.each(function () {
            let children = this.childNodes;
            children.forEach(function (d, i) {
              let is_in_cluster = false;
              let link = {};
              let source = d.getAttribute("source");
              let target = d.getAttribute("target");
              let weight = d.getAttribute("weight");
              link["source"] = source;
              link["target"] = target;
              link["weight"] = weight;
              if (vueApp.includes(link_array, link)) {
                console.log("includes");
                for (let i = 0; i < vueApp.clusters.length; i++) {
                  let node_ids = [];
                  vueApp.clusters[i].labels.forEach(function (p) {
                    node_ids.push(p.text);
                  });
                  if (node_ids.includes(source) && node_ids.includes(target)) {
                    let cluster_colour = vueApp.clusters[i].colour;
                    console.log(
                      source,
                      target,
                      d.getAttribute("stroke"),
                      cluster_colour
                    );
                    d.setAttribute("stroke", cluster_colour);
                    console.log(d.getAttribute("stroke"));
                    is_in_cluster = true;
                  }
                }
                if (!is_in_cluster) {
                  d.setAttribute("stroke", "#999");
                }
              }
            });
          });
        })
        .catch(function (error) {
          console.log(error);
        });
      console.log("in recluster ende");
      this.overlay_main = false;
    },

    includes(array, obj) {
      let found = false;
      array.forEach((d) => {
        if (
          d.source === obj.source &&
          d.target === obj.target &&
          d.weight === obj.weight
        ) {
          found = true;
        }
      });
      return found;
    },

    /*
		Choose cluster for context analysis and display context information
		*/
    get_cluster_information(cluster) {
      let links = graph.links;
      let nodes_graph = graph.nodes;
      let jsonReq = {
        edges: [],
        nodes: [],
        collection: this.collection_key,
      };
      let nodes_tmp = [];
      // get all nodes that are assigned to cluster - irrespective of time-ids
      for (let key in cluster["labels"]) {
        let dati = cluster["labels"][key];
        nodes_tmp.push(dati["text"]);
      }

      // get time-ids for nodes from global
      nodes_tmp.forEach(function (item1, index) {
        // all texts
        nodes_graph.forEach(function (item2, index) {
          // all
          if (item1 === item2["target_text"]) {
            jsonReq["nodes"].push({
              label: item2["target_text"],
              time_id: item2["time_ids"][0],
            });
          }
        });
      });
      //console.log(jsonReq)

      if (jsonReq["nodes"].length > this.cluster_search_limit) {
        alert(
          "You clicked on cluster-context information. " +
            "Currently, you can only query clusters with 5 or less nodes. " +
            "Reason: cluster information is extracted from over 1 billion features which takes long for mysql."
        );
      } else {
        console.log("cluster info continue with less than six");
        vueApp.busy_right2 = true;
        vueApp.context_mode2 = true;
        // find edges that are inside the cluster (ie both nodes are cluster nodes)
        for (let key in links) {
          let t1 = links[key]["source_text"];
          let t2 = links[key]["target_text"];
          let timeId = links[key]["time_ids"][0];
          let true1 = nodes_tmp.includes(t1);
          let true2 = nodes_tmp.includes(t2);
          if (true1 && true2) {
            jsonReq["edges"].push({
              source: t1,
              target: t2,
              time_id: timeId,
            });
            console.log("includes ", t1 + t2, timeId);
          }
        }
        //console.log(jsonReq)
        let url = "./api/cluster_information";
        axios
          .post(url, jsonReq)
          .then((res) => {
            console.log(res.data);
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
		Generate a new, random cluster id, that differs from the existing ones
		*/
    generate_cluster_id() {
      let number_of_nodes = d3.selectAll(".node").selectAll("g").size();

      let existing_cluster_ids = [];
      for (let i = 0; i < vueApp.clusters.length; i++) {
        let cluster = vueApp.clusters[i];
        existing_cluster_ids.push(parseInt(cluster.cluster_id));
      }

      let random_number = Math.floor(
        Math.random() * Math.floor(number_of_nodes + 10)
      );

      while (existing_cluster_ids.includes(random_number)) {
        random_number = Math.floor(
          Math.random() * Math.floor(number_of_nodes + 10)
        );
      }

      return random_number;
    },
    /*
		Create a new cluster from scratch when using the node options to change the cluster of a node
		*/
    createNewCluster(event) {
      createNewCluster_d3(event);
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
      assignNewCluster_d3();
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
      let svg = d3.select("#svg");
      let nodes = svg.selectAll(".node");
      let links = svg.selectAll(".link");
      console.log(
        "applyClusterSettings, point 1: all clusters",
        vueApp.clusters
      );

      for (let i = 0; i < vueApp.clusters.length; i++) {
        let cluster_id = vueApp.clusters[i].cluster_id;
        let cluster_name = vueApp.clusters[i].cluster_name;
        let colour = vueApp.clusters[i].colour;
        //let add_cluster_node = vueApp.clusters[i].add_cluster_node;
        let labels = vueApp.clusters[i].labels;
        let text_labels = [];

        for (let j = 0; j < labels.length; j++) {
          text_labels.push(labels[j].text);
        }
        console.log("applyClusterSettings, point 2: one cluster", text_labels);

        // ######### EXPERIMENTAL PUSH CLUSTER NAME START

        // wenn cluster_node hinzugefügt werden soll, aber nicht vorhanden ist
        // if (add_cluster_node && !text_labels.includes(cluster_name)){
        // 	text_labels.push(cluster_name)

        // }
        // ######### EXPERIMENTAL PUSH CLUSTER NAME END

        nodes.selectAll("g").each(function (d, i) {
          let node_cluster;
          let node_fill;
          let node_label;

          let childnodes = this.childNodes;

          childnodes.forEach(function (d, i) {
            if (d.tagName === "circle") {
              node_cluster = d.getAttribute("cluster");
              node_fill = d.getAttribute("fill");
            }
            if (d.tagName === "text") {
              node_label = d.getAttribute("text");
            }
          });

          if (text_labels.includes(node_label)) {
            childnodes.forEach(function (d, i) {
              if (d.tagName === "circle") {
                console.log(
                  "applyClusterSettings, point 3: one node",
                  node_label
                );
                d.setAttribute("cluster", cluster_name);
                d.setAttribute("fill", colour);
              }
            });
          }
        });

        // TODO: update colour of links
        links.each(function (d) {
          let children = this.childNodes;
          let source;
          let target;
          children.forEach(function (p) {
            source = p.getAttribute("source");
            target = p.getAttribute("target");
            if (text_labels.includes(source) && text_labels.includes(target)) {
              p.setAttribute("stroke", colour);
            }
          });
        });
      }

      console.log(
        "++++++++++++in graph apply settings button +++++++++++++++++++++"
      );
      for (let i = 0; i < vueApp.clusters.length; i++) {
        let cluster_name = vueApp.clusters[i].cluster_name;
        let add_cluster_node = vueApp.clusters[i].add_cluster_node;
        let cluster_colour = vueApp.clusters[i].colour;
        let cluster_id = vueApp.clusters[i].cluster_id;
        let labels = vueApp.clusters[i].labels;

        console.log(
          "d3 apply settings cluster loop",
          i,
          "with cluster",
          cluster_name
        );

        let text_labels = [];
        //let cluster_nodes = []

        for (let j = 0; j < labels.length; j++) {
          text_labels.push(labels[j]["text"]);
          //cluster_nodes.push(labels[j]["cluster_node"]);
        }

        let values = cluster_node_exists(cluster_id);
        let exists = values[0];
        let currentname = values[1];

        console.log(
          "d3 cluster_node CRUD decision values",
          exists,
          add_cluster_node,
          currentname
        );

        // CREATE
        if (add_cluster_node === "true" && !exists) {
          addclusternode(cluster_name, cluster_colour, cluster_id);
          for (let k = 0; k < text_labels.length; k++) {
            addlink(text_labels[k], cluster_name);
          }
          console.log("d3 cluster_node CREATE");
        }

        // UPDATE
        if (currentname != cluster_name && currentname != "%%") {
          console.log(
            "d3 click cluster node apply step 5 we should change name"
          );
          vueApp.deletenode(currentname);
          vueApp.deletelinks(currentname);
          addclusternode(cluster_name, cluster_colour, cluster_id);
          for (let k = 0; k < text_labels.length; k++) {
            addlink(text_labels[k], cluster_name);
          }
          console.log("d3 cluster_node UPDATE");
        }

        // DELETE
        if (exists && add_cluster_node == "false") {
          console.log("d3 click cluster node apply step 4 we should delete");
          vueApp.deletenode(currentname);
          vueApp.deletelinks(currentname);
          console.log("d3 cluster_node DELETE");
        }
      }
      //restart the simulation with the additional nodes and links
      restart();
      console.log(graph);
    },
    showEditMask() {
      if (vueApp.time_diff === "false") {
        //update clusters before fading in the column, keep the old clusters in time diff mode though, so that the user can still see the information about clusters
        vueApp.get_clusters();
      }
      if (vueApp.edit_column_open === false) {
        vueApp.edit_column_open = true;
        document.getElementById("edit_clusters_popup").style.display = "block";
      } else if (vueApp.edit_column_open === true) {
        vueApp.edit_column_open = false;
        document.getElementById("edit_clusters_popup").style.display = "none";
      }
    },

    /*
		Collect the information on the clusters from the graph and store it in the data clusters.
		@return Array of objects with cluster information
		// commment by CH: This looks circular - data is pushed on the graph, modified there and then re-read from the graph
    // Better: data is changed on the datastructure - and only displayed on the graph
    // Better: cluster nodes are seperated from main graph nodes more clearly into own sub-data-structure as rectangular labels perhaps
    // TODO WHAT IS GOING ON HERE ???????? 
    */

    get_clusters() {
      function compare_clusters(a, b) {
        if (a.labels.length < b.labels.length) {
          return 1;
        }
        if (a.labels.length > b.labels.length) {
          return -1;
        }
        return 0;
      }
      // Refactoring this distinguishes between basic data-structure and clusters managed by Vue
      // Works on local clusters before assigning it
      vueApp.clusters = [];
      graph.clusters = [];
      let clusters = [];

      // Rectoring: This is where things get a bit funky
      // we need the global data structure for consolidation (vueApp.clusters)

      let svg = d3.select("#svg");
      let nodes = svg.selectAll(".node").selectAll("g");

      nodes.each(function (d, i) {
        let cluster = {};
        let exists = false;
        let cluster_name;
        let colour;
        let text;
        let cluster_id;
        let cluster_node;

        let childnodes = this.childNodes;
        childnodes.forEach(function (d, i) {
          if (d.tagName === "circle") {
            cluster_name = d.getAttribute("cluster");
            cluster_id = d.getAttribute("cluster_id");
            colour = d.getAttribute("fill");
            cluster_node = d.getAttribute("cluster_node");
          }

          if (d.tagName === "text") {
            text = d.getAttribute("text");
          }
        });

        clusters.forEach(function (c, i) {
          //console.log(c)
          if (c.cluster_name === cluster_name) {
            exists = true;
            if (cluster_node === "false") {
              c.labels.push({
                text: text,
                cluster_node: cluster_node,
              });
            }
          }
        });

        if (!exists) {
          cluster["cluster_id"] = cluster_id;
          cluster["cluster_name"] = cluster_name;
          cluster["colour"] = colour;
          cluster["add_cluster_node"] = false;
          //cluster["delete_cluster"] = false;
          cluster.labels = [];
          if (cluster_node === "false") {
            cluster["labels"].push({
              text: text,
              cluster_node: cluster_node,
            });
            //console.log("in cluster labels", text, cluster_node )
          }
          if (cluster.labels.length > 0) {
            clusters.push(cluster);
          }
        }
        clusters.sort(compare_clusters);
        //console.log(clusters)
      });

      /* for (let i = 0; i < clusters.length; i++) {
        Vue.set(vueApp.clusters, i, clusters[i]);
      } */
      graph.clusters = clusters;
      vueApp.clusters = clusters;
    },

    delete_cluster(cluster_name, cluster_id, labels) {
      delete_cluster_d3(cluster_name, cluster_id, labels);
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
      delete_selected_nodes_d3();
    },
    /*
		Delete a node from the data
		*/
    deletenode(node_id) {
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

      for (let i = 0; i < vueApp.clusters.length; i++) {
        if (id === vueApp.clusters[i].cluster_id) {
          cluster_name = vueApp.clusters[i].cluster_name;
        }
      }

      return cluster_name;
    },
    /*
		Get the id of the cluster that a specific node belongs to
		*/
    findClusterId(node_id) {
      let cluster_id;

      for (let i = 0; i < vueApp.clusters.length; i++) {
        let labels = [];
        let cluster = vueApp.clusters[i];

        for (let j = 0; j < cluster.labels.length; j++) {
          labels.push(cluster.labels[j].text);
        }

        if (labels.includes(node_id)) {
          cluster_id = cluster.cluster_id;
        }
      }
      return cluster_id;
    },
    /*
		Get the clusters to which a node is connected and the amount of nodes per cluster
		Returns an object with the {cluster_id : amount of nodes} and a string containing the cluster names and the number of nodes
		*/
    findNeighbourhoodClusters: function (node) {
      let neighbourhoodClusters = {};
      var links = d3.selectAll(".link");

      links.each(function (d) {
        var children = this.childNodes;
        var neighbour_cluster;

        children.forEach(function (p) {
          var source = p.getAttribute("source");
          var target = p.getAttribute("target");
          if (source === node) {
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
          if (target === node) {
            neighbour_cluster = vueApp.findClusterId(source);
            if (neighbour_cluster !== undefined) {
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
        });
      });

      let neighbourhoodClusters_str = [];
      // Get the cluster name to each cluster id in the neighbourhood
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
		For a specific node return an array containg an object for each neighbouring cluster with the cluster id and the neighbouring nodes per cluster
		*/
    findNeighboursAndClusters: function (node) {
      var neighbours = [];
      var links = d3.selectAll(".link");

      links.each(function (d) {
        var children = this.childNodes;

        children.forEach(function (p) {
          var source = p.getAttribute("source");
          var target = p.getAttribute("target");

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
          } else if (target === node) {
            var source_cluster_id = vueApp.findClusterId(source);
            if (source_cluster_id !== undefined) {
              var exists = false;
              for (var i = 0; i < neighbours.length; i++) {
                if (neighbours[i]["cluster_id"] === source_cluster_id) {
                  neighbours[i]["neighbours"].push(source);
                  exists = true;
                }
              }
              if (exists === false) {
                neighbours.push({
                  cluster_id: source_cluster_id,
                  neighbours: [source],
                });
              }
            }
          }
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
		For each node, check if their neighbourhood is balanced and find neighbouring nodes
		*/
    findWobblyCandidates: function () {
      vueApp.wobblyCandidates = [];

      if (vueApp.hightlighInbetweennessCentrality === true) {
        vueApp.resetCentralityHighlighting();
        vueApp.hightlighInbetweennessCentrality = false;
      }

      var nodes = d3.selectAll(".node").selectAll("g");
      var texts = d3.selectAll(".node").selectAll("g").select("text");

      nodes.each(function (d, i) {
        var children = this.childNodes;
        var text = d3.select(texts.nodes()[i]);
        var cluster_id;
        var node_text;
        var candidate = {};
        var is_cluster_node;

        children.forEach(function (p) {
          if (p.tagName === "text") {
            node_text = p.getAttribute("text");
          }
          if (p.tagName === "circle") {
            cluster_id = p.getAttribute("cluster_id");
            is_cluster_node = p.getAttribute("cluster_node");
          }
        });

        if (is_cluster_node === "false") {
          let result = vueApp.findNeighbourhoodClusters(node_text);
          let neighbourClusterDistr = result[0];
          let neighbourClusterDistr_string = result[1];

          let b = vueApp.is_balanced(neighbourClusterDistr)[1];

          candidate["text"] = node_text;
          candidate["connected_clusters"] = neighbourClusterDistr_string;
          candidate["balanced"] = b;
          candidate["neighbours"] = vueApp.findNeighboursAndClusters(node_text);

          vueApp.wobblyCandidates.push(candidate);
        }
      });
    },
    /*
		Highlight the nodes with a balanced neighbourhood in the graph
		*/
    highlightWobblyCandidates: function () {
      if (vueApp.hightlighInbetweennessCentrality === true) {
        vueApp.resetCentralityHighlighting();
        vueApp.hightlighInbetweennessCentrality = false;
      }
      vueApp.highlightWobblies = true;
      var nodes = d3.selectAll(".node").selectAll("g");
      var texts = d3.selectAll(".node").selectAll("g").select("text");

      nodes.each(function (d, i) {
        var children = this.childNodes;
        var text = d3.select(texts.nodes()[i]);
        var cluster_id;
        var node_text;
        var candidate = {};
        var is_cluster_node;

        children.forEach(function (p) {
          if (p.tagName === "text") {
            node_text = p.getAttribute("text");
          }
          if (p.tagName === "circle") {
            cluster_id = p.getAttribute("cluster_id");
            is_cluster_node = p.getAttribute("cluster_node");
          }
        });

        if (is_cluster_node === "false") {
          var neighbourClusterDistr = vueApp.findNeighbourhoodClusters(
            node_text
          )[0];
          let balanced = vueApp.is_balanced(neighbourClusterDistr)[0];

          // if a node has a balanced neighbourhood, make it large
          if (balanced === true) {
            children.forEach(function (p) {
              if (p.tagName === "circle") {
                p.setAttribute("r", 20);
                text.style("font-size", "20px");
              }
            });
          }

          // if node is connected to more than one cluster, make it medium-sized
          else if (Object.keys(neighbourClusterDistr).length > 1) {
            children.forEach(function (p) {
              if (p.tagName === "circle") {
                p.setAttribute("r", 10);
                text.style("font-size", "14px");
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
      console.log(graph.nodes);
      for (let d of graph.nodes) {
        if (d["centrality_score"] != null) {
          vueApp.centrality_scores.push({
            node: d["id"],
            centrality_score: d["centrality_score"],
          });
        }
      }
      console.log(vueApp.centrality_scores);
    },
    /*
		Reset all the nodes make to their original size
		*/
    resetCentralityHighlighting() {
      resetCentralityHighlighting_d3();
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
      console.log("time diff true");
    },

    time_diff_true_and_reset() {
      this.time_diff = true;
      console.log("time diff true");
      this.reset_time_diff_colours();
    },

    selectIntervalWithActive() {
      console.log("in selectIntervalwitactive" + this.active_edge.time_ids);
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

      console.log("in startindx", vueApp.interval_start, vueApp.interval_end);
      let small_time_interval = [];
      let startindex2 = this.start_years.find(
        (startind) => startind.text === vueApp.interval_start
      )["id"];
      console.log("start id", startindex2);
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
      console.log("nall intervall start time id", small_interval_start_time_id);
      console.log("small end time", small_interval_end_time_id);
      console.log("big time intervall", big_time_interval);

      for (let i = 0; i < big_time_interval.length; i++) {
        if (big_time_interval[i] < small_interval_start_time_id) {
          period_before.push(big_time_interval[i]);
        } else if (big_time_interval[i] > small_interval_end_time_id) {
          period_after.push(big_time_interval[i]);
        }
        console.log("big", big_time_interval);
        console.log("before", period_before);
        console.log("after", period_after);
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
                console.log("in time ids", time_ids, node_text);
                node_text = node_text; //+ " [" + time_ids.sort() + "]"
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
                  console.log("pushed throughout");
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
      console.log(time_diff_nodes);
    },

    // ############################ SVG GENERAL TRIGGERED BY UI ----------------------------------------------------------

    /*
		Fetch the updated amount of nodes and edges as well as the singletons from the BE.
		*/
    update() {
      update_io();
    },
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
      // console.log(items);
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
      console.log("in toggle", this.context_mode);
    },

    // returns selected row in table node-context information
    onRowSelectedEdge(items) {
      //this.selected = items
      console.log(items);
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
      console.log("in toggle3", this.context_mode3);
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
      console.log(url);
      axios
        .post(url, data)
        .then((res) => {
          let ret = [];
          if (res.data["error"] == "none") {
            for (let key in res.data) {
              if (key != "error") {
                let dati = res.data[key];
                retObj = {};
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
      console.log("in toggle2", this.context_mode2);
    },
    // DOC INFO
    toggleSidebarContext4() {
      this.context_mode4 = !this.context_mode4;
      console.log("in toggle4", this.context_mode4);
    },
  },
  // ######################   APP STATE  ------------------------------------------------------------------------------
  // gets collections from backend at startup
  mounted() {
    this.getCollections();
  },
});
