Vue.component("feature-sidebarcluster", {
  data: function () {
    return this.$root.$data;
  },
  computed: {

     selected_contexts_names() {
            //a workaround to force update,
            //vue2 does not react to Map and Set datatypes
            k = this.selected_contexts_cluster

            let features = []
            keys = this.selected_contexts_cluster_all.keys()
            for (item of keys){
                features.push(item)
            }
            return features
        },
  },

  methods: {
    // CLUSTER INFO - ADDITIONAL

    toggleSidebarContext2() {
      this.showSidebar_cluster = !this.showSidebar_cluster;
      // console.log("in toggle2", this.showSidebar_cluster);
    },

    onRowSelected(items) {

        if (items.length==0){
            if(this.filter_clusterbims_changed){ //it will be 0 after filtering, therefore preserve selection
                this.reSelectRows()
            }
            else{
                this.deSelectRows()
            }
        }
        else{
            if(this.filter_clusterbims_changed){
                this.reSelectRows()
            }
            else{
                this.deSelectRows()
            }
        }
        items.map(item=> vueApp.selected_contexts_cluster_all.set(item.wort, item.score))
        vueApp.selected_contexts_cluster = items


        items.map(item=> vueApp.selected_contexts_cluster_all.set(item.wort, item.score))
        vueApp.selected_contexts_cluster = items

        this.filter_clusterbims_changed = false
        if(vueApp.selected_contexts_cluster_all.size == 0){
            this.cluster_feature_selected = false;
        }
        else{
            this.cluster_feature_selected = true;
        }

      },

      selectAllRows() {
        this.$refs.selectableTable.selectAllRows()
        this.cluster_feature_selected = true
        this.selectAll=true
      },

      clearSelected() {
        this.$refs.selectableTable.clearSelected()
        this.cluster_feature_selected = false
        this.selectAll=false
        vueApp.selected_contexts_cluster_all = new Map()
      },
      toggleSelection(checked) {
        if(checked == 'true'){
            this.selectAllRows()
        }
        else{
            this.clearSelected()
        }
      },

      onFiltered(filteredItems) {
        this.filter_clusterbims_changed = true
        this.reSelectRows()

      },
      reSelectRows(){
        for(let index=0; index<vueApp.table_records.length; index++){
                if(vueApp.selected_contexts_cluster_all.has(vueApp.table_records[index]['wort'])){
                    this.$refs.selectableTable.selectRow(index)
                }
            }
      },

      deSelectRows(){
        for(let index=0; index<vueApp.table_records.length; index++){
                if(vueApp.selected_contexts_cluster_all.has(vueApp.table_records[index]['wort'])){
                    if(!this.$refs.selectableTable.isRowSelected(index)){
                        vueApp.selected_contexts_cluster_all.delete(vueApp.table_records[index]['wort'])
                    }
                }
            }
      },
  },

  template: `
  <!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR LEFT 2 - Cluster CONTEXT ANALYSIS VIEW XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
  <b-sidebar v-show="showSidebar_cluster" id="sidebar-right2" title="Cluster Shared Words" width="22%"
    bg-variant="secondary" text-variant="light" style="opacity: 0.99;" no-header left shadow>
    <template>
      <div class="mx-2 my-3" >
        <h5 class="d-inline pl-1 pr-3" id="sidebar-no-header-title" style="text-align: left" >Cluster Shared Context-Words</h5>
        <b-button class="d-inline px-1 py-1" style="float: right; height:30px; width:30px;" @click="toggleSidebarContext2">
         <b-icon icon="x-lg" class="px-0 py-0"  scale="0.70"></b-icon>
        </b-button>
      </div>
      <!--b-button size="sm" variant="danger" @click="toggleSidebarContext2">Close</b-button> -->
    </template>
    <div class="ml-2 mr-2 mb-1">
        <!--p style="font-size:12px"> SCoT-clusters exhibit similarity between multiple paradigms over time.
          The following list shows the top 200 context-words among all nodes in the cluster. The score is the
          normalized cumulated significance of the syntagmatic context for the cluster over time.
        </p-->
        <p style="font-size:12px"> The top 200 context-words among all nodes in the cluster. The score is the
          normalized cumulated significance of the syntagmatic context for the cluster over time.
        </p>
    </div>
    <div class="mx-1 px-1 pt-1 pb-2"  v-bind:style="{ 'background-color': !cluster_selected ? selected_cluster.colour: null }">
        <b-input class="mb-2" v-model="filter_clusterbims" placeholder="Filter context..." type="search"></b-input>
        <b-table class="mb-0" small striped hover selectable head-variant="dark" table-variant="light"
            sticky-header="350px" style="color: white;font-size:12px"
            :busy="busy_right_cluster" :fields="fields_cluster" :items="cluster_shared_object"
            v-model="table_records"  ref="selectableTable" :select-mode="'multi'" selected-variant="info"
            @row-selected="onRowSelected"
            :filter="filter_clusterbims" :filter-included-fields="filter_clusterbims_on" @filtered="onFiltered" show-empty

            :sort-by="'score'" :sort-desc="true" sort-icon-left >
            <template v-slot:table-busy>
              <div class="text-center text-danger my-2">
                <b-spinner class="align-middle"></b-spinner>
                <strong>Loading...</strong>
              </div>
            </template>
            <template #head(selected)="data">
                <b-form-checkbox class="pr-2" size="sm" :indeterminate="cluster_feature_selected" @change="toggleSelection" v-model="selectAll" value="true" unchecked-value="false">
                </b-form-checkbox>
            </template>
            <template #cell(selected)="{ rowSelected }">
                <template v-if="rowSelected">
                  <span aria-hidden="true">&check;</span>
                  <span class="sr-only">Selected</span>
                </template>
                <template v-else>
                  <span aria-hidden="true">&nbsp;</span>
                  <span class="sr-only">Not selected</span>
                </template>
            </template>
        </b-table>

        <!--b-button size="sm" @click="selectAllRows">Select all</b-button-->
        <!--b-button size="sm" @click="clearSelected">Clear selected</b-button-->
    </div>
    <div class="ml-2 mr-2 mt-0 mb-1">
         <hr style="border: 1px solid gray;" />
         <b-button v-b-modal.modal-plot-cluster-cf size="sm" variant="info" :disabled="!cluster_feature_selected"
            v-b-tooltip.hover title="Select some contexts from the table to view their frequency plot over time">
           Context-Frequency Plot  <em class="bi bi-box-arrow-up-right" style="font-size: 15px;"></em></b-button>

        <b-modal id="modal-plot-cluster-cf" title="Cluster-Context" size="lg" scrollable>
          <div id="cluster_context_plot2" ></div>

          <div id="selected_contexts" >

                <b-button v-b-toggle.collapse-3 class="m-1" size="sm" > Selected Contexts
                <span class="when-opened"><i class="fa fa-chevron-down"
                        aria-hidden="true"></i></span>
                <span class="when-closed"><i class="fa fa-chevron-up"
                        aria-hidden="true"></i></span>
                </b-button>
                <b-collapse visible id="collapse-3" >
                <b-card>
                    <small>{{selected_contexts_names}}</small></div>
                </b-card>
            </b-collapse>
            </div>

        </b-modal
    </div>
  </b-sidebar>
      `,
});
