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
     	data_from_db : {}
	},
	methods: {
		set_cluster_opacity: function(cluster, opacity) {
			console.log("mouseover" + cluster.cluster_id);
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
					childnodes.forEach(function(d,i) {
						if (d.tagName === "circle") {
							d.setAttribute("style", "stroke-opacity:" + opacity)
							d.setAttribute("style", "fill-opacity:" + opacity)
						}
						if (d.tagName === "text") {
							d.setAttribute("style", "stroke-opacity:" + opacity)
							d.setAttribute("style", "fill-opacity:" + opacity)
						}
					})
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
						d.setAttribute("style", "stroke-opacity:" + opacity);
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
				childnodes.forEach(function(d,i) {
					if(d.tagName === "text") {
						nodes_array.push(d.getAttribute("text"));
					}
				})
			})

			data['nodes'] = nodes_array;

			var link_array = [];

			links.each(function(d,i) {
				childnodes = this.childNodes;
				childnodes.forEach(function(d,i) {
					link = {}
					link['source'] = d.getAttribute("source");
					link['target'] = d.getAttribute("target");

					//var strokewidth = d.getAttribute("stroke-width");
					//var weight = Math.pow(strokewidth, 2) * 10;
					link['weight'] = d.getAttribute("weight");
					link_array.push(link);
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
				for (var i = 0; i < labels.length; i++) {
					text_labels.push(labels[i].text);
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
								node_cluster = d.setAttribute('cluster', cluster_name);
								node_fill = d.setAttribute('fill', colour);
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
							console.log(d.getAttribute("cluster_node"));
							cluster_node = d.getAttribute("cluster_node");
						}

						if (d.tagName === "text") {
							text = d.getAttribute("text");
						}

					});

					clusters.forEach(function(c,i) {
						if (c.cluster_name === cluster_name) {
							exists = true;
							c.labels.push({"text": text, "cluster_node": cluster_node})

						}
					});

					if (! exists) {
						cluster["cluster_id"] = cluster_id;
						cluster["cluster_name"] = cluster_name;
						cluster["colour"] = colour;
						cluster["add_cluster_node"] = false;
						cluster["labels"] = [{"text": text, "cluster_node": cluster_node}];
						clusters.push(cluster)
					}
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
			console.log(this.target_word)
			var target_word = this.target_word;
			var start_year = this.start_year;
			var end_year = this.end_year;
			var senses = this.senses;
			var edges = this.edges;
			var time_diff = this.time_diff;

			//var url = './sense_graph' + '/' + encodeURIComponent(target_word) + '/' + start_year + '/' + end_year + '/' + senses + '/' + edges + '/' + time_diff;
			var url = './sense_graph' + '/' + target_word + '/' + start_year + '/' + end_year + '/' + senses + '/' + edges + '/' + time_diff;
			
			axios.get(url)
				.then((res) => {
					console.log(res.data)
					this.data_from_db = res.data;
					render_graph(this.data_from_db, this.time_diff)
					this.graph_rendered = true;
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
				var id = this.__data__.id;
				var cluster_id = this.__data__.class;
				var cluster_name;
				var is_cluster_node;
				var colour;

				var node = {}

				var childnodes = this.childNodes;
				childnodes.forEach(function(d,i) {
					if (d.tagName === "circle") {
						cluster_name = d.getAttribute("cluster");
						is_cluster_node = d.getAttribute("cluster_node");
						colour = d.getAttribute("fill");
					}
				})

				node["id"] = id;
				node["x"] = x;
				node["y"] = y;
				node["class"] = cluster_id;
				node["cluster_name"] = cluster_name;
				node["cluster_node"] = is_cluster_node;
				node["colour"] = colour;

				graph_nodes.push(node);

			})

			
			var graph = {};
			graph['links'] = graph_links;
			graph['nodes'] = graph_nodes;
			//graph['target'] = this.target_word;

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

			const file = this.file;
			const reader = new FileReader()

			reader.onload = function(e) {
			  this.read_graph = JSON.parse(reader.result);
			  render_graph_from_file(this.read_graph);
			}
			reader.readAsText(file);
			app.graph_from_file = true;
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