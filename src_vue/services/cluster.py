import networkx as nx
import random
import json
import statistics
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

 # Cluster Metrics are computed
    # cluster max size is needed for balance score of nodes
    # A node has a balanced_cluster_connection if at least two clusters in its neigbourhood fulfil the following condition
    # max_links_to_one_connected_cluster - links_to_connected_cluster_i < mean_links_to_any_cluster /2
    # [max of number of links from this node to one cluster
    # number of ngot dir links with each cluster meansize /2]
    # ngot dir links with each cluster = dir links to and from [there may be only one]
    # no breaking down to time_slices [since clustering is done on NGOT]
    # ngot_dir_links_with_each_cluster_dic: Optional[Dict[str, int]] = None
    # ngot_dir_links_with_each_cluster_max: Optional[int] = None
    # ngot_dir_links_with_each_cluster_mean: Optional[int] = None
    # ngot_dir_links_with_each_cluster_is_balanced: Optional[bool] = None


def balance_calc(ngot):
    # create helper dics
    node_dic = {}
    for node in ngot.nodes:
        node_dic[node.id] = node
    link_dic = {}
    for link in ngot.links:
        link_dic[link.id] = link
    cluster_dic = {}
    for cluster in ngot.clusters:
        cluster_dic[cluster.cluster_id] = cluster
    # now calc for each node in a cluster the link_to_each_cluster_dic
    for cluster in ngot.clusters:
        for node in cluster.cluster_nodes:
            node_dic[node].ngot_dir_links_with_each_cluster_dic = {
                cluster.cluster_id: 0 for cluster in ngot.clusters}
            tmp = node_dic[node].ngot_dir_links_with_each_cluster_dic
            for link in ngot.links:
                if (not link.cluster_link):
                    source = link_dic[link.id].source
                    target = link_dic[link.id].target
                    if (source == node):
                        tmp[node_dic[target].cluster_id] += 1
                    elif (target == node):
                        tmp[node_dic[source].cluster_id] += 1
            # print(node, tmp)
            # determine metrics
            linkNum = [v for v in tmp.values()]
            maxi = node_dic[node].ngot_dir_links_with_each_cluster_max = max(
                linkNum)
            # print("max", maxi)
            meani = node_dic[node].ngot_dir_links_with_each_cluster_mean = statistics.mean(
                linkNum)
            # print("mean", meani)
            # determine if balanced
            counter = 0
            for k, v in tmp.items():
                if (maxi - v) < meani / 2:
                    counter += 1
            if counter >= 2:
                balanced = node_dic[node].ngot_dir_links_with_each_cluster_is_balanced = True
            else:
                balanced = node_dic[node].ngot_dir_links_with_each_cluster_is_balanced = False
            # print("is balanced", balanced)

    return ngot

# call chinese whispers and calc centrality and balance score


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
    # insert balance calc here
    ngot = balance_calc(ngot)
    # old json_graph used for reclustering - not yet refactored
    json_graph = nx.readwrite.json_graph.node_link_data(graph)

    return json_graph, ngot


def manual_recluster(ngot):
    # runs all methods of the abovve without chinese whispers
    # uses networkx graph
    # print(ngot.nodes_dic)
    graph = construct_graph(ngot.nodes_dic, ngot.links_dic)
    # calculates betweeness centrality with networkx graph and resets class values to original ones
    centrality_nodes = nx.betweenness_centrality(graph)
    for node, centrality_score in centrality_nodes.items():
        # print(node)
        graph.node[node]['centrality_score'] = centrality_score
        graph.node[node]['class'] = graph.node[node]['cluster_id']
    # update data structure with results of networkx graph if all elements present
    if ngot.nodes != None and ngot.links != None and ngot.nodes_dic != None and ngot.links_dic != None:
        ngot = update_ngot_with_clusters_and_node_infos_from_graph(graph, ngot)
    # insert balance calc here
    ngot = balance_calc(ngot)
    # old json_graph used for reclustering - not yet refactored
    json_graph = nx.readwrite.json_graph.node_link_data(graph)

    return json_graph, ngot
