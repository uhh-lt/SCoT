/*
Renders the graph on the svg element
Paramams necessary due to callback - async??
@param array of objects graph_nodes
@param array of objects graph_links
@param object target: the target word
*/
// global vars
let svg;
let brush;
let drag_node;
let time_diff_tip;
let time_diff_tip_link;
let shiftKey;
let sticky;

const render_graph = function (graph_nodes, graph_links, target) {
  // DEFINE VARS #########################
  // Set initial parameters for ease of use
  let radius = app.radius;
  sticky = app.sticky_mode;
  // init app vars here due to callback async (data may be here first...)
  app.nodes = graph_nodes;
  app.links = graph_links;
  // Choose a predefined colour scheme
  let color = d3.scaleOrdinal(d3.schemePaired);

  // Always remove the svg element. Otherwise a new one is appended every time you click the render button
  d3.select("#graph2").select("svg").remove();
  console.log(app.viewport_width, app.viewport_height);

  // SET SVG #############################################
  // Create the svg element on which you want to render the graph
  svg = d3
    .select("#graph2")
    .on("keydown.brush", keydowned)
    .on("keyup.brush", keyupped)
    .each(function () {
      this.focus();
    })
    .append("svg")
    .attr("id", "svg")
    .attr("width", app.svg_width)
    .attr("height", app.svg_height)
    .attr("viewBox", " 0 0 " + app.viewport_width + " " + app.viewport_height)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .classed("svg-content", true)
    .call(
      d3.zoom().on("zoom", function () {
        svg.attr("transform", d3.event.transform);
      })
    )
    .append("g");

  // append the brush to the svg for dragging multiple nodes at the same time
  brush = svg.append("g").attr("class", "brush");

  // initialize the class attributes selected and previouslySelected for each node
  app.nodes.forEach(function (d) {
    d.selected = false;
    d.previouslySelected = false;
  });

  // append the target word to the center of the svg
  var t = svg.append("g").data(target);

  t.append("text")
    .attr("class", "target")
    .attr("x", app.viewport_width / 3)
    .attr("y", app.viewport_height / 3)
    .style("font-family", "helvetica, arial, sans-serif")
    .style("font-size", "25px")
    .style("font-weight", "bold")
    .style("opacity", 0.2)
    .text(function (d) {
      return d.target_word;
    });

  // create the force simulation
  app.simulation = d3
    .forceSimulation(app.nodes)
    .force(
      "link",
      d3
        .forceLink(app.links)
        .id(function (d) {
          return d.id;
        })
        .distance(function (d) {
          return app.linkdistance;
        })
    )
    .force(
      "charge",
      d3.forceManyBody().strength(app.charge).distanceMin(1).distanceMax(2000)
    )
    .force("collide", d3.forceCollide().radius(10))
    .force(
      "center",
      d3.forceCenter(app.viewport_width / 3, app.viewport_height / 3)
    )
    .on("tick", ticked);

  //var forceLinkDistance = app.simulation.force("link");

  // initialize drag behaviour
  drag_node = d3.drag();

  // initialize the tooltip for nodes
  time_diff_tip = d3
    .tip()
    .attr("class", "d3-tip")
    .html(function (d) {
      return app.toolTipNode(d.time_ids, d.target_text, d.weights);
    });

  // initialize the tooltip for edges
  time_diff_tip_link = d3
    .tip()
    .attr("class", "d3-tip")
    .html(function (d) {
      return app.toolTipLink(
        d.time_ids,
        d.weights,
        d.target_text,
        d.source_text
      );
    });

  // call the time diff tooltip from the svg
  svg.call(time_diff_tip);
  svg.call(time_diff_tip_link);

  // create the nodes
  app.node = svg
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .attr("class", "node")
    .selectAll("g")
    .data(app.nodes)
    .enter()
    .append("g")
    .on("mousedown", mousedowned)
    .call(drag_node)
    .on("mouseover", app.mouseOver(0.2))
    .on("mouseout", app.mouseOut)
    .on("click", function (d) {
      if (this.getAttribute("class") === "selected") {
        app.node_selected = true;
      } else {
        app.node_selected = false;
      }
      console.log(d.target_text);
      console.log(d.time_ids);
      app.active_node = {
        time_ids: d.time_ids,
        weights: d.weights,
        source_text: app.target_word,
        target_text: d.target_text,
      };
      app.getSimBimsNodes();
      console.log("in nodeclick ", app.active_node);
      // set fields
      app.fields_nodes[0]["label"] = app.target_word;
      app.fields_nodes[2]["label"] = d.target_text;
      // switch on view
      app.context_mode3 = true;
      app.context_mode = false;
      console.log(app.context_mode3);
      app.select_node_is_no_cluster_node = app.is_normal_node();
      showContextMenu(this);
    });

  // append circles to the node
  // this is the way the nodes are displayed in the graph
  app.circles = app.node
    .append("circle")
    .attr("r", function (d) {
      if (d.cluster_node === "true") {
        // if the node is a cluster node make it twice as big
        return radius * 2;
      } else {
        // experimental - nodes bigger according to similarity
        // console.log(d.target_text, Math.max(...d.weights))
        // if (isNaN(Math.max(...d.weights))){
        // 	return radius
        // } else if(Math.max(...d.weights)<=1){
        // 	return radius * (Math.max(...d.weights)*5+1);
        // } else {
        // 	return radius
        // }
        return radius;
      }
    })
    .attr("centrality_score", function (d) {
      if (!d.centrality_score.isNaN) {
        return d.centrality_score;
      } else {
        return null;
      }
    })
    .attr("cluster", function (d) {
      if (d.cluster_name) {
        return d.cluster_name;
      } else {
        return d.class;
      }
    })
    .attr("cluster_id", function (d) {
      return d.class;
    })
    .attr("cluster_node", function (d) {
      // check if the node is a cluster node and make that information known for later
      return Boolean(d.cluster_node);
    })
    .attr("time_ids", function (d) {
      return d.time_ids;
    })
    .attr("target_text", function (d) {
      return d.target_text;
    })
    .attr("fill", function (d) {
      if (d.colour) {
        // if the nodes has an explicit colour use that
        return d.colour;
      } else {
        // otherwise look the colour up for the class of the node
        return color(d.class);
      }
    })
    .on("mouseover", time_diff_tip.show)
    .on("mouseout", time_diff_tip.hide);

  // append a label to the node which displays its id
  let labels = app.node
    .append("text")
    .text(function (d) {
      return d.id;
    })
    .style("fill", "black")
    .style("stroke", "black")
    .attr("x", 6)
    .attr("y", 3)
    .attr("text", function (d) {
      return d.id;
    });

  // create the graph links
  app.link = svg
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", app.base_link_opacity)
    .attr("class", "link")
    .selectAll("line")
    .data(app.links)
    .enter()
    .append("line")
    .attr("source", function (d) {
      return d.source.id;
    })
    .attr("target", function (d) {
      return d.target.id;
    })
    .attr("source_text", function (d) {
      return d.source_text;
    })
    .attr("target_text", function (d) {
      return d.target_text;
    })
    .attr("weight", function (d) {
      return d.weight;
    })
    .attr("weights", function (d) {
      return d.weight;
    })
    .attr("time_ids", function (d) {
      return d.time_ids;
    })
    // set the stroke with in dependence to the weight attribute of the link
    // TODO: sort the weights into three categories and only use three different thicknesses for links according to the category
    .attr("stroke-width", function (d) {
      if (app.link_thickness_scaled === "true") {
        return Math.sqrt(d.weight / app.link_thickness_factor);
      } else {
        return Math.sqrt(app.link_thickness_value);
      }
    })
    .attr("stroke", function (d) {
      if (d.colour !== undefined) {
        return d.colour;
      } else if (d.source.class === d.target.class) {
        return color(d.source.class);
      } else {
        return "#999";
      }
    })
    .on("click", function (d) {
      app.active_edge = {
        time_ids: d.time_ids,
        weights: d.weights,
        source_text: d.source_text,
        target_text: d.target_text,
      };
      app.getSimBims();
      // set label
      app.fields_edges[0]["label"] = d.source_text;
      app.fields_edges[2]["label"] = d.target_text;

      // switch on context mode edges, switch off context mode
      app.context_mode = true;
      app.context_mode3 = false;
    })
    .on("mouseover", time_diff_tip_link.show)
    .on("mouseout", time_diff_tip_link.hide);

  app.simulation.on("tick", ticked);

  // update the cluster information in the Vue data variable after initializing the graph
  app.get_clusters();

  // release all pinned nodes and restart the simulation
  d3.select("#restart_button").on("click", function () {
    app.node.each(function (d) {
      //console.log(d)
      d.fx = null;
      d.fy = null;
    });
    app.simulation.alphaTarget(0);
  });

  // ################ EVENT LISTENERS D3 ####################
  // executed once at beginning of graph-rendering

  // Add cluster nodes when clicking on the apply button in the edit column
  // sets event listeners
  d3.select("#apply_settings_button").on("click", function () {
    console.log(
      "++++++++++++in graph apply settings button +++++++++++++++++++++"
    );
    for (let i = 0; i < app.clusters.length; i++) {
      let cluster_name = app.clusters[i].cluster_name;
      let add_cluster_node = app.clusters[i].add_cluster_node;
      let cluster_colour = app.clusters[i].colour;
      let cluster_id = app.clusters[i].cluster_id;
      let labels = app.clusters[i].labels;

      console.log(
        "d3 apply settings cluster loop",
        i,
        "with cluster",
        cluster_name
      );

      let text_labels = [];
      //let cluster_nodes = []

      for (let j = 0; j < labels.length; j++) {
        text_labels.push(labels[j]["text"]);
        //cluster_nodes.push(labels[j]["cluster_node"]);
      }

      let values = cluster_node_exists(cluster_id);
      let exists = values[0];
      let currentname = values[1];

      console.log(
        "d3 cluster_node CRUD decision values",
        exists,
        add_cluster_node,
        currentname
      );

      // CREATE
      if (add_cluster_node === "true" && !exists) {
        addclusternode(cluster_name, cluster_colour, cluster_id);
        for (let k = 0; k < text_labels.length; k++) {
          addlink(text_labels[k], cluster_name);
        }
        console.log("d3 cluster_node CREATE");
      }

      // UPDATE
      if (currentname != cluster_name && currentname != "%%") {
        console.log("d3 click cluster node apply step 5 we should change name");
        app.deletenode(currentname);
        app.deletelinks(currentname);
        addclusternode(cluster_name, cluster_colour, cluster_id);
        for (let k = 0; k < text_labels.length; k++) {
          addlink(text_labels[k], cluster_name);
        }
        console.log("d3 cluster_node UPDATE");
      }

      // DELETE
      if (exists && add_cluster_node == "false") {
        console.log("d3 click cluster node apply step 4 we should delete");
        app.deletenode(currentname);
        app.deletelinks(currentname);
        console.log("d3 cluster_node DELETE");
      }
    }
    //restart the simulation with the additional nodes and links
    restart();
  });

  // Switch between time diff and sense clustering mode
  d3.select("#select_time_diff").on("change", function (d) {
    // sense clustering
    if (app.time_diff === false) {
      app.reset_time_diff_colours();
      console.log("time diff change triggered render sense graph");
    }
    if (app.time_diff === true) {
      d3.select("#skip_through_button").on("click", function (d) {
        if (this.getAttribute("aria-expanded") === "true") {
          app.node.on("mouseover", null);
          app.node.on("mouseout", null);
        } else {
          app.node.on("mouseover", app.mouseOver(0.2));
          app.node.on("mouseout", app.mouseOut);
        }
      });
    }
  });

  // add new nodes and edges to the graph when the user updated the number of nodes and edges
  d3.select("#update_button").on("click", async function () {
    app.update().then((res) => {
      var existing_labels = [];
      var new_labels = [];
      for (var j = 0; j < app.clusters.length; j++) {
        var cluster = app.clusters[j];

        for (var k = 0; k < cluster.labels.length; k++) {
          existing_labels.push(cluster.labels[k].text);
        }
      }

      for (var i = 0; i < app.updated_nodes.length; i++) {
        var new_label = app.updated_nodes[i].id;
        new_labels.push(new_label);

        var cluster_class = app.updated_nodes[i].class;
        var centr_score = app.updated_nodes[i].centrality_score;

        if (!existing_labels.includes(new_label)) {
          // add new nodes to the nodes array
          app.nodes.push({
            id: app.updated_nodes[i].id,
            class: app.updated_nodes[i].class,
            time_ids: app.updated_nodes[i].time_ids,
            centrality_score: app.updated_nodes[i].centrality_score,
          });
        } else {
          // update existing ones (colour, cluster id and cluster name)
          var existing_nodes = d3.selectAll(".node");
          existing_nodes.selectAll("g").each(function (d, i) {
            var label;
            var childnodes = this.childNodes;

            childnodes.forEach(function (d, i) {
              if (d.tagName === "text") {
                label = d.getAttribute("text");
              }
            });

            if (new_label === label) {
              childnodes.forEach(function (d, i) {
                if (d.tagName === "circle") {
                  var colour = get_colour(cluster_class);

                  d.setAttribute("centrality_score", centr_score);
                  d.setAttribute("cluster_id", cluster_class);
                  d.setAttribute("fill", colour);
                  d.setAttribute("cluster", cluster_class);
                }
              });
            }
          });
        }
      }

      // downscale graph
      for (var i = 0; i < existing_labels.length; i++) {
        if (!new_labels.includes(existing_labels[i])) {
          //console.log(existing_labels[i])
          app.deletelinks(existing_labels[i]);
          app.deletenode(existing_labels[i]);
        }
      }

      app.nodes.forEach(function (d) {
        d.selected = false;
        d.previouslySelected = false;
      });

      // update the links too
      for (var i = 0; i < app.updated_links.length; i++) {
        var source = app.updated_links[i].source;
        var target = app.updated_links[i].target;
        var found = false;

        for (var j = 0; j < app.links.length; j++) {
          if (
            app.links[j].source.id === source &&
            app.links[j].target.id === target
          ) {
            found = true;
          }
        }
        if (found === false) {
          app.links.push(app.updated_links[i]);
        }
      }
      update_graph();
      app.get_clusters();
    });
  });
};

