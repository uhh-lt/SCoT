Vue.component("frame-sidebarclustertime", {
  data: function () {
    return this.$root.$data;
  },
  computed: {
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
    console.log("in recluster")
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
      vueApp.manual_recluster();
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
    createNewCluster() {
      let new_cluster_id = this.generate_cluster_id();
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
      vueApp.applyClusterSettings();
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
      this.manual_recluster();
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
      console.log(vueApp.active_node.target_text);
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
      graph.singletons = graph.singletons.filter((d) => d != vueApp.active_node.target_text);

      // check if cluster has become singleton
      // let index = vueApp.graph_clusters.findIndex(
      //   (d) => d.cluster_id == vueApp.active_node.cluster_id
      // );
      // if(index != -1){
      //   console.log(index)
      //   console.log(vueApp.graph_clusters[index].cluster_nodes.length)
      //   if(vueApp.graph_clusters[index].cluster_nodes.length==2){
      //     graph.singletons.push(vueApp.graph_clusters[index].cluster_nodes[0]);
      //     vueApp.graph_clusters.splice(index, 1);
      //     // this.delete_cluster(vueApp.graph_clusters[index].cluster_id);
      //     // return;
      //   }
      // }
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
        tmp["connected_clusters"] = "";
        tmp["neighbours"] = [];
        tmp["balanced"] = null;
        tmp["text"] = "";
        if (
          !(node.id in graph.singletons) &&
          !node.cluster_node &&
          node.ngot_undir_links_with_each_cluster_is_balanced != null
        ) {
          tmp["balanced"] = node.ngot_undir_links_with_each_cluster_is_balanced;
          //console.log(node.neighbours_by_cluster);
          for (let key of Object.keys(node.neighbours_by_cluster)) {
            tmp["connected_clusters"] +=
              String(key) +
              " (" +
              node.neighbours_by_cluster[key].length +
              ") ";
          }
          for (let key2 of Object.keys(node.neighbours_by_cluster)) {
            tmp["neighbours"].push({
              cluster_id: key2,
              neighbours: node.neighbours_by_cluster[key2],
            });
          }
          tmp["text"] = node.id;
          vueApp.wobblyCandidates.push(tmp);
        }
      }
      console.log("wobblies", vueApp.wobblyCandidates);
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
      this.getCentralityScores();

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
//      this.reset_time_diff_colours();
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
    closeSidebar_right(){
        this.showSidebar_right = false;
    },

    resizeNodes(measure) {
       resizeNodes_d3(measure);

    },
  },

  template: `
    <!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR-RIGHT ANALYSIS CLUSTERING XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
		<b-sidebar v-show="showSidebar_right" width="23%" id="sidebar-right" bg-variant="secondary"
				text-variant="light" style="opacity: 0.9;" no-header right shadow >
			<template v-slot:footer="{ hide }">
         <div class="d-flex bg-secondary text-light align-items-center px-3 py-2">
            <!-- Button to apply changes to graph  -->
            <b-button v-show="right_selected === 'cluster_basic'" id="apply_settings_button" size="sm" class="lrmargin_button" variant="warning" @click="applyClusterSettings()">Update Clusters</b-button>
         </div>
			</template>
      <div class="mx-2 my-3" >
           <b-button class="d-inline px-1 py-1" style="text-align:right; height:30px;width:30px; vertical-align: top;" @click="showSidebar_right=false">
             <b-icon icon="x-lg" class="px-0 py-0"  scale="0.70"></b-icon>
          </b-button>
          <h4 class="d-inline px-2" id="sidebar-no-header-title" style="text-align: right" >Cluster Analysis</h4>
      </div>
      <div class="px-2 py-2 mt-1">
				<!-- options buttons-->
				<b-form-group class="ml-2" variant="info">
					<b-form-radio-group size="sm" v-model="right_selected" :options="right_options" buttons
						button-variant="info" name="radios-btn-default" @change="toggle_time_diff()">
					</b-form-radio-group>
				</b-form-group>

				<!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR-RIGHT ANALYSIS CLUSTERING CLUSTER FUNCS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
        <!--div class="px-2 py-2 mt-1"> -->
				<div v-if="right_selected === 'cluster_functions'">

					<!-- Options Drop Down for node options TODO Update Options-->

          <!-- Modal to change cluster assignment of A node -->
					<b-modal id="modal-1" title="Change Cluster Assignment" @ok="assignNewCluster()">
						<div>
							<!-- Show selected nodes -->
							<div> Selected node: {{active_node.target_text}} </div>
							<br>
							<!-- Show current cluster -->
							<div>
                Current cluster:
                <span class="dot-sm" v-bind:style="{'background-color': active_node.colour}"></span>
								{{cluster_name_by_node_id}}, (ID: {{active_node.cluster_id}})
							</div>
							<!-- Choose a new cluster -->
							<div>
								Select new cluster:
								<span class="dot-sm" v-bind:style="{'background-color': new_assigned_cluster.colour}"></span>
								{{new_assigned_cluster.cluster_name}}

								<b-form-select v-model="new_assigned_cluster" size="sm" class="mt-3">
									<option :value="{}" disabled> Select a cluster </option>
									<option v-for="cluster in cluster_options" :value="cluster.value">{{cluster.text}}
									</option>
								</b-form-select>
							</div>
						</div>
					</b-modal>

					<!-- Modal for creating a new cluster an adding the clicked node to it -->
					<b-modal id="modal-2" title="Create new cluster" @ok="createNewCluster">
						<div v-for="node in clicked_nodes">
							<!-- Show selected node -->
							<div> Selected node: {{node.id}} </div>
							<br>
							<div>
								<span style="font-size: 16pt"> Create a new cluster </span>
								<br>
								<!-- <div>
									<b-form-group id="c_name" label="Choose cluster name">
										<b-form-input v-model="created_cluster_name" placeholder="Enter cluster name">
										</b-form-input>
									</b-form-group>
									<b-form-group label="Choose cluster colour">
										<b-form-input class="color-select" v-model="created_cluster_colour"
											type="color"> </b-form-input>
									</b-form-group>
								</div> -->
							</div>
						</div>
					</b-modal>

					<!-- Modal to Customize Thresholds-->
					<b-modal id="modal-centrality-1" title="Customize Highlighting Thresholds"
						@ok="highlightCentralNodes(centrality_threshold_s, centrality_threshold_m)">
						<div>
							<b-table small striped hover :items="centrality_score_distribution"></b-table>
						</div>
						<hr>
						<div>
							<div style="font-size: 20px; font-weight:bold;">
								Customize Thresholds [Close and Open for Recalc]
							</div>
							<div style="margin-top: 2ex">
								<span style="text-decoration: underline">Threshold Small/Medium</span>
								<b-form-input size="sm" type="text" v-model="centrality_threshold_s"> </b-form-input>
							</div>
							<div style="margin-top: 2ex">
								<span style="text-decoration: underline;">Threshold Medium/Large</span>
								<b-form-input size="sm" type="text" v-model="centrality_threshold_m"> </b-form-input>
							</div>
							<!-- <div style="margin-top: 2ex">
								<span style="text-decoration: underline">Large radius</span> for nodes with centrality
								score over {{centrality_threshold_m}}
							</div> -->
						</div>
					</b-modal>

					<!-- Recluster button id="recluster_button"-->
          <hr style="border: 1px solid gray;" />
					<h6>Recluster </h6>
					<b-button class="lrmargin_button" size="sm" variant="success" v-on:click="recluster()">
            <em class="fas fa-cogs"></em>&nbsp;Recluster with Chinese Whispers </b-button>
					<br>
					<hr style="border: 1px solid gray;" />
					<h6>&nbsp;Change Cluster-Assignment</h6>
					<!-- only available for non cluster nodes -->
					<b-button class="lrmargin_button" size="sm" variant="success" v-show="select_node_is_no_cluster_node" v-on:click="findSelectedNodes()" v-b-modal.modal-1>
              <em class="fas fa-exchange-alt"></em> Assign to different cluster </b-button>
				  <br>
					<b-button class="lrmargin_button" size="sm" variant="success"
						v-show="select_node_is_no_cluster_node" v-on:click="findSelectedNodes()" v-b-modal.modal-2> <em
							class="fas fa-plus"></em> Create new cluster</b-button>
					<br>
					<b-button class="lrmargin_button" size="sm" variant="success" v-on:click="delete_selected_nodes()">
						<em class="fas fa-trash"></em> Delete node </b-button>
					<br>
					<!-- Options Drop Down for node options -->
					<hr style="border: 1px solid gray;" />
					<!-- Centrality Button -->
					<div style="background-color:gray-600; color: white;">
						<h6>Betweenness Centrality</h6>
						<b-button class="lrmargin_button" size="sm" variant="success"
							v-on:click="highlightCentralNodes(centrality_threshold_s, centrality_threshold_m)">
							<em class="fas fa-highlighter"></em> Highlight central nodes in graph
						</b-button>
						<br>
						<b-button class="lrmargin_button" size="sm" variant="success"
							v-on:click="calculateCentralityDistribution()" v-b-modal.modal-centrality-1>
							<em class="fas fa-cogs"></em> Customize highlighting thresholds
						</b-button>
						<br>
						<!-- <b-button v-on:click="resetCentralityHighlighting()"> <em class="fas fa-times"></em>
							Reset
							highlighting </b-button> -->
						<b-button class="lrmargin_button" size="sm" variant="success" v-on:click="getCentralityScores"
							v-b-modal.modal-centrality-2> <em class="fas fa-bars"></em> List centrality node scores
						</b-button>
						<br>

					</div>
					<!-- Options Drop Down for node options -->

					<!-- Centrality Button -->
					<!-- Modal listing the centrality scores of nodes-->
					<b-modal id="modal-centrality-2" scrollable ok-only ok-title="Close"
						title="List of Centrality Node Scores">
						<div>
							<b-table striped hover :items="centrality_scores" :fields="centrality_fields"></b-table>
						</div>
					</b-modal>


					<!-- Nodes with balanced neighbourhood of clusters id="wobblyCandidatesCC" -->
					<hr style="border: 1px solid gray;" />
					<h6>Node Cluster Balance</h6>
					<b-button class="lrmargin_button" size="sm" variant="success"
						v-on:click="highlightWobblyCandidates()"> <em class="fas fa-highlighter"></em>
						Highlight nodes between clusters </b-button>

					<!-- <b-button v-on:click="resetCentralityHighlighting()"> <em class="fas fa-times"></em>
						Reset Highlighting </b-button> -->
					<b-button class="lrmargin_button" size="sm" variant="success" v-on:click="findWobblyCandidates()"
						v-b-modal.modal-wobbly-1> <em class="fas fa-bars"></em> List nodes </b-button>
					</b-dropdown>

					<b-modal id="modal-wobbly-1" size="xl" scrollable title="List of Nodes between Clusters" ok-only
						ok-title="Close">
						<div>
							<b-button size="sm" style="margin-bottom: 15px;" v-b-toggle.collapse-heuristic-1
								aria-expanded="false"> <em class="fas fa-info-circle"></em> Infos on heuristic
							</b-button>
							<b-collapse :id="'collapse-heuristic-1'">
								<b-card>
									The neighbourhood of a node is balanced, if there are at least two clusters in the
									node's neighbourhood for which
									<div style="margin-left: 20px">
										<span style="font-weight: bold"> max - d_i &lt; mean / 2 </span>
									</div> holds true.
									<ul>
										<li><span style="font-style: italic">max</span>: the highest number of NGOT
											undirected links between the node and the nodes belonging to one cluster
										</li>
										<li><span style="font-style: italic">d_i</span>: the number of NGOT undirected
											links between this node and the nodes belonging to cluster i
										</li>
										<li><span style="font-style: italic">mean</span>: the mean number of NGOT
											undirected links between this node and the nodes of any of all clusters
										</li>
									</ul>
								</b-card>
							</b-collapse>
						</div>
						<div>
							<b-table striped hover responsive="sm" :items="wobblyCandidates"
								:fields="wobblyCandidatesFields">
								<template v-slot:cell(show_details)="row">
									<b-button size="sm" @click="row.toggleDetails" class="mr-2">
										{{ row.detailsShowing ? 'Hide' : 'Show'}} Details
									</b-button>
								</template>
								<template v-slot:row-details="row">
									<b-card>
										<ul v-for="c in row.item.neighbours">
											<li> <span style="font-weight: bold;"> Cluster: {{ c.cluster_id }} </span>
												<div style="font-size: 12px;" v-for="n in c.neighbours"> {{ n }} </div>
											</li>
										</ul>
									</b-card>
								</template>
							</b-table>
						</div>
					</b-modal>

                    <!-- Resize nodes as per their similarity score-->
					<hr style="border: 1px solid gray;" />
					<h6>Resize Nodes as per Similarity</h6>
					<b-button class="lrmargin_button" size="sm" variant="success"
						v-on:click="resizeNodes('max')"> <em class="fas fa-highlighter"></em>
						Maximum</b-button>
					<b-button class="lrmargin_button" size="sm" variant="success"
						v-on:click="resizeNodes('avg')"> <em class="fas fa-highlighter"></em>
						Average</b-button>
					<b-button class="lrmargin_button" size="sm" variant="success"
						v-on:click="resizeNodes('avg_all')"> <em class="fas fa-highlighter"></em>
						Average-AllSlices</b-button>

					<!-- <b-button v-on:click="resetCentralityHighlighting()"> <em class="fas fa-times"></em>
						Reset Highlighting </b-button> -->


					<!-- DISABBLE TODO DELETE AFTER TESTING NEW FRONTEND Update button to add more nodes and edges to graph -->
					<p>
						<b-button :disabled="time_diff == 1" v-if="graph_rendered" v-b-toggle.collapse-update-1
							id="add_update_button" style="display:none"> Update Graph
						</b-button>
					</p>
					<br>
					<div>
						<!-- Card collape to enter number of nodes and edges for update -->
						<b-collapse :id="'collapse-update-1'" class="mt-2">
							<b-card class="input_cluster" style="color: black">
								<!-- Enter new number of neighbouring nodes to the target word -->
								<b-form-group class="input" label="Number of neighbours">
									<b-form-input type="number" v-model="update_senses" min="0"
										placeholder="number of neighbours" size="sm"></b-form-input>
								</b-form-group>
								<!-- Enter new max. number of edges per node -->
								<b-form-group class="input" label="Max. number of edges per node">
									<b-form-input type="number" v-model="update_edges" min="0"
										placeholder="number of edges" size="sm"></b-form-input>
								</b-form-group>
								<p>
									<!-- Update button -->
									<b-button id="update_button"> Update
									</b-button>
								</p>
							</b-card>
						</b-collapse>
					</div>

				</div>
				<!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR-RIGHT ANALYSIS CLUSTERING XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
				TODO URGENT REFACTOR
				-->

				<div v-if="right_selected === 'cluster_basic'">
					<!-- list with clusters -->
					<div class="edit_cluster_textbox">
						<b-list-group v-for="(cluster, index) in clusters_no_singleton" :key="index">
							<b-list-group-item style="background-color: #6c757d;">
								<div>

									<!-- Button for opening list of nodes in cluster -->
									<div class="btn btn-sm btn-primary"
										v-bind:style="{ 'background-color': cluster.colour }"
										v-b-toggle="'collapse-nodes-' + index"
										@mouseover="!cluster_selected ? set_cluster_opacity(cluster, 0.2, reduced_link_opacity) : null"
										@mouseout="!cluster_selected ? set_cluster_opacity(cluster, 1.0, base_link_opacity) : null">
										Nodes [{{cluster.labels.length}}]
										<span class="when-opened"><i class="fa fa-chevron-down"
												aria-hidden="true"></i></span>
										<span class="when-closed"><i class="fa fa-chevron-up"
												aria-hidden="true"></i></span>
									</div>
									<!-- Button for opening edit options of cluster -->
									<div class="btn btn-sm btn-primary"
										v-bind:style="{ 'background-color': cluster.colour }"
										@mouseover="!cluster_selected ? set_cluster_opacity(cluster, 0.2, reduced_link_opacity) : null"
										@mouseout="!cluster_selected ? set_cluster_opacity(cluster, 1.0, base_link_opacity) : null"
										v-b-toggle="'collapse-edit-' + index">Name:
										{{cluster.cluster_name}} <span class="when-opened"><i class="fa fa-chevron-down"
												aria-hidden="true"></i></span>
										<span class="when-closed"><i class="fa fa-chevron-up"
												aria-hidden="true"></i></span>
									</div>

									<!-- Button for opening context options of cluster -->
									<div class="btn btn-sm btn-primary"
										v-bind:style="{ 'background-color': cluster.colour }"
										@mouseover="!cluster_selected ? set_cluster_opacity(cluster, 0.2, reduced_link_opacity) : null"
										@mouseout="!cluster_selected ? set_cluster_opacity(cluster, 1.0, base_link_opacity) : null"
										v-b-toggle="'collapse-cluster-' + index">Context <span class="when-opened"><i
												class="fa fa-chevron-down" aria-hidden="true"></i></span>
										<span class="when-closed"><i class="fa fa-chevron-up"
												aria-hidden="true"></i></span>
									</div>

									<b-collapse :id="'collapse-cluster-' + index" class="mt-2" aria-expanded="false">
										<!-- Button for opening context in cluster -->
										<b-card style="background-color: #6c757d; color: white">
											The context-feature reveals the most significant syntagmatic contexts of the
											nodes of a cluster.
											The results can be filtered against the contexts of the target word.
											Calculations can take long. It is recommended to query only clusters
											with {{cluster_search_limit}}
											or less nodes.
											<br><br>
											<b-form-group>
												<div class="btn btn-sm btn-primary"
													v-bind:style="{ 'background-color': cluster.colour }"
													@click="!cluster_selected ? get_cluster_information(cluster) : null"
													@mouseover="!cluster_selected ? set_cluster_opacity(cluster, 0.2, reduced_link_opacity) : null"
													@mouseout="!cluster_selected ? set_cluster_opacity(cluster, 1.0, base_link_opacity) : null">
													Context

												</div>
												<!-- Button for opening context in cluster -->
												<div class="btn btn-sm btn-primary"
													v-bind:style="{ 'background-color': cluster.colour }"
													@click="!cluster_selected ? get_cluster_information_filtered(cluster) : null"
													@mouseover="!cluster_selected ? set_cluster_opacity(cluster, 0.2, reduced_link_opacity) : null"
													@mouseout="!cluster_selected ? set_cluster_opacity(cluster, 1.0, base_link_opacity) : null">
													Context-Target-Filtered
												</div>
											</b-form-group>
										</b-card>
									</b-collapse>

									<!-- Button for opening delete options of cluster -->
									<div class="btn btn-sm btn-primary"
										v-bind:style="{ 'background-color': cluster.colour }"
										@mouseover="!cluster_selected ? set_cluster_opacity(cluster, 0.2, reduced_link_opacity) : null"
										@mouseout="!cluster_selected ? set_cluster_opacity(cluster, 1.0, base_link_opacity) : null"
										v-b-modal="'modal-delete-' + index" :disabled="time_diff == 1"> <i
											class="fas fa-trash"></i> </div>


									<b-modal :id="'modal-delete-' + index" title="Confirm Deletion"
										@ok="delete_cluster(cluster.cluster_id)">
										Are you sure you want to delete the cluster "{{ cluster.cluster_name }}"?
									</b-modal>


									<!-- collapse card for cluster edit options -->
									<b-collapse :id="'collapse-edit-' + index" class="mt-2" aria-expanded="false">
										<b-card class="input_cluster">
											<!-- Input for cluster name edit -->
											<b-form-group label="Change cluster name">
												<b-form-input v-model="cluster.cluster_name" size="sm"></b-form-input>
											</b-form-group>

											<!-- Checkbox to add cluster label to graph -->
											<b-form-group>
												<b-form-checkbox v-model="cluster.add_cluster_node">
													Show cluster label in graph
												</b-form-checkbox>
												<!-- <b-form-checkbox
									v-model="cluster.delete_cluster"
									value="true"
									unchecked-value="false">
									Delete cluster
								</b-form-checkbox> -->
											</b-form-group>

											<!-- Change colour of cluster -->
											<b-form-group label="Select cluster colour">
												<b-form-input class="color-select" v-model="cluster.colour" type="color"
													:value="cluster.colour"> </b-form-input>
											</b-form-group>


										</b-card>
									</b-collapse>

									<!-- Show list of nodes in cluster -->
									<div>
										<b-collapse :id="'collapse-nodes-' + index">
											<b-card style="background-color:  #6c757d; color:white">
												<div v-for="label in cluster.labels"> {{ label.text2 }}</div>
											</b-card>
										</b-collapse>
									</div>
								</div>
							</b-list-group-item>
						</b-list-group>
						<b-list-group>
							<b-list-group-item style="background-color: #6c757d;">
								<div class="btn btn-sm btn-primary" v-b-toggle.collapse-singletons-1>
									Singletons [{{singletons.length}}]
									<span class="when-opened"><i class="fa fa-chevron-down"
											aria-hidden="true"></i></span>
									<span class="when-closed"><i class="fa fa-chevron-up" aria-hidden="true"></i></span>
								</div>
								<div>
									<b-collapse :id="'collapse-singletons-1'">
										<b-card style="background-color:  #6c757d; color: white; ">
											<div v-for="node in singletons_with_time">{{node}}</div>
										</b-card>
									</b-collapse>
								</div>
							</b-list-group-item>
						</b-list-group>
					</div>
					<!-- Show list of singletons -->

					<p style="float: left;">

						<!-- Button to "close" column -->
						<!--<b-button class="close_button" variant="danger" v-on:click="closeForm('edit_clusters_popup')">Close</b-button>-->
					</p>
				</div>

				<!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR RIGHT TIME-DIFF VIEW XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
				<div v-if="right_selected === 'cluster_time'">

					<!-- TIME DIFF -->
					<!-- Card with time diff options -->
					<b-card bg-variant="secondary" text-variant="light" style="opacity: 0.9;">
						<p>
							<!-- Option compare time intervals -->
							<b-button size="sm" style="width: 40%;" variant="primary" v-b-toggle.collapse-interval-1
								aria-expanded="false" @click="time_diff_true()">
								Interval
							</b-button>

							<!-- Option skip through time slices -->
							<b-button size="sm" style="width: 40%;" variant="primary" v-b-toggle.collapse-skip-1
								aria-expanded="false" v-on:click="time_diff_true_and_reset()">
								Time-Slice
							</b-button>
						</p>

						<!-- Collapse card for option compare time intervals -->
						<b-collapse id="collapse-interval-1" accordion="time-diff-accordion">
							<div bg-variant="secondary">
								<p>
									Select an interval for time diff:
								</p>
								<div style="font-size: 12px;">
									<!-- Button to show difference in graph -->
									{{start_year}} -
									<!-- Select start year for small interval -->
									<b-form-select v-model="interval_start" class="interval_input" size="sm">
										<option v-for="s in reducedStartYears"> {{ s.text }} </option>
									</b-form-select>
									-
									<!-- Select end year for small interval -->
									<b-form-select v-model="interval_end" class="interval_input" size="sm">
										<option v-for="e in reducedEndYears"> {{ e.text }} </option>
									</b-form-select>
									- {{end_year}}
									<br>
									<br>
									<b-button size="sm" variant="primary" v-on:click="show_time_diff"
										style="width: 70%; ">Show Difference </b-button>
									<!-- Legend: Colour of node categories, show nodes belonging to a category -->
									<hr style="border: 1px solid gray;" />
									<!-- On mouseover over circle show nodes of the respective category in graph -->
									<div style="font-size: 12px;">
										<!-- deceased nodes -->
										<!--<p></p> -->
										<!-- button collapse to show nodes belonging to category -->
										<div>
											<b-button size="sm" v-b-toggle.collapse-deceased-2
												style="background-color: #dc3546; width: 70%; margin-bottom: 3px;"
												v-on:mouseover="fade_in_nodes('#dc3546')"
												v-on:mouseout="reset_opacity()">Died before interval
												<span class="when-opened"><i class="fa fa-chevron-down"
														aria-hidden="true"></i></span>
												<span class="when-closed"><i class="fa fa-chevron-up"
														aria-hidden="true"></i></span>
											</b-button>
											<!-- experimental delete of time-nodes  -->
											<!-- <b-button size="sm"
										style="background-color: #dc3546; margin-bottom: 3px;"
										@click="delete_multiple_nodes(time_diff_nodes.exists_only_before)">
										<i class="fas fa-trash"></i> </b-button> -->

											<b-collapse id="collapse-deceased-2">
												<b-card style="background-color:  #6c757d; color: white; ">
													<div v-for="node in time_diff_nodes.exists_only_before"> {{ node }}
													</div>
												</b-card>
											</b-collapse>
										</div>
										<!--<p></p>-->
										<div>
											<b-button size="sm"
												style="background-color:#dc3545;width: 70%; margin-bottom: 3px;"
												v-b-toggle.collapse-deceased-1 v-on:mouseover="fade_in_nodes('#dc3545')"
												v-on:mouseout="reset_opacity()">Dies in interval
												<span class="when-opened"><i class="fa fa-chevron-down"
														aria-hidden="true"></i></span>
												<span class="when-closed"><i class="fa fa-chevron-up"
														aria-hidden="true"></i></span>
											</b-button>
											<!-- <b-button size="sm"
										style="background-color:#dc3545;margin-bottom: 3px;"
										@click="delete_multiple_nodes(time_diff_nodes.deceases_in_interval)"> <i class="fas fa-trash"></i> </b-button> -->
											<b-collapse id="collapse-deceased-1">
												<b-card style="background-color:  #6c757d; color: white; ">
													<div v-for="node in time_diff_nodes.deceases_in_interval"> {{ node
														}} </div>
												</b-card>
											</b-collapse>
										</div>

										<!-- shortlived nodes -->
										<!--<p></p>-->
										<!-- <hr style="border: 1px solid gray;" /> -->
										<!-- button collapse to show nodes belonging to category -->
										<div>
											<b-button size="sm"
												style="background-color: yellow; color: black;width: 70%;margin-bottom: 3px;  "
												v-b-toggle.collapse-shortlived-1
												v-on:mouseover="fade_in_nodes('yellow')"
												v-on:mouseout="reset_opacity()">Occurs only during interval
												<span class="when-opened"><i class="fa fa-chevron-down"
														aria-hidden="true"></i></span>
												<span class="when-closed"><i class="fa fa-chevron-up"
														aria-hidden="true"></i></span>
											</b-button>
											<!-- <b-button
										size="sm"
										style="background-color: yellow;margin-bottom: 3px;"
										@click="delete_multiple_nodes(time_diff_nodes.exists_only_in_interval)"> <i class="fas fa-trash"></i> </b-button> -->
											<b-collapse id="collapse-shortlived-1">
												<b-card style="background-color:  #6c757d; color: white; ">
													<div v-for="node in time_diff_nodes.exists_only_in_interval"> {{
														node }} </div>
												</b-card>
											</b-collapse>
										</div>
										<!-- born nodes -->
										<!-- <p></p> -->
										<!-- <hr style="border: 1px solid gray;" /> -->
										<!-- button collapse to show nodes belonging to category -->
										<div>
											<b-button size="sm" v-b-toggle.collapse-born-1
												style="background-color: #28a745;width: 70%; margin-bottom: 3px;"
												v-on:mouseover="fade_in_nodes('#28a745')"
												v-on:mouseout="reset_opacity()">Born in interval
												<span class="when-opened"><i class="fa fa-chevron-down"
														aria-hidden="true"></i></span>
												<span class="when-closed"><i class="fa fa-chevron-up"
														aria-hidden="true"></i></span>
											</b-button>
											<!-- <b-button
										size="sm"
										style="background-color: #28a745;margin-bottom: 3px;"
										@click="delete_multiple_nodes(time_diff_nodes.born_in_interval)"> <i class="fas fa-trash"></i> </b-button> -->
											<b-collapse id="collapse-born-1">
												<b-card style="background-color:  #6c757d; color: white; ">
													<div v-for="node in time_diff_nodes.born_in_interval"> {{ node }}
													</div>
												</b-card>
											</b-collapse>
										</div>
										<!-- <p></p> -->
										<!-- button collapse to show nodes belonging to category -->
										<div>
											<b-button size="sm" v-b-toggle.collapse-born-2
												style="background-color: #28a746;width: 70%; margin-bottom: 3px; "
												v-on:mouseover="fade_in_nodes('#28a746')"
												v-on:mouseout="reset_opacity()">Born after interval
												<span class="when-opened"><i class="fa fa-chevron-down"
														aria-hidden="true"></i></span>
												<span class="when-closed"><i class="fa fa-chevron-up"
														aria-hidden="true"></i></span>
											</b-button>
											<!-- <b-button
										size="sm"
										style="background-color: #28a746;margin-bottom: 3px;"
										@click="delete_multiple_nodes(time_diff_nodes.exists_only_after)"> <i class="fas fa-trash"></i> </b-button> -->
											<b-collapse id="collapse-born-2">
												<b-card style="background-color:  #6c757d; color: white; ">
													<div v-for="node in time_diff_nodes.exists_only_after"> {{ node }}
													</div>
												</b-card>
											</b-collapse>
										</div>
										<!-- consistent nodes -->
										<!-- <p></p> -->
										<!-- <hr style="border: 1px solid gray;" /> -->
										<!-- button collapse to show nodes belonging to category -->

										<div>
											<b-button size="sm" v-b-toggle.collapse-normal-2
												style="background-color: #343a40;width: 70%; margin-bottom: 3px;"
												v-on:mouseover="fade_in_nodes('#343a40')"
												v-on:mouseout="reset_opacity()">Occurs before and after
												<span class="when-opened"><i class="fa fa-chevron-down"
														aria-hidden="true"></i></span>
												<span class="when-closed"><i class="fa fa-chevron-up"
														aria-hidden="true"></i></span>
											</b-button>
											<!-- <b-button
										size="sm"
										style="background-color: #343a40;margin-bottom: 3px;"
										@click="delete_multiple_nodes(time_diff_nodes.exists_before_and_after)"> <i class="fas fa-trash"></i> </b-button> -->
											<b-collapse id="collapse-normal-2">
												<b-card style="background-color:  #6c757d; color: white; ">
													<div v-for="node in time_diff_nodes.exists_before_and_after"> {{
														node }} </div>
												</b-card>
											</b-collapse>
										</div>
										<!--<p></p>-->
										<div>
											<b-button size="sm" v-b-toggle.collapse-normal-1
												style="background-color: #343a41;width: 70%; margin-bottom: 3px; "
												v-on:mouseover="fade_in_nodes('#343a41')"
												v-on:mouseout="reset_opacity()">Occurs before & during & after
												<span class="when-opened"><i class="fa fa-chevron-down"
														aria-hidden="true"></i></span>
												<span class="when-closed"><i class="fa fa-chevron-up"
														aria-hidden="true"></i></span>
											</b-button>
											<!-- <b-button
										size="sm"
										style="background-color: #343a41;margin-bottom: 3px;"
										@click="delete_multiple_nodes(time_diff_nodes.exists_throughout)"> <i class="fas fa-trash"></i> </b-button> -->
											<b-collapse id="collapse-normal-1">
												<b-card style="background-color:  #6c757d; color: white; ">
													<div v-for="node in time_diff_nodes.exists_throughout"> {{ node }}
													</div>
												</b-card>
											</b-collapse>
										</div>


									</div>
								</div>
							</div>
                        </b-collapse>


						<!-- card collapse for skipping through time slice (range input) -->
						<b-collapse id="collapse-skip-1" accordion="time-diff-accordion">
							<b-card bg-variant="secondary" text-variant="light" style="opacity: 0.9;">
								<div>
									<b-form-group>
										<!-- Show the current time slice while skipping through -->
										Current time slice: {{ time_slice_from_interval }}
										<b-form-input id="range_time_slices" v-model="interval_id" type="range"
											v-bind:min="min_time_id" v-bind:max="max_time_id"
											v-on:change="skip_through_time_slices"></b-form-input>
									</b-form-group>
								</div>
							</b-card>
						</b-collapse>
					</b-card>
				</div>
			</b-sidebar>
    `,
});
