/**
 * The functions in this connector module
 * handle VIA AXIOS (which resolves json well)
 * (1) initial prop queries
 * (2) graph-crud queries
 * (3) additional feature information
 * VIA FILE IO
 * (4) the saving and loading of teh graph-model to json local files
 */

// (1) INITIAL PROPS FOR APP --------------------------------------------------------------------------
async function getCollections_io() {
  try {
    const res = await axios.get("./api/collections");
    vueApp.collections = res.data;
    vueApp.collections_names = Object.keys(vueApp.collections);
    vueApp.collection_name = vueApp.collections_names[0];
    vueApp.is_ES_available = vueApp.collections[vueApp.collection_name].is_ES_available;

    vueApp.getGraphTypes();
    vueApp.onChangeDb();
  } catch (error) {
    console.error(error);
  }
}

/**
 * (2) GRAPH-CRUD --------------------------------------------------------------------------------
 */

// create
// Graph create - get initial data (you need to send the props to the backend for creating it)
async function getData_io() {
  const url = "./api/collections/sense_graph";
  try {
    let res = await axios.post(url, graph.props);
    let data_from_db = res.data;
    // attach to graph - assign per nested object
    graph.nodes = data_from_db.nodes;
    graph.links = data_from_db.links;
    graph.singletons = data_from_db.singletons;
    graph.props = data_from_db.props;

    graph.clusters = data_from_db.clusters;
    graph.transit_links = data_from_db.transit_links;
    // clean up of data - python cannot use the reserved word "class"
    // execute mapping to node attribute "class" : "cluster_id" -> "class"
    for (let node of graph.nodes) {
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
    for (let cluster of graph.clusters) {
      cluster.colour = color(cluster.cluster_id);
      cluster.opacity = vueApp.node_fill_opacity;
    }
    // and deep copy of links to d3 - it works on these data and modifies them
    d3Data.links = JSON.parse(JSON.stringify(graph.links));
    // create node and link dics for calculations
    vueApp.node_dic = {};
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
    vueApp.target_word_counts = graph.props.counts;
    // set first active node
  } catch (error) {
    console.log(error);
    if (error.response.status >= 500) {
      alert(error + "\nPlease try a different target word.");
    }
  }
  return "ok";
}

/**
 * UPDATE GRAPH ------------------------------------------------------------------------------------------------
 */
async function recluster_io() {
  // chose type of reclustering
  // this api is for automatic reclustering with chinese whispers
  let url = "./api/reclustering";
  return recluster_with_url(url);
}

async function manual_recluster_io() {
  // chose type of reclustering
  // this api is for an update of the graph after manual reclustering in the frontend
  let url = "./api/manualreclustering";
  let clusters_old = JSON.parse(JSON.stringify(vueApp.graph_clusters));
  let nodes_old = JSON.parse(JSON.stringify(graph.nodes));
  await recluster_with_url(url);
  // restore old graph parts
  for (let cluster1 of clusters_old) {
    for (let cluster2 of vueApp.graph_clusters) {
      if (cluster1.cluster_id === cluster2.cluster_id) {
        cluster2.cluster_name = cluster1.cluster_name;
        cluster2.add_cluster_node = cluster1.add_cluster_node;
        cluster2.colour = cluster1.colour;
        console.log("cluster2.cluster_name");
      }
    }
  }
  // prep cluster data
  for (let cluster of vueApp.graph_clusters) {
    if (!cluster.colour) {
      cluster.colour = color(cluster.cluster_id);
    } else {
      for (let node of graph.nodes) {
        if (node.cluster_id == cluster.cluster_id) {
          node.colour = cluster.colour;
        }
      }
    }
    cluster.opacity = vueApp.node_fill_opacity;
  }
  // update hidden
  // update hidden
  for (let cluster of graph.clusters) {
    vueApp.cluster_dic[cluster.cluster_id] = cluster;
    for (let link of graph.links) {
      if (cluster.add_cluster_node && cluster.cluster_id == link.cluster_id) {
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
  // update colour of nodes
  for (let node of graph.nodes) {
    let tmp = vueApp.cluster_dic[node.cluster_id];
    if (tmp && tmp.colour) {
      node["colour"] = tmp.colour;
    }
  }
  console.log(clusters_old, vueApp.graph_clusters);
  graph.clusters = JSON.parse(JSON.stringify(vueApp.graph_clusters));
}

async function recluster_with_url(url) {
  if (vueApp.highlightWobblies === true) {
    vueApp.resetCentralityHighlighting();
    vueApp.highlightWobblies = false;
  }
  // remove cluster links and cluster nodes
  let newLinks = d3Data.links.filter((d) => d.cluster_link == false);
  graph.links = JSON.parse(JSON.stringify(newLinks));

  let newnodes = graph.nodes.filter((d) => d.cluster_node == false);
  graph.nodes = newnodes;

  // Repair d3 changes
  for (let link of graph.links) {
    link.target = link.target_text;
    link.source = link.source_text;
    link.colour = null;
  }

  for (let node of graph.nodes) {
    node.class = null;
    node.colour = null;
  }

  // prepare data to send
  let data = {};
  data["nodes"] = graph.nodes;
  data["links"] = graph.links;
  data["singletons"] = graph.singletons;
  data["props"] = graph.props;

  try {
    const response = await axios.post(url, data);

    // NEW REFACTORED
    let data_from_db = response.data;
    // attach to graph - assign per nested object
    graph.nodes = data_from_db.nodes;
    graph.links = data_from_db.links;
    graph.singletons = data_from_db.singletons;
    graph.props = data_from_db.props;
    graph.clusters = data_from_db.clusters;
    graph.transit_links = data_from_db.transit_links;

    // new copy back to vue app props
    vueApp.collection_key = graph.props["collection_key"];
    vueApp.start_year = graph.props["start_year"];
    vueApp.end_year = graph.props["end_year"];

    // user input: graph props
    vueApp.target_word = graph.props["target_word"];
    vueApp.graph_type_keys[vueApp.graph_type] = graph.props["graph_type"];
    vueApp.n_nodes = graph.props["n_nodes"];
    vueApp.density = graph.props["density"];

    // clean up of data - python cannot use the reserved word "class"
    // execute mapping to node attribute "class" : "cluster_id" -> "class"
    for (let node of graph.nodes) {
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
        for (let node of graph.nodes) {
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
    // update hidden
    // update hidden
    for (let cluster of graph.clusters) {
      vueApp.cluster_dic[cluster.cluster_id] = cluster;
      for (let link of graph.links) {
        if (cluster.add_cluster_node && cluster.cluster_id == link.cluster_id) {
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
    // update colour of nodes
    for (let node of graph.nodes) {
      let tmp = vueApp.cluster_dic[node.cluster_id];
      if (tmp && tmp.colour) {
        node["colour"] = tmp.colour;
      }
    }
    // and deep copy of links to d3 - it works on these data and modifies them
    d3Data.links = JSON.parse(JSON.stringify(graph.links));
    delete_graph();
    graph_init();
    graph_crud(graph.nodes, d3Data.links, graph.clusters);
    sticky_change_d3();
  } catch (error) {
    console.log(error);
  }
  console.log("in recluster ende");
  return "ok";
}

/**
 * FEATURE INFORMATION -----------------------------------------------------------------------------------------------------
 * @param {} wort1
 * @param {*} wort2
 */
// Features

function getSimBims_io() {
  vueApp.busy_right_node = true;
//  vueApp.busy_right_edge = true;
  let retArray = [];
  let data = {};
  data["word1"] = vueApp.active_edge.source_text;
  data["word2"] = vueApp.active_edge.target_text;
  data["time_id"] = vueApp.active_edge.time_ids[0];

  let url = "./api/collections/" + vueApp.collection_key + "/simbim";
//  console.log(url);
  axios
    .post(url, data)
    .then((res) => {
      let ret = [];
      if (res.data["error"] == "none") {
        for (let key in res.data) {
          if (key != "error") {
            let dati = res.data[key];
            let retObj = {};
            retObj.node1 = parseFloat(dati["score"]).toFixed(5);
            retObj.edge = dati["key"];
            retObj.node2 = parseFloat(dati["score2"]).toFixed(5);
            ret.push(retObj);
          }
        }
      }

      vueApp.simbim_object = ret;
      vueApp.bim_objects = vueApp.simbim_object;
      vueApp.busy_right_node = false;
//      vueApp.busy_right_edge = false;
    })
    .catch((error) => {
      console.error(error);
    });
}

function getSimBimsNodes_io() {
  vueApp.busy_right_node = true;
  let retArray = [];
  let data = {};
  data["word1"] = vueApp.target_word;
  data["word2"] = vueApp.active_node.target_text;
  data["time_id"] = vueApp.active_node.time_ids[0];
  vueApp.node_time_id = vueApp.active_node.time_ids[0];

  let url = "./api/collections/" + vueApp.collection_key + "/simbim";
  // console.log(url);
  axios
    .post(url, data)
    .then((res) => {
      let ret = [];
      if (res.data["error"] == "none") {
        for (let key in res.data) {
          if (key != "error") {
            let dati = res.data[key];
            let retObj = {};
            retObj.node1 = parseFloat(dati["score"]).toFixed(5);
            retObj.edge = dati["key"];
            retObj.node2 = parseFloat(dati["score2"]).toFixed(5);
            ret.push(retObj);
          }
        }
      }

      vueApp.simbim_node_object = ret;
      vueApp.bim_objects = vueApp.simbim_node_object;
      vueApp.busy_right_node = false;
    })
    .catch((error) => {
      console.error(error);
    });
}

function get_cluster_information_axios(cluster) {
  // console.log("in get cluster information", cluster);
  let jsonReq = {
    nodes: [],
    collection: vueApp.collection_key,
  };
  // node dic
  // needs node map
  let node_dic = {};
  for (let node of graph.nodes) {
    node_dic[node.id] = node;
  }
  // needs link map

  // required: label + single time-id
  // the function queries the features whcih are stored
  // per node per time-id
  // get time-ids for nodes from global
  // needs to choose a time id from all edges
  cluster.cluster_nodes.forEach(function (nodeid) {
    // all time ids
    node_dic[nodeid]["time_ids"].forEach(function (timeid) {
      jsonReq["nodes"].push({
        label: nodeid,
        time_id: timeid,
      });
    });
  });
  // console.log(jsonReq);
  // add filter info for cluster
  jsonReq["props"] = graph.props;

  /* if (jsonReq["nodes"].length > vueApp.cluster_search_limit) {
    alert(
      "You clicked on cluster-context information. " +
        "Currently, you can only query clusters with " +
        vueApp.cluster_search_limit +
        " or less nodes. " +
        "Reason: cluster information is extracted from over 1 billion features which takes long for mysql."
    );
  } else { */
  // console.log("cluster info continue with less than six");
  vueApp.busy_right_cluster = true;
  vueApp.showSidebar_cluster = true;
  vueApp.showSidebar_docs = false;
  let url = "./api/cluster_information";
  axios
    .post(url, jsonReq)
    .then((res) => {
      // console.log(res.data);
      let ret = [];
      for (let key in res.data) {
        let retObj = {};
        retObj.wort = key;
        retObj.score = parseFloat(res.data[key]).toFixed(5);
        ret.push(retObj);
      }
      vueApp.cluster_shared_object = ret;
      //console.log(this.cluster_shared_object)
      vueApp.busy_right_cluster = false;
    })
    .catch((error) => {
      console.error(error);
    });
  //}
  return "ok";
}

// Example sentences
function docSearch_io(wort1, wort2) {
  if (!vueApp.is_ES_available){
    alert("Example Docs are not available for this collection...")
    return;
  }
  vueApp.showSidebar_docs = true;
  vueApp.busy_right_docs = true;
  vueApp.docs_loaded = false;
  let data = {};
  data["jo"] = wort1;
  data["bim"] = wort2;
  data["collection_key"] = vueApp.collection_key;
  data["time_slices"] = graph.props.selected_time_ids.map(vueApp.time_id_text);
//  console.log("selected", data["jo"], data["bim"]);
  let url = "./api/collections/" + vueApp.collection_key + "/documents";
//  console.log(url);
  axios.post(url, data).then((res) => {
//    console.log(res);
    vueApp.documents = res.data["docs"];
//    console.log(vueApp.documents);
    vueApp.busy_right_docs = false;
    vueApp.docs_loaded = true;
  }); // end then
}

/**
 * LOAD AND SAVE GRAPH TO JSON --------------------------------------------------------------------------------------
 */

function saveGraph_io() {
  // harmonize all cluster colors

  let data = JSON.stringify(graph, null, 2);
  let blob = new Blob([data], { type: "text/plain" });
  console.log(blob);

  const a = document.createElement("a");
  document.body.appendChild(a);
  const url = window.URL.createObjectURL(blob);
  console.log(url)
  a.href = url;
  a.download = vueApp.collection_name + '--'+
    graph.props.target_word +
    "_" +
    graph.props.n_nodes +
    "_" +
    graph.props.density +
    "_" +
    graph.props.graph_type +
    '_' +
    graph.props.start_year + "_" + graph.props.end_year +
    ".json";
  a.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 0);
}

function loadGraph_io() {
  const reader = new FileReader();

  reader.onload = function (e) {
    let data_from_db;
    data_from_db = JSON.parse(reader.result);
    console.log("in parsed with", data_from_db);
    vueApp.loadNew(data_from_db);
  };
  reader.readAsText(vueApp.file);
}

function saveGraphSVG_io() {
        const filename = vueApp.collection_name + '--'+
        graph.props.target_word +
        "_" +
        graph.props.n_nodes +
        "_" +
        graph.props.density +
        "_" +
        graph.props.graph_type +
        "_" +
        graph.props.start_year + "_" + graph.props.end_year
        ;
//        svgExport.downloadSvg(document.querySelector("#svg"),
//                              filename,
//                              {
//                                width: svg_width,
//                                height: svg_height,
//                                scale: 0.95,
//                              }
//                              );

         saveSvg(document.querySelector("#svg"), filename + ".svg",
            {
              left: viewbox_pan_horizontal,
              top: viewbox_pan_vertical,
              height: svg_height,
              width: svg_width,
              scale: 0.95,
              excludeCss: false
            });

}

function saveGraphPNG_io() {
        const filename = vueApp.collection_name + '--'+
        graph.props.target_word +
        "_" +
        graph.props.n_nodes +
        "_" +
        graph.props.density +
        "_" +
        graph.props.graph_type +
        "_" +
        graph.props.start_year + "_" + graph.props.end_year
        ;

//        svgExport.downloadPng(document.querySelector("#svg"),
//                              filename,
//                              {
//                                width: svg_width,
//                                height: svg_height,
//                                scale: 5,
//                                transparentBackgroundReplace: 'white',
//                                transparent: false,
//                              }
//                              );

        saveSvgAsPng(document.querySelector("#svg"), filename + ".png",
            {
              left: viewbox_pan_horizontal,
              top: viewbox_pan_vertical,
              height: svg_height,
              width: svg_width,
              scale: 5,
              backgroundColor: 'White'
            });

}

function saveDocs_io(jo, bim) {

  if (!vueApp.is_ES_available){
    alert("Example Docs are not available for this collection...")
    return;
  }

  let data = {};
  let json_docs = []
  data["jo"] = jo;
  data["bim"] = bim;
  data["collection_key"] = vueApp.collection_key;
  data["time_slices"] = graph.props.selected_time_ids.map(vueApp.time_id_text);
//  console.log("selected", data["jo"], data["bim"]);
  let url = "./api/collections/" + vueApp.collection_key + "/documents_scroll";
//  console.log(url);
  axios.post(url, data).then((res) => {
    console.log(res);
    json_docs = res.data["json_docs"];
    data2 = JSON.stringify(json_docs, null, 2)
    console.log(json_docs.length);
    let blob = new Blob([json_docs], { type: "text/csv" });
//    console.log(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    const url2 = window.URL.createObjectURL(blob);
    a.href = url2;
    a.download = vueApp.bim_fields[0]["label"] + '_' + bim + '_' + vueApp.bim_fields[2]["label"]
    + '_'
    + graph.props.start_year + "_" + graph.props.end_year
    + ".tsv";

    a.click();
    setTimeout(() => {
    window.URL.revokeObjectURL(url2);
    document.body.removeChild(a);
    }, 0);

  }); // end then

}

async function wordFeatureCounts_io(word1, word2, feature) {
//  vueApp.busy_right_node = true;
  let retArray = [];
  let data = {};
  data["word1"] = word1;
  data["word2"] = word2;
  data["feature"] = feature;

  let url = "./api/collections/" + vueApp.collection_key + "/wordfeaturecounts";
  try
  {
      let res = await axios.post(url, data);
      res_data = res.data;
      jobim_counts = {}
      for (key in res_data){
           jobim_counts[key] = {'time_ids': Object.keys(res_data[key]),
                        'counts': Object.values(res_data[key])}
                        ;
      }
      vueApp.jobim_counts = jobim_counts

  }
    catch(error){
      console.error(error);
    }
}