// functions ############################################################################
// check if a cluster node exists for a specific cluster
// return exists and current name
function cluster_node_exists(cluster_id) {
  let nodes = d3.selectAll(".node");
  let exists = false;
  let name = "%%";
  let id = null;
  //console.log("in exists")

  nodes.selectAll("g").each(function (d) {
    let childnodes = this.childNodes;

    childnodes.forEach(function (d, i) {
      //console.log("childnode function", name, exists, d)

      if (d.tagName === "circle") {
        let is_cluster_node = d.getAttribute("cluster_node");
        id = d.getAttribute("cluster_id");

        if (is_cluster_node === "true" && id === cluster_id) {
          exists = true;
          console.log("true", d);
        }
      }
      if (exists && d.tagName === "text" && id === cluster_id) {
        name = d.getAttribute("text");
        console.log("text", d.getAttribute("text"));
      }
    });
  });
  return [exists, name];
}

// Add or remove cluster nodes and edges to the graph and restart the simulation
// This function is for adding cluster nodes
function restart() {
  // Apply the general update pattern to the nodes.
  let node = app.node.data(app.nodes, function (d) {
    return d.id;
  });
  node.exit().remove();

  let g = node
    .enter()
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .attr("class", "node")
    .on("mousedown", mousedowned)
    .call(drag_node)
    .on("mouseover", app.mouseOver(0.2))
    .on("mouseout", app.mouseOut)
    .on("click", function (d) {
      if (d.selected) {
        app.node_selected = true;
      } else {
        app.node_selected = false;
      }
      app.select_node_is_no_cluster_node = app.is_normal_node();
      showContextMenu(this);
    });

  let circle = g
    .append("circle")
    .attr("fill", function (d) {
      return d.colour;
    })
    //.attr("fill-opacity", 0.5)
    .attr("r", 10)
    .attr("cluster_id", function (d) {
      return d.cluster_id;
    })
    .attr("cluster_node", true);

  let text = g
    .append("text")
    .text(function (d) {
      return d.id;
    })
    .style("fill", "black")
    .style("stroke", "black")
    .attr("x", 6)
    .attr("y", 3)
    .attr("text", function (d) {
      return d.id;
    });

  app.node = node.merge(g);

  // Apply the general update pattern to the links.
  let link = app.link.data(app.links, function (d) {
    return d.source.id + "-" + d.target.id;
  });
  link.exit().remove();
  app.link = link
    .enter()
    .append("line")
    //.attr("class", "link")
    .attr("weight", 10)
    .attr("source", function (d) {
      return d.source;
    })
    .attr("target", function (d) {
      return d.target;
    })
    //.style("stroke-width", 5)
    .attr("stroke", "#eee")
    .merge(link);

  // Update and restart the app.simulation.
  app.simulation.nodes(app.nodes);
  app.simulation.force("link").links(app.links);
  ticked();
  app.simulation.alpha(1).restart();

  // update the object with connected nodes
  app.calc_linkedByIndex();
}

