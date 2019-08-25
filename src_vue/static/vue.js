app = new Vue({
   el: "#vue-app",
   data: {
   		target_word : "",
     	start_year : 0,
     	end_year : 0,
     	senses : 0,
     	edges : 0,
     	time_diff : false,
     	start_years : [],
     	end_years : [],
     	file : null,
     	read_graph : null,
     	graph_rendered : false,
     	clusters : [],
     	newclusters : {},
     	sticky_mode : "true",
     	charge : -10,
     	linkdistance : 100,
     	graph_from_file : false,
     	singletons : [],
     	data_from_db : {},
     	simulation : null,
     	update_senses : 0,
     	update_edges : 0,
     	updated_nodes : null,
     	updated_links : null,
     	interval_start : 0,
     	interval_end : 0,
     	interval_time_ids : []
	},
	computed: {
		reducedStartYears: function() {
			reducedStartYears = [];
			for (var i=0; i < app.start_years.length; i++) {
				if (app.start_years[i].value >= app.start_year && app.end_year > app.start_years[i].value ) {
					reducedStartYears.push(app.start_years[i]);
				} 
			}
			return reducedStartYears;
		},
		reducedEndYears: function() {
			reducedEndYears = []
			for (var i=0; i < app.end_years.length; i++) {
				if (app.end_years[i].value <= app.end_year && app.end_years[i].value > app.interval_start) {
					reducedEndYears.push(app.end_years[i]);
				}
			}
			return reducedEndYears;
		}
	},
	methods: {
		selectInterval: function(time_ids) {
			var intervalString = "";
			//time_ids = time_ids.split(",");
			time_ids.sort();
			for (time_id of time_ids) {
				//var time_id = time_ids[i];
				//console.log(time_id);
				var start = app.start_years[time_id - 1].text;
				var end = app.end_years[time_id - 1].text;
				//console.log(start, end)
				intervalString += start + " - " + end + "<br>"
			}
			
			return intervalString;
		},
		show_time_diff: async function() {
			var big_time_interval = [];
			await axios.get("./interval/" + app.start_year + "/" + app.end_year)
				.then((res) => {
					big_time_interval = res.data;
				})
				.catch((error) => {
					console.error(error)
				});

			var small_time_interval = [];
			await axios.get("./interval/" + app.interval_start + "/" + app.interval_end)
				.then((res) => {
					small_time_interval = res.data;
				})
				.catch((error) => {
					console.error(error)
				});

			//console.log(big_time_interval, small_time_interval)

			var period_before = [];
			var period_after = [];

			var small_interval_start_time_id = Math.min(...small_time_interval);
			var small_interval_end_time_id = Math.max(...small_time_interval)

			for (var i=0; i<big_time_interval.length; i++) {
				if (big_time_interval[i] < small_interval_start_time_id) {
					period_before.push(big_time_interval[i]);
				} else if (big_time_interval[i] > small_interval_end_time_id) {
					period_after.push(big_time_interval[i]);
				}
			}

			console.log(period_before, period_after);
			
			var nodes = d3.selectAll(".node").selectAll("g");

			nodes.each(function(d) {
				var childnodes = this.childNodes;
				childnodes.forEach(function(d){
					if (d.tagName === "circle") {
						var time_ids = d.getAttribute("time_ids").split(",");
						time_ids = time_ids.map(x => parseInt(x))
						console.log(time_ids);

						var born = true;
						var deceased = true;
						
						for (var i = 0; i < time_ids.length; i++) {
							var t = time_ids[i];
							if (period_after.includes(t)) {
								deceased = false;
							}
							if (period_before.includes(t)) {
								born = false;
							}
						}

						if(born===true && deceased===true) {
							d.setAttribute("fill", "yellow");
						} else if (born===true) {
							d.setAttribute("fill", "green");
						} else if (deceased===true) {
							d.setAttribute("fill", "red");
						} else {
							d.setAttribute("fill", "grey");
						}
						// would be good to see exactly the time slices of the respective nodes
					}
				});
			});
		},
		update_graph: function() {
			var target_word = this.target_word;
			var start_year = this.start_year;
			var end_year = this.end_year;
			var senses = this.update_senses;
			var edges = this.update_edges;
			var time_diff = this.time_diff;

			app.time_diff = false;
			//var url = './sense_graph' + '/' + encodeURIComponent(target_word) + '/' + start_year + '/' + end_year + '/' + senses + '/' + edges + '/' + time_diff;
			var url = './sense_graph' + '/' + target_word + '/' + start_year + '/' + end_year + '/' + senses + '/' + edges;
			
			axios.get(url)
				.then((res) => {
					//console.log(res.data)
					this.data_from_db = res.data;
					app.updated_nodes = this.data_from_db[0].nodes;
					//console.log(app.updated_nodes.length)
					app.updated_links = this.data_from_db[0].links;
					//var target = [this.data_from_db[1]];
					app.singletons = this.data_from_db[2].singletons;
					
					//update_existing_graph(nodes, links);
					
					//await this.$nextTick();

				})
				.catch((error) => {
					console.error(error);
			});


		},
		restart_sim: function() {
			var node = d3.selectAll(".node")
			//console.log(node)
			app.simulation.alpha(1).restart();
		},
		set_cluster_opacity: function(cluster, opacity, link_opacity) {
			//console.log("mouseover" + cluster.cluster_id);
			var cluster_id = cluster.cluster_id;
			var cluster_nodes = [];

			for (var i = 0; i < cluster.labels.length; i++) {
				cluster_nodes.push(cluster.labels[i].text);
			}

			var svg = d3.select("#svg");
			var nodes = svg.selectAll(".node");
			var links = svg.selectAll(".link");

			nodes.selectAll("g").each(function(d,i) {
				var childnodes = this.childNodes;
				var node_text;
				var node_cluster_id;
				childnodes.forEach(function(d,i) {
					if (d.tagName === "circle") {
						node_cluster_id = d.getAttribute("cluster_id");
					}
					if (d.tagName === "text") {
						node_text = d.getAttribute("text");
					}
				})
				//console.log(cluster_nodes, node_text)
				if (! cluster_nodes.includes(node_text)) {
					//this.setAttribute("style", "stroke-opacity:" + opacity);
					//this.setAttribute("style", "fill-opacity:" + opacity);
					this.style.strokeOpacity = opacity;
					this.style.fillOpacity = opacity;
					// childnodes.forEach(function(d,i) {
					// 	if (d.tagName === "circle") {
					// 		d.setAttribute("style", "stroke-opacity:" + opacity)
					// 		d.setAttribute("style", "fill-opacity:" + opacity)
					// 	}
					// 	if (d.tagName === "text") {
					// 		d.setAttribute("style", "stroke-opacity:" + opacity)
					// 		d.setAttribute("style", "fill-opacity:" + opacity)
					// 	}
					// })
				}

			})

			//console.log(links)
			links.each(function(d,i) {
				//console.log(this)
				var childnodes = this.childNodes;
				childnodes.forEach(function(d,i) {
					var source = d.getAttribute("source");
					var target = d.getAttribute("target");
					if (!cluster_nodes.includes(source) || !cluster_nodes.includes(target)) {
						d.setAttribute("style", "stroke-opacity:" + link_opacity);
					} 
					if (cluster_nodes.includes(source) && cluster_nodes.includes(target)) {
						if (opacity < 1) {
							d.setAttribute("style", "stroke:" + cluster.colour)
						} else {
							d.setAttribute("style", "stroke: #999;")
						}
					}

				}) 
				
			})

		},
		recluster: function() {
			document.getElementById("edit_clusters_popup").style.display = "none";			

			var svg = d3.select("#svg");
			var nodes = svg.selectAll(".node");
			var links = svg.selectAll(".link");

			var data = {};

			var nodes_array = [];
			nodes.selectAll("g").each(function(d,i) {
				childnodes = this.childNodes;

				var is_cluster_node;
				childnodes.forEach(function(d,i) {
					if (d.tagName === "circle") {
						is_cluster_node = d.getAttribute("cluster_node");
					}
				});

				if (is_cluster_node === "false") {
					childnodes.forEach(function(d,i) {
						if(d.tagName === "text") {
							nodes_array.push(d.getAttribute("text"));
						}
					});
				}
				
			})

			data['nodes'] = nodes_array;

			var link_array = [];

			links.each(function(d,i) {
				childnodes = this.childNodes;
				childnodes.forEach(function(d,i) {
					var link = {}
					var source = d.getAttribute("source");
					var target = d.getAttribute("target");

					if (nodes_array.includes(source) && nodes_array.includes(target)) {
						link['source'] = source;
						link['target'] = target;

						//var strokewidth = d.getAttribute("stroke-width");
						//var weight = Math.pow(strokewidth, 2) * 10;
						link['weight'] = d.getAttribute("weight");

						link_array.push(link);	
					}
					
				})
				
			})

			data["nodes"] = nodes_array;
			data["links"] = link_array;

			axios.post('./reclustering', data)
				.then(function (response) {
				    this.newclusters = response.data;

				    var colour = d3.scaleOrdinal(d3.schemePaired);

				    var newClusteredNodes = this.newclusters.nodes;

				    //var svg = d3.select("#svg")
				    //var nodes = svg.selectAll(".node");

				    for (var i=0; i<newClusteredNodes.length; i++) {
				    	var node_id = newClusteredNodes[i].id;
				    	var node_new_cluster = newClusteredNodes[i].class;

				    	var texts = nodes.selectAll("g").select("text");
				    	var circles = nodes.selectAll("g").select("circle");
				    	//console.log(text)
				    	//console.log(circle)
				    	//d3.select(someSelection.nodes()[i])
				    	texts.each(function(d,i) {
				    		var t = d3.select(this);
				    		//console.log(t)
				    		if (t.attr("text") === node_id) {
				    			//console.log(t.attr("text"));
				    			var circle = d3.select(circles.nodes()[i])
				    			//console.log(circle);
				    			circle.attr("cluster", node_new_cluster)
				    			circle.attr("fill", function() {return colour(node_new_cluster) })
				    			circle.attr("cluster_id", node_new_cluster);
				    			circle.attr("cluster_node", "false");
				    		}
				    	})
				    }

				    

				  })
				  .catch(function (error) {
				    console.log(error);
				  });


			
			// get links (source, target, weight)
			// post to API -> call chinese whispers
			// get response (clustered graph)
			// for each node set Attribute cluster, fill according to cluster
		},
		resetZoom: function() {
			var svg = d3.select("#svg");
			svg.select("g")
				.attr("transform", "translate(0.0, 0.0) scale(1.0)");
		},
		getStartYears: function() {
			axios.get('./start_years')
				.then((res) => {
					this.start_years = res.data;
				})
				.catch((error) => {
					console.error(error);
				});
		},
		getEndYears: function() {
			axios.get('./end_years')
				.then((res) => {
					this.end_years = res.data;
				})
				.catch((error) => {
					console.error(error);
				});

		},
		applyClusterSettings: function() {
			var svg = d3.select("#svg");
			var nodes = svg.selectAll(".node");

			for (var i = 0; i < this.clusters.length; i++) {
				var cluster_id = this.clusters[i].cluster_id;
				var cluster_name = this.clusters[i].cluster_name;
				var colour = this.clusters[i].colour;
				var add_cluster_node = this.clusters[i].add_cluster_node;
				var labels = this.clusters[i].labels;
				var text_labels = [];

				for (var j = 0; j < labels.length; j++) {
					text_labels.push(labels[j].text);
				}

				nodes.selectAll("g").each(function(d,i) {
					var node_cluster;
					var node_fill;
					var node_label;

					childnodes = this.childNodes;

					childnodes.forEach(function(d,i) {
						if (d.tagName === "circle") {
							node_cluster = d.getAttribute('cluster');
							node_fill = d.getAttribute('fill');
						}
						if (d.tagName === "text") {
							node_label = d.getAttribute('text');
						}
					});

					if (text_labels.includes(node_label)) {
						childnodes.forEach(function(d,i) {
							if (d.tagName === "circle") {
								d.setAttribute('cluster', cluster_name);
								d.setAttribute('fill', colour);
							}
						});
					}

				});

				// add
				// if (cluster_node === "true") {
				// 	app.add_cluster_node(cluster_name, colour, labels);
				// }
			}
		},
		showEditMask: function() {
			app.get_clusters();
			document.getElementById("edit_clusters_popup").style.display = "block";
		},
		get_clusters: function() {

				app.clusters = [];
				var clusters = [];
				
				var svg = d3.select("#svg");
				var nodes = svg.selectAll(".node");

				nodes.selectAll("g").each(function(d,i) {
					var cluster = {};
					var exists = false;
					var cluster_name;
					var colour;
					var text;
					var cluster_id;
					var cluster_node;

					childnodes = this.childNodes;
					childnodes.forEach(function(d,i) {
						
						if (d.tagName === "circle") {
							cluster_name = d.getAttribute("cluster");
							cluster_id = d.getAttribute("cluster_id");
							colour = d.getAttribute("fill");
							//console.log(d.getAttribute("cluster_node"));
							cluster_node = d.getAttribute("cluster_node");
						}

						if (d.tagName === "text") {
							text = d.getAttribute("text");
						}
					});

					//console.log(cluster_id, text)

					clusters.forEach(function(c,i) {
						if (c.cluster_name === cluster_name) {
							exists = true;
							if (cluster_node === "false") {
								c.labels.push({"text": text, "cluster_node": cluster_node})
							}
						}
					});

					if (! exists) {
						cluster["cluster_id"] = cluster_id;
						cluster["cluster_name"] = cluster_name;
						cluster["colour"] = colour;
						cluster["add_cluster_node"] = false;
						cluster.labels = []
						if (cluster_node === "false") {
							cluster["labels"].push({"text": text, "cluster_node": cluster_node});
						}
						if (cluster.labels.length > 0) {
							clusters.push(cluster)
						}
						
					}

					//console.log(clusters)
			 	});

				for (var i=0; i < clusters.length; i++) {
					Vue.set(app.clusters, i, clusters[i]);
				}
		},
		render_graph: async function() {
			this.getData();
			this.graph_from_file = false;
			this.graph_rendered = false;
			await this.$nextTick();
			

		},
		getData: function() {
			//console.log(this.target_word)
			var target_word = this.target_word;
			var start_year = this.start_year;
			var end_year = this.end_year;
			var senses = this.senses;
			var edges = this.edges;
			var time_diff = this.time_diff;

			//var url = './sense_graph' + '/' + encodeURIComponent(target_word) + '/' + start_year + '/' + end_year + '/' + senses + '/' + edges + '/' + time_diff;
			var url = './sense_graph' + '/' + target_word + '/' + start_year + '/' + end_year + '/' + senses + '/' + edges;
			
			axios.get(url)
				.then((res) => {
					console.log(res.data)
					this.data_from_db = res.data;
					var nodes = this.data_from_db[0].nodes;
					//console.log(nodes.length)
					var links = this.data_from_db[0].links;
					var target = [this.data_from_db[1]];
					app.singletons = this.data_from_db[2].singletons;
					render_graph(nodes, links, target, this.time_diff)
					this.graph_rendered = true;
					app.get_clusters()
					//await this.$nextTick();

				})
				.catch((error) => {
					console.error(error);
				});

			
		},
		saveGraph: function() {
			var svg = d3.select("#svg");

			var links = svg.selectAll(".link");
			var nodes = svg.selectAll(".node");

			var graph_links = [];
			var graph_nodes = [];

			links.selectAll("line").each(function(d,i) {
				var source = this.getAttribute("source");
				var target = this.getAttribute("target");
				var weight = this.getAttribute("weight");
				var link = {};

				link["source"] = source;
				link["target"] = target;
				link["weight"] = weight;

				graph_links.push(link);
			});


			nodes.selectAll("g").each(function(d,i) {
				var x = this.__data__.x;
				var y = this.__data__.y;
				var fx = this.__data__.fx;
				var fy = this.__data__.fy;
				var id = this.__data__.id;
				var cluster_id;
				var cluster_name;
				var is_cluster_node;
				var colour;

				var node = {}

				var childnodes = this.childNodes;
				childnodes.forEach(function(d,i) {
					if (d.tagName === "circle") {
						cluster_id = d.getAttribute("cluster_id");
						cluster_name = d.getAttribute("cluster");
						is_cluster_node = d.getAttribute("cluster_node");
						colour = d.getAttribute("fill");
					}
				})

				node["id"] = id;
				node["x"] = x;
				node["y"] = y;
				node["fx"] = fx;
				node["fy"] = fy;
				node["class"] = cluster_id;
				node["cluster_name"] = cluster_name;
				node["cluster_node"] = is_cluster_node;
				node["colour"] = colour;

				graph_nodes.push(node);

			})


			
			var graph = {};
			graph['links'] = graph_links;
			graph['nodes'] = graph_nodes;
			graph['singletons'] = app.singletons;
			graph['target'] = app.target_word;
			graph['link_distance'] = app.linkdistance;
			graph['charge'] = app.charge;
			graph['start_year'] = app.start_year;
			graph['end_year'] = app.end_year;
			graph['time_diff'] = app.time_diff;

			var data = JSON.stringify(graph, null, 2);
			var blob = new Blob([data], {type: 'text/plain'});

			const a = document.createElement('a');
		    document.body.appendChild(a);
		    const url = window.URL.createObjectURL(blob);
		    a.href = url;
		    a.download = "graph.json";
		    a.click();
		    setTimeout(() => {
		      window.URL.revokeObjectURL(url);
		      document.body.removeChild(a);
		    }, 0)

		},
		loadGraph: function() {
			document.getElementById("loadpopup").style.display = "none";
			document.getElementById("edit_clusters_popup").style.display = "none";	
			app.graph_from_file = true;
			const file = this.file;
			const reader = new FileReader()

			reader.onload = function(e) {
			  this.read_graph = JSON.parse(reader.result);
			  //console.log(this.read_graph);
			  if (this.read_graph.singletons) {
			  	app.singletons = this.read_graph.singletons;
			  } else {
			  	app.singletons = [];
			  }
			  
			  var nodes = this.read_graph.nodes;
			  var links = this.read_graph.links;
			  var target = this.read_graph.target;
			  app.target_word = target;
			  app.charge = this.read_graph.charge;
			  app.linkdistance = this.read_graph.link_distance;
			  app.start_year = this.read_graph.start_year;
			  app.end_year = this.read_graph.end_year;
			  app.time_diff = this.read_graph.time_diff;
			  //console.log(nodes, links, target);
			  render_graph(nodes, links, target, app.time_diff);
			}
			reader.readAsText(file);
			
			app.graph_rendered = true;
		},
		closeForm: function(id) {
			document.getElementById(id).style.display = "none";
		},
		displayForm: function() {
			document.getElementById("loadpopup").style.display = "block";
		}
	},
	created() {
		this.getStartYears();
		this.getEndYears();
	}

});