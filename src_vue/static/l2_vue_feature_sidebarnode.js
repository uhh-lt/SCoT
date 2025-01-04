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
//        console.log(items);
      this.row_selected = items;
      if (this.row_selected == null || this.row_selected["length"] == 0) {
              this.feature_selected = false;
      }
      else{
        this.feature_selected = true;
        this.nodeContextFrequencyPlot()
      }
    },

    // function for button search N1
    nodeContextSearchNodeOne() {
      let wort1 = this.active_component.source_text;
      if (this.row_selected == null || this.row_selected["length"] == 0) {
        //console.log("items is null")
        alert("Please select a row in the table to select the context word to search");
      } else {
      this.feature_selected = true;
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
        alert("Please select a row in the table to select the context word to search");
      } else {
        let wort2 = this.row_selected[0]["edge"];
        this.selected_bim = wort2;
        docSearch_io(wort1, wort2);
      }
    },

//    modal_similarity_plot(){
//
//    },

    async nodeContextFrequencyPlot(){
          let word1 = this.active_component.source_text;
            let word2 = this.active_component.target_text;

          if (this.row_selected == null || this.row_selected["length"] == 0) {
            alert("Please select a row in the table to select the context word to plot");
          } else {
            let feature = this.row_selected[0]["edge"];
            this.selected_bim = feature;
            await wordFeatureCounts_io(word1, word2, feature);
          }
      },
  },
  template: `
  <!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR RIGHT 3 - Node CONTEXT ANALYSIS VIEW  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
      <div>
        <b-sidebar v-show="showSidebar_node" id="sidebar-right3" title="Shared Context-Words" width="23%"
                bg-variant="secondary" text-variant="light" style="opacity: 0.9;" no-header right shadow>
            <template>
                <div class="mx-2 my-3" >
                    <b-button class="d-inline px-1 py-1" style="text-align:right; height:30px;width:30px; vertical-align: top;" @click="toggleSidebarContext3">
                       <b-icon icon="x-lg" class="px-0 py-0"  scale="0.70"></b-icon>
                    </b-button>
                    <h5 class="d-inline px-2" id="sidebar-no-header-title" style="text-align: left" > Shared Context-Words</h5>
                </div>
                <!--
                <div class="px-2 py-2 mt-2">
                    <b-button size="sm" variant="success" @click="nodeContextSearchNodeOne">Search N1/Edge</b-button>
                    <b-button size="sm" variant="success" @click="nodeContextSearchNodeTwo">Search N2/Edge</b-button>
                </div>
                -->
                <div class="pt-1 ml-2 mr-2 mb-1">
                    <p style="margin-top:5px;font-size:12px"> <mark>{{active_component.source_text}}</mark> and
                        <mark>{{active_component.target_text}}</mark> are most strongly related in: <b>{{active_component.time_slices[0]}}</b>.
                        Following is the list of their shared context-words along with normalized significance scores.
                    </p>
                    <b-input class="mb-2" v-model="filter_bims" placeholder="Filter context..." type="search"></b-input>
                    <b-table selectable :select-mode="'single'" selected-variant="info" @row-selected="onRowSelected" striped hover
                         sticky-header="320px" head-variant="dark" table-variant="light" small
                        :busy="busy_right_node" :fields="bim_fields" :items="bim_objects" :sort-by="'node1'"
                        :filter="filter_bims" :filter-included-fields="filter_bims_on" show-empty
                        :sort-desc="true" sort-icon-left style="color: white;font-size:12px">
                        <template v-slot:table-busy>
                            <div class="text-center text-danger my-2">
                                <b-spinner class="align-middle"></b-spinner>
                                <strong>Loading...</strong>
                            </div>
                        </template>
                    </b-table>
                    <!-- <div class="px-2 py-2 mt-2"> -->
                    <div >
                        <b-button size="sm" variant="success" @click="nodeContextSearchNodeOne" :disabled="!feature_selected" ><i class="bi bi-search"></i> N1</b-button>
                        <b-button size="sm" variant="success" @click="nodeContextSearchNodeTwo" :disabled="!feature_selected" ><em class="bi bi-search"></em> N2</b-button>
                        <b-button v-b-modal.modal-plot-ncf size="sm" variant="info" :disabled="!feature_selected" title="show node-context frequency plot">
                        <em class="bi bi-box-arrow-up-left" style="font-size: 15px;"></em>  Node-Context Frequency</b-button>
                    </div>
                    <hr class="mb-2" style="border: 1px solid gray;" />
                    <h5 class="d-inline">Node Similarity</h5>
                    <b-button v-b-modal.modal-plot-ns class="mb-2 mr-0 d-inline float-right" size="sm" variant="info">
                    <em class="bi bi-box-arrow-up-left" style="font-size: 15px;"></em></b-button>
                    <div id="node_similarity_plot1" class="mw-100" ></div> <!-- style="height:320px" -->
                    <hr class="mb-2" style="border: 1px solid gray;" />
                    <h5 class="d-inline">Node Frequency</h5>
                    <b-button v-b-modal.modal-plot-nf class="mb-2 mr-0 d-inline float-right" size="sm" variant="info">
                    <em class="bi bi-box-arrow-up-left" style="font-size: 15px;"></em></b-button>
                    <div id="node_frequency_plot1" class="mb-2 mw-100"></div>
                    <!--
                    <hr style="border: 1px solid gray;" />
                    <h5 class="d-inline">Node-Context Frequency</h5>
                    <b-button v-b-modal.modal-plot-ncf class="mb-2 mr-0 d-inline float-right" size="sm" variant="info">
                    <em class="fas fa-expand-arrows-alt"></em></b-button>

                    <div id="node_context_frequency_plot1" class="mb-4 mw-100" style="height:320px"></div>
                    <hr style="border: 1px solid gray;" />
                    -->
                </div>
            </template>
        </b-sidebar>
        <b-modal id="modal-plot-ns" title="Node Similarity" size="lg" scrollable="true">
              <div id="node_similarity_plot2" ></div>
         </b-modal>

         <b-modal id="modal-plot-nf" title="Node Frequency" size="lg" scrollable="true">
               <div id="node_frequency_plot2" ></div>
        </b-modal>
        <b-modal id="modal-plot-ncf" title="Node-Context Frequency" size="lg" scrollable="true">
               <div id="node_context_frequency_plot2" ></div>
        </b-modal
      </div>
  `,
});
