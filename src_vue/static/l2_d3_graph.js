// ------------------------- SVG COMPONENT ---------------------------
/*
Works on the d3Data [see data.js]

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
//// general svg
//let viewbox_pan_horizontal = -screen.width * 0.01;
//// increase -> down
//let viewbox_pan_vertical = -screen.height * 0.07;
//// larger viewbox height and width -> zoom out / smaller viewbox - > zoom in
//let viewbox_height = screen.height * 1.2;
//let viewbox_width = screen.width * 1.8;
//// for setting the svg size for the graph
//// THIS IS THE VIEWPORT
//let svg_height = screen.height * 1;
//// it needs to be wider than screen.width - otherwise it does
//let svg_width = screen.width * 1.3;
// general svg
let viewbox_pan_horizontal = -screen.width * 0.05;
// increase -> down
let viewbox_pan_vertical = -screen.height * 0.05;
// larger viewbox height and width -> zoom out / smaller viewbox - > zoom in
let viewbox_height = screen.height * 0.8 //* 1.2; or 0.825
let viewbox_width = screen.width * 0.99 //* 1.2;
// for setting the svg size for the graph
// THIS IS THE VIEWPORT
let svg_height = viewbox_height; // screen.height * 0.8
// it needs to be wider than screen.width - otherwise it does
let svg_width = viewbox_width; //screen.width * 0.99

async function graph_init() {
  /**
   * graph init prepares the svg-dom-graph before the data is bound to it in graph-crud
   */

  /**
   * build svg d3 - dom graph upper part
   */
  d_svg = d3
    .select("#graph2")
//    .on("keydown.brush", keydowned)
//    .on("keyup.brush", keyupped)
//    .each(function () {
//      this.focus();
//    })
    .append("svg")
    .classed("svg-content", true)
    .attr("id", "svg")
    .attr("width", svg_width)
    .attr("height", svg_height)
    .attr(
      "viewBox",
        viewbox_pan_horizontal +
        " " +
        viewbox_pan_vertical +
        " " +
        viewbox_width +
        " " +
        viewbox_height
    )
    .attr("preserveAspectRatio", "xMidYMid meet")
    .call(
      d3.zoom().on("zoom", function () {
        d_svg.attr("transform", d3.event.transform);
      })
    )
    .append("g");

    // ---- add target text, with drag
    let dragTargetText = d3.drag()
  .on('drag', function(){
      e = d3.event;
        x =  parseFloat(d3.select(this).attr("x"))
        y = parseFloat(d3.select(this).attr("y"))
        d3.select(this)
        .attr("x", ((e.dx) + x))
        .attr("y", ((e.dy) + y))
    });
    d_svg.append("text")
    .attr("class", "targettext")
    .attr("x", viewbox_width / 2.5)
    .attr("y",  0) //viewbox_height
    .style("font-family", "helvetica, arial, sans-serif")
    .style("font-size", vueData.svg_target_text_font_size)
    .style("font-weight", "bold")
    .style("opacity", vueData.svg_target_text_opacity)
    .text(graph.props.target_word)
    .call(dragTargetText)
    .on("mouseover", function(){
        d3.select(this).style("cursor", "pointer");
    });
    // -----
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
    .attr("stroke-width", vueData.node_stroke_width);

  /**
   * define simulation with data-binding
   * Params
   * forceCollide: min distance of nodes to each other
   * forceCenter: center of attraction in moving simulation
   * force link : binds links to node-data (they are also moving)
   */
  d_simulation = d3
    .forceSimulation()
    .force("link", d3.forceLink().id(function (d) {
          return d.id;
        })
        .distance(function (d) {
          return vueData.linkdistance;
        })
    )
    .force("charge", d3.forceManyBody(vueData.charge))
    .force("collide", d3.forceCollide().radius(vueData.radius * 3))
    .force("center", d3.forceCenter(viewbox_width / 2.2, viewbox_height / 2.2))
    ;

  // initi drag
  d_drag_node = d3.drag();

  return "end";
}

async function delete_graph() {
  d3.select("#graph2").select("svg").remove();
  return "ok";
}

/**
 * KEY FUNCTION: BINDS AND UPDATES DATA TO .Node and .Link container elements
 * THIS FUNCTION SHOULD BE CALLED AGAIN WHEN THERE ARE CHANGES TO THE DATA THAT NEED TO BE RENDERED
 * @param {} dnodes // array of nodes -- data is only read and not changed
 * @param {} dlinks // array of graph-links from graph-model -- USE DEEP COPY (force links transforms data)
 */

