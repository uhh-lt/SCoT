/*
Renders the graph on the svg element
@param array of objects graph_nodes
@param array of objects graph_links
@param object target: the target word
TODO: NOT NEEDED, DELETE @param string time_diff
*/
async function render_graph(graph_nodes, graph_links, target, time_diff) {

	// Set initial parameters
	var width = 1000;
	var height = 1000;
	var shiftKey;
	var radius = 5;

	// Choose a predefined colour scheme
	var color = d3.scaleOrdinal(d3.schemePaired)

	// Always remove the svg element. Otherwise a new one is appended every time you click the render button
	d3.select("#graph2").select("svg").remove()

	// Create the svg element on which you want to render the graph
	var svg = d3.select("#graph2")
		.on("keydown.brush", keydowned)
		.on("keyup.brush", keyupped)
		.each(function() { this.focus(); })
		.append("svg")
			.attr("id", "svg")
			.attr("width", width)
			.attr("height", height)
			.style("outline", "1px solid")
			.style("margin", "3ex")
		.call(d3.zoom().on("zoom", function () {
    		svg.attr("transform", d3.event.transform)
 			}))
 		.append("g")

	function keydowned(){
		shiftKey = d3.event.shiftKey || d3.event.metaKey;
	}

	function keyupped() {
		shiftKey = d3.event.shiftKey || d3.event.metaKey;
	}

	// append the brush to the svg for dragging multiple nodes at the same time
	var brush = svg.append("g")
		.attr("class", "brush");

	var nodes = graph_nodes;
	var links = graph_links;

	// build a dictionary of nodes that are linked
	var linkedByIndex = {}

	// initialize the class attributes selected and previouslySelected for each node
	nodes.forEach(function(d) {
	    d.selected = false;
	    d.previouslySelected = false;
	  });

	// append the target word to the center of the svg
	var t = svg.append("g")
		.data(target)

	t.append("text")
		.attr("class", "target")
		.attr("x", (width/2))
		.attr("y", (height/2))
		.text(function(d) { return d.target_word; })

	// create the force simulation
	app.simulation = d3.forceSimulation(nodes)
		.force("link", d3.forceLink(links).id(function(d) { return d.id; }).distance(function(d) { return app.linkdistance } ))
		.force("charge", d3.forceManyBody().strength(app.charge).distanceMin(1).distanceMax(2000))
		.force("collide", d3.forceCollide().radius(10))
		.force("center", d3.forceCenter(width/2, height/2))
		.on('tick', ticked);

	var forceLinkDistance = app.simulation.force("link");

	// update the charge strength if the user moves the range input with the value from the Vue data variable charge and restart the simulation with the new value
	d3.select("#range_charge").on("change", function() {
		app.simulation.force("charge", d3.forceManyBody()
			.strength(app.charge)
			.distanceMin(1)
			.distanceMax(2000));
		app.simulation.alpha(1).restart();
	})

	// update the link distance if the user moves the range input with the value from the Vue data variable linkdistance and restart the simulation with the new value
	d3.select("#range_linkdistance").on("change", function() {
		forceLinkDistance.distance(app.linkdistance)
		app.simulation.alpha(1).restart()
	})
	
	// create the graph links
	var link = svg.append("g")
			.attr("stroke", "#999")
			//.attr("stroke-opacity", 0.8)
			.attr("class", "link")
		.selectAll("line")
		.data(links)
		.enter().append("line")
			.attr("source", function(d) { return d.source.id })
			.attr("target", function(d) { return d.target.id })
			.attr("weight", function(d) { return d.weight })
			// set the stroke with in dependence to the weight attribute of the link
			// TODO: sort the weights into three categories and only use three different thicknesses for links according to the category
			.attr("stroke-width", function(d) { return Math.sqrt(d.weight/10);	});

	// initialize drag behaviour
	var drag_node = d3.drag()

	// initialize the tooltip for the time diff mode
	var time_diff_tip = d3.tip()
		.attr("class", "d3-tip")
		.html(function(d) { return app.selectInterval(d.time_ids); })

	// create the nodes
	var node = svg.append("g")
	    	.attr("stroke", "#fff")
	    	.attr("stroke-width", 1.5)
	    	.attr("class", "node")
	    .selectAll("g")
	    .data(nodes)
	    .enter()
	    .append("g")
	    	.on("mousedown", mousedowned)
	    		.call(drag_node)
	    	.on("mouseover", mouseOver(0.2))
	    	.on("mouseout", mouseOut)
	    	.on("click", function(d) {
	    		app.node_selected = true;
	    		app.select_node_is_no_cluster_node = app.is_normal_node();
	   		});
	
	// call the time diff tooltip from the svg
	svg.call(time_diff_tip);
	
	// append circles to the node
	// this is the way the nodes are displayed in the graph
	var circles = node.append("circle")
		.attr("r", function(d) {
			if (d.cluster_node === "true") {
				// if the node is a cluster node make it twice as big
				return radius * 2;
			} else {
				return radius;
			}
		})
		.attr("cluster", function(d) { return d.class; })
		.attr("cluster_id", function(d) { return d.class })
		.attr("cluster_node", function(d) {
			// check if the node is a cluster node and make that information known for later
			if (d.cluster_node === "true") {
				return true;
			} else {
				return false;
			}
		})
		.attr("time_ids", function(d) {return d.time_ids})
		.attr("fill", function(d) { 
			if (d.colour) {
				// if the nodes has an explicit colour use that
				return d.colour
			} else {
				// otherwise look the colour up for the class of the node
				return color(d.class);
			}
		});

	// append a label to the node which displays its id
 	var labels = node.append("text")
		.text(function(d) { return d.id; })
		.style('fill', 'black')
		.style('stroke', 'black')
		.attr('x', 6)
		.attr('y', 3)
		.attr("text", function(d) { return d.id; });

	app.simulation.on("tick", ticked)

	// update the cluster information in the Vue data variable after initializing the graph
	app.get_clusters();

	// release all pinned nodes and restart the simulation
	d3.select("#restart_button").on("click", function() {
		node.each(function(d) {
			//console.log(d)
			d.fx = null;
			d.fy = null;
		});
		app.simulation.alphaTarget(0);
	});

	// determine the dragging behaviour on rendering the graph initially
	// sticky means that the simulation recalculates the other node positions when one has been dragged
	var sticky = app.sticky_mode;

	if (sticky === "false") {
		brush.call(d3.brush()
	    	.extent([[0, 0], [width, height]])
	    	.on("start", brushstarted)
	    	.on("brush", brushed)
	    	.on("end", brushended));

	    drag_node
			.on("start", function() {
				d3.selectAll('.selected').each(dragstart); })
			.on("drag", function() {
				d3.selectAll('.selected').each(dragmove); })
			.on("end", function() {
				d3.selectAll('.selected').each(dragend); });	

	} else if (sticky === "true") {
		drag_node
			.on("start", function() {
				d3.selectAll('.selected').each(dragstart_sticky); })
			.on("drag", function() {
				d3.selectAll('.selected').each(dragmove_sticky); })
			.on("end", function() {
				d3.selectAll('.selected').each(dragend_sticky); });
	} 

	// determine the dragging behaviour if the user switched it on the radio buttons	
	d3.select("#sticky").on("change", function() {
		sticky = app.sticky_mode;

		if (sticky === "false") {
			brush.style("display", "inline")
			brush.call(d3.brush()
		    	.extent([[0, 0], [width, height]])
		    	.on("start", brushstarted)
		    	.on("brush", brushed)
		    	.on("end", brushended));

		    drag_node
				.on("start", function() {
					d3.selectAll('.selected').each(dragstart); })
				.on("drag", function() {
					d3.selectAll('.selected').each(dragmove); })
				.on("end", function() {
					d3.selectAll('.selected').each(dragend); });

		} else if (sticky === "true") {
			// tidy up after brush and unselect all selected nodes
			brush.style("display", "none");
			
			node.classed("selected", function(d) { 
				if (d.selected) {
					d.previouslySelected = d.selected;
					d.selected = ! d.selected;
					return d.selected;
				}
			});

			drag_node
				.on("start", function() {
					d3.selectAll('.selected').each(dragstart_sticky); })
				.on("drag", function() {
					d3.selectAll('.selected').each(dragmove_sticky); })
				.on("end", function() {
					d3.selectAll('.selected').each(dragend_sticky); });
		} 
	})

	// Add cluster nodes when clicking on the apply button in the edit column
	d3.select("#apply_settings_button").on("click", function() {
		//DONE? I need a cluster ID + cluster node ID -> necessary for updating
		for (var i = 0; i < app.clusters.length; i++) {
			var cluster_name = app.clusters[i].cluster_name
			var add_cluster_node = app.clusters[i].add_cluster_node;
			var cluster_colour = app.clusters[i].colour;
			var cluster_id = app.clusters[i].cluster_id;
			var labels = app.clusters[i].labels;

			var text_labels = [];
			var cluster_nodes = []

			for (var j = 0; j < labels.length; j++) {
				text_labels.push(labels[j]["text"]);
				cluster_nodes.push(labels[j]["cluster_node"]);
			}

			var exists = false;
			exists = cluster_node_exists(cluster_id);
			// make sure that each cluster only has one cluster node
			if (add_cluster_node === "true" && !exists) {
				addclusternode(cluster_name, cluster_colour, cluster_id);

				for (var k = 0; k < text_labels.length; k++) {
					addlink(text_labels[k], cluster_name);
				}

			}
		}
		// restart the simulation with the additional nodes and links
		restart();
	})

	// check if a cluster node exists for a specific cluster
	function cluster_node_exists(cluster_id) {
		var nodes = d3.selectAll(".node");
		var exists = false;

		nodes.selectAll("g").each(function(d) {
			childnodes = this.childNodes;

			childnodes.forEach(function(d,i) {
				if (d.tagName === "circle") {
					var is_cluster_node = d.getAttribute("cluster_node");
					var id = d.getAttribute("cluster_id");
					
					if (is_cluster_node === "true" && id === cluster_id) {
						exists = true;
					}
				}
			});
		});
		return exists;
	}

	// Add or remove cluster nodes and edges to the graph and restart the simulation
	// This function is for addin cluster nodes
	function restart() {
		// Apply the general update pattern to the nodes.
		node = node.data(nodes, function(d) { return d.id;});
		node.exit().remove();

		var g = node.enter()
				.append("g")
				.attr("stroke", "#fff")
		    	.attr("stroke-width", 1.5)
		    	.attr("class", "node")
				.on("mousedown", mousedowned)
		    		.call(drag_node)
		    	.on("mouseover", mouseOver(0.2))
		   		.on("mouseout", mouseOut)
		   		.on("click", function(d) {
	    			app.node_selected = true;
	    			app.select_node_is_no_cluster_node = app.is_normal_node();
	   			});

	   	var circle = g.append("circle")
				.attr("fill", function(d) { return d.colour; })
				.attr("r", 10)
				.attr("cluster_id", function(d) { return d.cluster_id; })
		    	.attr("cluster_node", true);

		var text = g.append("text")
			.text(function(d) { return d.id; })
			.style('fill', "black")
			.style('stroke', "black")
			.attr('x', 6)
			.attr('y', 3)
			.attr("text", function(d) { return d.id; });

		node = node.merge(g);

		 // Apply the general update pattern to the links.
		link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
		link.exit().remove();
		link = link.enter().append("line")
			.attr("weight", 10)
			.attr("source", function(d) { return d.source })
			.attr("target", function(d) { return d.target })
			//.attr("stroke-width", 5)
			//.attr("stroke", "#eee")
			.merge(link);

		// Update and restart the app.simulation.
		app.simulation.nodes(nodes);
		app.simulation.force("link").links(links);
		ticked();
		app.simulation.alpha(1).restart();

		// update the object with connected nodes
		linkedByIndex = {};
		links.forEach(function(d) {
		    linkedByIndex[d.source.id + "," + d.target.id] = 1;
		});
	}

	function addlink(source, target) {
		if((source !== undefined) && (target !== undefined)) {
            links.push({"source": source, "target": target});
            restart();
    	}
	}

	function addclusternode(name, colour, cluster_id) {
		nodes.push({"id" : name, "colour" : colour, "cluster_id": cluster_id})
		restart()	
	}

	// On backspace anywhere in the html body delete cluster node
	// TODO: only focus this on the svg element, otherwise it is really annoying when entering stuff in input fields
	d3.select("body").on("keydown", deleteClusterNode)

	function deleteClusterNode(d) {
		var KeyID = event.keyCode;
		if (KeyID === 8) {
			var selected_nodes = d3.selectAll(".node").selectAll("g");

			selected_nodes.each(function(d) {
				if (d.selected) {
					var childnodes = this.childNodes;
					var is_cluster_node;
					var node_name;
					var cluster_id;

					childnodes.forEach(function(d,i) {
						if (d.tagName === "circle") {
							is_cluster_node = d.getAttribute("cluster_node");
							cluster_id = d.getAttribute("cluster_id");
						}
						if (d.tagName === "text") {
							node_name = d.getAttribute("text");
						}
					});

					if (is_cluster_node === "true") {
						deletenode(node_name);
						deletelinks(node_name, cluster_id);
						restart();
					}
				}
			});	
		}
	}

	function deletenode(id) {
		for (var i=0; i < nodes.length; i++) {
			if (nodes[i]["id"] === id) {
				nodes.splice(i,1)
			}
		}		
	}
	
	// TODO: delete cluster_id as parameter 
	function deletelinks(target, cluster_id) {
		var allLinks = d3.select(".link").selectAll("line");

		allLinks.each(function(d) {
			if (this.getAttribute("target") === target) {
				for (var i = 0; i < links.length; i++) {
					if (links[i].target.id === target) {
						links.splice(i, 1);
					}
				}
			}
		});
	}

	// add new nodes and edges to the graph when the user updated the number of nodes and edges
	d3.select("#update_button").on("click", async function() {
		app.update().then((res) => {
			var existing_labels = [];
			for (var j = 0; j < app.clusters.length; j++) {
				var cluster = app.clusters[j];
			
				for (var k=0; k < cluster.labels.length; k++) {
					existing_labels.push(cluster.labels[k].text);
				}
			}

			for (var i = 0; i < app.updated_nodes.length; i++) {
				var new_label = app.updated_nodes[i].id;
				var cluster_class = app.updated_nodes[i].class;
				
					if (!existing_labels.includes(new_label)) {
						// add new nodes to the nodes array
						nodes.push({"id": app.updated_nodes[i].id, "class": app.updated_nodes[i].class, "time_ids": app.updated_nodes[i].time_ids});
					} else {
						// update existing ones (colour, cluster id and cluster name)
						var existing_nodes = d3.selectAll(".node");
						existing_nodes.selectAll("g").each(function(d,i) {
							var label;
							var childnodes = this.childNodes;
							
							childnodes.forEach(function(d,i) {
								if (d.tagName === "text") {
									label = d.getAttribute("text");
								}
							});

							if (new_label === label) {
								childnodes.forEach(function(d,i) {
									if (d.tagName === "circle") {
										var colour = get_colour(cluster_class);

										d.setAttribute("cluster_id", cluster_class);
										d.setAttribute("fill", colour);
										d.setAttribute("cluster", cluster_class);
									}
								});
							}
						});
					}
				}

				nodes.forEach(function(d) {
			    	d.selected = false;
			   		d.previouslySelected = false;
				});

				for (var i = 0; i < app.updated_links.length; i++) {
					if (! links.includes(app.updated_links[i])) {
						// add new links to link array
						links.push(app.updated_links[i]);	
					}
				}
				update_graph()
				app.get_clusters();
		});
	});


	function get_colour(c) {
		return color(c);
	}

	// update the graph with the additional nodes and links
	function update_graph() {
		// Apply the general update pattern to the nodes.
		node = node.data(nodes, function(d) { return d.id;});
		node.exit().remove();

		var g = node.enter()
				.append("g")
				.attr("stroke", "#fff")
		    	.attr("stroke-width", 1.5)
		    	.attr("class", "node")
				.on("mousedown", mousedowned)
		    		.call(drag_node)
		    	.on("mouseover", mouseOver(0.2))
		   		.on("mouseout", mouseOut)
		   		.on("click", function(d) {
	    			app.node_selected = true;
	    			app.select_node_is_no_cluster_node = app.is_normal_node();

	   			});


	   	var circle = g.append("circle")
				.attr("fill", function(d) { return color(d.class); })
				.attr("r", 5)
				.attr("cluster_id", function(d) { return d.class; })
		    	.attr("cluster_node", false)
		    	.attr("time_ids", function(d) { return d.time_ids})
		    	.attr("cluster", function(d) { return d.class; });

		var text = g.append("text")
			.text(function(d) { return d.id; })
			.style('fill', "black")
			.style('stroke', "black")
			.attr('x', 6)
			.attr('y', 3)
			.attr("text", function(d) { return d.id; });

		node = node.merge(g);

		d3.select("#select_time_diff").on("change", function(d) {
			if (app.time_diff === false) {
				circles.attr("fill", function(d) { return color(d.class); })
				circles.on("mouseover", null);
				circles.on("mouseout", null);
			}
			if (app.time_diff === true) {
				circles.on("mouseover", time_diff_tip.show);
				circles.on("mouseout", time_diff_tip.hide);
			}
		});


		// Apply the general update pattern to the links.
		link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
		link.exit().remove();
		link = link.enter().append("line")
			.attr("weight", function(d) { return d.weight })
			.attr("source", function(d) { return d.source })
			.attr("target", function(d) { return d.target })
			.attr("stroke-width", function(d) { return Math.sqrt(d.weight/10); })
			.attr("stroke", "#999")
			.merge(link);

		// Update and restart the app.simulation.
		app.simulation.nodes(nodes);
		app.simulation.force("link").links(links);
		ticked();
		app.simulation.alpha(1).restart();

		// keep track of the connected nodes
		linkedByIndex = {};
		links.forEach(function(d) {
		    linkedByIndex[d.source.id + "," + d.target.id] = 1;
		});
	}

	// Switch between time diff and sense clustering mode
	d3.select("#select_time_diff").on("change", function(d) {
		// sense clustering
		if (app.time_diff === false) {
			var circleChilds = d3.selectAll(".node").selectAll("g").selectAll("circle");

			circleChilds.each(function(d) {
				var node_cluster_id = this.getAttribute("cluster_id");
				for (var i=0; i < app.clusters.length; i++) {
					// set the colour of the nodes back to the cluster colours
					if (node_cluster_id === app.clusters[i].cluster_id) {
						this.setAttribute("fill", app.clusters[i].colour);
					}
				}
			})

			// don't show time diff tooltip
			circles.on("mouseover", null);
			circles.on("mouseout", null);
		}
		if (app.time_diff === true) {
			// show time diff tooltip
			circles.on("mouseover", time_diff_tip.show);
			//circles.on("mouseout", time_diff_tip.hide);
		}
	});

	function brushstarted(){
		if (d3.event.sourceEvent.type !== "end") {
			node.classed("selected", function(d) {
				return d.selected = d.previouslySelected = shiftKey && d.selected;
			});
		}
	}

	function brushed() {
		if (d3.event.sourceEvent.type !== "end") {
			var selection = d3.event.selection;

			node.classed("selected", function(d) {
				return d.selected = d.previouslySelected ^ (selection != null && selection[0][0] <= d.x && d.x < selection[1][0]
				&& selection[0][1] <= d.y && d.y < selection[1][1]);
			});
		}
	 }

	function brushended() {
		if (d3.event.selection != null) {
  			d3.select(this).call(d3.event.target.move, null);
		}
	}

	function mousedowned(d){
		if (shiftKey) {
			d3.select(this).classed("selected", d.selected = !d.selected);
			d3.event.stopImmediatePropagation();
		} else if (!d.selected) {
			node.classed("selected", function(p) { return p.selected = d === p;});
		}	
	}

	// update node and link positions
	function ticked() {
		node
    		.attr("transform", positionNode);
	 	link
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

	}

    function positionNode(d) {
        // keep the node within the boundaries of the svg
        if (d.x < 0) {
            d.x = 0;
        };
        if (d.y < 0) {
            d.y = 0;
        };
        if (d.x > width) {
            d.x = width - 50;
        };
        if (d.y > height) {
            d.y = height - 50;
        };
        return "translate(" + d.x + "," + d.y + ")";
    }

    // update the connected nodes
	linkedByIndex = {};
	links.forEach(function(d) {
    	linkedByIndex[d.source.id + "," + d.target.id] = 1;
	});

	// check the dictionary to see if nodes are linked
	function isConnected(a, b) {
    	return linkedByIndex[a.id + "," + b.id] || linkedByIndex[b.id + "," + a.id] || a.id == b.id;
	}

	// fade nodes on hover
	function mouseOver(opacity) {
		return function(d) {
        	// check all other nodes to see if they're connected
        	// to this one. if so, keep the opacity at 1, otherwise
        	// fade
        	node.style("stroke-opacity", function(o) {
            	thisOpacity = isConnected(d, o) ? 1 : opacity;
            	return thisOpacity;
        	});
        	node.style("fill-opacity", function(o) {
            	thisOpacity = isConnected(d, o) ? 1 : opacity;
            	return thisOpacity;
        	});
        	// also style link accordingly
        	link.style("stroke-opacity", function(o) {
            	return o.source === d || o.target === d ? 1 : opacity;
        	});
        	//link.style("stroke", function(o){
        		// TODO: how to get o.source.colour for graph rendered from db?
        		// works for graph loaded from file
        	//	return o.source === d || o.target === d ? o.source.colour : "#ddd";
        	//});
    	}        
	}

	// fade everything back in
	function mouseOut() {
    	node.style("stroke-opacity", 1);
    	node.style("fill-opacity", 1);
    	link.style("stroke-opacity", 1);
    	//link.style("stroke", "#ddd");
	}

	function dragstart(d) {
		app.simulation.stop()
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
}