app = new Vue({
   el: "#vue-app",
   data: {
   		target_word : "",
   		// TODO read from DB!
     	start_year : 0,
     	end_year : 0,
     	senses : 0,
     	edges : 0,
     	time_diff : false,
     	start_years : [{
     		value : 1520, text: "1520"
     	}, {
     		value : 1909, text: "1909"
     	}, {
     		value : 1954, text: "1954"
     	}, {
     		value : 1973, text: "1973"
     	}, {
     		value: 1987, text: "1987"
     	}, {
     		value: 1996, text: "1996" 
     	}, {
     		value : 2002, text: "2002"
     	}, {
     		value : 2006, text: "2006"
     	}],
     	end_years : [{
     		value : 1908, text: "1908"
     	}, {
     		value : 1953, text: "1953"
     	}, {
     		value : 1972, text: "1972"
     	}, {
     		value : 1986, text: "1986"
     	}, {
     		value: 1995, text: "1995"
     	}, {
     		value: 2001, text: "2001" 
     	}, {
     		value : 2005, text: "2005"
     	}, {
     		value : 2008, text: "2008"
     	}],
     	file : null,
     	read_graph: null,
     	graph_rendered : false,
     	clusters : []
     	//got_clusters : false,

	},
	methods: {
		get_clusters: function() {
			//this.got_clusters = false;
			var timeout;
			if (this.senses < 100) {
				timeout = 1000;
			} else {
				timeout = this.senses * 10;
			}
			setTimeout(function() {
				var clusters = [];
				var circles = document.getElementsByTagName("circle")
				for(var i=0; i < circles.length; i++) {
					var cluster = circles[i].getAttribute("cluster");
					if (! clusters.includes(cluster)) {
						clusters.push(cluster);
					}
				}
				console.log(clusters);
				//this.clusters = clusters;
				for (var i=0; i < clusters.length; i++) {
					Vue.set(app.clusters, i, clusters[i]);
				}
				console.log(this.clusters);
				//this.got_clusters = true;
				//console.log(this.got_clusters);
			}, timeout);
		},
		getURL: function() {
			this.render_graph = false;
			console.log(this.target_word)
			var target_word = this.target_word;
			var start_year = this.start_year;
			var end_year = this.end_year;
			var senses = this.senses;
			var edges = this.edges;
			var time_diff = this.time_diff;

			// var birth_start = this.birth_start;
			// var birth_end = this.birth_end;
			// var death_start = this.death_start;
			// var death_end = this.death_end;

			var url = '/sense_graph' + '/' + encodeURIComponent(target_word) + '/' + start_year + '/' + end_year + '/' + senses + '/' + edges + '/' + time_diff;

			render_graph(url, time_diff)

			this.graph_rendered = true;
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
				//console.log(this)
				node["node"] = this;
				childnodes = this.childNodes;
				//console.log(childnodes)
				childnodes.forEach(function(d,i) {
					var circle = {};
					var text = [];

					if (d.tagName === "circle") {
						console.log("it's a circle!")
						var attrs = d.attributes;
						for(var k = attrs.length - 1; k >= 0; k--) {
							//console.log("length: " + attrs.length)

							var name = attrs[k].name;
							var value = attrs[k].value;
							console.log(name);
							console.log(value);
							circle[name] = value;
						}
					node['circle'] = circle;
					} else if (d.tagName === "text") {
						console.log("it's a text!");

						attrs = d.attributes;

						for(var i = attrs.length - 1; i >= 0; i--) {
							console.log("length: " + attrs.length)

							var name = attrs[i].name;
							var value = attrs[i].value;
							
							if (name === "style") {
								console.log("Have some Style!");
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
				//node.push(childnodes)
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
		},
		closeForm: function() {
			document.getElementById("loadpopup").style.display = "none";
		},
		displayForm: function() {
			document.getElementById("loadpopup").style.display = "block";
		}
	}

});