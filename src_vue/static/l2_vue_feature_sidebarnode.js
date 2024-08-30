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
//      this.showSidebar_edge = false;
      this.showSidebar_node = false;//!this.showSidebar_node;

      // console.log("in toggle3", this.showSidebar_node);
    },

    // returns selected row in table node-context information
    onRowSelected(items) {
      //this.selected = items
      // // console.log(items);
      this.row_selected = items;
    },

    // function for button search N1
    nodeContextSearchNodeOne() {
      let wort1 = this.active_component.source_text;
      if (this.row_selected == null || this.row_selected["length"] == 0) {
        //console.log("items is null")
        alert("Please select a row in the table to select a search term.");
      } else {
        let wort2 = this.row_selected[0]["edge"];
        this.selected_bim = wort2;
        docSearch_io(wort1, wort2);
      }
    },
    // function for button search N2
    nodeContextSearchNodeTwo() {
      let wort1 = this.active_component.target_text;
      if (this.row_selected == null || this.row_selected["length"] == 0) {
        //console.log("items is null")
        alert("Please select a row in the table to select a search term.");
      } else {
        let wort2 = this.row_selected[0]["edge"];
        this.selected_bim = wort2;
        docSearch_io(wort1, wort2);
      }
    },
    modal_similarity_plot(){
//    nothing to do here
      }
  },
  template: `
  <!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR RIGHT 3 - Node CONTEXT ANALYSIS VIEW  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
      <div>
        <b-sidebar v-show="showSidebar_node" id="sidebar-right3" title="Nodes Shared Words" width="23%"
                bg-variant="secondary" text-variant="light" style="opacity: 0.9;" no-header right shadow>
            <template>
                <div class="mx-2 my-3" >
                    <b-button class="d-inline px-1 py-1" style="text-align:right; height:30px;width:30px; vertical-align: top;" @click="toggleSidebarContext3">
                       <b-icon icon="x-lg" class="px-0 py-0"  scale="0.70"></b-icon>
                    </b-button>
                    <h4 class="d-inline px-2" id="sidebar-no-header-title" style="text-align: left" >Nodes Shared Words</h4>
                </div>
                <div class="px-2 py-2 mt-2">
                    <!-- b-button size="sm" variant="danger" @click="toggleSidebarContext3">Close</b-button -->
                    <b-button size="sm" variant="success" @click="nodeContextSearchNodeOne">Search N1/Edge</b-button>
                    <b-button size="sm" variant="success" @click="nodeContextSearchNodeTwo">Search N2/Edge</b-button>
                </div>
                <div class="ml-2 mr-2 mb-1">
                    <p style="margin-top:5px;font-size:12px"> <mark>{{active_component.source_text}}</mark> and
                        <mark>{{active_component.target_text}}</mark> are most strongly related in: <b>{{active_component.time_slices[0]}}</b>.
                        Following is the list of their shared context-words along with normalized significance scores.
                    </p>
                    <b-table selectable :select-mode="'single'" selected-variant="info" @row-selected="onRowSelected" striped hover
                         sticky-header="320px" head-variant="dark" table-variant="light" small
                        :busy="busy_right_node" :fields="bim_fields" :items="bim_objects" :sort-by="'node1'"
                        :sort-desc="true" style="color: white;font-size:12px">
                        <template v-slot:table-busy>
                            <div class="text-center text-danger my-2">
                                <b-spinner class="align-middle"></b-spinner>
                                <strong>Loading...</strong>
                            </div>
                        </template>
                    </b-table>
                    <hr style="border: 1px solid gray;" />
                    <h5>Nodes Similarity Plot</h5>
                    <div id="line_plot1" class="mw-100" style="height:320px"></div>
                    <b-button v-b-modal.modal-plot class="mb-3 mt-2" size="sm" variant="info">Open in new Window</b-button>
                </div>
            </template>
        </b-sidebar>
        <b-modal id="modal-plot" title="Nodes Similarity Plot" size="lg" scrollable="true">
              <div id="line_plot2" ></div>
         </b-modal>
      </div>
  `,
});
