import networkx as nx
import random
import json
from model.ngot_model import NGOT, NGOTCluster, NGOTLink, NGOTProperties, NGOTNode
from model.ngot_mapper import update_ngot_with_clusters_and_node_infos_from_graph

#  For the algorithm see the following paper
#  Chris Biemann (2006):
#  Chinese Whispers - an Efficient Graph Clustering Algorithm
#  https://www.aclweb.org/anthology/W06-3812.pdf
#

############ ORIGINAL CHINESES WHISPERS (SCOT) #######################

# Apply the Chinese Whispers Clustering Algorithm to the graph
# Chineses Whispers cumulates edge-weights per node and class -
# and allocates the neighbouring node-class with the highest cumulated weight to the node
# it uses random starting points


def chinese_whispers_algo(graph, iterations=15):

    for i in range(iterations):
        graph_nodes = list(graph.nodes())
        # select a random starting point for the algorithm
        random.shuffle(graph_nodes)

        for node in graph_nodes:
            # get neighbours of nodes
            neighbours = graph[node]
            # dictionary for cumulating edge-weights of nodes that belong to that class
            classes = {}
            # for each neighbour
            for neighbour in neighbours:
                # cumulate edges weights in class-dictionary
                if graph.node[neighbour]['class'] in classes:
                    classes[graph.node[neighbour]['class']
                            ] += graph[node][neighbour]['weight']
                # or init class in dictionary with first edge weight
                else:
                    classes[graph.node[neighbour]['class']
                            ] = graph[node][neighbour]['weight']

            maxi = 0
            maxclass = 0
            for c in classes:
                if classes[c] > maxi:
                    maxi = classes[c]
                    maxclass = c
            graph.node[node]['class'] = maxclass

    return graph

# Construct a networkx graph from the nodes and edges
# precondition: nodes_set typed, edges types - all scores in float


def construct_graph(nodes_set, edges):

    nodes = list(nodes_set)
    graph = nx.Graph()
    graph.add_nodes_from(nodes)
    # initialize the class of each node
    for v, n in enumerate(graph.nodes):
        graph.node[n]['class'] = v
    graph.add_edges_from(edges)
    # print("---------- start ----------- before cw")
    # print(graph.edges.data())
    # print(graph.nodes.data())
    # print("---------- end--------- before cw")
    return graph


# call chinese whispers and calc centrality
def chinese_whispers(ngot, iterations=15):

    # uses networkx graph
    graph = construct_graph(ngot.nodes_dic, ngot.links_dic)
    # calculates betweeness centrality with networkx graph
    centrality_nodes = nx.betweenness_centrality(graph)
    for node, centrality_score in centrality_nodes.items():
        graph.node[node]['centrality_score'] = centrality_score
    # call chinese whispers with network x graph
    graph = chinese_whispers_algo(graph, iterations)
    # update data structure with results of networkx graph if all elements present
    if ngot.nodes != None and ngot.links != None and ngot.nodes_dic != None and ngot.links_dic != None:
        ngot = update_ngot_with_clusters_and_node_infos_from_graph(graph, ngot)
    # old json_graph used for reclustering - not yet refactored
    json_graph = nx.readwrite.json_graph.node_link_data(graph)

    return json_graph, ngot
