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
		.selectAll("line");

	link.data(links).enter().append("line")
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

	node.data(nodes).enter().append("g")
	    .on("mousedown", mousedowned)
	    .call(drag_node)
	    .on("mouseover", mouseOver(0.2))
	    .on("mouseout", mouseOut);
}