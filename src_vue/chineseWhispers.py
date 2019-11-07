import networkx as nx
import random
import json

# Construct a networkx graph from the nodes and edges
def construct_graph(nodes_set, edges):
	nodes = list(nodes_set)
	print("--------------------------------- nodes: " + str(nodes))
	print("--------------------------------- edges: " + str(edges))
	graph = nx.Graph()
	# add nodes from a list of nodes
	# [1,2,3,...]
	graph.add_nodes_from(nodes)
	#print("graph nodes:" + str(graph.nodes))
	# initialize the class of each node
	for v, n in enumerate(graph.nodes):
		print(graph.node[n])
		graph.node[n]['class'] = v

	# [(1,2), (2,3), ...]
	graph.add_edges_from(edges)
	return graph

# Apply the Chinese Whispers Clustering Algorithm to the graph
def chinese_whispers(nodes, edges, target_word, iterations=2):
	graph = construct_graph(nodes, edges)

	centrality_nodes = nx.betweenness_centrality(graph)

	for node, centrality_score in centrality_nodes.items():
		graph.node[node]['centrality_score'] = centrality_score

	for i in range(0, iterations):
		graph_nodes = list(graph.nodes())
		# select a random starting point for the algorithm
		random.shuffle(graph_nodes)

		for node in graph_nodes:
			neighbours = graph[node]
			classes = {}
			for neighbour in neighbours:
				if graph.node[neighbour]['class'] in classes:
					classes[graph.node[neighbour]['class']] += graph[node][neighbour]['weight']
				else:
					classes[graph.node[neighbour]['class']] = graph[node][neighbour]['weight']	

			max = 0
			maxclass = 0
			for c in classes:
				if classes[c] > max:
					max = classes[c]
					maxclass = c
			graph.node[node]['class'] = maxclass

	return  nx.readwrite.json_graph.node_link_data(graph)


# Construct a graph from the data sent from the FE
def construct_reclustering_graph(nodes, edges):
	graph = nx.Graph()
	# add nodes from a list of nodes
	# [1,2,3,...]
	graph.add_nodes_from(nodes)
	# initialize the class of each node
	for v, n in enumerate(nodes):
		graph.node[n]['class'] = v

	# [(1,2), (2,3), ...]
	graph.add_edges_from(edges)
	return graph


# Apply Chinese Whispers again
# TODO: try to avoid duplicated code!!
def reclustering(nodes, edges, iterations=2):
	graph = construct_reclustering_graph(nodes, edges)

	# calculate betweenness centrality of nodes
	#centrality_nodes = nx.betweenness_centrality(graph)

	# add the centrality score as attribute to the nodes
	#for node, centrality_score in centrality_nodes.items():
	#	graph.node[node]['centrality_score'] = centrality_score

	for i in range(0, iterations):
		graph_nodes = list(graph.nodes())

		# random starting point
		random.shuffle(graph_nodes)
		for node in graph_nodes:
			neighbours = graph[node]
			
			classes = {}
			for neighbour in neighbours:
				if graph.node[neighbour]['class'] in classes:
					classes[graph.node[neighbour]['class']] += graph[node][neighbour]['weight']
				else:
					classes[graph.node[neighbour]['class']] = graph[node][neighbour]['weight']	

			max = 0
			maxclass = 0
			for c in classes:
				if classes[c] > max:
					max = classes[c]
					maxclass = c
			graph.node[node]['class'] = maxclass

	return  nx.readwrite.json_graph.node_link_data(graph)