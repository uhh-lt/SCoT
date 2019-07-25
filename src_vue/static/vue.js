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
     	read_graph: null,
     	graph_rendered : false,
     	clusters : [],
     	newclusters: {},
     	sticky_mode: "true",
     	charge: -10,
     	linkdistance: 100,
     	graph_from_file: false
	},
	methods: {
		recluster: function() {
			document.getElementById("edit_clusters_popup").style.display = "none";			

			var svg = d3.select("#svg");
			var nodes = svg.selectAll(".node");
			var links = svg.selectAll(".link");
			console.log(links)

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
				//console.log(childnodes)
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

			console.log(data);

			axios.post('./reclustering', data)
				.then(function (response) {
					console.log(response.data);
				    this.newclusters = response.data;


				    var colour = d3.scaleOrdinal(d3.schemePaired);
				    console.log(colour)

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
				    			circle.attr("fill", function() {return colour(node_new_cluster) });
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
				var cluster_name = this.clusters[i].cluster_name;
				var colour = this.clusters[i].colour;
				var cluster_node = this.clusters[i].cluster_node;
				var labels = this.clusters[i].labels;

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

					if (labels.includes(node_label)) {
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

					childnodes = this.childNodes;
					childnodes.forEach(function(d,i) {
						
						if (d.tagName === "circle") {
							cluster_name = d.getAttribute("cluster");
							cluster_id = d.getAttribute("cluster_id");
							colour = d.getAttribute("fill")
						}

						if (d.tagName === "text") {
							text = d.getAttribute("text");
						}

					});

					clusters.forEach(function(c,i) {
						if (c.cluster_name === cluster_name) {
							exists = true;
							c.labels.push(text)

						}
					});

					if (! exists) {
						cluster["cluster_id"] = cluster_id;
						cluster["cluster_name"] = cluster_name;
						cluster["colour"] = colour;
						cluster["cluster_node"] = false;
						cluster["labels"] = [text];
						clusters.push(cluster)
					}
			 	});

				for (var i=0; i < clusters.length; i++) {
					Vue.set(app.clusters, i, clusters[i]);
				}
		},
		render_graph: async function() {
			this.graph_from_file = false;
			this.graph_rendered = false;
			await this.$nextTick();
			this.getURL();
		},
		getURL: async function() {
			console.log(this.target_word)
			var target_word = this.target_word;
			var start_year = this.start_year;
			var end_year = this.end_year;
			var senses = this.senses;
			var edges = this.edges;
			var time_diff = this.time_diff;

			var url = '/sense_graph' + '/' + encodeURIComponent(target_word) + '/' + start_year + '/' + end_year + '/' + senses + '/' + edges + '/' + time_diff;

			render_graph(url, time_diff)
			this.graph_rendered = true;
			await this.$nextTick();
		},
		saveGraph: function() {
			var svg = d3.select("#svg");

			var links = svg.selectAll(".link");
			var nodes = svg.selectAll(".node");

			var graph_links = [];
			var graph_nodes = [];

			links.selectAll("line").each(function(d, i) { graph_links.push(this) });

			nodes.selectAll("g").each(function(d,i) {
				var node = {};
				var text_obj = {};
				node["node"] = this;
				childnodes = this.childNodes;
				childnodes.forEach(function(d,i) {
					var circle = {};
					var text = [];

					if (d.tagName === "circle") {
						var attrs = d.attributes;

						for(var k = attrs.length - 1; k >= 0; k--) {
							var name = attrs[k].name;
							var value = attrs[k].value;
							circle[name] = value;
						}
					node['circle'] = circle;
					} else if (d.tagName === "text") {

						attrs = d.attributes;

						for(var i = attrs.length - 1; i >= 0; i--) {
							var name = attrs[i].name;
							var value = attrs[i].value;
							
							if (name === "style") {
								var value_list = value.split(";");
								
								var formatted_obj = {};
								
								for (var j = value_list.length - 1; j >= 0; j--) {
									var name_value = value_list[j].split(":");
									var n = String(name_value[0]).replace(" ", "").replace(";", "");
									var v = String(name_value[1]).replace(" ", "").replace(";", "");
									
									if (n !== "") {
										formatted_obj[n] = v;
									}
								}

								text_obj['style'] = formatted_obj;

							} else {
							text_obj[name] = value;
							}
						}
					}
					node['label']= text_obj;
				})
				graph_nodes.push(node);
			})


			var graph;
			graph = {};
			graph['links'] = graph_links;
			graph['nodes'] = graph_nodes;
			graph['target'] = this.target_word;

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