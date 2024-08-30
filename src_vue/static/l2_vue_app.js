let vueApp = new Vue({
  el: "#vue-app",
  template: `
  <div class="parentdiv">
  <b-overlay :show="overlay_main" rounded="sm" spinner-type="border" spinner-variant="dark">
  <div id="graph2" class="svg-container" style="text-align:right;">
      <small style="font-size: 10px; font-color:red">
      SVG and PNG functions are tested for Chrome only.
      </small></div>
  </b-overlay>
  <frame-navbar></frame-navbar>
  <frame-sidebargraph></frame-sidebargraph>
  <frame-sidebarclustertime></frame-sidebarclustertime>
  <!-- feature-sidebaredge></feature-sidebaredge -->
  <feature-sidebarnode></feature-sidebarnode>
  <feature-sidebarcluster></feature-sidebarcluster>
  <text-example></text-example>
  </div>
    `,
  /**
   * vueData is one of three data-objects objects in the global scope: vueData, graph and d3Data
   * vueData is specific to the VueApp - it is included here to make it reactive
   * ( graph refers to the global graph-model, d3Data  refers to specific data for d3)
   */
  data: vueData,
  computed: {},
  methods: {
    /**
     * helper
     */
    getKeyByValue(object, value) {
      return Object.keys(object).find((key) => object[key] === value);
    },

    /*
        / ############ GRAPH CREATION UPDATE DELETE FUNCTIONS WHERE vueAPP acts as linkage between components
        */
    loadNew: async function (data_from_db) {
      vueApp.graph_rendered = false;
      vueApp.overlay_main = true;
      // nodes and links should be released from d3
      if (d3Data.d_simulation) {
        d3Data.d_simulation.stop();
      }
      await delete_graph();
      // delete additional data storage locations
      vueApp.graph_clusters = [];
      d3Data.links = [];
      // attach to graph - assign per nested object
      graph.nodes = data_from_db.nodes;
      graph.links = data_from_db.links;
      graph.singletons = data_from_db.singletons;
      graph.props = data_from_db.props;
      graph.clusters = data_from_db.clusters;
      graph.transit_links = data_from_db.transit_links;
      console.log(" new prop ", graph.props.collection_key);
      console.log(" loaded names in vueApp", vueApp.collections);
      // new copy back to vue app props
      for (let collection_obj_key in vueApp.collections) {
        console.log("iterating col obj keys", collection_obj_key);
        if (
          vueApp.collections[collection_obj_key].key ===
          graph.props.collection_key
        ) {
          vueApp.collection_name = collection_obj_key;
          vueApp.collection_key = graph.props.collection_key;
          break;
        }
      }
      console.log("collection name", vueApp.collection_name);
      vueApp.onChangeDb();
      vueApp.start_year = graph.props["start_year"];
      vueApp.end_year = graph.props["end_year"];
      // user input: graph props
      // here is a naming confusion
      // in the frontend vueApp the real key is the name - this is stored in vueApp.graph_type
      // in the graph.props the graph.props.graph_type refers to the string, such as "ngot-interval" that is the value in the FE
      // Thus - graph_type != graph_type
      vueApp.target_word = graph.props["target_word"];
      vueApp.graph_type = this.getKeyByValue(
        vueApp.graph_type_keys,
        graph.props.graph_type
      );
      console.log(vueApp.graph_type);
      vueApp.onChangeDb();
      vueApp.n_nodes = graph.props["n_nodes"];
      vueApp.density = graph.props["density"];

      // clean up of data - python cannot use the reserved word "class"
      // execute mapping to node attribute "class" : "cluster_id" -> "class"
      for (let node of graph.nodes) {
//      console.log(node);
        node.class = node.cluster_id;
      }
      // copy target and source to source-Text and target-text: d3 force is working on them
      for (let link of graph.links) {
        link.target_text = link.target;
        link.source_text = link.source;
      }
      // // link graph.singletons to app
      vueApp.singletons = data_from_db.singletons;
      vueApp.graph_clusters = data_from_db.clusters;
      // prep cluster data
      for (let cluster of vueApp.graph_clusters) {
        if (!cluster.colour) {
          cluster.colour = color(cluster.cluster_id);
        } else {
          for (let node in graph.nodes) {
            if (node.cluster_id == cluster.cluster_id) {
              node.colour = cluster.colour;
            }
          }
        }
        cluster.opacity = vueApp.node_fill_opacity;
      }

      // dictionaries
      for (let node of graph.nodes) {
        vueApp.node_dic[node.id] = node;
      }
      vueApp.link_dic = {};
      for (let link of graph.links) {
        vueApp.link_dic[link.id] = link;
      }
      vueApp.cluster_dic = {};
      for (let cluster of graph.clusters) {
        vueApp.cluster_dic[cluster.cluster_id] = cluster;
      }
      // update hidden
      for (let cluster of graph.clusters) {
        for (let link of graph.links) {
          if (
            cluster.add_cluster_node &&
            cluster.cluster_id == link.cluster_id
          ) {
            link.hidden = false;
          } else if (
            !cluster.add_cluster_node &&
            link.cluster_link &&
            cluster.cluster_id == link.cluster_id
          ) {
            link.hidden = true;
          }
        }
      }
      // update colour of nodes
      for (let node of graph.nodes) {
        let tmp = vueApp.cluster_dic[node.cluster_id];
        if (tmp && tmp.colour) {
          node["colour"] = tmp.colour;
        }
      }

      // and deep copy of links to d3 - it works on these data and modifies them
      d3Data.links = JSON.parse(JSON.stringify(graph.links));
      // update hidden of cluster links
      await graph_init();
      await graph_crud(graph.nodes, d3Data.links, graph.clusters);
      this.applyClusterSettings();
      sticky_change_d3();
      vueApp.graph_rendered = true;
      vueApp.overlay_main = false;
      return "ok";
    },

    // on change database in frontend - update function
    onChangeDb() {
      this.collection_key = this.collections[this.collection_name]["key"];
      this.target_word = this.collections[this.collection_name]["target"];
      this.n_nodes = this.collections[this.collection_name]["p"];
      this.density = this.collections[this.collection_name]["d"];
      this.collection_info = this.collections[this.collection_name]["info"];
      this.is_ES_available = this.collections[this.collection_name]["is_ES_available"];
      // console.log("in onchange db" + this.collection_key);
      // console.log("in onchange db" + this.collection_name);

      // async
      this.getStartYears();
      this.getEndYears();
    },
    // init graph_types
    getGraphTypes() {
      this.graph_types = Object.keys(this.graph_type_keys);
      this.graph_type = this.graph_types[0];
    },
    // init collections from axios
    getCollections() {
      getCollections_io();
    },
    getStartYears() {
      // Vue dropdown needs text and value
      this.start_years = this.collections[this.collection_name]["start_years"];
      this.start_year = this.start_years[0]["value"];
    },
    getEndYears() {
      this.end_years = this.collections[this.collection_name]["end_years"];
      this.end_year = this.end_years[this.end_years.length - 1]["value"];
    },

    manual_recluster: async function () {
      vueApp.overlay_main = true;
      vueApp.graph_rendered = false;
      vueApp.wait_rendering = true;
      d_simulation.stop();
      await manual_recluster_io();
      graph_crud(graph.nodes, d3Data.links, graph.cluster);
      // this.restart_change();
      this.applyClusterSettings();
      d_simulation.restart();
      //vueApp.get_clusters();
      vueApp.graph_rendered = true;
      vueApp.overlay_main = false;
      vueApp.wait_rendering = false;
    },
    /*
		  Reset all the nodes make to their original size
		  */
    resetCentralityHighlighting() {
      restart();
    },
    // creates the string of the tooltip
    selectInterval(time_ids, weights) {
      let intervalString = "";

      for (let index = 0; index < time_ids.length; index++) {
        let start = this.start_years[time_ids[index] - 1].text;
        let end = this.end_years[time_ids[index] - 1].text;
        intervalString +=
          start + " - " + end + " [" + weights[index] + "]" + "<br>";
      }
      return intervalString;
    },
    sort_timewise(time_ids, weights)
    {
        let data = []
        for(let index = 0; index<time_ids.length; index++){
            data.push({'id':time_ids[index],
                              'weight':weights[index]})
        }
        data.sort((a,b) => a.id - b.id)
        let ids2 = []
        let weights2 = []
        for(let index = 0; index<time_ids.length; index++){
            ids2.push(data[index].id)
            weights2.push(data[index].weight)
        }
        return {'time_ids':ids2, 'weights':weights2};
    },

    sort_timewise2(time_ids, counts1, counts2)
    {
        let data = []
        for(let index = 0; index<time_ids.length; index++){
            data.push({'id':time_ids[index],
                              'count1':counts1[index],
                              'count2':counts2[index]})
        }
        data.sort((a,b) => a.id - b.id)
        let ids2 = []
        let counts11 = []
        let counts21 = []

        for(let index = 0; index<time_ids.length; index++){
            ids2.push(data[index].id)
            counts11.push(data[index].count1)
            counts21.push(data[index].count2)
        }
        return {'time_ids':ids2, 'counts1':counts11, 'counts2':counts21};
    },

    time_id_text(time_id){
        let start = this.start_years[time_id-1].text;
        let end = this.end_years[time_id-1].text;
        return start + "-" + end
    },

    show_similarity_plot(div_id, source='node'){

        console.log("vueapp.plot_similarity for dtype:", source);

        width=400; height = 250; fst=12; fsa=12; fsl=10; fs=8;
        if (div_id === "line_plot2"){ // reset for modal window
            console.log(div_id)
            height=null
            width=null
            fst = 18 //title
            fsa = 15 //axis
            fsl = 12 //legend
            fs = 12 //rest
        }

        node1_text= this.active_component.source_text;
        node2_text= this.active_component.target_text;
        time_ids = [...this.active_component.time_ids]; //shallow copy
        weights = [...this.active_component.weights];
        weight_stats = graph.props.weight_stats;
//        check if time_id of min and max score is not present in selected node time_ids
        if(source == 'node'){
            if(time_ids.indexOf(weight_stats.min_score[1]) == -1){
                time_ids.push(weight_stats.min_score[1]);
                weights.push('null')
            }
            if(time_ids.indexOf(weight_stats.max_score[1]) == -1){
                time_ids.push(weight_stats.max_score[1]);
                weights.push('null')
            }
        }
        line_data = vueApp.sort_timewise(time_ids, weights)
        line_data['time_slices'] = line_data['time_ids'].map(vueApp.time_id_text)

        sim_graph = {
        x: line_data.time_slices,
        y: line_data.weights,
        name: node2_text,//'score',
        mode: 'lines+markers',
        connectgaps: true,
        marker: { color: 'rgba(0, 115, 230, 0.9)', size: 8 }
        };
        min_score = {
        x: [vueApp.time_id_text(weight_stats.min_score[1])],
        y: [weight_stats.min_score[0]],
        name: 'minimum',
        mode: 'markers+text',
        type: 'scatter',

        text: [weight_stats.min_score[2]],
        textposition: 'top center',
        marker: { color: 'rgba(255, 191, 0,0.75)', symbol:'cross', size: 8 }
        };
        max_score = {
        x: [vueApp.time_id_text(weight_stats.max_score[1])],
        y: [weight_stats.max_score[0]],
        name: 'maximum',
        mode: 'markers+text',
        type: 'scatter',

        text: [weight_stats.max_score[2]],
        textposition: 'bottom center',
        marker: { color: 'rgba(0, 138, 0,0.75)', symbol:'cross', size: 8 }
        };

        let data = [sim_graph, min_score, max_score];
        if(source != 'node'){ //for edge min-max does not make sense
            data = [sim_graph]
        }

        let config = {
            responsive: true,
            scrollZoom: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d','select2d','lasso2d','autoScale2d','zoom2d'],
            toImageButtonOptions: {
                format: 'svg', // one of png, svg, jpeg, webp
                filename: vueApp.collection_name + '--'+
                node1_text + '_similarity-over-time_with_' +
                node2_text +
                "_" + graph.props.start_year + "_" + graph.props.end_year,
                height: 500,
                width: 700,
                scale: 1.5 // Multiply title/legend/axis/canvas sizes by this factor
              }
        };
        let layout = {

            title:{
                text: 'Similarity over Time of ' + node1_text + ' with ' + node2_text,
                font: {size:fst},
            },
            font:{size:fs},
            autosize: true,
//            width: width,
            height: height,
            margin: {
              l: 50,
              r: 50,
              b: 50,
              t: 50,
              pad: 2},

            showlegend: true,
            legend: {
                "orientation": "v",
                x: 1.05,
                y: 1,
                font: {size: fsl},
            },
            xaxis: {
                title: {
                        text: 'time slots',
                        font: {
                                size: fsa,
                                }
                },
                automargin: true,
                showline: true,
              },
              yaxis: {
                title: {
                        text: 'score',
                        font: {
                                size: fsa,
                                }
                },
                automargin: true,
                showline: true,
              },
        };

        Plotly.newPlot(div_id, data, layout, config);
    },

    show_nodefrequency_plot(div_id, source='node'){

        console.log("vueapp.plot_frequency for dtype:", source);

        width=400; height = 275; fst=12; fsa=12; fsl=10; fs=8;
        if (div_id === "line_plot4"){ // reset for modal window
            console.log(div_id)
            height=null
            width=null
            fst = 18 //title
            fsa = 15 //axis
            fsl = 12 //legend
            fs = 12 //rest
        }
        node1_text = this.active_component.source_text;
        node2_text = this.active_component.target_text;
        let time_ids1, time_ids2;
        let counts1, counts2;
        if (source == 'node'){
          counts1 = graph.props.counts;
          counts2 = [...this.active_component.counts];
          time_ids1 = graph.props.counts_time_ids;
        }
        else{
//        console.log(this.active_component)
          counts1 = [...this.active_component.source_counts];
          counts2 = [...this.active_component.target_counts];
          time_ids1 = graph.props.counts_time_ids;
//          time_ids1 = [...this.active_component.source_counts_time_ids];
//          time_ids2 = [...this.active_component.target_counts_time_ids];
        }
        time_ids = time_ids1 //assuming time_ids1 and 2 are same
        line_data = {'time_ids':time_ids, 'counts1':counts1, 'counts2':counts2};
        line_data['time_slices'] = line_data['time_ids'].map(vueApp.time_id_text)

        count_graph1 = {
        x: line_data.time_slices,
        y: line_data.counts1.map(i => i[1]),
        text: line_data.counts1.map(i => 'raw freq:' + i[0]),
        name: node1_text,
        mode: 'lines+markers',
        connectgaps: false,
        marker: { color: 'rgba(0, 115, 230,0.9)', size: 8 }
        };
        count_graph2 = {
        x: line_data.time_slices,
        y: line_data.counts2.map(i => i[1]),
        text: line_data.counts2.map(i => 'raw freq:' + i[0]),
        name: node2_text,
        mode: 'lines+markers',
        connectgaps: false,
        marker: { color: 'rgba(255, 191, 0,0.75)', size: 8 }
        };

        let data = [count_graph1, count_graph2];

        let config = {
            responsive: true,
            scrollZoom: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d','select2d','lasso2d','autoScale2d','zoom2d'],
            toImageButtonOptions: {
                format: 'svg', // one of png, svg, jpeg, webp
                filename: vueApp.collection_name + '--'+
                node1_text + '_frequency-over-time_with_' +
                node2_text +
                "_" + graph.props.start_year + "_" + graph.props.end_year,
                height: 500,
                width: 700,
                scale: 1.5 // Multiply title/legend/axis/canvas sizes by this factor
              }
        };
        let layout = {
            title:{
                text: 'Node Frequency over Time',//of ' + node1_text + ' and ' + node2_text,
                font: {size:fst},
            },
            font:{size:fs},
            autosize: true,
//            width: width,
            height: height,
            margin: {
              l: 50,
              r: 50,
              b: 50,
              t: 50,
              pad: 2},

            showlegend: true,
            legend: {
                "orientation": "v",
                x: 1.05,
                y: 1,
                font: {size: fsl},
            },
            xaxis: {
                title: {
                        text: 'time slots',
                        font: {
                                size: fsa,
                                }
                },
                automargin: true,
                showline: true,

              },
              yaxis: {
                title: {
                        text: 'frequency as ppm (log-scaled)',
                        font: {
                                size: fsa,
                                }
                },
                type: 'log',
                automargin: true,
                showline: true,
                zeroline: true, //not effective with log-scale

              },
        };

        Plotly.newPlot(div_id, data, layout, config);

    },

    show_nodecontextfrequency_plot(div_id){

        console.log("vueapp.plot_wordfeature_frequency");

        width=400; height = 275; fst=12; fsa=12; fsl=10; fs=8;
        if (div_id === "line_plot6"){ // reset for modal window
            height=null
            width=null
            fst = 18 //title
            fsa = 15 //axis
            fsl = 12 //legend
            fs = 12 //rest
        }
        counts_data = this.jobim_counts

        node1_text = this.active_component.source_text;
        node2_text = this.active_component.target_text;
        feature = this.selected_bim;

        let time_ids1 = counts_data[node1_text]['time_ids']
        let time_ids2 = counts_data[node2_text]['time_ids']
        let counts1 = counts_data[node1_text]['counts']
        let counts2 = counts_data[node2_text]['counts']

        time_ids = time_ids1 //assuming time_ids1 and 2 are same
        line_data = {'time_ids':time_ids, 'counts1':counts1, 'counts2':counts2};
        line_data['time_slices'] = line_data['time_ids'].map(vueApp.time_id_text)

        count_graph1 = {
        x: line_data.time_slices,
        y: line_data.counts1,
//        text: line_data.counts1.map(i => 'raw freq:' + i[0]),
        name: node1_text,
        mode: 'lines+markers',
        connectgaps: false,
        marker: { color: 'rgba(0, 115, 230,0.9)', size: 8 }
        };
        count_graph2 = {
        x: line_data.time_slices,
        y: line_data.counts2,
//        text: line_data.counts2.map(i => 'raw freq:' + i[0]),
        name: node2_text,
        mode: 'lines+markers',
        connectgaps: false,
        marker: { color: 'rgba(255, 191, 0,0.75)', size: 8 }
        };

        let data = [count_graph1, count_graph2];

        let config = {
            responsive: true,
            scrollZoom: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d','select2d','lasso2d','autoScale2d','zoom2d'],
            toImageButtonOptions: {
                format: 'svg', // one of png, svg, jpeg, webp
                filename: vueApp.collection_name + '--'+
                node1_text  +'_'+ node2_text +'_'+  feature + '_nodecontextfrequency-over-time_with_' +
                "_" + graph.props.start_year + "_" + graph.props.end_year,
                height: 500,
                width: 700,
                scale: 1.5 // Multiply title/legend/axis/canvas sizes by this factor
              }
        };
        let layout = {
            title:{
                text: 'Node-Context Frequency over Time for ' + feature,// + 'with' + node1_text + ' and ' + node2_text,
                font: {size:fst},
            },
            font:{size:fs},
            autosize: true,
//            width: width,
            height: height,
            margin: {
              l: 50,
              r: 50,
              b: 50,
              t: 50,
              pad: 2},

            showlegend: true,
            legend: {
                "orientation": "v",
                x: 1.05,
                y: 1,
                font: {size: fsl},
            },
            xaxis: {
                title: {
                        text: 'time slots',
                        font: {
                                size: fsa,
                                }
                },
                automargin: true,
                showline: true,

              },
              yaxis: {
                title: {
                        text: 'frequency (log-scaled)',
                        font: {
                                size: fsa,
                                }
                },
                type: 'log',
                automargin: true,
                showline: true,
                zeroline: true, //not effective with log-scale

              },
        };

        Plotly.newPlot(div_id, data, layout, config);

    },

    // check the dictionary to see if nodes are linked
    isConnected(a, b) {
      // console.log("in is connected with a.id, b.id", a, b);
      return (
        vueApp.link_dic[a.id + "-" + b.id] ||
        vueApp.link_dic[b.id + "-" + a.id] ||
        a.id == b.id
      );
    },
    /*
		  Apply changes in cluster name and colour to all the nodes in the graph (when pressing the "Apply" button in the edit column)
		  Data Changes---
		  */
    applyClusterSettings() {
      // needs node map
      let node_dic = {};
      for (let node of graph.nodes) {
        node_dic[node.id] = node;
      }
      // console.log("in apply cluster settings");
      // console.log("node_dic", node_dic);

      for (let cluster of vueApp.graph_clusters) {
        // apply name changes - name has twoway-binding
        // needs applying to cluster node (which is now in nodes)
        console.log(cluster);
        cluster.cluster_info_node.target_text = cluster.cluster_name;
        cluster.cluster_info_node.colour = cluster.colour;
        let tmp = node_dic[cluster.cluster_id];
        tmp.colour = cluster.colour;
        tmp.target_text = cluster.cluster_name;
        for (let node of cluster.cluster_nodes) {
          // apply colour changes
          // needs applying to cluster node and all nodes
          //console.log(node);
          tmp = node_dic[node];
          // console.log("tmp", tmp);
          tmp.colour = cluster.colour;
        }

        // apply cluster label visible

        for (let node of graph.nodes) {
          if (node.cluster_node && node.cluster_id == cluster.cluster_id) {
            node.hidden = !cluster.add_cluster_node;
          }
        }
        for (let link of d3Data.links) {
          if (link.cluster_link && link.cluster_id == cluster.cluster_id) {
            link.hidden = !cluster.add_cluster_node;
          }
        }
        console.log(cluster.add_cluster_node, cluster.cluster_id);
        // console.log(d3Data.links);
      }
      // needs applying to
      restart();
    },

    /*
    Get edge information, i.e. the feature-contexts words that are shared by paradigms
    Since we are using similarity - bims (ie contexts) - the function is called simbim
    */
    getSimBims() {
      getSimBims_io();
    },
    /*
        Get node-target word (invisible edge) information, i.e. the feature-contexts words that are shared by paradigms
        Since we are using similarity - bims (ie contexts) - the function is called simbim
        */
    getSimBimsNodes() {
      getSimBimsNodes_io();
    },
  },
  // ######################   APP STATE  ------------------------------------------------------------------------------
  // gets collections from backend at startup and inits svg
  mounted() {
    this.getCollections();
    this.$root.$on('bv::modal::shown', (bvEvent, modalId) => {
//            console.log(modalId)
            if(modalId == "modal-plot"){
                this.show_similarity_plot("line_plot2", this.active_component.dtype)
            }
            if(modalId == "modal-plot-wc"){
                this.show_nodefrequency_plot("line_plot4", this.active_component.dtype)
            }
            if(modalId == "modal-plot-wfc"){
                this.show_nodecontextfrequency_plot("line_plot6")
            }
        })
  },
  created() {},

});
