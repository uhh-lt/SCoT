Vue.component("frame-navbar", {
  data: function () {
    return this.$root.$data;
  },
  methods: {
    unsearch_nodes() {
      unsearch_nodes_d3();
    },
    search_node() {
      search_node_d3();
    },
    /**
     Loads examples graph from example.js    
    */
    startExample() {
      let data_from_db = exampleJSON;
      vueApp.loadNew(data_from_db);
    },
    /*
    Returns a json object with all the information needed to rerender a graph and saves it locally.
   */
    saveGraph() {
      saveGraph_io();
    },
    /*
    Render the graph from a json file that the user has specified.
   */
    loadGraph() {
      loadGraph_io();
    },
    saveGraphSVG(){
       saveGraphSVG_io();
    },
    saveGraphPNG(){
       saveGraphPNG_io();
    },
    toggleSidebar_right(){
        this.showSidebar_right = !this.showSidebar_right;
        if (vueApp.showSidebar_right){
            this.showSidebar_node=false
        }
    },
  },
  template: `
    <div>
        <b-navbar type="dark" variant="secondary" toggleable="lg" fixed="top">
            <b-navbar-brand tag="h1" class="header">{{title}}
            </b-navbar-brand>

            <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
            <b-collapse id="nav-collapse" is-nav>

            <!-- buttons to create graph and analyse clusters -->
            <b-navbar-nav class="ml-auto">
              <b-button size="sm" class="lrmargin_button" v-b-toggle.sidebar-left variant="success">Create Graph
              </b-button>
              <b-button size="sm" class="lrmargin_button" variant="info" :disabled="!graph_rendered" @click="toggleSidebar_right">Analyse Clusters
              </b-button>
            </b-navbar-nav>
            <!-- input node and reset highlight option -->
            <b-navbar-nav class="ml-auto">
                <b-nav-form v-on:submit.prevent>
                    <b-input-group size="sm">
                        <b-input-group-prepend is-text>
                            <b-icon icon="search"></b-icon>
                        </b-input-group-prepend>
                        <b-form-input v-model="searchterm" @change="search_node()" type="search"
                            placeholder="Input Node & Enter" > </b-form-input>
                        <b-input-group-append>
                            <b-button class="lrmargin_button" variant="danger" @click="unsearch_nodes()">
                                Reset Highlighting <em class="fas fa-times"></em>
                            </b-button>
                        </b-input-group-append>
                    </b-input-group>
                </b-nav-form>
            </b-navbar-nav>
            <!-- buttons to load and save graph -->
            <b-navbar-nav class="ml-auto">
                <!-- Save and Load Graph buttons :disabled="time_diff == 1" -->

                <!--
                 <b-button size="sm" class="lrmargin_button" variant="success" v-b-modal.modal-20>
                    <em class="fas fa-upload"></em> Example
                </b-button>
                <b-button size="sm" class="lrmargin_button" variant="success" v-b-modal.modal-19>
                    <em class="fas fa-upload"></em> Load Graph
                </b-button>
                <b-button id="savebtn_json" class="lrmargin_button"  size="sm" variant="success" :disabled="!graph_rendered" v-on:click="saveGraph" download="graph.json" href="">
                    <em class="fas fa-download"></em> Save Graph
                </b-button>
                <b-button id="savebtn_svg" class="lrmargin_button"  size="sm" variant="info" :disabled="!graph_rendered" v-on:click="saveGraphSVG">
                    <em class="fas fa-download"></em> Save SVG
                </b-button>
                <b-button id="savebtn_png" class="lrmargin_button"  size="sm" variant="info" :disabled="!graph_rendered" v-on:click="saveGraphPNG">
                    <em class="fas fa-download"></em> Save PNG
                </b-button> -->
                <b-nav-item-dropdown text="Load & Save" right >
                  <b-dropdown-item id="loadbtn_json" variant="success" v-b-modal.modal-20><em class="fas fa-upload"></em> Example</b-dropdown-item>
                  <b-dropdown-item id="loadbtn_json" variant="success" v-b-modal.modal-19><em class="fas fa-upload"></em> Load as Json</b-dropdown-item>
                  <b-dropdown-item id="savebtn_json" variant="success" :disabled="!graph_rendered" v-on:click="saveGraph" download="graph.json" href=""><em class="fas fa-download"></em> Save as Json</b-dropdown-item>
                  <b-dropdown-item id="savebtn_svg" v-b-tooltip.hover title="SVG and PNG have been tested for Chrome only" variant="info" :disabled="!graph_rendered" v-on:click="saveGraphSVG"><em class="fas fa-download"></em>
                  Save as SVG <sup style="font-size: 8px; color:red">
                    *</sup></b-dropdown-item>
                  <b-dropdown-item id="savebtn_png" v-b-tooltip.hover title="SVG and PNG have been tested for Chrome only" variant="info" :disabled="!graph_rendered" v-on:click="saveGraphPNG"><em class="fas fa-download"></em>
                  Save as PNG<sup style="font-size: 8px; color:red">
                    *</sup> </b-dropdown-item>

                    <!--span style="font-size: 8px; color:red; text-align: right;">
                       *tested for Chrome only</span-->
                </b-nav-item-dropdown>
			</b-navbar-nav>

      </b-navbar>
      <b-modal id="modal-19" title="Load">
        <b-card>
            <b-card-text> Select a .json file to render graph from</b-card-text>

            <b-form-file
              id="file_input"
              v-model="file"
              :state="Boolean(file)"
              placeholder="Choose a file..."
              drop-placeholder="Drop file here..."
            >
            </b-form-file>

            <b-button
              id="render_file_button"
              href="#"
              variant="success"
              v-on:click="loadGraph()"
              >Render</b-button
            >
        </b-card>
      </b-modal>
      <b-modal id="modal-20" title="Example Graph">
          <b-card>
            <b-card-text> The example graph shows the senses of the noun "bar/NN".
              It is based on the corpus English Google Books, 1520-2008, and has been calculated with the settings
              n = 50, d = 20, ngot-interval. For further explanations of the graph, see our paper (in submission to EACL 2021): <br>
              <a href="https://www.dropbox.com/s/fqgwatcjhweryqi/Haase_Anwar_Yimam_Friedrich_Biemann_SCoT_2021.pdf?dl=0"
                 style="color:green; text-decoration:underline;">SCoT-Paper-2021</a>
              <br>
              See the help section in the left-sidebar for further help on using the graph.
            </b-card-text>
            <b-button class="lrmargin_button" size="sm" variant="success" v-on:click="startExample"
            download="graph.json" href="">Render Example-Graph bar/NN</b-button>
          </b-card>
      </b-modal>
    </div>
  `,
});