async function graph_crud(dnodes, dlinks, dcluster) {
  // console.log("------------ in graph crud d3 --------------------------");
  // console.log(dnodes, dlinks);
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
  // remove target word
//  d3.selectAll(".target").remove();

  // append the target word to the center of the svg
//  d_svg
//    .append("text")
//    .attr("class", "target")
//    .attr("x", viewbox_width / 2.2)
//    .attr("y", viewbox_height / 2.2)
//    .style("font-family", "helvetica, arial, sans-serif")
//    .style("font-size", vueData.svg_target_text_font_size)
//    .style("font-weight", "bold")
//    .style("opacity", vueData.svg_target_text_opacity)
//    .text(graph.props.target_word);

  // initialize the tooltip for nodes
  d3Data.time_diff_tip = d3
    .tip()
    .attr("class", "d3-tip")
    .html(function (d) {
      if (d.time_ids && d.target_text && d.weights) {
        return toolTipNode(d.time_ids, d.target_text, d.weights);
      } else {
        return null;
      }
    });

  // initialize the tooltip for edges
  d3Data.time_diff_tip_link = d3
    .tip()
    .attr("class", "d3-tip")
    .html(function (d) {
      if (d.time_ids && d.weights && d.target_text && d.source_text) {
        return toolTipLink(d.time_ids, d.weights, d.target_text, d.source_text);
      } else {
        return null;
      }
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
        return vueData.radius * 2;
      }
      else{
            return vueData.radius;
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
    .attr("weight", (d) => d.weight).attr("weight_average", (d) => d.weight_average). attr("weight_average_all", (d) => d.weight_average_all)
    .attr("cluster_id", (d) => d.cluster_id)
    .attr("cluster_node", (d) => d.cluster_node)
    .attr("time_ids", (d) => d.time_ids)
    .attr("target_text", (d) => d.target_text)
    .attr("is_balanced", function (d) {
      if (d.ngot_undir_links_with_each_cluster_is_balanced != null) {
        return d.ngot_undir_links_with_each_cluster_is_balanced;
      }
    })
    .attr("connected_clusters", function (d) {
      if (d.neighbours_by_cluster) {
        return Object.keys(d.neighbours_by_cluster).length;
      } else {
        return 0;
      }
    })
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
    .on("mouseover", mouseOver(vueData.node_reduced_opacity))
    .on("mouseout", mouseOut)
    .on("click", function (d) {
      if (this.getAttribute("class") === "selected") {
        vueData.node_selected = true;
      } else {
        vueData.node_selected = false;
      }
      vueData.select_node_is_no_cluster_node = vueApp.is_normal_node();
//      showContextMenu(this);
    })
    .on("click", function (d) {
       if(d3.event.shiftKey == true){
            return;
      }
      // vueData.node_selected = true;
      // vueData.edge_selected = false;
      console.log("node clicked")
//      console.log(d)
      if (!d.cluster_node) {
        vueData.active_node = {
          time_ids: d.time_ids,
          time_slices:d.time_ids.map(vueApp.time_id_text),
          weights: d.weights, counts_map: d.counts_map,
          source_text: vueData.target_word,
          target_text: d.target_text,
          cluster_id: d.cluster_id,
          cluster_name: d.cluster_name,
          colour: d.fill,
          dtype:"node",
        };

        vueApp.getSimBimsNodes();
        // set fields for display in node feature element
        vueData.bim_fields[0]["label"] = vueData.target_word;
        vueData.bim_fields[2]["label"] = d.target_text;
        // switch on node feature element
        vueData.active_component = vueData.active_node;
        vueApp.show_nodeSimilarity_plot("node_similarity_plot1")
        vueApp.show_nodeFrequency_plot("node_frequency_plot1")
       //reset node/edge highlights
        d3.selectAll(".link").selectAll("line").classed('edge_selected', false);

        vueApp.showSidebar_node = true;
        vueApp.showSidebar_right=false;
      }
    });


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
        return vueData.node_text_font_size * 2;
      } else {
        return vueData.node_text_font_size;
      }
    });

  d_link = d_linkG
    .selectAll("g")
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
      if (vueData.link_thickness_scaled === "true") {
        return Math.sqrt(d.weight / vueData.link_thickness_factor);
      } else {
        return vueData.link_thickness_value;
      }
    })
    .attr("stroke", "#999")
    .attr("stroke-opacity", vueData.base_link_opacity)
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
      
      // vueData.edge_selected = true;
      // vueData.node_selected = false;

      vueData.active_edge = {
        time_ids: d.time_ids,
        time_slices:d.time_ids.map(vueApp.time_id_text),
        weights: d.weights,
        source_text: d.source_text, source_counts_map:d.source_counts_map,
        target_text: d.target_text,  target_counts_map:d.target_counts_map,
        cluster_info_link: d.cluster_link,
        dtype:"edge",
      };

      if (!d.cluster_link) {
        vueApp.getSimBims();
        // set label
        vueData.bim_fields[0]["label"] = d.source_text;
        vueData.bim_fields[2]["label"] = d.target_text;

//        vueData.bim_fields = vueData.fields_edges;
        vueData.active_component = vueData.active_edge;
        vueApp.show_nodeSimilarity_plot("node_similarity_plot1", 'edge')
        vueApp.show_nodeFrequency_plot("node_frequency_plot1", 'edge')

        // switch on context mode edges, switch off context mode
        vueApp.showSidebar_node = true;
        vueApp.showSidebar_right=false;
//        console.log(d);
        
        d3.selectAll(".node").selectAll("g").classed("selected", false);
        d3.selectAll('line').attr('class', false)
        d3.select(this).attr('class', 'edge_selected')

        d_node.classed("selected", function (p) {
          if(p == d.source || p == d.target){
            return true;
          }
          else{
            return false;
          }
        });

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
//  console.log('ticked');
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
  if (d.x > svg_width) {
    d.x = svg_width - 50;
  }
  if (d.y > svg_height) {
    d.y = svg_height - 50;
  }
  return "translate(" + d.x + "," + d.y + ")";
}