function addlink(source, target) {
  if (source !== undefined && target !== undefined) {
    app.links.push({ source: source, target: target });
    restart();
  }
}

function addclusternode(name, colour, cluster_id) {
  app.nodes.push({ id: name, colour: colour, cluster_id: cluster_id });
  restart();
}

// On backspace anywhere in the html body delete cluster node
function deleteClusterNode() {
  let selected_nodes = d3.selectAll(".node").selectAll("g");
  selected_nodes.each(function (d) {
    if (d.selected) {
      var childnodes = this.childNodes;
      var is_cluster_node;
      var node_name;
      //var cluster_id;
      childnodes.forEach(function (d, i) {
        if (d.tagName === "circle") {
          is_cluster_node = d.getAttribute("cluster_node");
          //cluster_id = d.getAttribute("cluster_id");
        }
        if (d.tagName === "text") {
          node_name = d.getAttribute("text");
        }
      });

      if (is_cluster_node === "true") {
        app.deletenode(node_name);
        app.deletelinks(node_name);
        restart();
      }
    }
  });
}

function get_colour(c) {
  return color(c);
}
// update the graph with the additional nodes and links
function update_graph() {
  // Apply the general update pattern to the nodes.
  let node = app.node.data(app.nodes, function (d) {
    return d.id;
  });
  node.exit().remove();

  let g = node
    .enter()
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .attr("class", "node")
    .on("mousedown", mousedowned)
    .call(drag_node)
    .on("mouseover", app.mouseOver(0.2))
    .on("mouseout", app.mouseOut)
    .on("click", function (d) {
      if (this.getAttribute("class") === "selected") {
        app.node_selected = true;
      } else {
        app.node_selected = false;
      }

      app.select_node_is_no_cluster_node = app.is_normal_node();
      //console.log(this)
      showContextMenu(this);
    });

  let circle = g
    .append("circle")
    .attr("fill", function (d) {
      return color(d.class);
    })
    .attr("r", 5)
    .attr("centrality_score", function (d) {
      return d.centrality_score;
    })
    .attr("cluster_id", function (d) {
      return d.class;
    })
    .attr("cluster_node", false)
    .attr("time_ids", function (d) {
      return d.time_ids;
    })
    .attr("cluster", function (d) {
      return d.class;
    })
    .on("mouseover", time_diff_tip.show)
    .on("mouseout", time_diff_tip.hide);

  d3.select("#select_time_diff").on("change", function (d) {
    if (app.time_diff === false) {
      circle.attr("fill", function (d) {
        return color(d.class);
      });
      circle.on("mouseover", null);
      circle.on("mouseout", null);
      app.circles.attr("fill", function (d) {
        return color(d.class);
      });
      app.circles.on("mouseover", null);
      app.circles.on("mouseout", null);
    }
    if (app.time_diff === true) {
      circle.on("mouseover", time_diff_tip.show);
      circle.on("mouseout", time_diff_tip.hide);
      app.circles.on("mouseover", time_diff_tip.show);
      app.circles.on("mouseout", time_diff_tip.hide);
    }
  });

  let text = g
    .append("text")
    .text(function (d) {
      return d.id;
    })
    .style("fill", "black")
    .style("stroke", "black")
    .attr("x", 6)
    .attr("y", 3)
    .attr("text", function (d) {
      return d.id;
    });

  app.node = node.merge(g);

  // Apply the general update pattern to the links.
  let link = app.link.data(app.links, function (d) {
    return d.source.id + "-" + d.target.id;
  });
  link.exit().remove();
  app.link = link
    .enter()
    .append("line")
    .attr("weight", function (d) {
      return d.weight;
    })
    .attr("source", function (d) {
      return d.source;
    })
    .attr("target", function (d) {
      return d.target;
    })
    .attr("stroke-width", function (d) {
      if (app.link_thickness_scaled === "true") {
        return Math.sqrt(d.weight / app.link_thickness_factor);
      } else {
        return Math.sqrt(app.link_thickness_value);
      }
    })
    .merge(link);

  // Update and restart the app.simulation.
  app.simulation.nodes(app.nodes);
  app.simulation.force("link").links(app.links);
  ticked();

  // colour the links
  let all_links = svg.selectAll("line");
  all_links.each(function () {
    // check if link is connected to cluster node
    var is_connected_to_cluster_node = false;
    var source = this.getAttribute("source");
    var target = this.getAttribute("target");
    var source_colour = app.findColour(source);
    var target_colour = app.findColour(target);
    console.log(source, source_colour, target, target_colour);

    is_connected_to_cluster_node = app.check_cluster_node_connection(source);
    if (is_connected_to_cluster_node === false) {
      is_connected_to_cluster_node = app.check_cluster_node_connection(target);
    }
    if (is_connected_to_cluster_node === false) {
      if (source_colour === target_colour) {
        this.setAttribute("stroke", source_colour);
      } else {
        this.setAttribute("stroke", "#999");
      }
    }
  });

  app.simulation.alpha(1).restart();

  // keep track of the connected nodes
  app.calc_linkedByIndex();
  // linkedByIndex = {};
  // app.links.forEach(function(d) {
  // 	linkedByIndex[d.source.id + "," + d.target.id] = 1;
  // });
}

