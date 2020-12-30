// ------------------------- SVG COMPONENT ---------------------------
/*
Works on the d3Data [see data.js], the vueData managed by VueApp and the globalGraph
Functions are triggered by Vue-Components (such as Sidebar-left sense graph etc.)
*/

// ########### SIDEBAR-LEFT - GRAPH CREATION ##########################################################
const delete_graph = function () {
  // FUNCTION remove
  // Always remove the svg element before rendering new. Otherwise a new one is appended every time you click the render button
  d3.select("#graph2").select("svg").remove();
};

/*
Renders the graph on the svg element
Triggered via sidebar left -graph render - then data
*/
const render_graph = function () {
  // Set local parameters for ease of use
  let radius = vueApp.radius;
  let target = graph.props.target_word;
  let color = d3.scaleOrdinal(d3.schemePaired);

  // FUNCTION CREATE
  // Create the svg element on which you want to render the graph
  d3Data.svg = d3
    .select("#graph2")
    .on("keydown.brush", keydowned)
    .on("keyup.brush", keyupped)
    .each(function () {
      this.focus();
    })
    .append("svg")
    .attr("id", "svg")
    .attr("width", vueApp.svg_width)
    .attr("height", vueApp.svg_height)
    .attr(
      "viewBox",
      " 0 0 " + vueApp.viewport_width + " " + vueApp.viewport_height
    )
    .attr("preserveAspectRatio", "xMidYMid meet")
    .classed("svg-content", true)
    .call(
      d3.zoom().on("zoom", function () {
        d3Data.svg.attr("transform", d3.event.transform);
      })
    )
    .append("g");

  // append the brush to the svg for dragging multiple nodes at the same time
  d3Data.brush = d3Data.svg.append("g").attr("class", "brush");

  // initialize the class attributes selected and previouslySelected for each node
  // this works on GRAPH-DATA-STRUCTURE [CORRECT ???]
  /* graph.nodes.forEach(function (d) {
    d.selected = false;
    d.previouslySelected = false;
  }); */

  // append the target word to the center of the svg
  let t = d3Data.svg.append("g").data(target);

  t.append("text")
    .attr("class", "target")
    .attr("x", vueApp.viewport_width / 3)
    .attr("y", vueApp.viewport_height / 3)
    .style("font-family", "helvetica, arial, sans-serif")
    .style("font-size", "25px")
    .style("font-weight", "bold")
    .style("opacity", 0.2)
    .text(function (d) {
      return d.target_word;
    });

  // create the force simulation
  d3Data.simulation = d3
    .forceSimulation(graph.nodes)
    .force(
      "link",
      d3
        .forceLink(graph.links)
        .id(function (d) {
          return d.id;
        })
        .distance(function (d) {
          return vueApp.linkdistance;
        })
    )
    .force(
      "charge",
      d3
        .forceManyBody()
        .strength(vueApp.charge)
        .distanceMin(1)
        .distanceMax(2000)
    )
    .force("collide", d3.forceCollide().radius(10))
    .force(
      "center",
      d3.forceCenter(vueApp.viewport_width / 3, vueApp.viewport_height / 3)
    )
    .on("tick", ticked);

  //var forceLinkDistance = d3Data.simulation.force("link");

  // initialize drag behaviour
  d3Data.drag_node = d3.drag();

  // initialize the tooltip for nodes
  d3Data.time_diff_tip = d3
    .tip()
    .attr("class", "d3-tip")
    .html(function (d) {
      return toolTipNode(d.time_ids, d.target_text, d.weights);
    });

  // initialize the tooltip for edges
  d3Data.time_diff_tip_link = d3
    .tip()
    .attr("class", "d3-tip")
    .html(function (d) {
      return toolTipLink(d.time_ids, d.weights, d.target_text, d.source_text);
    });

  // call the time diff tooltip from the svg
  d3Data.svg.call(d3Data.time_diff_tip);
  d3Data.svg.call(d3Data.time_diff_tip_link);

  // create the nodes
  d3Data.node = d3Data.svg
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .attr("class", "node")
    .selectAll("g")
    .data(graph.nodes)
    .enter()
    .append("g")
    .on("mousedown", mousedowned)
    .call(d3Data.drag_node)
    .on("mouseover", mouseOver(0.2))
    .on("mouseout", mouseOut)
    .on("click", function (d) {
      if (this.getAttribute("class") === "selected") {
        vueApp.node_selected = true;
      } else {
        vueApp.node_selected = false;
      }
      console.log(d.target_text);
      console.log(d.time_ids);
      vueApp.active_node = {
        time_ids: d.time_ids,
        weights: d.weights,
        source_text: vueApp.target_word,
        target_text: d.target_text,
      };
      vueApp.getSimBimsNodes();
      console.log("in nodeclick ", vueApp.active_node);
      // set fields
      vueApp.fields_nodes[0]["label"] = vueApp.target_word;
      vueApp.fields_nodes[2]["label"] = d.target_text;
      // switch on view
      vueApp.context_mode3 = true;
      vueApp.context_mode = false;
      console.log(vueApp.context_mode3);
      // vueApp.select_node_is_no_cluster_node = vueApp.is_normal_node();
      showContextMenu(this);
    });

  // append circles to the node
  // this is the way the nodes are displayed in the graph
  d3Data.circles = d3Data.node
    .append("circle")
    .attr("r", function (d) {
      if (d.cluster_node === "true") {
        // if the node is a cluster node make it twice as big
        return radius * 5;
      } else {
        // experimental - nodes bigger according to similarity
        // console.log(d.target_text, Math.max(...d.weights));
        // if (isNaN(Math.max(...d.weights))) {
        //   return radius;
        // } else if (Math.max(...d.weights) <= 1000) {
        //   return Math.sqrt(Math.max(...d.weights));
        // } else {
        //   return radius;
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
    .on("mouseover", d3Data.time_diff_tip.show)
    .on("mouseout", d3Data.time_diff_tip.hide);

  // append a label to the node which displays its id
  d3Data.node
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
  d3Data.link = d3Data.svg
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", vueApp.base_link_opacity)
    .attr("class", "link")
    .selectAll("line")
    .data(graph.links)
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
      if (vueApp.link_thickness_scaled === "true") {
        return Math.sqrt(d.weight / vueApp.link_thickness_factor);
      } else {
        return Math.sqrt(vueApp.link_thickness_value);
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
      vueApp.active_edge = {
        time_ids: d.time_ids,
        weights: d.weights,
        source_text: d.source_text,
        target_text: d.target_text,
      };
      vueApp.getSimBims();
      // set label
      vueApp.fields_edges[0]["label"] = d.source_text;
      vueApp.fields_edges[2]["label"] = d.target_text;

      // switch on context mode edges, switch off context mode
      vueApp.context_mode = true;
      vueApp.context_mode3 = false;
    })
    .on("mouseover", d3Data.time_diff_tip_link.show)
    .on("mouseout", d3Data.time_diff_tip_link.hide);

  d3Data.simulation.on("tick", ticked);

  /* // release all pinned nodes and restart the simulation
  // Hardly applicable to a new graph
  d3.select("#restart_button").on("click", function () {
    d3Data.node.each(function (d) {
      //console.log(d)
      d.fx = null;
      d.fy = null;
    });
    d3Data.simulation.alphaTarget(0);
  }); */

  // deprecated
  // eventListenerFunc();

  // console.log(graph);
};

// ############################################# SVG - MAIN ELEMENT FUNCTIONS ########################################

/*
		Returns all the time ids of a node as a string of start year and end year to be displayed in the tooltip on a node in the time diff mode
		*/
function toolTipLink(time_ids, weights, targetA, targetB) {
  let stringRet = "Edge: " + targetA + " - " + targetB + "<br>" + "<br>";
  stringRet += "Max. similarity:" + "<br>";
  stringRet += vueApp.selectInterval(time_ids, weights) + "<br>";
  stringRet += "For context-information - click me!";
  return stringRet;
}

function toolTipNode(time_ids, target_text, weights) {
  let stringRet = "Node: " + target_text + "<br>" + "<br>";
  stringRet += "Highest similarities with " + vueApp.target_word + ":" + "<br>";
  stringRet += vueApp.selectInterval(time_ids, weights) + "<br>";
  return stringRet;
}

function showContextMenu(d) {
  if (vueApp.node_selected) {
    d3.select("#nodeOptionsDD").style("display", "block");

    d3.event.preventDefault();
  } else {
    d3.select("#nodeOptionsDD").style("display", "none");
  }
}

function mousedowned(d) {
  /*
	if (d3Data.shiftKey) {
		d3.select(this).classed("selected", d.selected = !d.selected);
		d3.event.stopImmediatePropagation();
	} else if (!d.selected) {
		node.classed("selected", function(p) { return p.selected = d === p;});
	}
	*/
  if (!d.selected) {
    d3Data.node.classed("selected", function (p) {
      return (p.selected = d === p);
    });
  } else if (d3Data.shiftKey && vueApp.sticky_mode === "true") {
    d3.select(this).classed("selected", (d.selected = !d.selected));
    d3.event.stopImmediatePropagation();
  } else if (vueApp.sticky_mode === "true") {
    d3.select(this).classed("selected", (d.selected = !d.selected));
    //d3.event.stopImmediatePropagation();
  }
}

// update node and link positions
function ticked() {
  d3Data.node.attr("transform", positionNode);
  d3Data.link
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
  if (d.x > vueApp.svg_width) {
    d.x = vueApp.svg_width - 50;
  }
  if (d.y > vueApp.svg_height) {
    d.y = vueApp.svg_height - 50;
  }
  return "translate(" + d.x + "," + d.y + ")";
}

// fade nodes on hover
function mouseOver(opacity) {
  //mouseOver_d3(opacity);
  return function (d) {
    // check all other nodes to see if they're connected
    // to this one. if so, keep the opacity, otherwise
    // fade
    d3Data.node.style("stroke-opacity", function (o) {
      let thisOpacity = vueApp.isConnected(d, o) ? 1 : opacity;
      return thisOpacity;
    });
    d3Data.node.style("fill-opacity", function (o) {
      let thisOpacity = vueApp.isConnected(d, o) ? 1 : opacity;
      return thisOpacity;
    });
    // also style link accordingly
    d3Data.link.style("stroke-opacity", function (o) {
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
// fade everything back in
function mouseOut() {
  d3Data.node.style("stroke-opacity", 1);
  d3Data.node.style("fill-opacity", 1);
  d3Data.link.style("stroke-opacity", this.base_link_opacity);
  //link.style("stroke", "#ddd");
}

function mouseOver_d3(opacity) {
  return function (d) {
    // check all other nodes to see if they're connected
    // to this one. if so, keep the opacity, otherwise
    // fade
    d3Data.node.style("stroke-opacity", function (o) {
      let thisOpacity = vueApp.isConnected(d, o) ? 1 : opacity;
      return thisOpacity;
    });
    d3Data.node.style("fill-opacity", function (o) {
      let thisOpacity = vueApp.isConnected(d, o) ? 1 : opacity;
      return thisOpacity;
    });
    // also style link accordingly
    d3Data.link.style("stroke-opacity", function (o) {
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
  d3Data.node.style("stroke-opacity", 1);
  d3Data.node.style("fill-opacity", 1);
  d3Data.link.style("stroke-opacity", this.base_link_opacity);
  //link.style("stroke", "#ddd");
}

function delete_cluster_d3(cluster_name, cluster_id, labels) {
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
      vueApp.deletenode(node_id);
      vueApp.deletelinks(node_id);
    }
  });

  // remove nodes from DOM with D3 and update the simulation
  d3Data.node
    .data(graph.nodes, function (d) {
      return d.id;
    })
    .exit()
    .remove();
  d3Data.link
    .data(graph.links, function (d) {
      return d.source.id + "-" + d.target.id;
    })
    .exit()
    .remove();

  d3Data.simulation.nodes(graph.nodes);
  d3Data.simulation.force("link").links(graph.links);
  d3Data.simulation.alpha(1).restart();

  // Update the number of updated senses for when saving the file the name will be correct
  if (vueApp.updated_nodes != null) {
    vueApp.update_senses = vueApp.update_senses - number_of_nodes;
  }

  // update number of senses
  vueApp.senses = vueApp.senses - number_of_nodes;

  // recalculate the cluster information
  vueApp.get_clusters();
}

// update the connected nodes
// vueApp.calc_linkedByIndex();

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
          vueApp.created_cluster_colour = node_characteristics["colour"];
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
  vueApp.clicked_nodes = list;
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

// ##############  SIDEBAR LEFT VIEW SETTINGS ############################################################################

function sticky_change_d3() {
  console.log("sticky_change triggered", vueApp.sticky_mode);

  if (vueApp.sticky_mode === "false") {
    d3Data.brush.style("display", "inline");
    d3Data.brush.call(
      d3
        .brush()
        .extent([
          [0, 0],
          [vueApp.svg_width, vueApp.svg_height],
        ])
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended)
    );

    d3Data.drag_node
      .on("start", function () {
        d3.selectAll(".selected").each(dragstart);
      })
      .on("drag", function () {
        d3.selectAll(".selected").each(dragmove);
      })
      .on("end", function () {
        d3.selectAll(".selected").each(dragend);
      });
  } else if (vueApp.sticky_mode === "true") {
    // tidy up after d3Data.brush and unselect all selected nodes
    d3Data.brush.style("display", "none");

    d3Data.node.classed("selected", function (d) {
      if (d.selected) {
        d.previouslySelected = false;
        d.selected = false;
        return d.selected;
      }
    });

    d3Data.drag_node
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
    d3Data.node.classed("selected", function (d) {
      return (d.selected = d.previouslySelected =
        d3Data.shiftKey && d.selected);
    });
  }
}

function brushed() {
  if (d3.event.sourceEvent.type !== "end") {
    var selection = d3.event.selection;

    d3Data.node.classed("selected", function (d) {
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

function dragstart(d) {
  d3Data.simulation.stop();
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
    d3Data.simulation.alphaTarget(0.3).restart();
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
    d3Data.simulation.alphaTarget(0);
  }
  //d.fx = null;
  //d.fy = null;
}

function keydowned() {
  d3Data.shiftKey = d3.event.d3Data.shiftKey || d3.event.metaKey;
}

function keyupped() {
  d3Data.shiftKey = d3.event.d3Data.shiftKey || d3.event.metaKey;
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
  d3Data.svg.attr("transform", "translate(0, 0) scale(1.0)");
  console.log("in reset_zoom d3");
}

function charge_change_d3() {
  d3Data.simulation.force(
    "charge",
    d3.forceManyBody().strength(vueApp.charge).distanceMin(1).distanceMax(2000)
  );
  d3Data.simulation.alpha(1).restart();
}

function restart_change_d3() {
  d3Data.node.each(function (d) {
    //console.log(d)
    d.fx = null;
    d.fy = null;
  });
  d3Data.simulation.alphaTarget(0);
  restart();
}

function linkdistance_change_d3() {
  console.log("linkdist change");
  let forceLinkDistance = d3Data.simulation.force("link");
  forceLinkDistance.distance(vueApp.linkdistance);
  d3Data.simulation.alpha(1).restart();
}

// ########################## CLUSTER ANALYSIS - RIGHT SIDEBAR - FUNCTIONS #############################################################
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

// check if a cluster node - aka LABEL exists for a specific cluster
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
  let node = d3Data.node.data(graph.nodes, function (d) {
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
    .call(d3Data.drag_node)
    .on("mouseover", mouseOver(0.2))
    .on("mouseout", mouseOut)
    .on("click", function (d) {
      if (d.selected) {
        vueApp.node_selected = true;
      } else {
        vueApp.node_selected = false;
      }
      // vueApp.select_node_is_no_cluster_node = vueApp.is_normal_node();
      showContextMenu(this);
    });

  let circle = g
    .append("circle")
    .attr("fill", function (d) {
      return d.colour;
    })
    //.attr("fill-opacity", 0.5)
    .attr("r", vueApp.clusterNodeRadius)
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

  d3Data.node = node.merge(g);

  // Apply the general update pattern to the links.
  let link = d3Data.link.data(graph.links, function (d) {
    return d.source.id + "-" + d.target.id;
  });
  link.exit().remove();
  d3Data.link = link
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

  // Update and restart the d3Data.simulation.
  d3Data.simulation.nodes(graph.nodes);
  d3Data.simulation.force("link").links(graph.links);
  ticked();
  d3Data.simulation.alpha(1).restart();

  // update the object with connected nodes
  vueApp.calc_linkedByIndex();
}

function addlink(source, target) {
  if (source !== undefined && target !== undefined) {
    graph.links.push({ source: source, target: target });
    restart();
  }
}

function addclusternode(name, colour, cluster_id) {
  graph.nodes.push({ id: name, colour: colour, cluster_id: cluster_id });
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
        vueApp.deletenode(node_name);
        vueApp.deletelinks(node_name);
        restart();
      }
    }
  });
}

function get_colour(c) {
  return color(c);
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
      vueApp.deletenode(node_id);
      vueApp.deletelinks(node_id);
    }
  });

  // remove nodes from DOM with D3 and update the simulation
  d3Data.node
    .data(graph.nodes, function (d) {
      return d.id;
    })
    .exit()
    .remove();
  d3Data.link
    .data(graph.links, function (d) {
      return d.source.id + "-" + d.target.id;
    })
    .exit()
    .remove();

  d3Data.simulation.nodes(graph.nodes);
  d3Data.simulation.force("link").links(graph.links);
  d3Data.simulation.alpha(1).restart();
}

function select_cluster_d3(cluster) {
  if (vueApp.cluster_selected === false) {
    vueApp.cluster_selected = true;
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
    if (vueApp.sticky_mode === "false") {
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
    vueApp.cluster_selected = false;
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
  let generated_cluster_id = vueApp.generate_cluster_id().toString();

  selected_nodes.each(function (d, i) {
    let text = "";
    let childnodes = this.childNodes;

    childnodes.forEach(function (d, i) {
      if (d.tagName === "text") {
        text = d.getAttribute("text");
      }
    });

    for (let j = 0; j < vueApp.clicked_nodes.length; j++) {
      // if the node is one of the selected nodes, assign the new attributes
      if (vueApp.clicked_nodes[j].id === text) {
        childnodes.forEach(function (d, k) {
          if (d.tagName === "circle") {
            d.setAttribute("cluster_id", generated_cluster_id);
            d.setAttribute("cluster", vueApp.created_cluster_name);
            d.setAttribute("fill", vueApp.created_cluster_colour);
          }
        });
      }
    }
  });

  // update the information about the clusters in the graph in the data letiable clusters.
  vueApp.get_clusters();

  vueApp.created_cluster_colour = "";
  vueApp.created_cluster_name = "";

  // colour the links accordingly
  let links = d3.selectAll(".link");
  links.each(function (d) {
    let children = this.childNodes;
    children.forEach(function (p) {
      let source = p.getAttribute("source");
      let target = p.getAttribute("target");
      let source_colour = vueApp.findColour(source);
      let target_colour = vueApp.findColour(target);
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
    let text = "";
    let childnodes = this.childNodes;

    childnodes.forEach(function (d, i) {
      if (d.tagName === "text") {
        text = d.getAttribute("text");
      }
    });

    for (let j = 0; j < vueApp.clicked_nodes.length; j++) {
      // if the node is one of the selected nodes, assign the new attributes
      if (vueApp.clicked_nodes[j].id === text) {
        childnodes.forEach(function (d, k) {
          if (d.tagName === "circle") {
            d.setAttribute(
              "cluster_id",
              vueApp.new_assigned_cluster.cluster_id
            );
            d.setAttribute("cluster", vueApp.new_assigned_cluster.cluster_name);
            d.setAttribute("fill", vueApp.new_assigned_cluster.colour);
          }
        });
      }
    }
  });
  // update the information about the clusters in the graph in the clusters.
  vueApp.get_clusters();

  let links = d3.selectAll(".link");
  links.each(function (d) {
    let children = this.childNodes;
    children.forEach(function (p) {
      let source = p.getAttribute("source");
      let target = p.getAttribute("target");
      let source_colour = vueApp.findColour(source);
      let target_colour = vueApp.findColour(target);
      if (source_colour === target_colour) {
        p.setAttribute("style", "stroke:" + source_colour);
      } else {
        p.setAttribute("style", "stroke: #999");
      }
    });
  });
}

// ########################## CLUSTER ANALYSIS RIGHT TIME-DIFF #############################################################

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
              if (d === vueApp.interval_id) {
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

    let interval = parseInt(vueApp.interval_id);

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
      vueApp.style.strokeOpacity = vueApp.reduced_link_opacity;
    }
  });
}

function reset_time_diff_colours_d3() {
  d3Data.circles.style("stroke-opacity", 1);
  vueApp.link.style("stroke-opacity", this.base_link_opacity);

  let circleChilds = d3.selectAll(".node").selectAll("g").selectAll("circle");

  circleChilds.each(function (d) {
    let node_cluster_id = this.getAttribute("cluster_id");
    console.log("in reset color vue.js ", graph.clusters);
    for (let i = 0; i < graph.clusters.length; i++) {
      // set the colour of the nodes back to the cluster colours
      if (node_cluster_id === graph.clusters[i].cluster_id) {
        this.setAttribute("fill", graph.clusters[i].colour);
      }
    }
  });
  d3Data.node.style("stroke-opacity", 1);
  d3Data.node.style("fill-opacity", 1);
  // don't show time diff tooltip
  // TODO tooltip hier ausstellen
  d3Data.circles.on("mouseover", null);
  d3Data.circles.on("mouseout", null);
  d3Data.node.on("mouseover", mouseOver(0.2));
  d3Data.node.on("mouseout", mouseOut);
}

// ########################## CLUSTER ANALYSIS FUNCTIONS #############################################################

function findWobblyCandidates_d3() {
  vueApp.wobblyCandidates = [];

  if (vueApp.hightlighInbetweennessCentrality === true) {
    vueApp.resetCentralityHighlighting();
    vueApp.hightlighInbetweennessCentrality = false;
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
      let result = vueApp.findNeighbourhoodClusters(node_text);
      let neighbourClusterDistr = result[0];
      let neighbourClusterDistr_string = result[1];

      let b = vueApp.is_balanced(neighbourClusterDistr)[1];

      candidate["text"] = node_text;
      candidate["connected_clusters"] = neighbourClusterDistr_string;
      candidate["balanced"] = b;
      candidate["neighbours"] = vueApp.findNeighboursAndClusters(node_text);

      vueApp.wobblyCandidates.push(candidate);
    }
  });
}

function delete_selected_nodes_d3() {
  vueApp.findSelectedNodes();
  vueApp.clicked_nodes.forEach(function (d) {
    vueApp.deletenode(d.id);
    vueApp.deletelinks(d.id);
  });
  // update DOM elements
  var node = d3Data.node.data(graph.nodes, function (d) {
    return d.id;
  });
  node.exit().remove();
  d3Data.node = node.enter().append("g").merge(node);

  var link = d3Data.link.data(graph.links, function (d) {
    return d.source.id + "-" + d.target.id;
  });
  link.exit().remove();
  d3Data.link = link.enter().append("line").merge(link);

  // update number of senses and updated senses
  vueApp.senses = vueApp.senses - 1;
  if (vueApp.updated_nodes != null) {
    vueApp.update_senses = vueApp.update_senses - 1;
  }

  // update simulation
  d3Data.simulation.nodes(graph.nodes);
  d3Data.simulation.force("link").links(graph.links);

  d3Data.simulation.alpha(1).restart();

  // recalculate the cluster information
  vueApp.get_clusters();
}

function deletelinks_d3(node_id) {
  var allLinks = d3.select(".link").selectAll("line");

  allLinks.each(function (d) {
    if (
      this.getAttribute("target") === node_id ||
      this.getAttribute("source") === node_id
    ) {
      for (var i = 0; i < graph.links.length; i++) {
        if (
          graph.links[i].target.id === node_id ||
          graph.links[i].source.id === node_id
        ) {
          graph.links.splice(i, 1);
        }
      }
    }
  });
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
  if (vueApp.highlightWobblies === true) {
    resetCentralityHighlighting_d3();
    vueApp.highlightWobblies = false;
  }
  vueApp.hightlighInbetweennessCentrality = true;
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

// ####  NAVBAR ########### SEARCH NODES ######################################################################################

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
  if (vueApp.searchterm === "") {
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
      if (text.lastIndexOf(vueApp.searchterm, 0) === 0) {
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
        if (text.lastIndexOf(vueApp.searchterm, 0) === 0) {
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
    vueApp.searchterm = "";
  }
}

// ############### DEPRECATED

function eventListenerFunc() {
  // ################ EVENT LISTENERS D3 ####################
  // executed once at beginning of graph-rendering
  // CURRENTLY NOT IN USE Add cluster nodes when clicking on the apply button in the edit column
  // sets event listeners
  /* d3.select("#apply_settings_button").on("click", function () {});
   */
  // CURRENTLY NOT IN USE Switch between time diff and sense clustering mode
  /* d3.select("#select_time_diff").on("change", function (d) {
    // sense clustering
    if (vueApp.time_diff === false) {
      vueApp.reset_time_diff_colours();
      console.log("time diff change triggered render sense graph");
    }
    if (vueApp.time_diff === true) {
      d3.select("#skip_through_button").on("click", function (d) {
        if (this.getAttribute("aria-expanded") === "true") {
          d3Data.node.on("mouseover", null);
          d3Data.node.on("mouseout", null);
        } else {
          d3Data.node.on("mouseover", mouseOver(0.2));
          d3Data.node.on("mouseout", mouseOut);
        }
      });
    }
  }); */
  // CURRENTLY NOT IN USE add new nodes and edges to the graph when the user updated the number of nodes and edges
  /* d3.select("#update_button").on("click", function () {
    vueApp.update().then((res) => {
      var existing_labels = [];
      var new_labels = [];
      for (var j = 0; j < graph.clusters.length; j++) {
        var cluster = graph.clusters[j];

        for (var k = 0; k < cluster.labels.length; k++) {
          existing_labels.push(cluster.labels[k].text);
        }
      }

      for (var i = 0; i < vueApp.updated_nodes.length; i++) {
        var new_label = vueApp.updated_nodes[i].id;
        new_labels.push(new_label);

        var cluster_class = vueApp.updated_nodes[i].class;
        var centr_score = vueApp.updated_nodes[i].centrality_score;

        if (!existing_labels.includes(new_label)) {
          // add new nodes to the nodes array
          graph.nodes.push({
            id: vueApp.updated_nodes[i].id,
            class: vueApp.updated_nodes[i].class,
            time_ids: vueApp.updated_nodes[i].time_ids,
            centrality_score: vueApp.updated_nodes[i].centrality_score,
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
          vueApp.deletelinks(existing_labels[i]);
          vueApp.deletenode(existing_labels[i]);
        }
      }

      graph.nodes.forEach(function (d) {
        d.selected = false;
        d.previouslySelected = false;
      });

      // update the links too
      for (var i = 0; i < vueApp.updated_links.length; i++) {
        var source = vueApp.updated_links[i].source;
        var target = vueApp.updated_links[i].target;
        var found = false;

        for (var j = 0; j < graph.links.length; j++) {
          if (
            graph.links[j].source.id === source &&
            graph.links[j].target.id === target
          ) {
            found = true;
          }
        }
        if (found === false) {
          graph.links.push(vueApp.updated_links[i]);
        }
      }
      update_graph();
      vueApp.get_clusters();
    });
  }); */
}

// update the graph with the additional nodes and links
function update_graph() {
  // Apply the general update pattern to the nodes.
  let node = d3Data.node.data(graph.nodes, function (d) {
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
    .call(d3Data.drag_node)
    .on("mouseover", mouseOver(0.2))
    .on("mouseout", mouseOut)
    .on("click", function (d) {
      if (this.getAttribute("class") === "selected") {
        vueApp.node_selected = true;
      } else {
        vueApp.node_selected = false;
      }

      // vueApp.select_node_is_no_cluster_node = vueApp.is_normal_node();
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
    .on("mouseover", d3Data.time_diff_tip.show)
    .on("mouseout", d3Data.time_diff_tip.hide);

  d3.select("#select_time_diff").on("change", function (d) {
    if (vueApp.time_diff === false) {
      circle.attr("fill", function (d) {
        return color(d.class);
      });
      circle.on("mouseover", null);
      circle.on("mouseout", null);
      d3Data.circles.attr("fill", function (d) {
        return color(d.class);
      });
      d3Data.circles.on("mouseover", null);
      d3Data.circles.on("mouseout", null);
    }
    if (vueApp.time_diff === true) {
      circle.on("mouseover", d3Data.time_diff_tip.show);
      circle.on("mouseout", d3Data.time_diff_tip.hide);
      d3Data.circles.on("mouseover", d3Data.time_diff_tip.show);
      d3Data.circles.on("mouseout", d3Data.time_diff_tip.hide);
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

  d3Data.node = node.merge(g);

  // Apply the general update pattern to the links.
  let link = d3Data.link.data(graph.links, function (d) {
    return d.source.id + "-" + d.target.id;
  });
  link.exit().remove();
  d3Data.link = link
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
      if (vueApp.link_thickness_scaled === "true") {
        return Math.sqrt(d.weight / vueApp.link_thickness_factor);
      } else {
        return Math.sqrt(vueApp.link_thickness_value);
      }
    })
    .merge(link);

  // Update and restart the d3Data.simulation.
  d3Data.simulation.nodes(graph.nodes);
  d3Data.simulation.force("link").links(graph.links);
  ticked();

  // colour the links
  let all_links = d3Data.svg.selectAll("line");
  all_links.each(function () {
    // check if link is connected to cluster node
    var is_connected_to_cluster_node = false;
    var source = this.getAttribute("source");
    var target = this.getAttribute("target");
    var source_colour = vueApp.findColour(source);
    var target_colour = vueApp.findColour(target);
    console.log(source, source_colour, target, target_colour);

    is_connected_to_cluster_node = vueApp.check_cluster_node_connection(source);
    if (is_connected_to_cluster_node === false) {
      is_connected_to_cluster_node = vueApp.check_cluster_node_connection(
        target
      );
    }
    if (is_connected_to_cluster_node === false) {
      if (source_colour === target_colour) {
        this.setAttribute("stroke", source_colour);
      } else {
        this.setAttribute("stroke", "#999");
      }
    }
  });

  d3Data.simulation.alpha(1).restart();

  // keep track of the connected nodes
  vueApp.calc_linkedByIndex();
  // linkedByIndex = {};
  // graph.links.forEach(function(d) {
  // 	linkedByIndex[d.source.id + "," + d.target.id] = 1;
  // });
}

function update_general_settings_d3() {
  /**
   * TODO WHY IS THIS WORKING ON LOCAL STATE???? [CH]
   */
  let svg = d3.select("svg");
  svg.attr("viewBox", "0 0 " + vueApp.svg_height + " " + vueApp.svg_width);
  let links = d3.selectAll(".link");
  links.each(function (d) {
    var children = this.childNodes;
    children.forEach(function (p) {
      var weight = p.getAttribute("weight");
      var thickness;
      if (vueApp.link_thickness_scaled === "true") {
        thickness = Math.sqrt(weight / vueApp.link_thickness_factor);
      } else {
        thickness = Math.sqrt(vueApp.link_thickness_value);
      }
      p.setAttribute("stroke-width", thickness);
    });
  });
  d3Data.simulation.alpha(0).restart();
}
