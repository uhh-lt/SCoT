function render_graph_from_file(graph) {
	console.log("start rendering graph");
	console.log(graph)

	var width = 1000;
	var height = 1000;
	var shiftKey;

	d3.select("#graph2").select("svg").remove()

	var svg = d3.select("#graph2")
		.on("keydown.brush", keydowned)
		.on("keyup.brush", keyupped)
		.each(function() { this.focus(); })
		.append("svg")
			.attr("id", "svg")
			.attr("width", width)
			.attr("height", height);

	function keydowned(){
		shiftKey = d3.event.shiftKey || d3.event.metaKey;
	}

	function keyupped() {
		shiftKey = d3.event.shiftKey || d3.event.metaKey;
	}

	var nodes = graph.nodes;
	var links = graph.links;
	var target = graph.target;

	target_word = svg.append("g").append("text")
		.attr("class", "target")
		.attr("x", (width/2))
		.attr("y", (height/2))
		.text(target);

	var brush = svg.append("g")
		.attr("class", "brush");

	var link = svg.append("g")
			.attr("stroke", "#999")
			.attr("stroke-opacity", 0.6)
			.attr("class", "link")
		.selectAll("line")
		.data(links).enter().append("line")
		.attr("x1", function(d) { return d.__data__.source.x })
		.attr("y1", function(d) { return d.__data__.source.y })
		.attr("x2", function(d) { return d.__data__.target.x })
		.attr("y2", function(d) { return d.__data__.target.y })
		.attr("stroke-width", function(d) { return Math.sqrt(d.__data__.weight/10); });

	var drag_nodes = d3.drag()
		.on("drag", function() {
    		d3.selectAll(".selected_hey").each(dragmove); })

	var node = svg.append("g")
			.attr("stroke", "#fff")
			.attr("stroke-width", 1.5)
			.attr("class", "node")
		.selectAll("g")
		.data(nodes).enter().append("g")
		.attr("transform", function(d) { return "translate(" + d.node.__data__.x + "," + d.node.__data__.y + ")"; })
		.attr("x", function(d) { return d.node.__data__.x; })
		.attr("y", function(d) { return d.node.__data__.y; })
		.attr("id", function(d) { return d.node.__data__.id; })
    .on("mousedown", mousedowned)
    	.call(drag_nodes)
    .on("mouseover", mouseOver(0.2))
    .on("mouseout", mouseOut);

	var circles = node.append("circle")
		.attr("r", function(d) { return d.circle.r; })
		.attr("cluster", function(d) { return d.circle.cluster; })
		.attr("fill", function(d) { return d.circle.fill; })


	var labels = node.append("text")
		.text(function(d) { return d.node.__data__.id; })
		.style('fill', function(d) { return d.label.style.fill; })
		.style('stroke', function(d) {return d.label.style.stroke; })
		.attr('x', function(d) {return d.label.x; })
		.attr('y', function(d) {return d.label.y; });

	brush.call(d3.brush()
	    .extent([[0, 0], [width, height]])
	    .on("start", brushstarted)
	    .on("brush", brushed)
	    .on("end", brushended));


	function brushstarted(){
		if (d3.event.sourceEvent.type !== "end") {
			node.classed("selected_hey", function(d) {
				//console.log("d.selected: " + d.selected)
				return d.node.__data__.selected = d.node.__data__.previouslySelected = shiftKey && d.node.__data__.selected;
			})
		}
	}

	function brushed() {
		if (d3.event.sourceEvent.type !== "end") {
			var selection = d3.event.selection;

			node.classed("selected_hey", function(d) {
				return d.node.__data__.selected = d.node.__data__.previouslySelected ^ (selection != null && selection[0][0] <= d.node.__data__.x && d.node.__data__.x < selection[1][0]
				&& selection[0][1] <= d.node.__data__.y && d.node.__data__.y < selection[1][1]);
			})
		}
	 }

	function brushended() {
		if (d3.event.selection != null) {
  			d3.select(this).call(d3.event.target.move, null);
		}
	}


	function mousedowned(d){
		if (shiftKey) {
			d3.select(this).classed("selected_hey", function(d) {
				return !d.node.__data__.selected
			});
			d3.event.stopImmediatePropagation();
		} else if (!d.node.__data__.selected) {
			node.classed("selected_hey", function(p) {
				if (d === p) {
					p.node.__data__.selected = true;
					return p.node.__data__.selected;
				} else {
					p.node.__data__.selected = false;
					return p.node.__data__.selected;
				}
		});
		}	
	}

	// build a dictionary of nodes that are linked
    var linkedByIndex = {};
    links.forEach(function(d) {
        linkedByIndex[d.__data__.source.id + "," + d.__data__.target.id] = 1;
    });

    // check the dictionary to see if nodes are linked
    function isConnected(a, b) {
        return linkedByIndex[a.node.__data__.id + "," + b.node.__data__.id] || linkedByIndex[b.node.__data__.id + "," + a.node.__data__.id] || a.node.__data__.id == b.node.__data__.id;
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
                return o.__data__.source.id === d.node.__data__.id || o.__data__.target.id === d.node.__data__.id ? 1 : opacity;
            });
            link.style("stroke", function(o){
                return o.__data__.source.id === d.node.__data__.id || o.__data__.target.id === d.node.__data__.id ? o.__data__.source.colour : "#ddd";
            });
        };
    }

    function mouseOut() {
        node.style("stroke-opacity", 1);
        node.style("fill-opacity", 1);
        link.style("stroke-opacity", 1);
        link.style("stroke", "#ddd");
    }

    function dragmove(d) {
		nudge(d3.event.dx, d3.event.dy);
	}

	function nudge(dx, dy) {
		node.filter(function(d) { return d.node.__data__.selected; })
			.attr("x", function(d) { return d.node.__data__.x += dx; })
			.attr("y", function(d) { return d.node.__data__.y += dy; })
			.attr("transform", function(d) { return "translate(" + d.node.__data__.x + "," + d.node.__data__.y + ")"; })

		// find source node id in links, find node in nodes, check selected. if so update link positions to node source node position
		var selected_nodes = node.filter(function(d) { return d.node.__data__.selected; });

		console.log(selected_nodes);
		selected_nodes.each(function(d) {
			link.filter(function(f) {
				return f.__data__.source.id === d.node.__data__.id;
			})
			.attr("x1", d.node.__data__.x)
			.attr("y1", d.node.__data__.y);
		});

		selected_nodes.each(function(d) {
			link.filter(function(f) {
				return f.__data__.target.id === d.node.__data__.id;
			})
			.attr("x2", d.node.__data__.x)
			.attr("y2", d.node.__data__.y);
		});
	}

}