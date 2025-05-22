Vue.component("text-example", {
  data: function () {
    return this.$root.$data;
  },
  methods: {
    // DOC INFO
    toggleSidebarContext4() {
      this.showSidebar_docs = false; //!this.showSidebar_docs;
      // console.log("in toggle4", this.showSidebar_docs);
    },
    save_docs(){
    if (vueApp.documents.length == 0)
    {alert("No example sentences found...")}
    let jo = this.active_component.target_text;
    let bim = this.selected_bim;
    saveDocs_io(jo, bim)
//    alert('to be done')
    }
  },
  template: `
  <!-- XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX SIDEBAR LEFT 3 - document CONTEXT ANALYSIS VIEW XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-->
  <b-sidebar v-model="showSidebar_docs" id="sidebar-right4" no-header width="22%"
    bg-variant="secondary" text-variant="light" style="opacity: 0.9;" left shadow>
    <template>
      <div class="mx-2 my-3" >
        <h4 class="d-inline pl-2 pr-5" id="sidebar-no-header-title" style="text-align: left" >Example Sentences</h4>
        <b-button class="d-inline px-1 py-1" style="float: right; height:30px; width:30px;" @click="toggleSidebarContext4">
         <b-icon icon="x-lg" class="px-0 py-0"  scale="0.70"></b-icon>
        </b-button>
    </div>
     <!--b-button size="sm" variant="danger" @click="toggleSidebarContext4">Close</b-button> -->
    </template>
    <div class="mx-2 mb-2">
    <b-input class="mb-2" v-model="filter_docs" placeholder="Filter docs..." type="search"></b-input>
      <b-table striped hov :busy="busy_right_docs" :fields="fields_documents" :items="documents"
      :filter="filter_docs" :filter-included-fields="filter_docs_on" show-empty small responsive="sm"
      head-variant="light" table-variant="dark" fixed
        :sort-by="'docs'" :sort-desc="true" style="color: white;font-size:12px">
        <template v-slot:table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>
            <strong>Loading...</strong>
          </div>
        </template>
      </b-table>
    </div>
    <template v-slot:footer="{ hide }">
        <div class="mx-2 my-2">
            <b-button size="sm" variant="info" :disabled="busy_right_docs" @click="save_docs">
            <em class="fas fa-download"></em> Save All Docs</b-button>
        </div>
    </template>
  </b-sidebar>
        `,
});