function showContextMenu(d) {
  if (app.node_selected) {
    d3.select("#nodeOptionsDD").style("display", "block");

    d3.event.preventDefault();
  } else {
    d3.select("#nodeOptionsDD").style("display", "none");
  }
}

function sticky_change(sticky) {
  console.log("sticky_change triggered", sticky);

  if (sticky === "false") {
    brush.style("display", "inline");
    brush.call(
      d3
        .brush()
        .extent([
          [0, 0],
          [app.svg_width, app.svg_height],
        ])
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended)
    );

    drag_node
      .on("start", function () {
        d3.selectAll(".selected").each(dragstart);
      })
      .on("drag", function () {
        d3.selectAll(".selected").each(dragmove);
      })
      .on("end", function () {
        d3.selectAll(".selected").each(dragend);
      });
  } else if (sticky === "true") {
    // tidy up after brush and unselect all selected nodes
    brush.style("display", "none");

    app.node.classed("selected", function (d) {
      if (d.selected) {
        d.previouslySelected = false;
        d.selected = false;
        return d.selected;
      }
    });

    drag_node
      .on("start", function () {
        d3.selectAll(".selected").each(dragstart_sticky);
      })
      .on("drag", function () {
        d3.selectAll(".selected").each(dragmove_sticky);
      })
      .on("end", function () {
        d3.selectAll(".selected").each(dragend_sticky);
      });
  }
}
function brushstarted() {
  if (d3.event.sourceEvent.type !== "end") {
    app.node.classed("selected", function (d) {
      return (d.selected = d.previouslySelected = shiftKey && d.selected);
    });
  }
}

function brushed() {
  if (d3.event.sourceEvent.type !== "end") {
    var selection = d3.event.selection;

    app.node.classed("selected", function (d) {
      return (d.selected =
        d.previouslySelected ^
        (selection != null &&
          selection[0][0] <= d.x &&
          d.x < selection[1][0] &&
          selection[0][1] <= d.y &&
          d.y < selection[1][1]));
    });
  }
}

function brushended() {
  if (d3.event.selection != null) {
    d3.select(this).call(d3.event.target.move, null);
  }
}

function mousedowned(d) {
  /*
	if (shiftKey) {
		d3.select(this).classed("selected", d.selected = !d.selected);
		d3.event.stopImmediatePropagation();
	} else if (!d.selected) {
		node.classed("selected", function(p) { return p.selected = d === p;});
	}
	*/
  if (!d.selected) {
    app.node.classed("selected", function (p) {
      return (p.selected = d === p);
    });
  } else if (shiftKey && app.sticky_mode === "true") {
    d3.select(this).classed("selected", (d.selected = !d.selected));
    d3.event.stopImmediatePropagation();
  } else if (app.sticky_mode === "true") {
    d3.select(this).classed("selected", (d.selected = !d.selected));
    //d3.event.stopImmediatePropagation();
  }
}

// update node and link positions
function ticked() {
  app.node.attr("transform", positionNode);
  app.link
    .attr("x1", function (d) {
      return d.source.x;
    })
    .attr("y1", function (d) {
      return d.source.y;
    })
    .attr("x2", function (d) {
      return d.target.x;
    })
    .attr("y2", function (d) {
      return d.target.y;
    });
}

