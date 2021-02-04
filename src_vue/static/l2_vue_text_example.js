Vue.component("text-example", {
  data: function () {
    return this.$root.$data;
  },
  methods: {
    // DOC INFO
    toggleSidebarContext4() {
      this.context_mode4 = !this.context_mode4;
      // console.log("in toggle4", this.context_mode4);
    },
  },
  template: `
  <!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR LEFT 3 - document CONTEXT ANALYSIS VIEW XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
  <b-sidebar v-show="context_mode4" id="sidebar-right4" title="Example Sentences" width="20%"
    bg-variant="secondary" text-variant="light" style="opacity: 0.9;" left shadow>
    <template>
      <b-button size="sm" variant="danger" @click="toggleSidebarContext4">Close</b-button>
    </template>
    <br>
    <br>
    <!-- <p style="margin-left: 10px;font-size:12px" > Example Sentences
    </p> -->
    <div>
      <b-table striped-hover :busy="busy_right4" :fields="fields_documents" :items="documents"
        :sort-by="'docs'" :sort-desc="true" style="color: white;font-size:12px">
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
