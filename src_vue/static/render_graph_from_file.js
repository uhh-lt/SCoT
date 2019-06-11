function render_graph_from_file(graph) {
	console.log("start rendering graph");
	console.log(graph)

	var width = 1000;
	var height = 1000;

	d3.select("#graph2").select("svg").remove()

	var svg = d3.select("#graph2").append(svg)
		.attr("id", "svg")
		.attr("width", width)
		.attr("height", height);

		var nodes = graph.nodes;
		var links = graph.links;
		var target = graph.target;
		console.log(nodes)
		console.log(links)
		console.log(target)

}