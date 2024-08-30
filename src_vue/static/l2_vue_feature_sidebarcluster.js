Vue.component("feature-sidebarcluster", {
  data: function () {
    return this.$root.$data;
  },
  methods: {
    // CLUSTER INFO - ADDITIONAL

    toggleSidebarContext2() {
      this.showSidebar_cluster = !this.showSidebar_cluster;
      // console.log("in toggle2", this.showSidebar_cluster);
    },
  },
  template: `
  <!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR LEFT 2 - Cluster CONTEXT ANALYSIS VIEW XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
  <b-sidebar v-show="showSidebar_cluster" id="sidebar-right2" title="Cluster Shared Words" width="22%"
    bg-variant="secondary" text-variant="light" style="opacity: 0.9;" no-header left shadow>
    <template>
      <div class="mx-2 my-3" >
        <h4 class="d-inline pl-1 pr-3" id="sidebar-no-header-title" style="text-align: left" >Cluster Shared Words</h4>
        <b-button class="d-inline px-1 py-1" style="float: right; height:30px; width:30px;" @click="toggleSidebarContext2">
         <b-icon icon="x-lg" class="px-0 py-0"  scale="0.70"></b-icon>
        </b-button>
      </div>
      <!--b-button size="sm" variant="danger" @click="toggleSidebarContext2">Close</b-button> -->
    </template>
    <div class="ml-2 mr-2 mb-1">
        <p style="font-size:12px"> SCoT-clusters exhibit similarity between multiple paradigms over time.
          The following list shows the top 200 context-words among all nodes in the cluster. The score is the
          normalized cumulated significance of the syntagmatic context for the cluster over time.
        </p>
        <b-table small striped-hover :busy="busy_right_cluster" :fields="fields_cluster" :items="cluster_shared_object"
        :sort-by="'score'" :sort-desc="true" head-variant="light" style="color: white;font-size:12px">
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
