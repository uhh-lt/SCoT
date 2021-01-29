Vue.component("feature-sidebarnode", {
  data: function () {
    return this.$root.$data;
  },
  methods: {
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

    // returns selected row in table node-context information
    onRowSelected(items) {
      //this.selected = items
      // // console.log(items);
      this.row_selected = items;
    },

    // function for buttion search N1
    nodeContextSearchNodeOne() {
      let wort1 = this.active_node.source_text;
      if (this.row_selected == null || this.row_selected["length"] == 0) {
        //console.log("items is null")
        alert("Please select a row in the table to select a search term.");
      } else {
        let wort2 = this.row_selected[0]["edge"];
        docSearch_io(wort1, wort2);
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
        docSearch_io(wort1, wort2);
      }
    },
  },
  template: `
  <!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR RIGHT 3 - Node CONTEXT ANALYSIS VIEW  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
  <b-sidebar v-show="context_mode3" id="sidebar-right3" title="Nodes Shared Words" width="23%"
      bg-variant="secondary" text-variant="light" style="opacity: 0.9;" no-header right shadow>
      <template>
          <br>
          <h4 id="sidebar-no-header-title" style="text-align: left;">&nbsp;&nbsp;&nbsp;&nbsp;<b>Nodes Shared
                  Words</b></h4>
          <br>
          <b-button size="sm" variant="danger" @click="toggleSidebarContext3">Close</b-button>
          <b-button size="sm" variant="success" @click="nodeContextSearchNodeOne">Search N1/Edge</b-button>
          <b-button size="sm" variant="success" @click="nodeContextSearchNodeTwo">Search N2/Edge</b-button>
      </template>
      <br>
      <br>
      <p style="margin-left: 10px;font-size:12px"> The target word {{target_word}} is related to
          {{active_node.target_text}} most strongly in time-slot {{active_node.time_ids[0]}}.
          They share the below context-words in this time-slot. The scores represent the significance of the
          context-word for each paradigm.

      </p>
      <div>
          <b-table selectable :select-mode="'single'" @row-selected="onRowSelected" striped-hover
              :busy="busy_right3" :fields="fields_nodes" :items="simbim_node_object" :sort-by="'node1'"
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
