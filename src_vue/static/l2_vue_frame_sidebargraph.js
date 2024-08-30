Vue.component("frame-sidebargraph", {
  data: function () {
    return this.$root.$data;
  },
  computed: {
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
  },
  methods: {
    /**
     Loads examples graph from example.js    
    */
    startExample() {
      let data_from_db = exampleJSON;
      vueApp.loadNew(data_from_db);
    },

    onChangeDb() {
      vueApp.onChangeDb();
      delete_graph();
      vueApp.overlay_main = false;
      vueApp.graph_rendered = false;
      vueApp.showSidebar_node = false;
      vueApp.showSidebar_right = false;

    },
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

    /*
        Get the data from the BE according to the parameters entered in the FE and render the graph
        */
    getDataAndRenderNew: async function () {
      // async start overlay with spinner
//      vueApp.showSidebar_node = false;
      vueApp.overlay_main = true;
      vueApp.graph_rendered = false;
      vueApp.wait_rendering = true;

      vueApp.showSidebar_node = false;
      vueApp.showSidebar_right = false;

      this.updateGraphPropsBasedonUserInput();

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
    // these functions mainly act as VUE event handlers (instead of the d3 ones)
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
  },

  template: `
    <!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR-LEFT XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
			<!-- Column with input parameters (left column) -->
//			<b-sidebar id="sidebar-left" title="Sense graph over time" bg-variant="secondary" text-variant="light"
			<b-sidebar id="sidebar-left" bg-variant="secondary" text-variant="light"
				style="opacity: 0.9;" width="22%" left shadow title="Graph Properties">
				<template v-slot:footer="{ hide }">
					<div class="d-flex bg-secondary text-light align-items-center px-3 py-2">
					</div>
				</template>
				<br>

				<h5 class="sidebar-section__title"> </h5>
				<b-form-group class="ml-2 mr-2 mb-2">
					<b-form-radio-group size="sm" v-model="left_selected" :options="left_options" buttons
						button-variant="info" name="radios-btn-default"></b-form-radio-group>
				</b-form-group>
				<!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR-LEFT CREATE GRAPH XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
				<div class="ml-2 mr-2 mb-2" v-if="left_selected === 'graph_data'">
					<b-overlay :show="overlay_main" :variant="'dark'" rounded="sm" spinner-type="border"
						spinner-variant="success">
						<hr class="mb-2" style="border: 1px solid gray;" />
						<!-- Enter database -->
						<b-form-group class="input" label="Collection">
							<b-form-select v-on:change="onChangeDb" v-model="collection_name"
								:options="collections_names" size="sm"></b-form-select>
						</b-form-group>
						
						<!-- Enter an start year -->
						<b-form-group class="input" label="Start of first interval">
							<b-form-select v-model="start_year" :options="start_years" size="sm"></b-form-select>
						</b-form-group>
						<!-- Enter an end year -->
						<b-form-group class="mb-0 input" label="End of last interval">
							<b-form-select v-model="end_year" :options="end_years" size="sm"></b-form-select>
						</b-form-group>
						<small>You have selected: {{number_of_intervals}} {{number_of_intervals > 1 ? "intervals" : "interval"}}</small>
                        <hr class="mb-2" style="border: 1px solid gray;" />
						<h5>Graph over Time</h5>
						<!-- Enter target word -->
						<b-form-group class="input" label="Target word">
							<b-form-input v-model="target_word" placeholder="target word" size="sm">
							</b-form-input>
						</b-form-group>
						<!-- Enter number of neighbouring nodes -->
						<small>{{node_info}}</small>
						<b-form-group class="input">
							<b-form-input type="number" v-model="n_nodes" min="0" placeholder="number of neighbours"
								size="sm"></b-form-input>
						</b-form-group>
						<!-- Enter factor that determines number of edges per graph -->
						Density in % <small>[E = {{edges}} of max. {{max_dir_edges}} {{density_edge_info}} ]</small>
						<b-form-group class="input">
							<b-form-input type="number" v-model="density" min="0" max="100"
								placeholder="number of edges" size="sm"></b-form-input>
						</b-form-group>
						<!-- Enter a graph type -->
						<b-form-group class="input" label="Type of graph">
							<b-form-select v-model="graph_type" :options="graph_types" size="sm">
							</b-form-select>
						</b-form-group>
						<!-- Render button -->
						<hr style="border: 1px solid gray;" />
						<h5></h5>
						<b-button class="lmmargin_button" size="sm" variant="success"
							v-on:click="getDataAndRenderNew()">
							Create and Cluster Graph</b-button>
						<!-- <b-button id="update_button" size="sm" class="lrmargin_button" variant="success" >Update Graph</b-button> -->


					</b-overlay>
				</div>

				<!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR-LEFT VIEW XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
				<div class="ml-2 mr-2 mb-2" v-if="left_selected === 'graph_view'">
					<div>
						<b-button-group>
							<!-- Resetz Zoom button -->
							<b-button variant="success" size="sm" class="lrmargin_button" v-on:click="resetZoom()">
								Graph: Reset Zoom</b-button>
							<!--<b-button v-b-modal.modal-settings-1 id="general_settings_button"> Graph: settings</b-button>-->
						</b-button-group>
					</div>
					<hr style="border: 1px solid gray;" />
					<!-- Set dragging behaviour -->
					<b-form-group id="sticky" class="input" label="Drag to Fixed-Position">
						<b-form-radio name="sticky_mode" value="false" v-model="sticky_mode"
							v-on:change="stickyChange('false')">Multi-Drag</b-form-radio>
						<b-form-radio name="sticky_mode" value="true" v-model="sticky_mode"
							v-on:change="stickyChange('true')">Single-Drag</b-form-radio>
					</b-form-group>
					<!-- Button to restart simulation with all the nodes -->
					<p>
						<b-button id="restart_button" variant="success" size="sm" class="lrmargin_button"
							v-on:click="restart_change()"> Release All Fixed
						</b-button>
					</p>
					<!-- Set charge strength for simulation -->
					<b-form-group> Charge strength: {{charge}}
						<b-form-input id="range_charge" v-model="charge" v-on:change="charge_change()" type="range"
							min="-200" max="100">
						</b-form-input>
					</b-form-group>
					<!-- Set link distance for simulation -->
					<b-form-group> Link distance: {{linkdistance}}
						<b-form-input id="range_linkdistance" v-model="linkdistance" v-on:change="linkdistance_change()"
							type="range" min="-10" max="200"></b-form-input>
					</b-form-group>
				</div>
				<!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR-LEFT HELP XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
				<div class="ml-2 mr-2 mb-2" v-if="left_selected === 'graph_help'">
					<hr style="border: 1px solid gray;" />
						SCoT (Sense Clustering over Time) is a web application to view the senses of a word and their evolvement over time. 
						<br>
						<hr style="border: 1px solid gray;" />
						For a detailed explanation, read our paper (in submission to EACL 2021): <br>
<a href="https://www.dropbox.com/s/fqgwatcjhweryqi/Haase_Anwar_Yimam_Friedrich_Biemann_SCoT_2021.pdf?dl=0" style="color:white; text-decoration:underline; font-size:140%">SCoT-Paper-2021</a>
<hr style="border: 1px solid gray;" />
You will find an introductory video here:
<br>
<a href="https://youtu.be/SbmfA4hKjvg"  style="color:white;text-decoration:underline;font-size:140%">Demo Video</a>
<hr style="border: 1px solid gray;" />
You will find the user guide here:
					<br>
					<p>
						<a href="https://chrishaase.github.io/SCoT/" style="color: white;text-decoration:underline;font-size:140%">User guide</a>
						
					</p>
					<hr style="border: 1px solid gray;" />
					You will find the source code here:
					<br>
					<a href="https://github.com/chrishaase/SCoT" style="color:white; text-decoration:underline;font-size:140%">Source code</a>
						<hr style="border: 1px solid gray;" />
						
						You can click on the top-right button EXAMPLE to see a pre-analysed graph.
						
						<hr style="border: 1px solid gray;" />
					
				</div>
			</b-sidebar>
			
			`,
});
