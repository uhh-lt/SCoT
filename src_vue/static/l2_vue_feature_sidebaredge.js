Vue.component("feature-sidebaredge", {
  data: function () {
    return this.$root.$data;
  },
  methods: {
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
        docSearch_io(wort1, wort2);
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
        docSearch_io(wort1, wort2);
      }
    },
    selectIntervalWithActive() {
      // console.log("in selectIntervalwitactive" + this.active_edge.time_ids);
      let ret = this.selectInterval(
        this.active_edge.time_ids,
        this.active_edge.weights
      ).slice(0, -4);
      return ret;
    },
    // creates the string of the tooltip
    selectInterval(time_ids, weights) {
      let intervalString = "";
      if (time_ids) {
        for (let index = 0; index < time_ids.length; index++) {
          let start = this.start_years[time_ids[index] - 1].text;
          let end = this.end_years[time_ids[index] - 1].text;
          intervalString +=
            start + " - " + end + " [" + weights[index] + "]" + "<br>";
        }
      }
      return intervalString;
    },
  },
  template: `
  <!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR RIGHT 1 - EDGE CONTEXT ANALYSIS VIEW XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
			<b-sidebar v-show="context_mode" id="sidebar-right1" title="Edges Shared Words" width="23%"
				bg-variant="secondary" text-variant="light" style="opacity: 0.9;" no-header right shadow>
				<template>
					<br>
					<h4 id="sidebar-no-header-title" style="text-align: left;">&nbsp;&nbsp;&nbsp;&nbsp;<b>Edges Shared
							Words</b></h4>
					<br>
					<b-button size="sm" variant="danger" @click="toggleSidebarContext">Close</b-button>
					<b-button size="sm" variant="success" @click="edgeContextSearchEdgeOne">Search N1/Edge</b-button>
					<b-button size="sm" variant="success" @click="edgeContextSearchEdgeTwo">Search N2/Edge</b-button>
				</template>
				<br>
				<br>
				<p style="margin-left: 10px;font-size:12px"> Edges represent a strong similarity between two paradigms.
					The [max] similarity between<b> {{active_edge.source_text}} </b> and <b> {{active_edge.target_text}}
					</b>
					occured in the interval: {{ selectIntervalWithActive () }}. The scores below represent the
					significance of the context-word for each paradigm.

				</p>
				<div>
					<b-table selectable :select-mode="'single'" @row-selected="onRowSelectedEdge" striped-hover
						:busy="busy_right1" :fields="fields_edges" :items="simbim_object" :sort-by="'node1'"
						:sort-desc="true" style="color: white;font-size:12px">
						<template v-slot:table-busy>
							<div class="text-center text-danger my-2">
								<b-spinner class="align-middle"></b-spinner>
								<strong>Loading...</strong>
							</div>
						</template>
					</b-table>
				</div>
			</b-sidebar>
    `,
});
