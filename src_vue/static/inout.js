// data is gathered from these fields (see above methods)
// JO = WORT1
// EDGE - WORT1
// data["word1"] = this.active_edge.source_text
// data["word2"] = this.active_edge.target_text
// NODE - WORT1
// data["word1"] = this.active_node.source_text
// data["word2"] = this.active_node.target_text
// data["time_id"] = this.active_edge.time_ids[0]
// BIM = WORT2
function docSearch_io(wort1, wort2) {
  app.context_mode4 = true;
  app.busy_right4 = true;
  let data = {};
  data["jo"] = wort1;
  data["bim"] = wort2;
  data["collection_key"] = app.collection_key;

  console.log("selected", data["jo"], data["bim"]);
  let url = "./api/collections/" + app.collection_key + "/documents";
  console.log(url);
  axios.post(url, data).then((res) => {
    console.log(res);
    app.documents = res.data["docs"];
    console.log(app.documents);
    app.busy_right4 = false;
  }); // end then
}

function update_io() {
  console.log("called update");
  let target_word = app.target_word;
  let start_year = app.start_year;
  let end_year = app.end_year;
  let senses = app.update_senses;
  let edges = app.update_edges;
  let time_diff = app.time_diff;

  app.time_diff = false;
  let url =
    "./api/collections/" +
    this.collection_key +
    "/sense_graph" +
    "/" +
    target_word +
    "/" +
    start_year +
    "/" +
    end_year +
    "/" +
    senses +
    "/" +
    edges;

  return axios
    .get(url)
    .then((res) => {
      let data_from_db = res.data;
      app.updated_nodes = data_from_db[0].nodes;

      app.updated_links = data_from_db[0].links;

      app.singletons = data_from_db[2].singletons;
    })
    .catch((error) => {
      console.error(error);
    });
}

function getSimBims_io() {
  app.busy_right1 = true;
  let retArray = [];
  let data = {};
  data["word1"] = app.active_edge.source_text;
  data["word2"] = app.active_edge.target_text;
  data["time_id"] = app.active_edge.time_ids[0];

  let url = "./api/collections/" + app.collection_key + "/simbim";
  console.log(url);
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

      app.simbim_object = ret;
      app.busy_right1 = false;
    })
    .catch((error) => {
      console.error(error);
    });
}

function getData_io() {
  let data = {};
  data["target_word"] = app.target_word;
  data["start_year"] = app.start_year;
  data["end_year"] = app.end_year;
  data["senses"] = app.senses;
  data["edges"] = app.edges;
  data["time_diff"] = app.time_diff;
  data["graph_type"] = app.graph_type_keys[app.graph_type];

  app.start_years.forEach(function (d, i) {
    if (d.value === app.start_year) {
      app.min_time_id = i + 1;
    }
  });

  app.end_years.forEach(function (d, i) {
    if (d.value === app.end_year) {
      app.max_time_id = i + 1;
    }
  });

  const url = "./api/collections/" + app.collection_key + "/sense_graph";

  axios
    .post(url, data)
    .then((res) => {
      // local vars needed here because of async callbacks??
      let data_from_db = res.data;
      let nodes = data_from_db[0].nodes;
      console.log("in data get nodes", nodes);
      let links = data_from_db[0].links;
      let target = [data_from_db[1]];
      console.log(target, app.target_word);
      app.singletons = data_from_db[2].singletons;
      console.log("in data get singletons", app.singletons);
      // Call D3 function to render graph - registered in global object - not nice
      render_graph(nodes, links, target);
      // no local vars needed from here on
      app.graph_rendered = true;
      app.overlay_main = false;
      app.wait_rendering = false;
      console.log("in get data:var wait rendering ", app.wait_rendering);
      // Update cluster information
      app.get_clusters();
    })
    .catch((error) => {
      console.log(error);
      if (error.response.status >= 500) {
        alert(error + "\nPlease try a different target word.");
      }
    });
}

