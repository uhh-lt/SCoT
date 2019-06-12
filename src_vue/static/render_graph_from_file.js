function render_graph_from_file(graph) {
	console.log("start rendering graph");
	console.log(graph)

	var width = 1000;
	var height = 1000;

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
	console.log(nodes)
	console.log(links)
	console.log(target)

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

	var node = svg.append("g")
			.attr("stroke", "#fff")
			.attr("stroke-width", 1.5)
			.attr("class", "node")
		.selectAll("g")
		.data(nodes).enter().append("g")
			.attr("transform", function(d) {return "translate(" + d.node.__data__.x + "," + d.node.__data__.y + ")"; } )
			.attr("selected", function(d) { return d.node.__data__.selected; })
			.attr("id", function(d) { return d.node.__data__.id; })
	    .on("mousedown", mousedowned)
	    //	.call(drag_node)
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


	console.log(circles);

	function mousedowned(d){
		if (shiftKey) {
			d3.select(this).classed("selected", d.selected = !d.selected);
			d3.event.stopImmediatePropagation();
		} else if (!d.selected) {
			node.classed("selected", function(p) { return p.selected = d === p;});
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
}