// ########### SIDEBAR-LEFT - GRAPH CREATION ##########################################################

// ------------------------- SVG COMPONENT ---------------------------
/*
Works on the d3Data [see data.js], the vueData managed by VueApp and the globalGraph

 */
let color = d3.scaleOrdinal(d3.schemePaired);
let d_svg;
let d_linkG;
let d_nodeG;
let d_link;
let d_node;
let d_simulation;
let d_drag_node;
let brush;

function graph_init() {
  /**
   * graph init prepares the svg-dom-graph before the data is bound to it in graph-crud
   */

  /**
   * build svg d3 - dom graph upper part
   */
  d_svg = d3
    .select("#graph2")
    .on("keydown.brush", keydowned)
    .on("keyup.brush", keyupped)
    .each(function () {
      this.focus();
    })
    .append("svg")
    .classed("svg-content", true)
    .attr("id", "svg")
    .attr("width", vueApp.svg_width)
    .attr("height", vueApp.svg_height)
    .attr(
      "viewBox",
      " " +
        vueApp.viewbox_pan_horizontal +
        " " +
        vueApp.viewbox_pan_vertical +
        " " +
        vueApp.viewbox_width +
        " " +
        vueApp.viewbox_height
    )
    .attr("preserveAspectRatio", "xMidYMid meet")
    .call(
      d3.zoom().on("zoom", function () {
        d_svg.attr("transform", d3.event.transform);
      })
    )
    .append("g");

  // append the brush to the svg for dragging multiple nodes at the same time
  // there are various attributes etc in this group in the DOM when enables
  brush = d_svg.append("g").attr("class", "brush");

  /**
   * build two main sub-graphs of Dom-Tree (nodes and links) - grouping containers: classes .node and .link
   */

  d_linkG = d_svg.append("g").attr("class", "link");

  d_nodeG = d_svg
    .append("g")
    .attr("class", "node")
    .attr("stroke", "#fff")
    .attr("stroke-width", vueApp.node_stroke_width);

  /**
   * define simulation with data-binding
   * Params
   * forceCollide: min distance of nodes to each other
   * forceCenter: center of attraction in moving simulation
   * force link : binds links to node-data (they are also moving)
   */
  d_simulation = d3
    .forceSimulation(graph.nodes)
    .force(
      "link",
      d3
        .forceLink(d3Data.links)
        .id(function (d) {
          return d.id;
        })
        .distance(function (d) {
          return vueApp.linkdistance;
        })
    )
    .force("charge", d3.forceManyBody(vueApp.charge))
    .force("collide", d3.forceCollide().radius(vueApp.radius * 3))
    .force(
      "center",
      d3.forceCenter(vueApp.viewbox_width / 2.2, vueApp.viewbox_height / 2.2)
    );

  // initi drag
  d_drag_node = d3.drag();

  return "end";
}

function delete_graph() {
  d3.select("#graph2").select("svg").remove();
}

/**
 * KEY FUNCTION: BINDS AND UPDATES DATA TO .Node and .Link container elements
 * THIS FUNCTION SHOULD BE CALLED AGAIN WHEN THERE ARE CHANGES TO THE DATA THAT NEED TO BE RENDERED
 * @param {} dnodes // array of nodes -- data is only read and not changed
 * @param {} dlinks // array of graph-links from graph-model -- USE DEEP COPY (force links transforms data)
 */

