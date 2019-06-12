function render_graph(url, time_diff) {
	console.log("start rendering graph")

	var width = 1000;
	var height = 1000;
	var shiftKey;
	var radius = 5;

	var color = d3.scaleOrdinal(d3.schemeCategory20)

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


	/* Load and bind data */
	d3.json(url, function(error, data) {
		if (error) throw error;
		
		var graph = data[0];
		var target = [data[1]];
		//console.log(target)

		var nodes = graph.nodes;
		var links = graph.links;

		nodes.forEach(function(d) {
		    d.selected = false;
		    d.previouslySelected = false;
		  });

		var t = svg.append("g")
			.data(target)

		t.append("text")
			.attr("class", "target")
			.attr("x", (width/2))
			.attr("y", (height/2))
			.text(function(d) { return d.target_word; })

		var brush = svg.append("g")
			.attr("class", "brush");

		var simulation = d3.forceSimulation(nodes)
			.force("link", d3.forceLink(links).id(function(d) { return d.id; }))
			.force("charge", d3.forceManyBody().strength(-10))
			.force("collide", d3.forceCollide().radius(10))
			.force("center", d3.forceCenter(width/2, height/2))
			//.on('tick', ticked);

		var link = svg.append("g")
				.attr("stroke", "#999")
				.attr("stroke-opacity", 0.6)
				.attr("class", "link")
			.selectAll("line")
			.data(links)
			.enter().append("line")
				.attr("stroke-width", function(d) { return Math.sqrt(d.weight/10); });

		var drag_node = d3.drag()
			.on("start", function() {
				d3.selectAll('.selected').each(dragstart); })
			.on("drag", function() {
				d3.selectAll('.selected').each(dragmove); })
			.on("end", function() {
				d3.selectAll('.selected').each(dragend); });

		var node = svg.append("g")
		    	.attr("stroke", "#fff")
		    	.attr("stroke-width", 1.5)
		    	.attr("class", "node")
		    .selectAll("g")
		    .data(nodes)
		    .enter().append("g")
		    .on("mousedown", mousedowned)
		    .call(drag_node)
		    .on("mouseover", mouseOver(0.2))
		    .on("mouseout", mouseOut);

		var circles = node.append("circle")
			.attr("r", radius)
			.attr("cluster", function(d) {return d.class; })
			.attr("fill", function(d) { return color(d.class); });

	 	var labels = node.append("text")
			.text(function(d) { return d.id; })
			.style('fill', function(d) {
				if (d.status == 'birth') {
					return "green";
				}
				if (d.status == 'death') {
					return "red";
				}
				if (d.status == 'shortlived') {
					return "orange"
				}
				else {
					return "black";
				}
			})
			.style('stroke', function(d) {
				if (d.status == 'birth') {
					return "green";
				}
				if (d.status == 'death') {
					return "red";
				}
				if (d.status == 'shortlived') {
					return "orange"
				}
				else {
					return "black";
				}
			})
			.attr('x', 6)
			.attr('y', 3);

		simulation.on("tick", ticked)

		brush.call(d3.brush()
		    .extent([[0, 0], [width, height]])
		    .on("start", brushstarted)
		    .on("brush", brushed)
		    .on("end", brushended));


		function brushstarted(){
			if (d3.event.sourceEvent.type !== "end") {
				node.classed("selected", function(d) {
					return d.selected = d.previouslySelected = shiftKey && d.selected;
				})
			}
		}

		function brushed() {
			if (d3.event.sourceEvent.type !== "end") {
				var selection = d3.event.selection;
				node.classed("selected", function(d) {
					return d.selected = d.previouslySelected ^ (selection != null && selection[0][0] <= d.x && d.x < selection[1][0]
					&& selection[0][1] <= d.y && d.y < selection[1][1]);
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
				d3.select(this).classed("selected", d.selected = !d.selected);
				d3.event.stopImmediatePropagation();
			} else if (!d.selected) {
				node.classed("selected", function(p) { return p.selected = d === p;});
			}	
		}


		function ticked() {
			node
        		.attr("transform", positionNode);
		 	link
				.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

		};

		    // move the node based on forces calculations
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

	// build a dictionary of nodes that are linked
    var linkedByIndex = {};
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
            link.style("stroke", function(o){
                return o.source === d || o.target === d ? o.source.colour : "#ddd";
            });
        };
    }

    function mouseOut() {
        node.style("stroke-opacity", 1);
        node.style("fill-opacity", 1);
        link.style("stroke-opacity", 1);
        link.style("stroke", "#ddd");
    }

		function dragstart(d, i) {
			simulation.stop()
		}

		function dragmove(d, i) {
			d.px += d3.event.dx;
	        d.py += d3.event.dy;
	        d.x += d3.event.dx;
	        d.y += d3.event.dy; 
        	ticked();
		}

		function dragend(d, i) {
			//d.fixed() = true;
			ticked();
		}

		
	});

}