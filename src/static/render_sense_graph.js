function render_graph(url) {
	console.log("start rendering graph")

	var width = 960;
	var height = 600;
	var shiftKey;


	var color = d3.scaleOrdinal(d3.schemeCategory20)
	/* Set up the SVG elements*/

	d3.select("body").select("svg").remove()

	var svg = d3.select("body")
		.on("keydown.brush", keydowned)
		.on("keyup.brush", keyupped)
		.each(function() { this.focus(); })
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	function keydowned(){
		shiftKey = d3.event.shiftKey || d3.event.metaKey;
	}

	function keyupped() {
		shiftKey = d3.event.shiftKey || d3.event.metaKey;
	}


	/* Load and bind data */
	d3.json(url, function(error, graph) {
		if (error) throw error;

		var nodes = graph.nodes;
		var links = graph.links;

		nodes.forEach(function(d) {
		    d.selected = false;
		    d.previouslySelected = false;
		  });

		var brush = svg.append("g")
			.attr("class", "brush");


		var simulation = d3.forceSimulation(nodes)
			.force("link", d3.forceLink(links).id(function(d) { return d.id; }))
			.force('charge', d3.forceManyBody())
			.force('center', d3.forceCenter(width/2, height/2))
			//.on('tick', ticked);

		var link = svg.append("g")
				.attr("stroke", "#999")
				.attr("stroke-opacity", 0.6)
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
		    .selectAll("g")
		    .data(nodes)
		    .enter().append("g")
		    .on("mousedown", mousedowned)
		    .call(drag_node);

		var circles = node.append("circle")
			.attr("r", 5)
			.attr("fill", function(d) { return color(d.class); });

	 	var labels = node.append("text")
			.text(function(d) { return d.id; })
			.attr('x', 6)
			.attr('y', 3);

		simulation.on("tick", ticked)

		brush.call(d3.brush()
		    .extent([[0, 0], [width, height]])
		    .on("start", brushstarted)
		    .on("brush", brushed));
		    //.on("end", brushended));

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
		 	link
				.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

			node
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
		};

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