function positionNode(d) {
  // keep the node within the boundaries of the svg
  if (d.x < 0) {
    d.x = 0;
  }
  if (d.y < 0) {
    d.y = 0;
  }
  if (d.x > app.svg_width) {
    d.x = app.svg_width - 50;
  }
  if (d.y > app.svg_height) {
    d.y = app.svg_height - 50;
  }
  return "translate(" + d.x + "," + d.y + ")";
}

// update the connected nodes
// app.calc_linkedByIndex();

function dragstart(d) {
  app.simulation.stop();
}

function dragmove(d) {
  d.x += d3.event.dx;
  d.y += d3.event.dy;
  d.fx = d.x;
  d.fy = d.y;
  ticked();
}

function dragend(d) {
  ticked();
}

function dragstart_sticky(d) {
  if (!d3.event.active) {
    app.simulation.alphaTarget(0.3).restart();
  }
}

function dragmove_sticky(d) {
  d.x = d3.event.x;
  d.y = d3.event.y;
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragend_sticky(d) {
  if (!d3.event.active) {
    app.simulation.alphaTarget(0);
  }
  //d.fx = null;
  //d.fy = null;
}

function keydowned() {
  shiftKey = d3.event.shiftKey || d3.event.metaKey;
}

function keyupped() {
  shiftKey = d3.event.shiftKey || d3.event.metaKey;
}

function reset_zoom() {
  let container = d3.select("#svg");
  let zoom = d3
    .zoom()
    .scaleExtent([0.7, 8])
    .on("zoom", () => {
      container.attr("transform", d3.event.transform);
    });
  zoom.transform(container, d3.zoomIdentity.translate(0, 0).scale(1.0));
  svg.attr("transform", "translate(0, 0) scale(1.0)");
  console.log("in reset_zoom d3");
}

function charge_change_d3() {
  app.simulation.force(
    "charge",
    d3.forceManyBody().strength(app.charge).distanceMin(1).distanceMax(2000)
  );
  app.simulation.alpha(1).restart();
}

function restart_change_d3() {
  app.node.each(function (d) {
    //console.log(d)
    d.fx = null;
    d.fy = null;
  });
  app.simulation.alphaTarget(0);
  restart();
}

function linkdistance_change_d3() {
  console.log("linkdist change");
  let forceLinkDistance = app.simulation.force("link");
  forceLinkDistance.distance(app.linkdistance);
  app.simulation.alpha(1).restart();
}

function reset_time_diff_colours_d3() {
  app.circles.style("stroke-opacity", 1);
  app.link.style("stroke-opacity", this.base_link_opacity);

  let circleChilds = d3.selectAll(".node").selectAll("g").selectAll("circle");

  circleChilds.each(function (d) {
    let node_cluster_id = this.getAttribute("cluster_id");
    console.log("in reset color vue.js ", app.clusters);
    for (let i = 0; i < app.clusters.length; i++) {
      // set the colour of the nodes back to the cluster colours
      if (node_cluster_id === app.clusters[i].cluster_id) {
        this.setAttribute("fill", app.clusters[i].colour);
      }
    }
  });
  app.node.style("stroke-opacity", 1);
  app.node.style("fill-opacity", 1);
  // don't show time diff tooltip
  // TODO tooltip hier ausstellen
  app.circles.on("mouseover", null);
  app.circles.on("mouseout", null);
  app.node.on("mouseover", app.mouseOver(0.2));
  app.node.on("mouseout", app.mouseOut);
}

function delete_multiple_nodes_d3(labels) {
  // get all the text labels
  console.log(labels);

  // find the correct nodes and delete them and the links connecting to them
  let nodes = d3.selectAll(".node").selectAll("g");
  nodes.each(function (d) {
    let childnodes = this.childNodes;
    let node_id;

    childnodes.forEach(function (d, i) {
      if (d.tagName === "text") {
        node_id = d.getAttribute("text");
      }
    });

    // if they belong to the list, that is to be deleted, ...
    if (labels.includes(node_id)) {
      console.log("in node del", node_id);
      app.deletenode(node_id);
      app.deletelinks(node_id);
    }
  });

  // remove nodes from DOM with D3 and update the simulation
  app.node
    .data(app.nodes, function (d) {
      return d.id;
    })
    .exit()
    .remove();
  app.link
    .data(app.links, function (d) {
      return d.source.id + "-" + d.target.id;
    })
    .exit()
    .remove();

  app.simulation.nodes(app.nodes);
  app.simulation.force("link").links(app.links);
  app.simulation.alpha(1).restart();
}

function mouseOver_d3(opacity) {
  return function (d) {
    // check all other nodes to see if they're connected
    // to this one. if so, keep the opacity, otherwise
    // fade
    app.node.style("stroke-opacity", function (o) {
      let thisOpacity = app.isConnected(d, o) ? 1 : opacity;
      return thisOpacity;
    });
    app.node.style("fill-opacity", function (o) {
      let thisOpacity = app.isConnected(d, o) ? 1 : opacity;
      return thisOpacity;
    });
    // also style link accordingly
    app.link.style("stroke-opacity", function (o) {
      return o.source === d || o.target === d
        ? this.base_link_opacity
        : this.reduced_link_opacity;
    });
    //link.style("stroke", function(o){
    // TODO: how to get o.source.colour for graph rendered from db?
    // works for graph loaded from file
    //	return o.source === d || o.target === d ? o.source.colour : "#ddd";
    //});
  };
}

function mouseOut_d3() {
  app.node.style("stroke-opacity", 1);
  app.node.style("fill-opacity", 1);
  app.link.style("stroke-opacity", this.base_link_opacity);
  //link.style("stroke", "#ddd");
}

async function delete_cluster_d3(cluster_name, cluster_id, labels) {
  // get all the text labels
  let text_labels = [];
  for (var i = 0; i < labels.length; i++) {
    text_labels.push(labels[i].text);
  }

  // see how many nodes are in the cluster
  var number_of_nodes = text_labels.length;

  // find the correct nodes and delete them and the links connecting to them
  var nodes = d3.selectAll(".node").selectAll("g");
  nodes.each(function (d) {
    let childnodes = this.childNodes;
    var node_id;
    var id;

    childnodes.forEach(function (d, i) {
      if (d.tagName === "circle") {
        id = d.getAttribute("cluster_id");
      }
      if (d.tagName === "text") {
        node_id = d.getAttribute("text");
      }
    });

    // if they belong to the cluster, that is to be deleted, ...
    if (id === cluster_id) {
      app.deletenode(node_id);
      app.deletelinks(node_id);
    }
  });

  // remove nodes from DOM with D3 and update the simulation
  app.node
    .data(app.nodes, function (d) {
      return d.id;
    })
    .exit()
    .remove();
  app.link
    .data(app.links, function (d) {
      return d.source.id + "-" + d.target.id;
    })
    .exit()
    .remove();

  app.simulation.nodes(app.nodes);
  app.simulation.force("link").links(app.links);
  app.simulation.alpha(1).restart();

  // Update the number of updated senses for when saving the file the name will be correct
  if (app.updated_nodes != null) {
    app.update_senses = app.update_senses - number_of_nodes;
  }

  // update number of senses
  app.senses = app.senses - number_of_nodes;

  // recalculate the cluster information
  await app.get_clusters();
}

function delete_selected_nodes_d3() {
  app.findSelectedNodes();
  app.clicked_nodes.forEach(function (d) {
    app.deletenode(d.id);
    app.deletelinks(d.id);
  });
  // update DOM elements
  var node = app.node.data(app.nodes, function (d) {
    return d.id;
  });
  node.exit().remove();
  app.node = node.enter().append("g").merge(node);

  var link = app.link.data(app.links, function (d) {
    return d.source.id + "-" + d.target.id;
  });
  link.exit().remove();
  app.link = link.enter().append("line").merge(link);

  // update number of senses and updated senses
  app.senses = app.senses - 1;
  if (app.updated_nodes != null) {
    app.update_senses = app.update_senses - 1;
  }

  // update simulation
  app.simulation.nodes(app.nodes);
  app.simulation.force("link").links(app.links);

  app.simulation.alpha(1).restart();

  // recalculate the cluster information
  app.get_clusters();
}

function deletelinks_d3(node_id) {
  var allLinks = d3.select(".link").selectAll("line");

  allLinks.each(function (d) {
    if (
      this.getAttribute("target") === node_id ||
      this.getAttribute("source") === node_id
    ) {
      for (var i = 0; i < app.links.length; i++) {
        if (
          app.links[i].target.id === node_id ||
          app.links[i].source.id === node_id
        ) {
          app.links.splice(i, 1);
        }
      }
    }
  });
}

function check_cluster_node_connection_d3(link_endpoint) {
  let is_connected = false;
  let nodes = d3.selectAll(".node").selectAll("g");
  nodes.each(function () {
    let children = this.childNodes;
    children.forEach(function (d) {
      let is_cluster_node = d.getAttribute("cluster_node");
    });
    if (is_cluster_node === "true") {
      is_connected = true;
    }
  });
  return is_connected;
}

function update_general_settings_d3() {
  let svg = d3.select("svg");
  svg.attr("viewBox", "0 0 " + app.svg_height + " " + app.svg_width);
  let links = d3.selectAll(".link");
  links.each(function (d) {
    var children = this.childNodes;
    children.forEach(function (p) {
      var weight = p.getAttribute("weight");
      var thickness;
      if (app.link_thickness_scaled === "true") {
        thickness = Math.sqrt(weight / app.link_thickness_factor);
      } else {
        thickness = Math.sqrt(app.link_thickness_value);
      }
      p.setAttribute("stroke-width", thickness);
    });
  });
  app.simulation.alpha(0).restart();
}

function resetCentralityHighlighting_d3() {
  let circles = d3.selectAll(".node").selectAll("g").select("circle");
  let texts = d3.selectAll(".node").selectAll("g").select("text");

  circles.each(function (d, i) {
    if (this.getAttribute("centrality_score") != null) {
      this.setAttribute("r", 5);
      let text = d3.select(texts.nodes()[i]);
      text.style("font-size", "10px");
    }
  });
}

function highlightCentralNodes_d3(threshold_s, threshold_m) {
  if (app.highlightWobblies === true) {
    app.resetCentralityHighlighting();
    app.highlightWobblies = false;
  }
  app.hightlighInbetweennessCentrality = true;
  threshold_s = parseFloat(threshold_s);
  threshold_m = parseFloat(threshold_m);

  let nodes = d3.selectAll(".node").selectAll("g");
  let texts = d3.selectAll(".node").selectAll("g").select("text");

  nodes.each(function (d, i) {
    let children = this.childNodes;
    let text = d3.select(texts.nodes()[i]);

    children.forEach(function (d, i) {
      if (d.tagName == "circle") {
        if (d.getAttribute("centrality_score") != null) {
          let centrality_score = parseFloat(d.getAttribute("centrality_score"));
          // three different sizes depending on centrality score
          if (centrality_score <= threshold_s) {
            d.setAttribute("r", 2.5);
            text.style("font-size", "8px");
          } else if (
            centrality_score > threshold_s &&
            centrality_score <= threshold_m
          ) {
            d.setAttribute("r", 10.0);
            text.style("font-size", "14px");
          } else {
            d.setAttribute("r", 20.0);
            text.style("font-size", "20px");
          }
        }
      }
    });
  });
}

function unsearch_nodes_d3() {
  // undo highlighting
  let nodes = d3.selectAll(".node").selectAll("g");
  let links = d3.selectAll(".link");

  nodes.each(function (d) {
    let children = this.childNodes;
    this.setAttribute("stroke", null);

    children.forEach(function (d) {
      if (d.tagName === "text") {
        d.style.fill = "black";
        d.style.fontSize = "10px";
        d.style.opacity = 1;
      }
      if (d.tagName === "circle") {
        let r = d.getAttribute("r");
        d.style.opacity = 1;
        if (r > 5) {
          let new_r = r / 2;
          d.setAttribute("r", new_r);
        }
      }
    });
  });

  links.each(function (d) {
    let children = this.childNodes;
    children.forEach(function (p) {
      p.style.strokeOpacity = this.base_link_opacity;
    });
  });
}

function search_node_d3() {
  let found_matching_string = false;

  // alert if no search term was entered
  if (app.searchterm === "") {
    alert("Please enter a search term.");
  } else {
    let nodes = d3.selectAll(".node").selectAll("g");

    nodes.each(function (d) {
      let children = this.childNodes;
      let text = "";

      children.forEach(function (d) {
        if (d.tagName === "text") {
          text = d.getAttribute("text");
        }
      });

      // prefix matching, see if there is a node that matches the search term
      if (text.lastIndexOf(app.searchterm, 0) === 0) {
        found_matching_string = true;
      }
    });

    // if a node was found, do the highlighting
    if (found_matching_string === true) {
      nodes.each(function (d) {
        let children = this.childNodes;
        let text = "";

        children.forEach(function (d) {
          if (d.tagName === "text") {
            text = d.getAttribute("text");
          }
        });

        // prefix matching
        if (text.lastIndexOf(app.searchterm, 0) === 0) {
          this.setAttribute("stroke", "yellow");
          // highlight matching node
          children.forEach(function (d) {
            if (d.tagName === "text") {
              d.style.fontSize = "16px";
            }
            if (d.tagName === "circle") {
              r = d.getAttribute("r");
              new_r = r * 2;
              d.setAttribute("r", new_r);
            }
          });
        } else {
          // reduce opacity of the other nodes
          // TODO: reduce opacity of links -> coloured links are a bit to strong
          children.forEach(function (d) {
            if (d.tagName === "text") {
              d.style.opacity = 0.4;
            }
            if (d.tagName === "circle") {
              d.style.opacity = 0.4;
            }
          });
        }

        let links = d3.selectAll(".link");
        links.each(function (d) {
          let children = this.childNodes;
          children.forEach(function (p) {
            p.style.strokeOpacity = this.reduced_link_opacity;
          });
        });
      });
      // if no matching node was found, show alert
    } else if (found_matching_string === false) {
      alert("No match found. Please try a different search term.");
    }
    app.searchterm = "";
  }
}

function select_cluster_d3(cluster) {
  if (app.cluster_selected === false) {
    app.cluster_selected = true;
    let cluster_id = cluster.cluster_id;
    let cluster_nodes = [];
    for (let i = 0; i < cluster.labels.length; i++) {
      cluster_nodes.push(cluster.labels[i].text);
    }

    let links = d3.selectAll(".link").selectAll("line");

    links.each(function (d) {
      let source = this.getAttribute("source");
      let target = this.getAttribute("target");
      if (cluster_nodes.includes(source) && cluster_nodes.includes(target)) {
        this.setAttribute("stroke", cluster.colour);
      }
    });
    if (app.sticky_mode === "false") {
      let nodes = d3.selectAll(".node").selectAll("g");
      nodes.classed("selected", function (d, i) {
        if (cluster_nodes.includes(d.id)) {
          return true;
        } else {
          return false;
        }
      });
    }
  } else {
    app.cluster_selected = false;
    let cluster_id = cluster.cluster_id;
    let cluster_nodes = [];
    for (let i = 0; i < cluster.labels.length; i++) {
      cluster_nodes.push(cluster.labels[i].text);
    }

    let links = d3.selectAll(".link").selectAll("line");

    links.each(function (d) {
      let source = this.getAttribute("source");
      let target = this.getAttribute("target");
      if (cluster_nodes.includes(source) && cluster_nodes.includes(target)) {
        this.setAttribute("stroke", "#999");
      }
    });
  }
}

function createNewCluster_d3(event) {
  let selected_nodes = d3.selectAll(".node").selectAll("g");
  let generated_cluster_id = app.generate_cluster_id().toString();

  selected_nodes.each(function (d, i) {
    let text = "";
    let childnodes = this.childNodes;

    childnodes.forEach(function (d, i) {
      if (d.tagName === "text") {
        text = d.getAttribute("text");
      }
    });

    for (let j = 0; j < app.clicked_nodes.length; j++) {
      // if the node is one of the selected nodes, assign the new attributes
      if (app.clicked_nodes[j].id === text) {
        childnodes.forEach(function (d, k) {
          if (d.tagName === "circle") {
            d.setAttribute("cluster_id", generated_cluster_id);
            d.setAttribute("cluster", app.created_cluster_name);
            d.setAttribute("fill", app.created_cluster_colour);
          }
        });
      }
    }
  });

  // update the information about the clusters in the graph in the data letiable clusters.
  app.get_clusters();

  app.created_cluster_colour = "";
  app.created_cluster_name = "";

  // colour the links accordingly
  let links = d3.selectAll(".link");
  links.each(function (d) {
    let children = this.childNodes;
    children.forEach(function (p) {
      let source = p.getAttribute("source");
      let target = p.getAttribute("target");
      let source_colour = app.findColour(source);
      let target_colour = app.findColour(target);
      if (source_colour === target_colour) {
        p.setAttribute("stroke", source_colour);
      } else {
        p.setAttribute("stroke", "#999");
      }
    });
  });
}

function assignNewCluster_d3() {
  let selected_nodes = d3.selectAll(".node").selectAll("g");

  selected_nodes.each(function (d, i) {
    text = "";
    let childnodes = this.childNodes;

    childnodes.forEach(function (d, i) {
      if (d.tagName === "text") {
        text = d.getAttribute("text");
      }
    });

    for (let j = 0; j < app.clicked_nodes.length; j++) {
      // if the node is one of the selected nodes, assign the new attributes
      if (app.clicked_nodes[j].id === text) {
        childnodes.forEach(function (d, k) {
          if (d.tagName === "circle") {
            d.setAttribute("cluster_id", app.new_assigned_cluster.cluster_id);
            d.setAttribute("cluster", app.new_assigned_cluster.cluster_name);
            d.setAttribute("fill", app.new_assigned_cluster.colour);
          }
        });
      }
    }
  });
  // update the information about the clusters in the graph in the data letiable clusters.
  app.get_clusters();

  let links = d3.selectAll(".link");
  links.each(function (d) {
    let children = this.childNodes;
    children.forEach(function (p) {
      let source = p.getAttribute("source");
      let target = p.getAttribute("target");
      let source_colour = app.findColour(source);
      let target_colour = app.findColour(target);
      if (source_colour === target_colour) {
        p.setAttribute("style", "stroke:" + source_colour);
      } else {
        p.setAttribute("style", "stroke: #999");
      }
    });
  });
}

function findSelectedNodes_d3() {
  let list = [];
  let selected_nodes = d3.select(".selected");

  selected_nodes.each(function (d, i) {
    let node_characteristics = {};
    let childnodes = this.childNodes;

    childnodes.forEach(function (d) {
      if (d.tagName === "circle") {
        // cluster nodes should not be considered
        if (d.getAttribute("cluster_node") === "false") {
          node_characteristics["colour"] = d.getAttribute("fill");
          app.created_cluster_colour = node_characteristics["colour"];
          node_characteristics["cluster_id"] = d.getAttribute("cluster_id");
          node_characteristics["cluster_name"] = d.getAttribute("cluster");
        }
      }

      if (d.tagName === "text") {
        node_characteristics["id"] = d.getAttribute("text");
      }
    });
    list.push(node_characteristics);
  });
  app.clicked_nodes = list;
}

function findWobblyCandidates_d3() {
  app.wobblyCandidates = [];

  if (app.hightlighInbetweennessCentrality === true) {
    app.resetCentralityHighlighting();
    app.hightlighInbetweennessCentrality = false;
  }

  let nodes = d3.selectAll(".node").selectAll("g");
  let texts = d3.selectAll(".node").selectAll("g").select("text");

  nodes.each(function (d, i) {
    let children = this.childNodes;
    let text = d3.select(texts.nodes()[i]);
    let cluster_id;
    let node_text;
    let candidate = {};
    let is_cluster_node;

    children.forEach(function (p) {
      if (p.tagName === "text") {
        node_text = p.getAttribute("text");
      }
      if (p.tagName === "circle") {
        cluster_id = p.getAttribute("cluster_id");
        is_cluster_node = p.getAttribute("cluster_node");
      }
    });

    if (is_cluster_node === "false") {
      let result = app.findNeighbourhoodClusters(node_text);
      let neighbourClusterDistr = result[0];
      let neighbourClusterDistr_string = result[1];

      let b = app.is_balanced(neighbourClusterDistr)[1];

      candidate["text"] = node_text;
      candidate["connected_clusters"] = neighbourClusterDistr_string;
      candidate["balanced"] = b;
      candidate["neighbours"] = app.findNeighboursAndClusters(node_text);

      app.wobblyCandidates.push(candidate);
    }
  });
}

function findColour_d3(node_id) {
  let nodes = d3.selectAll(".node").selectAll("g");
  let colour;

  nodes.each(function (d) {
    let node_name;
    let children = this.childNodes;
    children.forEach(function (p) {
      if (p.tagName === "text") {
        node_name = p.getAttribute("text");
      }
    });

    if (node_name === node_id) {
      children.forEach(function (p) {
        if (p.tagName === "circle") {
          colour = p.getAttribute("fill");
        }
      });
    }
  });
  return colour;
}

function skip_through_time_slices_d3() {
  let nodes = d3.selectAll(".node").selectAll("g");

  nodes.each(function (d, i) {
    // Set opacity to one in the beginning - important when changing time slice.
    this.style.strokeOpacity = 1.0;
    this.style.fillOpacity = 1.0;

    let childnodes = this.childNodes;
    // assume that every node is not in the interval
    let in_interval = false;

    childnodes.forEach(function (d, i) {
      if (d.tagName === "circle") {
        // for all nodes that have time ids, retrieve them - cluster nodes do not have any.
        if (d.getAttribute("cluster_node") === "false") {
          let time_ids = d.getAttribute("time_ids");
          if (time_ids !== null) {
            time_ids = time_ids.split(",");

            // check if the time ids of the node include the id of the interval
            time_ids.forEach(function (d, i) {
              if (d === app.interval_id) {
                // if so, the node occurs in the selected time slice
                in_interval = true;
              }
            });
          }
        }
      }
    });

    // Set the opacity to 0.2 for all nodes that do not occur in the focused time slice
    if (in_interval === false) {
      this.style.strokeOpacity = 0.2;
      this.style.fillOpacity = 0.2;
    }
  });

  let links = d3.selectAll(".link").selectAll("line");

  links.each(function (d, i) {
    // Set the opacity of all links to base_link_opacity initially
    this.style.strokeOpacity = this.base_link_opacity;

    // select the time ids of the source and the target
    let source_time_ids = d.source.time_ids;
    let target_time_ids = d.target.time_ids;

    if (
      typeof source_time_ids === "string" &&
      typeof target_time_ids === "string"
    ) {
      source_time_ids = source_time_ids.split(",");
      target_time_ids = target_time_ids.split(",");

      source_time_ids = source_time_ids.map((x) => parseInt(x));
      target_time_ids = target_time_ids.map((x) => parseInt(x));
    }

    let in_source_interval = false;
    let in_target_interval = false;

    let interval = parseInt(app.interval_id);

    // check if source time ids of a link include the time slice id of the selected interval
    if (source_time_ids.includes(interval)) {
      in_source_interval = true;
    }

    // check if the target time ids of a link include the time slice if of the selected interval
    if (
      !(target_time_ids === null || typeof target_time_ids === "undefined") &&
      target_time_ids.includes(interval)
    ) {
      in_target_interval = true;
    }

    // the link only has opacity 1.0 if both source and target are in the selected time slice
    if (in_source_interval === false || in_target_interval === false) {
      app.style.strokeOpacity = app.reduced_link_opacity;
    }
  });
}

function reset_opacity_d3() {
  let nodes = d3.selectAll(".node").selectAll("g");
  let links = d3.selectAll(".link");

  nodes.each(function (d) {
    this.style.strokeOpacity = 1.0;
    this.style.fillOpacity = 1.0;
  });

  links.each(function (d) {
    let childnodes = this.childNodes;
    childnodes.forEach(function (d) {
      d.setAttribute("style", "stroke: #999;");
      d.setAttribute("style", "stroke-opacity:" + this.base_link_opacity);
    });
  });
}

function fade_in_nodes_d3(colour) {
  let nodes = d3.selectAll(".node").selectAll("g");
  let links = d3.selectAll(".link");

  // collect all the nodes with opacity 1.0, so you can check them against the source and target of links
  let faded_in = [];

  nodes.each(function (d, i) {
    let childnodes = this.childNodes;
    let node_colour;

    childnodes.forEach(function (d) {
      if (d.tagName === "circle") {
        node_colour = d.getAttribute("fill");
      }
    });

    if (colour !== node_colour) {
      this.style.strokeOpacity = 0.2;
      this.style.fillOpacity = 0.2;
    } else {
      childnodes.forEach(function (d) {
        if (d.tagName === "text") {
          faded_in.push(d.getAttribute("text"));
        }
      });
    }
  });

  links.each(function (d) {
    let linknodes = this.childNodes;

    linknodes.forEach(function (d) {
      let source = d.getAttribute("source");
      let target = d.getAttribute("target");

      if (faded_in.includes(source) && faded_in.includes(target)) {
        // if the link is faded in, set the colour to the same as all the nodes
        d.setAttribute("style", "stroke:" + colour);
      } else {
        d.setAttribute("style", "stroke-opacity:" + this.reduced_link_opacity);
      }
    });
  });
}