function graph_crud(dnodes, dlinks, dcluster) {
  console.log("------------ in graph crud d3 --------------------------");
  d_simulation.stop();
  // remove data information for node and line elements of tree
  // while preserving positions for the same nodes and lines
  // (the positions are bound to the simulation - drag - brush etc. and are not saved here)
  // NOTE: for the logic, it would have been better to exit-remove with data-binding here
  // HOWEVER: it does not work as expected due to implicit force-position-binding of x,y etc.
  // THUS: all visible elements are deleted here
  // remove all lines
  d3.selectAll(".link").selectAll("line").remove();
  // remove all nodes
  d3.selectAll(".node").selectAll("g").remove();
  // remove target workd
  d3.selectAll(".target").remove();

  // append the target word to the center of the svg
  d_svg
    .append("text")
    .attr("class", "target")
    .attr("x", vueApp.viewbox_width / 2.2)
    .attr("y", vueApp.viewbox_height / 2.2)
    .style("font-family", "helvetica, arial, sans-serif")
    .style("font-size", vueApp.svg_target_text_font_size)
    .style("font-weight", "bold")
    .style("opacity", vueApp.svg_target_text_opacity)
    .text(graph.props.target_word);

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
  d_svg.call(d3Data.time_diff_tip);
  d_svg.call(d3Data.time_diff_tip_link);

  // create graph nodes mit data-binding
  // ein Knoten des NGOT-Graphn besteht im Dom-tree aus einer
  // Gruppe class: .node mit den beiden HTML Elemente text und circle
  // NOTE: Zusätzlich zum NGOT-Graphen sollen Links mit einer Info-Node, die den Cluster anzeigt
  // gerendert werden. DIese Elemente sollen an- und ausschaltbar sein
  // (-> attr hidden is controlled by logic)

  d_node = d_nodeG
    .selectAll("g")
    .data(dnodes, (d) => d.id)
    .enter()
    .append("g")
    .attr("display", function (d) {
      if (d.hidden) {
        return "none";
      } else {
        return "show";
      }
    })
    .on("mouseover", d3Data.time_diff_tip.show)
    .on("mouseout", d3Data.time_diff_tip.hide);

  let circles = d_node
    .append("circle")
    .attr("r", function (d) {
      if (d.cluster_node) {
        return vueApp.radius * 2;
      } else {
        return vueApp.radius;
      }
    })
    .attr("centrality_score", (d) => d.centrality_score)
    .attr("cluster_name", function (d) {
      if (d.cluster_name) {
        return d.cluster_name;
      } else {
        return d.cluster_id;
      }
    })
    .attr("cluster_id", (d) => d.cluster_id)
    .attr("cluster_node", (d) => d.cluster_node)
    .attr("time_ids", (d) => d.time_ids)
    .attr("target_text", (d) => d.target_text)
    .attr("fill", function (d) {
      if (d.colour) {
        // if the nodes has an explicit colour use that
        return d.colour;
      } else {
        // otherwise look the colour up for the cluster_id of the node
        return color(d.cluster_id);
      }
    })
    .on("mousedown", mousedowned)
    .call(d_drag_node)
    .on("mouseover", mouseOver(vueApp.node_reduced_opacity))
    .on("mouseout", mouseOut)
    .on("click", function (d) {
      if (this.getAttribute("class") === "selected") {
        vueApp.node_selected = true;
      } else {
        vueApp.node_selected = false;
      }
      vueApp.select_node_is_no_cluster_node = vueApp.is_normal_node();
      showContextMenu(this);
    })
    .on("click", function (d) {
      console.log("in click onn node g");
      if (!d.cluster_node) {
        vueApp.active_node = {
          time_ids: d.time_ids,
          weights: d.weights,
          source_text: vueApp.target_word,
          target_text: d.target_text,
          cluster_id: d.cluster_id,
          cluster_name: d.cluster_name,
          colour: d.fill,
        };

        vueApp.getSimBimsNodes();
        // set fields for display in node feature element
        vueApp.fields_nodes[0]["label"] = vueApp.target_word;
        vueApp.fields_nodes[2]["label"] = d.target_text;
        // switch on node feature element
        vueApp.context_mode3 = true;
        vueApp.context_mode = false;
        console.log(vueApp.context_mode3);
      }
    });
  // .call(
  //   d3
  //     .drag()
  //     .on("start", d_dragstarted)
  //     .on("drag", d_dragged)
  //     .on("end", d_dragended)
  // );

  let labels = d_node
    .append("text")
    .text(function (d) {
      return d.target_text;
    })
    .attr("text", function (d) {
      return d.target_text;
    })
    .attr("x", 6)
    .attr("y", 3)
    .style("fill", "black")
    .style("stroke", "black")
    .style("font-size", function (d) {
      if (d.cluster_node) {
        return vueApp.node_text_font_size * 2;
      } else {
        return vueApp.node_text_font_size;
      }
    });

  d_link = d_linkG
    .selectAll("line")
    .data(dlinks, (d) => d.id)
    .enter()
    .append("line")
    .attr("cluster_info_link", (d) => d.cluster_link)
    .attr("display", function (d) {
      if (d.hidden) {
        return "none";
      } else {
        return "show";
      }
    })
    // enables access to node class
    .attr("stroke-width", function (d) {
      if (vueApp.link_thickness_scaled === "true") {
        return Math.sqrt(d.weight / vueApp.link_thickness_factor);
      } else {
        return vueApp.link_thickness_value;
      }
    })
    .attr("stroke", "#999")
    .attr("stroke-opacity", vueApp.base_link_opacity)
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
    // enables access to node class
    .on("click", function (d) {
      vueApp.active_edge = {
        time_ids: d.time_ids,
        weights: d.weights,
        source_text: d.source_text,
        target_text: d.target_text,
      };
      if (!d.cluster_node) {
        vueApp.getSimBims();
        // set label
        vueApp.fields_edges[0]["label"] = d.source_text;
        vueApp.fields_edges[2]["label"] = d.target_text;

        // switch on context mode edges, switch off context mode
        vueApp.context_mode = true;
        vueApp.context_mode3 = false;
      }
    })
    .on("mouseover", d3Data.time_diff_tip_link.show)
    .on("mouseout", d3Data.time_diff_tip_link.hide);

  d_simulation.nodes(dnodes).on("tick", d_ticked);

  d_simulation.force("link").links(dlinks);

  d_simulation.restart();
  return "end";
}

