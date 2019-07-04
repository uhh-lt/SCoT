import networkx as nx
import random
import json

def construct_graph(time_diff, nodes_set, nodes_anno, edges):
	nodes = list(nodes_set)
	graph = nx.Graph()
	# add nodes from a list of nodes
	# [1,2,3,...]
	graph.add_nodes_from(nodes)
	#print(graph.nodes)
	# initialize the class of each node
	for v, n in enumerate(nodes):
		graph.node[n]['class'] = v
		#print(graph.node[n])
		#graph.node[n]['text'] = nodes[v]

	for word in nodes_anno:
		graph.node[word]['status'] = nodes_anno[word]

	# [(1,2), (2,3), ...]
	graph.add_edges_from(edges)
	return graph

def chinese_whispers(time_diff, nodes, nodes_anno, edges, target_word, iterations=2):
	graph = construct_graph(time_diff, nodes, nodes_anno, edges)

	for i in range(0, iterations):
		graph_nodes = list(graph.nodes())
		#print(graph_nodes)
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
			#print(graph.nodes.data('class'))

	#graph.add_node(target_word)
	#graph.node[target_word]['class'] = -1

	return  nx.readwrite.json_graph.node_link_data(graph)

def construct_reclustering_graph(nodes, edges):
	graph = nx.Graph()
	# add nodes from a list of nodes
	# [1,2,3,...]
	graph.add_nodes_from(nodes)
	#print(graph.nodes)
	# initialize the class of each node
	for v, n in enumerate(nodes):
		graph.node[n]['class'] = v

	# [(1,2), (2,3), ...]
	graph.add_edges_from(edges)
	return graph


def reclustering(nodes, edges, iterations=10):
	graph = construct_reclustering_graph(nodes, edges)
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