function d_dragstarted(d) {
  console.log('d node drag start');

  if (!d3.event.active) d_simulation.restart();
  d.fx = d.x;
  d.fy = d.y;
}

function d_dragged(d) {
  console.log('d node dragged');
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function d_dragended(d) {
  console.log('d node drag end');

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
  stringRet +=
    "Highest similarities with " + vueData.target_word + ":" + "<br>";
  stringRet += vueApp.selectInterval(time_ids, weights) + "<br>";
  stringRet += "For context-information - click me!";
  return stringRet;
}

function showContextMenu(d) {
  if (vueData.node_selected) {
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
    vueData.active_node = {
      time_ids: d.time_ids,
      time_slices:d.time_ids.map(vueApp.time_id_text),
      weights: d.weights, counts_map: d.counts_map,
      source_text: vueData.target_word,
      target_text: d.target_text,
      cluster_id: d.cluster_id,
      cluster_name: d.cluster_name,
      colour: d.fill,
      dtype:"edge",
    };
  }
//  vueApp.showSidebar_node = true;
//  vueApp.showSidebar_right=false;

//  vueApp.getSimBimsNodes();
  // set fields for display in node feature element
//  vueData.bim_fields[0]["label"] = vueData.target_word;
//  vueData.bim_fields[2]["label"] = d.target_text;
  // switch on node feature element
  vueData.active_component = vueData.active_node;

  console.log('node mouse downed')
  d3.selectAll("line").classed('edge_selected', false);
  d_node.selectAll(".node").selectAll("g").classed('selected', false);

  // console.log("in mouse downed sticky mode", vueData.sticky_mode);
  if (!d.selected) {
    d_node.classed("selected", function (p) {
      return (p.selected = d === p);
    });
  }
  else if (d3Data.shiftKey && vueData.sticky_mode === "true") {
    d3.select(this).classed("selected", (d.selected = !d.selected));
    d3.event.stopImmediatePropagation();
  }
  else if (vueData.sticky_mode === "true") {
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
      // console.log(
      //   "in mouseover stroke opacity with opacity = ",
      //   vueData.node_fill_opacity
      // );
      let thisOpacity = vueApp.isConnected(d, o)
        ? 1
        : vueData.node_reduced_opacity;
      return thisOpacity;
    });
    d_node.style("fill-opacity", function (o) {
      let thisOpacity = vueApp.isConnected(d, o)
        ? 1
        : vueData.node_reduced_opacity;
      return thisOpacity;
    });
    // also style link accordingly
    d_link.style("stroke-opacity", function (o) {
      return o.source === d || o.target === d
        ? 1
        : vueData.reduced_link_opacity;
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
  // console.log("sticky_change triggered", vueData.sticky_mode);
  let brush = d3.select("#graph2").select("#svg").select("g").select("g");

  if (vueData.sticky_mode === "false") {
    brush.style("display", "inline");
    brush.call(
      d3
        .brush()
        .extent([
          [0, 0],
          [svg_width, svg_height],
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
  } else if (vueData.sticky_mode === "true") {
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
  // console.log("in reset_zoom d3");
}

function charge_change_d3() {
  d_simulation.force(
    "charge",
    d3.forceManyBody().strength(vueData.charge).distanceMin(1).distanceMax(2000)
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
  // console.log("linkdist change");
  let forceLinkDistance = d_simulation.force("link");
  forceLinkDistance.distance(vueData.linkdistance);
  d_simulation.alpha(1).restart();
}

// ########################## CLUSTER ANALYSIS - RIGHT SIDEBAR - FUNCTIONS #############################################################

/*
Set the opacity of nodes and links of a specific cluster via d3
@param Object cluster: the entry for a specific cluster in the data letiable clusters.
@param float opacity: some number between 0.0 and 1.0.
@param float link_opacity: some number between 0.0 and 1.0.
*/

function set_cluster_opacity_d3(cluster, opacity, link_opacity) {
  let cluster_id = cluster.cluster_id;
  let cluster_nodes = [];

  for (let i = 0; i < cluster.labels.length; i++) {
    cluster_nodes.push(cluster.labels[i].text);
  }
  // console.log("cluster opacity point 1", cluster_nodes);

  let svg = d3.select("#svg");
  let nodes = svg.selectAll(".node");
  let links = svg.selectAll(".link");

  nodes.selectAll("g").each(function (d, i) {
    let childnodes = this.childNodes;
    let node_text;
    let node_cluster_id;
    childnodes.forEach(function (d, i) {
      if (d.tagName === "circle") {
        node_cluster_id = d.getAttribute("cluster_id");
      }
      if (d.tagName === "text") {
        node_text = d.getAttribute("text");
      }
    });
    if (!cluster_nodes.includes(node_text)) {
      this.style.strokeOpacity = opacity;
      this.style.fillOpacity = opacity;
    }
  });

  links.each(function (d, i) {
    let childnodes = this.childNodes;
    childnodes.forEach(function (d, i) {
      let source = d.getAttribute("source");
      let target = d.getAttribute("target");
      if (!cluster_nodes.includes(source) || !cluster_nodes.includes(target)) {
        //d.setAttribute("style", "stroke-opacity:" + link_opacity);
        d.style.strokeOpacity = link_opacity;
      }
      //if (cluster_nodes.includes(source) && cluster_nodes.includes(target)) {
      //if (opacity < 1) {
      //  d.setAttribute("style", "stroke:" + cluster.colour);
      //} else {
      //    d.setAttribute("style", "stroke:" + cluster.colour);
      //}
      //}
    });
  });
}

function delete_multiple_nodes_d3(labels) {
  // get all the text labels
  // console.log(labels);

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
      // console.log("in node del", node_id);
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

// ########################## CLUSTER ANALYSIS RIGHT TIME-DIFF #############################################################

/*
    Color nodes depending on whether they started to occur in the selected small time interval, stopped to occur in said interval, or both.
    Basically comparing the graph time interval and the small time interval selected by the user.
    # INTERVAL COUNTING ALWAYS START FIRST ID IN DATABASE WITH 1
    */
function show_time_diff_d3() {
  let big_time_interval = [];
  let startindex = vueData.start_years.find(
    (startindex) => startindex.value === vueData.start_year
  )["id"];
  let endindex = vueData.end_years.find(
    (endindex) => endindex.value === vueData.end_year
  )["id"];

  for (let ind = startindex; ind <= endindex; ind++) {
    big_time_interval.push(ind);
  }

  // console.log("in startindx", vueData.interval_start, vueData.interval_end);
  let small_time_interval = [];
  let startindex2 = vueData.start_years.find(
    (startind) => startind.text === vueData.interval_start
  )["id"];
  // console.log("start id", startindex2);
  let endindex2 = vueData.end_years.find(
    (endind) => endind.text === vueData.interval_end
  )["id"];

  for (let ind = startindex2; ind <= endindex2; ind++) {
    small_time_interval.push(ind);
  }

  let period_before = [];
  let period_after = [];

  let small_interval_start_time_id = Math.min(...small_time_interval);
  let small_interval_end_time_id = Math.max(...small_time_interval);
  // console.log("nall intervall start time id", small_interval_start_time_id);
  // console.log("small end time", small_interval_end_time_id);
  // console.log("big time intervall", big_time_interval);

  for (let i = 0; i < big_time_interval.length; i++) {
    if (big_time_interval[i] < small_interval_start_time_id) {
      period_before.push(big_time_interval[i]);
    } else if (big_time_interval[i] > small_interval_end_time_id) {
      period_after.push(big_time_interval[i]);
    }
    // console.log("big", big_time_interval);
    // console.log("before", period_before);
    // console.log("after", period_after);
  }

  let time_diff_nodes = {
    born_in_interval: [],
    deceases_in_interval: [],
    exists_only_in_interval: [],
    exists_only_before: [],
    exists_throughout: [],
    exists_only_after: [],
    exists_before_and_after: [],
  };

  let nodes = d3.selectAll(".node").selectAll("g");

  nodes.each(function (d) {
    let childnodes = this.childNodes;
    let node_text;

    childnodes.forEach(function (d) {
      if (d.tagName === "text") {
        node_text = d.getAttribute("text");
      }
    });

    childnodes.forEach(function (d) {
      if (d.tagName === "circle") {
        if (d.getAttribute("cluster_node") === "false") {
          let time_ids = d.getAttribute("time_ids");

          if (time_ids !== null && typeof time_ids !== "undefined") {
            time_ids = time_ids.split(",");
            time_ids = time_ids.map((x) => parseInt(x));
            // console.log("in time ids", time_ids, node_text);
            node_text = node_text + " [" + time_ids.sort() + "]";
            let in_interval = false;
            let before_interval = false;
            let after_interval = false;

            for (let i = 0; i < time_ids.length; i++) {
              let t = time_ids[i];

              if (period_before.includes(t)) {
                before_interval = true;
              }
              if (small_time_interval.includes(t)) {
                in_interval = true;
              }
              if (period_after.includes(t)) {
                after_interval = true;
              }
            }

            if (!before_interval && in_interval && !after_interval) {
              d.setAttribute("fill", "yellow");
              time_diff_nodes.exists_only_in_interval.push(node_text);
            } else if (!before_interval && in_interval && after_interval) {
              d.setAttribute("fill", "#28a745");
              time_diff_nodes.born_in_interval.push(node_text);
            } else if (before_interval && in_interval && !after_interval) {
              d.setAttribute("fill", "#dc3545");
              time_diff_nodes.deceases_in_interval.push(node_text);
            } else if (before_interval && in_interval && after_interval) {
              d.setAttribute("fill", "#343a41");
              time_diff_nodes.exists_throughout.push(node_text);
              // console.log("pushed throughout");
            } else if (before_interval && !in_interval && !after_interval) {
              d.setAttribute("fill", "#dc3546");
              time_diff_nodes.exists_only_before.push(node_text);
            } else if (!before_interval && !in_interval && after_interval) {
              d.setAttribute("fill", "#28a746");
              time_diff_nodes.exists_only_after.push(node_text);
            } else if (before_interval && !in_interval && after_interval) {
              d.setAttribute("fill", "#343a40");
              time_diff_nodes.exists_before_and_after.push(node_text);
            }
          }
        }
        // would be good to see exactly the time slices of the respective nodes
      }
    });
  });

  vueData.time_diff_nodes = time_diff_nodes;
  // console.log(time_diff_nodes);
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
              if (d === vueData.interval_id) {
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
    this.style.strokeOpacity = vueData.base_link_opacity;

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

    let interval = parseInt(vueData.interval_id);

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
      this.style.strokeOpacity = vueData.reduced_link_opacity;
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
          vueData.created_cluster_colour = node_characteristics["colour"];
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
  vueData.clicked_nodes = list;
}

// ########### NODE SIZE ---------------------------------------------------------

function highlightCentralNodes_d3(threshold_s, threshold_m) {
  if (vueData.highlightWobblies === true) {
    restart();
    vueData.highlightWobblies = false;
  }
  vueData.hightlighInbetweennessCentrality = true;
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
            d.setAttribute("r", vueData.radius);
            text.style("font-size", vueData.node_text_font_size);
          } else if (
            centrality_score > threshold_s &&
            centrality_score <= threshold_m
          ) {
            d.setAttribute("r", vueData.radius * 1.5);
            text.style("font-size", vueData.node_text_font_size * 1.25);
          } else {
            d.setAttribute("r", vueData.radius * 2);
            text.style("font-size", vueData.node_text_font_size * 1.75);
          }
        }
      }
    });
  });
}

/*
    Highlight the nodes with a balanced neighbourhood in the graph
    */
function highlightWobblyCandidates_d3() {
  if (vueData.hightlighInbetweennessCentrality === true) {
    restart();
    vueData.hightlighInbetweennessCentrality = false;
  }
  // console.log("in highlight wobbly");
  vueData.highlightWobblies = true;
  let nodes = d3.selectAll(".node").selectAll("g");

  nodes.each(function (d, i) {
    let children = this.childNodes;
    let node_text;
    let is_cluster_node;
    let is_balanced;
    let connected_clusters;

    children.forEach(function (p) {
      if (p.tagName === "text") {
        node_text = p.getAttribute("text");
      }
      if (p.tagName === "circle") {
        //is_cluster_node = p.getAttribute("cluster_node");
        if (p.getAttribute("is_balanced")) {
          is_balanced = p.getAttribute("is_balanced");
        }
        connected_clusters = p.getAttribute("connected_clusters");
      }
    });

    // if a node has a balanced neighbourhood, make it large
    if (is_balanced == "true") {
      children.forEach(function (p) {
        if (p.tagName === "circle") {
          p.setAttribute("r", vueData.radius * 3);
          // text.style("font-size", vueData.node_text_font_size * 2);
        }
      });
    }

    // if node is connected to more than one cluster, make it medium-sized
    else if (connected_clusters > 1) {
      children.forEach(function (p) {
        if (p.tagName === "circle") {
          p.setAttribute("r", vueData.radius * 2);
          // text.style("font-size", vueData.node_text_font_size * 1.5);
        }
      });
    }
  });
}

// ####  NAVBAR ########### SEARCH NODES ######################################################################################

function unsearch_nodes_d3() {
  vueData.highlightWobblies = false;
  restart();
}

function search_node_d3() {
  restart();
  let found_matching_string = false;

  // alert if no search term was entered
  if (vueData.searchterm === "") {
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
      if (text.lastIndexOf(vueData.searchterm, 0) === 0) {
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
        if (text.lastIndexOf(vueData.searchterm, 0) === 0) {
          this.setAttribute("stroke", "yellow");
          // highlight matching node
          children.forEach(function (d) {
            if (d.tagName === "text") {
              d.style.fontSize = "16px";
            }
            if (d.tagName === "circle") {
              let new_r = vueData.radius * 2;
              d.setAttribute("r", new_r);
            }
          });
        } else {
          // reduce opacity of the other nodes
          // TODO: reduce opacity of links -> coloured links are a bit to strong
          children.forEach(function (d) {
            if (d.tagName === "text") {
              d.style.opacity = vueData.node_reduced_opacity;
            }
            if (d.tagName === "circle") {
              d.style.opacity = vueData.node_reduced_opacity;
            }
          });
        }

        let links = d3.selectAll(".link");
        links.each(function (d) {
          let children = this.childNodes;
          children.forEach(function (p) {
            p.style.strokeOpacity = vueData.reduced_link_opacity;
          });
        });
      });
      // if no matching node was found, show alert
    } else if (found_matching_string === false) {
      alert("No match found. Please try a different search term.");
    }
    vueData.searchterm = "";
  }
}
// ################# Resize NODES ######################################################################################
function resizeNodes_d3(measure)
{
    rmin = 2; rmax = 999;
    tmin = vueData.radius; tmax = 50;
    attr = {"max": "weight", "avg":"weight_average", "avg_all": "weight_average_all"}[measure]

    console.log(measure, attr)
    let nodes = d3.selectAll(".node").selectAll("g");
    let texts = d3.selectAll(".node").selectAll("g").select("text");

  nodes.each(function (d, i) {

    let children = this.childNodes;
    let text = d3.select(texts.nodes()[i]);
    children.forEach(function (d, i) {

      if (d.tagName == "circle") {

        let weight = parseInt(d.getAttribute(attr))
        console.log(measure, weight)
        if (! isNaN(weight)) {
            let new_r = (weight-rmin) / (rmax-rmin) * (tmax-tmin) + tmin;
            d.setAttribute("r", Math.round(new_r));
            console.log('new r:', d.getAttribute("r"))
        }
      }
    });
  });
}