// ############################################# SVG - MAIN ELEMENT FUNCTIONS ########################################
/**
 * ------------------------------------ D3 SIMULATION FUNCTIONS
 */

function d_ticked() {
  d_node.attr("transform", positionNode);
  d_link
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

  // d_node.attr("transform", function (d) {
  //   return "translate(" + d.x + "," + d.y + ")";
  // });
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

function d_dragstarted(d) {
  if (!d3.event.active) d_simulation.restart();
  d.fx = d.x;
  d.fy = d.y;
}

function d_dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function d_dragended(d) {
  if (!d3.event.active) d_simulation.alphaTarget();
  d.fx = null;
  d.fy = null;
}

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

/**
 * d is the g element node ??
 * @param {} d
 */
function mousedowned(d) {
  if (!d.cluster_node) {
    vueApp.active_node = {
      time_ids: d.time_ids,
      weights: d.weights,
      source_text: vueApp.target_word,
      target_text: d.target_text,
      cluster_id: d.cluster_id,
      cluster_name: d.cluster_name,
      colour: d.fill,
    };
  }

  console.log(vueApp.active_node);

  console.log("in mouse downed sticky mode", vueApp.sticky_mode);
  if (!d.selected) {
    d_node.classed("selected", function (p) {
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

// fade nodes on hover
function mouseOver(opacity) {
  //mouseOver_d3(opacity);
  return function (d) {
    // check all other nodes to see if they're connected
    // to this one. if so, keep the opacity, otherwise
    // fade

    d_node.style("stroke-opacity", function (o) {
      console.log(
        "in mouseover stroke opacity with opacity = ",
        vueApp.node_fill_opacity
      );
      let thisOpacity = vueApp.isConnected(d, o)
        ? 1
        : vueApp.node_reduced_opacity;
      return thisOpacity;
    });
    d_node.style("fill-opacity", function (o) {
      let thisOpacity = vueApp.isConnected(d, o)
        ? 1
        : vueApp.node_reduced_opacity;
      return thisOpacity;
    });
    // also style link accordingly
    d_link.style("stroke-opacity", function (o) {
      return o.source === d || o.target === d ? 1 : vueApp.reduced_link_opacity;
    });
  };
}
// fade everything back in
function mouseOut() {
  d_node.style("stroke-opacity", 1);
  d_node.style("fill-opacity", 1);
  d_link.style("stroke-opacity", this.base_link_opacity);
  //link.style("stroke", "#ddd");
}

// update the connected nodes
// vueApp.calc_linkedByIndex();

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
function restart() {
  d_simulation.stop();
  graph_crud(graph.nodes, d3Data.links, graph.clusters);
  d_simulation.restart();
}

// ##############  SIDEBAR LEFT VIEW SETTINGS ############################################################################

function sticky_change_d3() {
  console.log("sticky_change triggered", vueApp.sticky_mode);
  let brush = d3.select("#graph2").select("#svg").select("g").select("g");

  if (vueApp.sticky_mode === "false") {
    brush.style("display", "inline");
    brush.call(
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

    d_drag_node
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
    // tidy up after brush and unselect all selected nodes
    //d_simulation.restart();
    brush.style("display", "none");

    d_node.classed("selected", function (d) {
      if (d.selected) {
        d.previouslySelected = false;
        d.selected = false;
        return d.selected;
      }
    });

    d_drag_node
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
    d_node.classed("selected", function (d) {
      return (d.selected = d.previouslySelected =
        d3Data.shiftKey && d.selected);
    });
  }
}

function brushed() {
  if (d3.event.sourceEvent.type !== "end") {
    var selection = d3.event.selection;

    d_node.classed("selected", function (d) {
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
  d_simulation.stop();
}

function dragmove(d) {
  d.x += d3.event.dx;
  d.y += d3.event.dy;
  d.fx = d.x;
  d.fy = d.y;
  d_ticked();
}

function dragend(d) {
  d_ticked();
}

function dragstart_sticky(d) {
  if (!d3.event.active) {
    d_simulation.alphaTarget(0.3).restart();
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
    d_simulation.alphaTarget(0);
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
  let graphC = d3.select("#graph2").select("#svg").select("g");
  let container = d3.select("#svg");
  let zoom = d3
    .zoom()
    .scaleExtent([0.7, 8])
    .on("zoom", () => {
      container.attr("transform", d3.event.transform);
    });

  zoom.transform(container, d3.zoomIdentity.translate(0, 0).scale(1.0));
  graphC.attr("transform", "translate(0, 0) scale(1.0)");
  // disable zooom dblClick
  container.on("dblclick.zoom", null);
  console.log("in reset_zoom d3");
}

function charge_change_d3() {
  d_simulation.force(
    "charge",
    d3.forceManyBody().strength(vueApp.charge).distanceMin(1).distanceMax(2000)
  );
  d_simulation.alpha(1).restart();
}

function restart_change_d3() {
  d_node.each(function (d) {
    //console.log(d)
    d.fx = null;
    d.fy = null;
  });
  d_simulation.alpha(1);
  restart();
}

function linkdistance_change_d3() {
  console.log("linkdist change");
  let forceLinkDistance = d_simulation.force("link");
  forceLinkDistance.distance(vueApp.linkdistance);
  d_simulation.alpha(1).restart();
}

// ########################## CLUSTER ANALYSIS - RIGHT SIDEBAR - FUNCTIONS #############################################################

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
  d_simulation
    .data(graph.nodes, function (d) {
      return d.id;
    })
    .exit()
    .remove();
  d3Data.link
    .data(d3Data.links, function (d) {
      return d.source.id + "-" + d.target.id;
    })
    .exit()
    .remove();

  d_simulation.nodes(graph.nodes);
  d_simulation.force("link").links(d3Data.links);
  d_simulation.alpha(1).restart();
}

function select_cluster_d3(cluster) {
  let cluster_id;
  if (vueApp.cluster_selected === false) {
    vueApp.cluster_selected = true;
    cluster_id = cluster.cluster_id;
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
    cluster_id = cluster.cluster_id;
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

// ########################## CLUSTER ANALYSIS RIGHT TIME-DIFF #############################################################
// Legacy version 1 that works on Dom -
// TODO Refactor at later stage - the colouring of the links is not correct (it is not dependent on the nodes)
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
    this.style.strokeOpacity = vueApp.base_link_opacity;

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
      this.style.strokeOpacity = vueApp.reduced_link_opacity;
    }
  });
}

// ########################## CLUSTER ANALYSIS - FUNCTIONS #############################################################

// ## READ AND DELETE -------------------------------------------

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

// ########### NODE SIZE ---------------------------------------------------------

function highlightCentralNodes_d3(threshold_s, threshold_m) {
  if (vueApp.highlightWobblies === true) {
    restart();
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
            d.setAttribute("r", vueApp.radius);
            text.style("font-size", vueApp.node_text_font_size);
          } else if (
            centrality_score > threshold_s &&
            centrality_score <= threshold_m
          ) {
            d.setAttribute("r", vueApp.radius * 2);
            text.style("font-size", vueApp.node_text_font_size * 2);
          } else {
            d.setAttribute("r", vueApp.radius * 3);
            text.style("font-size", vueApp.node_text_font_size * 3);
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
        d.style.fontSize = vueApp.node_text_font_size;
        d.style.opacity = null;
      }
      if (d.tagName === "circle") {
        d.setAttribute("r", vueApp.radius);
        d.style.opacity = null;
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
              let r = d.getAttribute("r");
              let new_r = r * 2;
              d.setAttribute("r", new_r);
            }
          });
        } else {
          // reduce opacity of the other nodes
          // TODO: reduce opacity of links -> coloured links are a bit to strong
          children.forEach(function (d) {
            if (d.tagName === "text") {
              d.style.opacity = vueApp.reduced_link_opacity;
            }
            if (d.tagName === "circle") {
              d.style.opacity = vueApp.reduced_link_opacity;
            }
          });
        }

        let links = d3.selectAll(".link");
        links.each(function (d) {
          let children = this.childNodes;
          children.forEach(function (p) {
            p.style.strokeOpacity = vueApp.reduced_link_opacity;
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
