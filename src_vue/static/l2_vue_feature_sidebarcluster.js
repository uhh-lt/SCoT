Vue.component("feature-sidebarcluster", {
  data: function () {
    return this.$root.$data;
  },
  methods: {
    // CLUSTER INFO - ADDITIONAL

    toggleSidebarContext2() {
      this.context_mode2 = !this.context_mode2;
      // console.log("in toggle2", this.context_mode2);
    },
  },
  template: `
  <!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR LEFT 2 - Cluster CONTEXT ANALYSIS VIEW XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
  <b-sidebar v-show="context_mode2" id="sidebar-right2" title="Cluster Shared Words" width="20%"
    bg-variant="secondary" text-variant="light" style="opacity: 0.9;" no-header left shadow>
    <template>
      <br>
      <h4 id="sidebar-no-header-title" style="text-align: left;">Cluster:
        shared words over time
        </b></h4>
      <br>
      <b-button size="sm" variant="danger" @click="toggleSidebarContext2">Close</b-button>
    </template>
    <br>
    <br>
    <p style="margin-left: 10px;font-size:12px"> SCoT-clusters exhibit similarity between
      multiple paradigms over time.
      The following list shows the top 200 context-words among all nodes in the cluster. The score is the
      normalized
      cumulated significance of the syntagmatic context for the cluster over time.
    </p>
    <div>
      <b-table striped-hover :busy="busy_right2" :fields="fields_cluster" :items="cluster_shared_object"
        :sort-by="'score'" :sort-desc="true" style="color: white;font-size:12px">
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