function saveGraph_io() {
  let svg = d3.select("#svg");

  let links = svg.selectAll(".link");
  let nodes = svg.selectAll(".node");

  let graph_links = [];
  let graph_nodes = [];

  links.selectAll("line").each(function (d, i) {
    let source = this.getAttribute("source");
    let target = this.getAttribute("target");
    let weight = this.getAttribute("weight");
    let colour = this.getAttribute("stroke");
    let link = {};

    link["source"] = source;
    link["target"] = target;
    link["weight"] = weight;
    link["colour"] = colour;

    graph_links.push(link);
  });

  nodes.selectAll("g").each(function (d, i) {
    let x = this.__data__.x;
    let y = this.__data__.y;
    let fx = this.__data__.fx;
    let fy = this.__data__.fy;
    let id = this.__data__.id;
    let cluster_id;
    let cluster_name;
    let is_cluster_node;
    let colour;
    let time_ids;
    let centrality_score;

    let node = {};

    node["id"] = id;
    node["x"] = x;
    node["y"] = y;
    node["fx"] = fx;
    node["fy"] = fy;

    let childnodes = this.childNodes;
    childnodes.forEach(function (d, i) {
      if (d.tagName === "circle") {
        cluster_id = d.getAttribute("cluster_id");
        cluster_name = d.getAttribute("cluster");
        is_cluster_node = d.getAttribute("cluster_node");
        colour = d.getAttribute("fill");
        time_ids = d.getAttribute("time_ids");

        node["class"] = cluster_id;
        node["cluster_name"] = cluster_name;
        node["cluster_node"] = is_cluster_node;
        node["colour"] = colour;
        node["time_ids"] = time_ids;

        if (is_cluster_node === "false") {
          centrality_score = d.getAttribute("centrality_score");
          node["centrality_score"] = centrality_score;
        }
      }
    });

    graph_nodes.push(node);
  });

  let graph = {};
  graph["links"] = graph_links;
  graph["nodes"] = graph_nodes;
  graph["singletons"] = app.singletons;
  graph["target"] = app.target_word;
  graph["link_distance"] = app.linkdistance;
  graph["charge"] = app.charge;
  graph["start_year"] = app.start_year;
  graph["end_year"] = app.end_year;
  graph["time_diff"] = app.time_diff;
  graph["senses"] = app.senses;
  graph["edges"] = app.edges;

  let data = JSON.stringify(graph, null, 2);
  let blob = new Blob([data], { type: "text/plain" });

  const a = document.createElement("a");
  document.body.appendChild(a);
  const url = window.URL.createObjectURL(blob);
  a.href = url;

  if (app.updated_nodes === null && app.updated_links === null) {
    a.download = app.target_word + "_" + app.senses + "_" + app.edges + ".json";
  } else {
    a.download =
      app.target_word +
      "_" +
      app.update_senses +
      "_" +
      app.update_edges +
      ".json";
  }

  // TODO What happens if nodes / clusters are deleted?

  //a.download = app.target_word + "_" + graph_nodes.length + "_" + graph_links.length + ".json"

  a.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 0);
}

function loadGraph_io() {
  document.getElementById("loadpopup").style.display = "none";
  app.overlay_main = true;
  const file = this.file;
  const reader = new FileReader();
  console.log("in load graph");
  reader.onload = function (e) {
    this.read_graph = JSON.parse(reader.result);
    if (this.read_graph.singletons) {
      app.singletons = this.read_graph.singletons;
    } else {
      app.singletons = [];
    }

    let nodes = this.read_graph.nodes;
    let links = this.read_graph.links;
    let target = this.read_graph.target;
    app.target_word = target;
    app.charge = this.read_graph.charge;
    app.linkdistance = this.read_graph.link_distance;
    app.start_year = this.read_graph.start_year;
    app.end_year = this.read_graph.end_year;
    app.time_diff = this.read_graph.time_diff;
    app.senses = this.read_graph.senses;
    app.edges = this.read_graph.edges;

    app.start_years.forEach(function (d, i) {
      if (d.value === app.start_year) {
        app.min_time_id = i + 1;
      }
    });

    app.end_years.forEach(function (d, i) {
      if (d.value === app.end_year) {
        app.max_time_id = i + 1;
      }
    });
    //Call the D3 function to render the graph
    render_graph(nodes, links, target, app.time_diff);
  };
  reader.readAsText(file);

  app.graph_rendered = true;
  app.overlay_main = false;
}
