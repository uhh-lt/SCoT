app = new Vue({
   el: "#vue-app",
   data: {
   		viewport_height : 550,
   		viewport_width : 950,
   		svg_height : 1500,
   		svg_width : 1500,
   		target_word : "happiness/NN",
     	start_year : 1520,
     	end_year : 2008,
     	senses : 100,
     	edges : 30,
     	time_diff : false,
     	start_years : [],
     	end_years : [],
     	min_time_id : 1,
     	max_time_id: 10,
     	file : null,
     	read_graph : null,
     	graph_rendered : false,
     	clusters : [],
     	newclusters : {},
     	sticky_mode : "true",
     	charge : -50,
     	linkdistance : 100,
     	graph_from_file : false,
     	singletons : [],
     	data_from_db : {},
     	simulation : null,
     	update_senses : 150,
     	update_edges : 50,
     	updated_nodes : null,
     	updated_links : null,
     	interval_start : 0,
     	interval_end : 0,
     	interval_time_ids : [],
     	interval_id : 0,
     	time_diff_nodes : {},
     	node_selected : false,
     	select_node_is_no_cluster_node : true,
     	clicked_nodes : [],
     	new_assigned_cluster : {},
     	created_cluster_name : "",
     	created_cluster_colour : "",
     	cluster_selected : false,
     	searchterm : "",
     	centrality_scores : [],
     	centrality_fields : [{key: "text", label: "Node", sortable: true}, {key: "centrality_score", sortable: true}],
     	centrality_threshold_s : "0.0",
     	centrality_threshold_m : "0.1",
     	centrality_score_distribution : [],
     	edit_column_open : false,
     	highlightWobblies : false,
     	hightlighInbetweennessCentrality : false,
     	wobblyCandidatesFields : [{key:"text", label: "Node", sortable: true}, {key: "connected_clusters", label: "Connected Clusters", sortable: false}, {key: "balanced", label: "Balanced", sortable: true}, {key: "show_details", label: "Show Details"}],
     	wobblyCandidates : [],
     	deleteable_cluster : {}
	},
	computed: {
		/*
		Returns all the clusters as an array of objects of the form 
			{"text": cluster_name}, "value": {"cluster_id": some_id, "cluster_name": some_cluster_name, "colour": some_cluster_colour}
		to be used as the options when selecting a different cluster for a node.
		All the information about the clusters is already stored in the data variable clusters.
		*/
		cluster_options: function() {
			app.new_assigned_cluster = {}
			options = [];
			for (var i=0; i < app.clusters.length; i++) {
				options.push(
					{"text": app.clusters[i].cluster_name, "value": {"cluster_id" : app.clusters[i].id, "cluster_name": app.clusters[i].cluster_name, "colour": app.clusters[i].colour}}
				);			
			}
			return options;
		},
		/*
		Returns all the possible start years for the small time diff interval.
		*/
		reducedStartYears: function() {
			reducedStartYears = [];
			for (var i=0; i < app.start_years.length; i++) {
				if (app.start_years[i].value >= app.start_year && app.end_year > app.start_years[i].value ) {
					reducedStartYears.push(app.start_years[i]);
				} 
			}
			return reducedStartYears;
		},
		/*
		Returns all the possible end years for the small time diff interval.
		Takes into account the selected start year of the small time diff interval.
		*/
		reducedEndYears: function() {
			reducedEndYears = []
			for (var i=0; i < app.end_years.length; i++) {
				if (app.end_years[i].value <= app.end_year && app.end_years[i].value > app.interval_start) {
					reducedEndYears.push(app.end_years[i]);
				}
			}
			return reducedEndYears;
		},
		/*
		Returns a string showing the start and end year of a time slice
		*/
		time_slice_from_interval: function() {
			var start = app.start_years[app.interval_id - 1];
			var end = app.end_years[app.interval_id - 1];
			if (typeof start === "undefined") {
				start = "-"
			} else {
				start = start.text;
			}
			if (typeof end === "undefined") {
				end = "-"
			} else {
				end = end.text
			}

			return start + " - " + end
		}
	},
	methods: {
		update_general_settings: function() {
			var svg = d3.select("svg");
			svg.attr("viewBox", "0 0 " + app.svg_height + " " + app.svg_width)
			svg.attr("width", app.viewport_width);
			svg.attr("height", app.viewport_height);
			app.simulation.alpha(0).restart()
		},
		getClusterNameFromID: function(id) {
			var cluster_name;
			for (var i=0; i < app.clusters.length; i++) {
				if (id === app.clusters[i].cluster_id) {
					cluster_name = app.clusters[i].cluster_name;
				}
			}
			return cluster_name;
		},
		findClusterId: function(node_id) {
			var cluster_id;
			for (var i = 0; i < app.clusters.length; i++) {
				var labels = [];
				var cluster = app.clusters[i];
				for(var j = 0; j < cluster.labels.length; j++) {
					labels.push(cluster.labels[j].text);
				}
				if (labels.includes(node_id)) {
					cluster_id = cluster.cluster_id;
				}
			}
			return cluster_id;
		},
		findNeighbourhoodClusters: function(node) {
			neighbourhoodClusters = {};
			var links = d3.selectAll(".link");
			links.each(function(d) {
				var children = this.childNodes;
				var neighbour_cluster;
				children.forEach(function(p) {
					var source = p.getAttribute("source");
					var target = p.getAttribute("target");
					if (source === node) {
						neighbour_cluster = app.findClusterId(target);
						if (neighbour_cluster !== undefined) {
							if (neighbourhoodClusters.hasOwnProperty(neighbour_cluster.toString())) {
								neighbourhoodClusters[neighbour_cluster] += 1;
							} else {
								neighbourhoodClusters[neighbour_cluster] = 1;
							}
						}
					}
					if (target === node) {
						neighbour_cluster = app.findClusterId(source);
						if (neighbour_cluster !== undefined) {
							if (neighbourhoodClusters.hasOwnProperty(neighbour_cluster.toString())) {
								neighbourhoodClusters[neighbour_cluster] += 1;
							} else {
								neighbourhoodClusters[neighbour_cluster] = 1;
							}
						}
						
					}
				});
				
			});
			//console.log(neighbourhoodClusters)
			var neighbourhoodClusters_str = []
			Object.keys(neighbourhoodClusters).forEach(function(d) {
				var name = app.getClusterNameFromID(d); 
				neighbourhoodClusters_str.push(name + "(" + neighbourhoodClusters[d] + ")")
			})
			return [neighbourhoodClusters, neighbourhoodClusters_str.join(", ")];
		},
		is_balanced: function(clusterDistr) {
			var balanced = false;
			var b = "no";

			if (Object.keys(clusterDistr).length > 1) {
				var max = 0;
				var mean = 0;

				clusterDistrValues = Object.values(clusterDistr);

				clusterDistrValues.forEach(function(d) {
					mean += d;
				});

				// the mean number of connections per cluster
				mean = mean / clusterDistrValues.length;

				max = Math.max(...clusterDistrValues);

				clusterDistrWithoutMax = clusterDistr;

				for (cluster in clusterDistrWithoutMax) {
					if (clusterDistrWithoutMax[cluster] === max) {
						delete clusterDistrWithoutMax[cluster];
						break;
					}
				}

				Object.values(clusterDistrWithoutMax).forEach(function(d) {
					if (max - d < mean/2) {
						balanced = true;
						b = "yes";
					}
				});

			}

			return [balanced, b];
		},
		findNeighboursAndClusters: function(node) {
			var neighbours = [];

			var links = d3.selectAll(".link");
			links.each(function(d) {
				var children = this.childNodes;
				children.forEach(function(p) {
					var source = p.getAttribute("source");
					var target = p.getAttribute("target");

					if (source === node) {
						var target_cluster_id = app.findClusterId(target);
						if (target_cluster_id !== undefined) {
							//var neighbour = target + " (cluster: " + target_cluster_id + ")";
							//neighbours.push(neighbour);
							var exists=false;
							for (var i = 0; i < neighbours.length; i++) {
								if (neighbours[i]["cluster_id"] === target_cluster_id) {
									neighbours[i]["neighbours"].push(target);
									exists = true;
								}
							}
							if (exists === false) {
								neighbours.push({"cluster_id": target_cluster_id, "neighbours": [target]});
							}
						}
						
					} else if (target === node) {
						var source_cluster_id = app.findClusterId(source);
						if (source_cluster_id !== undefined) {
							//var neighbour = source + " (cluster: " + source_cluster_id + ")";
							//neighbours.push(neighbour);
							var exists=false;
							for (var i = 0; i < neighbours.length; i++) {
								if (neighbours[i]["cluster_id"] === source_cluster_id) {
									neighbours[i]["neighbours"].push(source);
									exists = true;
								}
							}
							if (exists === false) {
								neighbours.push({"cluster_id": source_cluster_id, "neighbours": [source]});
							}
						}
					}
				});
			});
			return neighbours
		},
		findWobblyCandidates: function() {
			app.wobblyCandidates = []
			if (app.hightlighInbetweennessCentrality === true) {
				app.resetCentralityHighlighting();
				app.hightlighInbetweennessCentrality = false;
			}
			var nodes = d3.selectAll(".node").selectAll("g");
			var texts = d3.selectAll(".node").selectAll("g").select("text");

			nodes.each(function(d, i) {
				var children = this.childNodes;
				var text = d3.select(texts.nodes()[i]);
				var cluster_id;
				var node_text;
				var candidate = {};
				var is_cluster_node;

				children.forEach(function(p) {
					if (p.tagName === "text") {
						node_text = p.getAttribute("text");
					}
					if (p.tagName === "circle") {
						cluster_id = p.getAttribute("cluster_id");
						is_cluster_node = p.getAttribute("cluster_node");
					}
				});

				if (is_cluster_node === "false") {
					var result = app.findNeighbourhoodClusters(node_text)
					var neighbourClusterDistr = result[0];
					var neighbourClusterDistr_string = result[1];

					b = app.is_balanced(neighbourClusterDistr)[1];
					
					candidate["text"] = node_text;
					candidate["connected_clusters"] = neighbourClusterDistr_string;
					candidate["balanced"] = b;
					candidate["neighbours"] = app.findNeighboursAndClusters(node_text);
					app.wobblyCandidates.push(candidate);
				}
			});
		},
		highlightWobblyCandidates: function() {
			/*
			for node in nodes:
				cluster_assignment of node;
				neighbours = get_neighbouring_nodes_and_their_cluster_assignment -> via links
				neighbourhood = {cluster_id : counter}

			*/
			if (app.hightlighInbetweennessCentrality === true) {
				app.resetCentralityHighlighting();
				app.hightlighInbetweennessCentrality = false;
			}
			app.highlightWobblies = true;
			var nodes = d3.selectAll(".node").selectAll("g");
			var texts = d3.selectAll(".node").selectAll("g").select("text");

			nodes.each(function(d, i) {
				var children = this.childNodes;
				var text = d3.select(texts.nodes()[i]);
				var cluster_id;
				var node_text;
				var candidate = {}
				var is_cluster_node;

				children.forEach(function(p) {
					if (p.tagName === "text") {
						node_text = p.getAttribute("text");
					}
					if (p.tagName === "circle") {
						cluster_id = p.getAttribute("cluster_id");
						is_cluster_node = p.getAttribute("cluster_node");
					}
				});

				if (is_cluster_node === "false") {

					var neighbourClusterDistr = app.findNeighbourhoodClusters(node_text)[0];
					balanced = app.is_balanced(neighbourClusterDistr)[0];

					if (balanced === true) {
						children.forEach(function(p) {
							if (p.tagName === "circle") {
								p.setAttribute("r", 20);
								text.style("font-size", "20px");
							}
						})
					}

					// if node is connected to more than one cluster:
					// should be the least strict constraint
					else if (Object.keys(neighbourClusterDistr).length > 1) {
						// make node bigger
						// think of correlation of how well the clusters are distributed an the size of the node
						children.forEach(function(p) {
							if (p.tagName === "circle") {
								p.setAttribute("r", 10);
								text.style("font-size", "14px")
							}
						})
					}
				}
			});
				
		},
		/*
		Calculate how many nodes have a certain centrality score, so that the user has some reference when changing the thresholds
		*/
		calculateCentralityDistribution: function() {
			app.centrality_score_distribution = [];
			app.getCentralityScores();

			var group0 = 0;
			var group1 = 0;
			var group2 = 0;
			var group3 = 0;
			var group4 = 0;

			app.centrality_scores.forEach(function(d) {
				if (d.centrality_score === 0.0) {
					group0 += 1;
				} else if (d.centrality_score > 0.0 && d.centrality_score <= 0.1) {
					group1 += 1;
				} else if (d.centrality_score > 0.1 && d.centrality_score <= 0.2) {
					group2 += 1;
				} else if (d.centrality_score > 0.2 && d.centrality_score <= 0.3) {
					group3 +=1;
				} else {
					group4 += 1;
				}
			});

			app.centrality_score_distribution.push({"centrality_score": "0.0", "number": group0}, {"centrality_score": "0.0 - 0.1", "number": group1}, {"centrality_score": "0.1 - 0.2", "number": group2}, {"centrality_score": "0.2 - 0.3", "number": group3}, {"centrality_score": "over 0.3", "number": group4});
		},
		getCentralityScores: function() {
			app.centrality_scores = [];

			var circles = d3.selectAll(".node").selectAll("g").select("circle");
			var texts = d3.selectAll(".node").selectAll("g").select("text");

			texts.each(function(d, i) {
				var node = {};
				node["text"] = this.getAttribute("text");

				var circle = d3.select(circles.nodes()[i]);
				var cen_score = circle.attr("centrality_score");

				if (cen_score != null) {
					node["centrality_score"] = parseFloat(cen_score);
					app.centrality_scores.push(node);
				}
			});
		},
		resetCentralityHighlighting: function() {
			var circles = d3.selectAll(".node").selectAll("g").select("circle");
			var texts = d3.selectAll(".node").selectAll("g").select("text");

			circles.each(function(d, i) {
				if (this.getAttribute("centrality_score") != null) {
					this.setAttribute("r", 5)
					var text = d3.select(texts.nodes()[i])
					text.style("font-size", "10px");
				}
			})
		},
		highlightCentralNodes: function(threshold_s, threshold_m) {
			if (app.highlightWobblies === true) {
				app.resetCentralityHighlighting();
				app.highlightWobblies = false;
			}
			app.hightlighInbetweennessCentrality = true;
			threshold_s = parseFloat(threshold_s);
			threshold_m = parseFloat(threshold_m);

			var nodes = d3.selectAll(".node").selectAll("g");
			var texts = d3.selectAll(".node").selectAll("g").select("text");

			nodes.each(function(d, i) {
				var children = this.childNodes;
				var text = d3.select(texts.nodes()[i]);

				children.forEach(function(d,i) {
					if(d.tagName == "circle") {
						if (d.getAttribute("centrality_score") != null) {
							var centrality_score = parseFloat(d.getAttribute("centrality_score"));
							if (centrality_score <= threshold_s) {
								d.setAttribute("r", 2.5);
								text.style("font-size", "8px");
							} else if (centrality_score > threshold_s && centrality_score <= threshold_m) {
								d.setAttribute("r", 10.0);
								text.style("font-size", "14px");
							} else {
								d.setAttribute("r", 20.0);
								text.style("font-size", "20px");
							}
						}
					}
				});
			});
		},
		unsearch_nodes: function() {
			// undo highlighting
			var nodes = d3.selectAll(".node").selectAll("g");

			nodes.each(function(d) {
				var children = this.childNodes;

				children.forEach(function(d) {
					if (d.tagName === "text") {
						d.style.fill = "black";
						d.style.fontSize = "10px";
						d.style.opacity = 1;
					}
					if (d.tagName === "circle") {
						r = d.getAttribute("r");
						d.style.opacity = 1;
						if (r > 5) {
							new_r = r / 2;
							d.setAttribute("r", new_r);
							d.style.stroke = "white";
						}
					}
				});
			});
		},
		search_node: function() {
			found_matching_string = false;

			if (app.searchterm === "") {
				alert("Please enter a search term.");
			} else {
				// prefix matching
				var nodes = d3.selectAll(".node").selectAll("g");

				nodes.each(function(d) {
					var children = this.childNodes;
					text = "";

					children.forEach(function(d) {
						if (d.tagName === "text") {
							text = d.getAttribute("text");
						}
					});

					if (text.lastIndexOf(app.searchterm, 0) === 0) {
						found_matching_string = true;

						// highlight matching node
						children.forEach(function(d) {
							if (d.tagName === "text") {
								d.style.fontSize = "16px";
							}
							if (d.tagName === "circle") {
								r = d.getAttribute("r");
								new_r = r * 2;
								d.setAttribute("r", new_r);
								d.style.stroke = "yellow";
							}
						});
					} else {
						// reduce opacity of the other nodes
						// TODO: reduce opacity of links -> coloured links are a bit to strong
						children.forEach(function(d) {
							if (d.tagName === "text") {
								d.style.opacity = 0.4;
							}
							if (d.tagName === "circle") {
								d.style.opacity = 0.4;
							}
						});
					}
				});

				if (found_matching_string === true) {
					var links = d3.selectAll(".link");
					links.each(function(d) {
						var children = this.childNodes;
						children.forEach(function(p) {
							p.style.strokeOpacity = 0.2;
						})
					})
				}

				if (found_matching_string === false) {
					alert("No match found. Please try a different search term.");
				}
				app.searchterm = "";
			}	
		},
		// Not quite there yet. Save cluster_selected for every cluster
		// Otherwise weird behaviour when selecting different cluster
		select_cluster: function(cluster) {
			if (app.cluster_selected === false) {
				app.cluster_selected = true;
				var cluster_id = cluster.cluster_id;
				var cluster_nodes = [];
				for (var i = 0; i < cluster.labels.length; i++) {
					cluster_nodes.push(cluster.labels[i].text);
				}

				var links = d3.selectAll(".link").selectAll("line");

				links.each(function(d) {
					var source = this.getAttribute("source");
					var target = this.getAttribute("target");
					if (cluster_nodes.includes(source) && cluster_nodes.includes(target)) {
							this.setAttribute("stroke", cluster.colour);
					}	
				});
				if (app.sticky_mode === "false") {
					var nodes = d3.selectAll(".node").selectAll("g");
					nodes.classed("selected", function(d, i) {
						if (cluster_nodes.includes(d.id)) {
							return true;	
						} else {
							return false;
						}
					});
				}

			} else {
				app.cluster_selected = false;
				var cluster_id = cluster.cluster_id;
				var cluster_nodes = [];
				for (var i = 0; i < cluster.labels.length; i++) {
					cluster_nodes.push(cluster.labels[i].text);
				}

				var links = d3.selectAll(".link").selectAll("line");

				links.each(function(d) {
					var source = this.getAttribute("source");
					var target = this.getAttribute("target");
					if (cluster_nodes.includes(source) && cluster_nodes.includes(target)) {
							this.setAttribute("stroke", "#999");
					}
				});
			}
			
		},
		generate_cluster_id: function() {
			var number_of_nodes = d3.selectAll(".node").selectAll("g").size()

			var existing_cluster_ids = [];
			for (var i = 0; i < app.clusters.length; i++) {
				var cluster = app.clusters[i];
				existing_cluster_ids.push(parseInt(cluster.cluster_id));
			}
			
			var random_number = Math.floor(Math.random() * Math.floor(number_of_nodes + 10));

			while (existing_cluster_ids.includes(random_number)) {
				random_number = Math.floor(Math.random() * Math.floor(number_of_nodes + 10));	
			}

			return random_number;
		},
		// Create a new cluster from scratch when using the node options to change the cluster of a node
		createNewCluster: function(event) {
			var selected_nodes = d3.selectAll(".node").selectAll("g");
			var generated_cluster_id = app.generate_cluster_id().toString()

			selected_nodes.each(function(d,i) {
				text = "";
				var childnodes = this.childNodes;

				childnodes.forEach(function(d,i) {
					if (d.tagName === "text") {
						text = d.getAttribute("text");
					}
				})

				for (var j=0; j < app.clicked_nodes.length; j++) {
					// if the node is one of the selected nodes, assign the new attributes
					if (app.clicked_nodes[j].id === text) {
						childnodes.forEach(function(d,k) {
							if (d.tagName === "circle") {
								d.setAttribute("cluster_id", generated_cluster_id);
								d.setAttribute("cluster", app.created_cluster_name);
								d.setAttribute("fill", app.created_cluster_colour);
							}
						});
					}
				}
			});

			// update the information about the clusters in the graph in the data variable clusters.
			app.get_clusters();

			app.created_cluster_colour = "";
			app.created_cluster_name = "";

			var links = d3.selectAll(".link");
			links.each(function(d) {
				var children = this.childNodes;
				children.forEach(function(p) {
					var source = p.getAttribute("source");
					var target = p.getAttribute("target");
					var source_colour = app.findColour(source);
					var target_colour = app.findColour(target);
					if (source_colour === target_colour) {
						p.setAttribute("stroke", source_colour);
					} else {
						p.setAttribute("stroke", "#999");
					}
				})
			})
		},
		// Check if the selected nodes is a non cluster node. Only those should be considered for changing their cluster assignment
		is_normal_node: function() {
			var normal_node;
			var selected_node = d3.select(".selected").select("circle");

			selected_node.each(function(d) {
				var n = d3.select(this);
				if (n.attr("cluster_node") === "true") {
					normal_node = false;
				} else {
					normal_node = true;
				}
			});

			return normal_node;
		},
		// find the colour of a given node_id
		findColour: function(node_id) {
			var nodes = d3.selectAll(".node").selectAll("g")
			var colour;
			
			nodes.each(function(d) {
				var node_name;
				var children = this.childNodes;
				children.forEach(function(p) {
					if (p.tagName === "text") {
						node_name = p.getAttribute("text");
					}
				})

				if (node_name === node_id) {
					children.forEach(function(p) {
						if (p.tagName === "circle") {
							colour = p.getAttribute("fill");
						}
					})
				}
			})
			return colour;
		},
		/*
		Assigns the newly selected cluster id, cluster name and cluster colour to the selected node node.

		TODO: test this throughly with adding nodes, saving to file, rendering from file, cluster nodes etc.
		*/
		assignNewCluster: function() {
			var selected_nodes = d3.selectAll(".node").selectAll("g");

			selected_nodes.each(function(d,i) {
				text = "";
				var childnodes = this.childNodes;

				childnodes.forEach(function(d,i) {
					if (d.tagName === "text") {
						text = d.getAttribute("text");				
					}
				})

				for (var j=0; j < app.clicked_nodes.length; j++) {
					// if the node is one of the selected nodes, assign the new attributes
					if (app.clicked_nodes[j].id === text) {
						childnodes.forEach(function(d,k) {
							if (d.tagName === "circle") {
								d.setAttribute("cluster_id", app.new_assigned_cluster.cluster_id);
								d.setAttribute("cluster", app.new_assigned_cluster.cluster_name);
								d.setAttribute("fill", app.new_assigned_cluster.colour);
							}
						});
					}
				}
			});
			// update the information about the clusters in the graph in the data variable clusters.
			app.get_clusters();

			var links = d3.selectAll(".link")
			links.each(function(d) {
				var children = this.childNodes;
				children.forEach(function(p) {
					var source = p.getAttribute("source");
					var target = p.getAttribute("target");
					var source_colour = app.findColour(source);
					var target_colour = app.findColour(target);
					if (source_colour === target_colour) {
						p.setAttribute("style", "stroke:" + source_colour);
					} else {
						p.setAttribute("style", "stroke: #999");
					}
				})
			})
		},
		/*
		Return a list of all selected nodes as a list of objects
		An object depicts one selected node with slots for its colour, its cluster id, its cluster name and its id.
		The list is stored in the data variable clicked_nodes.
		*/
		findSelectedNodes: function() {
			list = [];
			var selected_nodes = d3.select(".selected");

			selected_nodes.each(function(d,i) {
				node_characteristics = {};
				var childnodes = this.childNodes;

				childnodes.forEach(function(d) {
					if (d.tagName === "circle") {
						// cluster nodes should not be considered
						if (d.getAttribute("cluster_node") === "false") {
							node_characteristics["colour"] = d.getAttribute("fill");
							app.created_cluster_colour = node_characteristics["colour"];
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
			app.clicked_nodes = list;
		},
		/*
		Set the opacity of all the nodes and edges that are not in the inspected time slice to 0.2.
		*/
		skip_through_time_slices: function() {
			var nodes = d3.selectAll(".node").selectAll("g");

			nodes.each(function(d,i) {
				

				// Set opacity to one in the beginning - important when changing time slice.
				this.style.strokeOpacity = 1.0;
				this.style.fillOpacity = 1.0;

				var childnodes = this.childNodes;
				// assume that every node is not in the interval
				var in_interval = false;

				childnodes.forEach(function(d,i) {
					if (d.tagName === "circle") {
						// for all nodes that have time ids, retrieve them - cluster nodes do not have any.
						if (d.getAttribute("cluster_node") === "false") {

							var time_ids = d.getAttribute("time_ids");
							if (time_ids !== null) {
								time_ids = time_ids.split(",");

								// check if the time ids of the node include the id of the interval
								time_ids.forEach(function(d, i) {
									if (d === app.interval_id) {
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

			var links = d3.selectAll(".link").selectAll("line");

			links.each(function(d,i) {
				// Set the opacity of all links to 1.0 initially
				this.style.strokeOpacity = 1.0;

				// select the time ids of the source and the target
				var source_time_ids = d.source.time_ids;
				var target_time_ids = d.target.time_ids;

				if (typeof source_time_ids === "string" && typeof target_time_ids === "string") {
					source_time_ids = source_time_ids.split(",");
					target_time_ids = target_time_ids.split(",");

					source_time_ids = source_time_ids.map(x => parseInt(x));
					target_time_ids = target_time_ids.map(x => parseInt(x));

				}

				var in_source_interval = false;
				var in_target_interval = false;

				interval = parseInt(app.interval_id);

				// check if source time ids of a link include the time slice id of the selected interval
				if (source_time_ids.includes(interval)) {
					in_source_interval = true;
				}

				// check if the target time ids of a link include the time slice if of the selected interval
				if (!(target_time_ids === null || typeof target_time_ids === "undefined") && target_time_ids.includes(interval)) {
					in_target_interval = true;
				}
				
				// the link only has opacity 1.0 if both source and target are in the selected time slice
				if (in_source_interval === false || in_target_interval === false) {
					this.style.strokeOpacity = 0.2;
				}
			});
		},
		/*
		Returns all the time ids of a node as a string of start year and end year to be displayed in the tooltip on a node in the time diff mode
		*/
		selectInterval: function(time_ids) {
			var intervalString = "";
			
			if ((time_ids !== null) && (typeof time_ids !== "undefined")) {
				if (typeof time_ids === "string") {
					time_ids = time_ids.split(",");
				}
				time_ids.sort();
				for (time_id of time_ids) {
					var start = app.start_years[time_id - 1].text;
					var end = app.end_years[time_id - 1].text;
					intervalString += start + " - " + end + "<br>"
				}
				return intervalString;
			}
		},
		/*
		Color nodes depending on whether they started to occur in the selected small time interval, stopped to occur in said interval, or both.
		Basically comparing the graph time interval and the small time interval selected by the user.
		*/
		show_time_diff: async function() {
			
			var big_time_interval = [];
			await axios.get("./interval/" + app.start_year + "/" + app.end_year)
				.then((res) => {
					big_time_interval = res.data;
				})
				.catch((error) => {
					console.error(error);
				});

			var small_time_interval = [];
			await axios.get("./interval/" + app.interval_start + "/" + app.interval_end)
				.then((res) => {
					small_time_interval = res.data;
				})
				.catch((error) => {
					console.error(error);
				});

			var period_before = [];
			var period_after = [];

			var small_interval_start_time_id = Math.min(...small_time_interval);
			var small_interval_end_time_id = Math.max(...small_time_interval);

			for (var i=0; i<big_time_interval.length; i++) {
				if (big_time_interval[i] < small_interval_start_time_id) {
					period_before.push(big_time_interval[i]);
				} else if (big_time_interval[i] > small_interval_end_time_id) {
					period_after.push(big_time_interval[i]);
				}
			}

			var time_diff_nodes = {born: [], deceased: [], shortlived: [], normal: []};
			
			var nodes = d3.selectAll(".node").selectAll("g");

			nodes.each(function(d) {
				var childnodes = this.childNodes;
				var node_text;

				childnodes.forEach(function(d) {
					if (d.tagName === "text") {
						node_text = d.getAttribute("text")
					}
				})

				childnodes.forEach(function(d){
					if (d.tagName === "circle") {
						if (d.getAttribute("cluster_node") === "false") {

							var time_ids = d.getAttribute("time_ids")

							if ((time_ids !== null) && (typeof time_ids !== "undefined")) {
								time_ids = time_ids.split(",");
								time_ids = time_ids.map(x => parseInt(x));

								var born = true;
								var deceased = true;
								var in_interval = false;
								
								for (var i = 0; i < time_ids.length; i++) {
									var t = time_ids[i];
									
									if(small_time_interval.includes(t)) {
										in_interval = true;
									}
									if (!small_time_interval.includes(t) && period_after.includes(t) && ! period_before.includes(t)) {
										deceased = false;
									}
									if (!small_time_interval.includes(t) && period_before.includes(t) && !period_after.includes(t)) {
										born = false;
									}
								}

								if (born===true && deceased===true && in_interval===true) {
									d.setAttribute("fill", "yellow");
									time_diff_nodes.shortlived.push(node_text);
								} else if (born===true && in_interval===true) {
									d.setAttribute("fill", "green");
									time_diff_nodes.born.push(node_text);
								} else if (deceased===true && in_interval===true) {
									d.setAttribute("fill", "red");
									time_diff_nodes.deceased.push(node_text);
								} else {
									d.setAttribute("fill", "grey");
									time_diff_nodes.normal.push(node_text);
								}

							}
						
						}
						// would be good to see exactly the time slices of the respective nodes
					}
				});
			});

			app.time_diff_nodes = time_diff_nodes;
		},
		/*
		Fetch the updated amount of nodes and edges as well as the singletons from the BE.
		*/
		update: function() {
			console.log("called update")
			var target_word = this.target_word;
			var start_year = this.start_year;
			var end_year = this.end_year;
			var senses = this.update_senses;
			var edges = this.update_edges;
			var time_diff = this.time_diff;

			app.time_diff = false;
			var url = './sense_graph' + '/' + target_word + '/' + start_year + '/' + end_year + '/' + senses + '/' + edges;
			
			return axios.get(url)
				.then((res) => {
					this.data_from_db = res.data;
					app.updated_nodes = this.data_from_db[0].nodes;

					app.updated_links = this.data_from_db[0].links;

					app.singletons = this.data_from_db[2].singletons;
				})
				.catch((error) => {
					console.error(error);
			});
		},
		/*
		Reset the opacity of all nodes and edges to their original values (nodes: 1.0, edges: 0.6).
		*/
		reset_opacity: function() {
			var nodes = d3.selectAll(".node").selectAll("g");
			var links = d3.selectAll(".link");

			nodes.each(function(d) {
				this.style.strokeOpacity = 1.0;
				this.style.fillOpacity = 1.0;
			});

			links.each(function(d) {
				var childnodes = this.childNodes;
				childnodes.forEach(function(d) {
					d.setAttribute("style", "stroke: #999;");
					d.setAttribute("style", "stroke-opacity:" + 0.6);

				});
			});
		},
		/*
		Fade in the nodes of a certain colour and the connecting links.
		The purpose of this function is to fade in only the red, yellow, green and grey nodes in the time diff mode.
		@param String CSS colour such as 'red'
		*/
		fade_in_nodes: function(colour) {
			var nodes = d3.selectAll(".node").selectAll("g");
			var links = d3.selectAll(".link");
			
			// collect all the nodes with opacity 1.0, so you can check them against the source and target of links
			var faded_in = [];

			nodes.each(function(d,i) {
				var childnodes = this.childNodes;
				var node_colour;

				childnodes.forEach(function(d) {	
					if (d.tagName === "circle") {
						node_colour = d.getAttribute("fill");
					}
				});

				if (colour !== node_colour) {
					this.style.strokeOpacity = 0.2;
					this.style.fillOpacity = 0.2;
				} else {
					childnodes.forEach(function(d) {	
						if (d.tagName === "text") {
							faded_in.push(d.getAttribute("text"));
						}
					});
				}
			});


			links.each(function(d) {
				var linknodes = this.childNodes;

				linknodes.forEach(function(d) {
					var source = d.getAttribute("source");
					var target = d.getAttribute("target");

					if (faded_in.includes(source) && faded_in.includes(target)) {
						// if the link is faded in, set the colour to the same as all the nodes
						d.setAttribute("style", "stroke:" + colour);
					} else {
						d.setAttribute("style", "stroke-opacity:" + 0.2);
					}
				})
			})

		},
		/*
		Set the opacity of nodes and links of a specific cluster.
		@param Object cluster: the entry for a specific cluster in the data variable clusters.
		@param float opacity: some number between 0.0 and 1.0.
		@param float link_opacity: some number between 0.0 and 1.0.
		*/
		set_cluster_opacity: function(cluster, opacity, link_opacity) {
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
				});
				if (! cluster_nodes.includes(node_text)) {
					this.style.strokeOpacity = opacity;
					this.style.fillOpacity = opacity;
				}
			})

			links.each(function(d,i) {
				var childnodes = this.childNodes;
				childnodes.forEach(function(d,i) {
					var source = d.getAttribute("source");
					var target = d.getAttribute("target");
					if (!cluster_nodes.includes(source) || !cluster_nodes.includes(target)) {
						//d.setAttribute("style", "stroke-opacity:" + link_opacity);
						d.style.strokeOpacity = link_opacity;
					} 
					//if (cluster_nodes.includes(source) && cluster_nodes.includes(target)) {
						//if (opacity < 1) {
						//	d.setAttribute("style", "stroke:" + cluster.colour);
						//} else {
					//		d.setAttribute("style", "stroke:" + cluster.colour);
						//}
					//}
				}) ;	
			});
		},
		/*
		Send all the nodes and edges to the backend, recluster them and change the nodes in the graph accordingly (cluster id, cluster name, colour)
		*/
		recluster: function() {
			if (app.highlightWobblies === true) {
				app.resetCentralityHighlighting();
				app.highlightWobblies = false;
			}
			//document.getElementById("edit_clusters_popup").style.display = "none";			

			var svg = d3.select("#svg");
			var nodes = svg.selectAll(".node");
			var links = svg.selectAll(".link");

			var data = {};

			// accumulate all the graph nodes
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

			// accumulate all the links
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
						link['weight'] = d.getAttribute("weight");

						link_array.push(link);
					}
				});
			});

			// store all the nodes and links in a data object to be sent to the BE
			data["nodes"] = nodes_array;
			data["links"] = link_array;

			axios.post('./reclustering', data)
				.then(async function (response) {
				    this.newclusters = response.data;

				    var colour = d3.scaleOrdinal(d3.schemePaired);

				    var newClusteredNodes = this.newclusters.nodes;

				    var texts = nodes.selectAll("g").select("text");
				    var circles = nodes.selectAll("g").select("circle");

				    for (var i=0; i<newClusteredNodes.length; i++) {
				    	var node_id = newClusteredNodes[i].id;
				    	var node_new_cluster = newClusteredNodes[i].class;
				    	//var node_centr_score = newClusteredNodes[i].centrality_score;
				    	// assign the updated attributes to the nodes
				    	// Careful, data is not bound to DOM!
				    	texts.each(function(d,i) {
				    		var t = d3.select(this);
				    		if (t.attr("text") === node_id) {
				    			var circle = d3.select(circles.nodes()[i])
				    			//circle.attr("centrality_score", node_centr_score)
				    			circle.attr("cluster", node_new_cluster)
				    			circle.attr("fill", function() {return colour(node_new_cluster) })
				    			circle.attr("cluster_id", node_new_cluster);
				    			circle.attr("cluster_node", "false");
				    		}
				    	})
				    }
				    // update the data variable clusters
				    await app.get_clusters();

				    //var links = d3.selectAll(".link");
				    

				    links.each(function() {
				    	var children = this.childNodes;
				    	children.forEach(function(d,i) {
				    		var is_in_cluster = false;
							var source = d.getAttribute("source");
							var target = d.getAttribute("target");
							for (var i=0; i<app.clusters.length; i++) {
					    		var node_ids = [];
					    		app.clusters[i].labels.forEach(function(p) {
					    			node_ids.push(p.text)
					    		})
					    		if (node_ids.includes(source) && node_ids.includes(target)) {
						    		var cluster_colour = app.clusters[i].colour;
						    		d.setAttribute("style", "stroke:" + cluster_colour);
						    		is_in_cluster = true;
						    	}

					    	}
					    	if (!is_in_cluster) {
								d.setAttribute("style", "stroke:#999");
							}
						}); 
				    });
				})
				  .catch(function (error) {
				    console.log(error);
				  });
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
		/*
		Apply changes in cluster name and colour to all the nodes in the graph (when pressing the "Apply" button in the edit column)
		*/
		applyClusterSettings: function() {
			var svg = d3.select("#svg");
			var nodes = svg.selectAll(".node");
			var links = svg.selectAll(".link");

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

				// TODO: update colour of links
				links.each(function(d) {
					var children = this.childNodes;
					var source;
					var target;
					children.forEach(function(p) {
						source = p.getAttribute("source");
						target = p.getAttribute("target");
						if (text_labels.includes(source) && text_labels.includes(target)) {
						    p.setAttribute("style", "stroke:" + colour);
						}
					});

				});

			}
		},
		showEditMask: function() {
			if (app.time_diff==="false") {
				//update clusters before fading in the column, keep the old clusters in time diff mode though, so that the user can still see the information about clusters
				app.get_clusters();
			}
			if (app.edit_column_open === false) {
				app.edit_column_open = true;
				document.getElementById("edit_clusters_popup").style.display = "block";
			} else if (app.edit_column_open === true) {
				app.edit_column_open = false;
				document.getElementById("edit_clusters_popup").style.display = "none";
			}
			
		},
		/*
		Collect the information on the clusters from the graph and store it in the data variable clusters.
		@return Array of objects with cluster information
		*/
		get_clusters: async function() {
				app.clusters = [];
				var clusters = [];
				
				var svg = d3.select("#svg");
				var nodes = svg.selectAll(".node").selectAll("g");

				nodes.each(function(d,i) {
					console.log(d)
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
							cluster_node = d.getAttribute("cluster_node");
						}

						if (d.tagName === "text") {
							text = d.getAttribute("text");
						}
					});

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
						cluster["delete_cluster"] = false;
						cluster.labels = [];
						if (cluster_node === "false") {
							cluster["labels"].push({"text": text, "cluster_node": cluster_node});
						}
						if (cluster.labels.length > 0) {
							clusters.push(cluster);
						}	
					}
			 	});

				for (var i=0; i < clusters.length; i++) {
					Vue.set(app.clusters, i, clusters[i]);
				}
				return;
		},
		render_graph: async function() {
			this.getData();
			this.graph_from_file = false;
			this.graph_rendered = false;
			await this.$nextTick();
		},
		/*
		Get the data from the BE according to the parameters entered in the FE and render the graph
		*/
		getData: function() {
			var target_word = this.target_word;
			var start_year = this.start_year;
			var end_year = this.end_year;
			var senses = this.senses;
			var edges = this.edges;
			var time_diff = this.time_diff;

			app.start_years.forEach(function(d,i) {
				if (d.value === app.start_year) {
					app.min_time_id = i + 1;
				}
			});

			app.end_years.forEach(function(d,i) {
				if (d.value === app.end_year) {
					app.max_time_id = i + 1;
				}
			});

			var url = './sense_graph' + '/' + target_word + '/' + start_year + '/' + end_year + '/' + senses + '/' + edges;
			
			axios.get(url)
				.then((res) => {
					this.data_from_db = res.data;
					var nodes = this.data_from_db[0].nodes;
					var links = this.data_from_db[0].links;
					var target = [this.data_from_db[1]];
					app.singletons = this.data_from_db[2].singletons;
					// Call D3 function to render graph
					render_graph(nodes, links, target, this.time_diff)
					this.graph_rendered = true;
					// Update cluster information
					app.get_clusters();
				})
				.catch((error) => {
					console.log(error)
					if (error.response.status >= 500) {
						alert(error + "\nPlease try a different target word.");
					}
					
				});

			
		},
		/*
		Returns a json object with all the information needed to rerender a graph and saves it locally.
		*/
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
				var colour = this.getAttribute("stroke");
				console.log(colour)
				var link = {};

				link["source"] = source;
				link["target"] = target;
				link["weight"] = weight;
				link["colour"] = colour;

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
				var time_ids;
				var centrality_score;

				var node = {}

				node["id"] = id;
				node["x"] = x;
				node["y"] = y;
				node["fx"] = fx;
				node["fy"] = fy;

				var childnodes = this.childNodes;
				childnodes.forEach(function(d,i) {
					if (d.tagName === "circle") {
						cluster_id = d.getAttribute("cluster_id");
						cluster_name = d.getAttribute("cluster");
						is_cluster_node = d.getAttribute("cluster_node");
						colour = d.getAttribute("fill");
						time_ids = d.getAttribute("time_ids");

						node["class"] = cluster_id;
						node["cluster_name"] = cluster_name;
						node["cluster_node"] = is_cluster_node;
						node["colour"] = colour;
						node["time_ids"] = time_ids;

						if (is_cluster_node === "false") {
							centrality_score = d.getAttribute("centrality_score");
							node["centrality_score"] = centrality_score;
						}
					}
				})

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
			graph['senses'] = app.senses;
			graph['edges'] = app.edges;

			var data = JSON.stringify(graph, null, 2);
			var blob = new Blob([data], {type: 'text/plain'});

			const a = document.createElement('a');
		    document.body.appendChild(a);
		    const url = window.URL.createObjectURL(blob);
		    a.href = url;
		    a.download = app.target_word + "_" + app.senses + "_" + app.edges + ".json";
		    a.click();
		    setTimeout(() => {
		      window.URL.revokeObjectURL(url);
		      document.body.removeChild(a);
		    }, 0)

		},
		/*
		Render the graph from a json file that the user has specified.
		*/
		loadGraph: function() {
			document.getElementById("loadpopup").style.display = "none";
			document.getElementById("edit_clusters_popup").style.display = "none";	
			app.graph_from_file = true;
			const file = this.file;
			const reader = new FileReader()

			reader.onload = function(e) {
			  this.read_graph = JSON.parse(reader.result);
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
			  app.senses = this.read_graph.senses;
			  app.edges = this.read_graph.edges;

			  app.start_years.forEach(function(d,i) {
				if (d.value === app.start_year) {
					app.min_time_id = i + 1;
				}
			  })

			  app.end_years.forEach(function(d,i) {
				if (d.value === app.end_year) {
					app.max_time_id = i + 1;
				}
			  })
			  //Call the D3 function to render the graph
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