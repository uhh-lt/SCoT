from model.ngot_model import NGOT, NGOTCluster, NGOTLink, NGOTProperties, NGOTNode
import dataclasses

""" maps old style nodes of form
    [id-string, {'weights': ..., 'Weight':, ...}]
    to NGOT-nodes (class with types)
"""


def map_ngot_nodes_2_dic(ngot):
    return [[node.id, dataclasses.asdict(node)] for node in ngot.nodes]


def map_ngot_links_2_dic(ngot):
    return [[link.source, link.target, dataclasses.asdict(link)] for link in ngot.links]


def map_nodes_dic_2_ngot(nodes):
    # mapsdictionary nodes to ngot nodes
    # this mapping function is used after the graph building process - at this stage
    # the nodes only carry weight and time-id information
    ngot_nodes = []
    for node in nodes:
        ngot_node = NGOTNode()
        ngot_node.id = node[0]
        ngot_node.weight = max(node[1]['weights'])
        ngot_node.weights = node[1]['weights']
        ngot_node.time_ids = node[1]['time_ids']
        ngot_nodes.append(ngot_node)
    return ngot_nodes


def map_edges_dic_2_ngot(edges):
    # maps dictionary edges to ngot edges
    ngot_edges = []
    for edge in edges:
        ngot_edge = NGOTLink()
        ngot_edge.source = edge[0]
        ngot_edge.target = edge[1]
        ngot_edge.id = ngot_edge.source + "-" + ngot_edge.target
        ngot_edge.weight = edge[2]['weight']
        ngot_edge.weights = edge[2]['weights']
        ngot_edge.time_ids = edge[2]['time_ids']
        ngot_edges.append(ngot_edge)
    return ngot_edges


def update_ngot_with_clusters_and_node_infos_from_graph(graph, ngot):
    # function is used after clustering
    # uses the already mapped NGOT - nodes and adds cluster information from the dictionary-nodes
    # graph consists of nodes  in format array with document egdes = [[s, t, {}], ...], nodes=[[id, {}], ...]
    # what is missing from the nodes is
    # mapper adds the additional centrality score info
    # and the cluster id
    # edges of networkx-graph not useable - they are undirected!
    # also maps CLUSTERS
    # the missing values in properties should have been filled in in the graph-building section...
    graph_nodes = list(graph.nodes(data=True))
    # print(graph_nodes)
    edges = ngot.links_dic
    cluster_set_id = set()
    cluster_set = []
    for g_node in graph_nodes:
        for n_node in ngot.nodes:
            if g_node[0] == n_node.id:
                n_node.centrality_score = g_node[1]['centrality_score']
                n_node.cluster_id = g_node[1]['class']
                n_node.target_text = g_node[0]
                # check if cluster already initialised
                if (n_node.id not in ngot.singletons):
                    if (n_node.cluster_id not in cluster_set_id):
                        cluster_new = NGOTCluster()
                        cluster_new.id = n_node.cluster_id
                        cluster_new.name = str(n_node.cluster_id)
                        cluster_new.cluster_nodes = []
                        cluster_new.cluster_links = []
                        cluster_new.cluster_nodes.append(n_node.id)
                        cluster_set_id.add(n_node.cluster_id)
                        cluster_set.append(cluster_new)
                    else:
                        # find cluster with id in cluster-set and add node id
                        for obj in cluster_set:
                            if obj.id == n_node.cluster_id:
                                obj.cluster_nodes.append(n_node.id)
    # remove singletons from clusters (done) and give them new unique ids > max cluster no (done)
    maxi_id = max(cluster_set_id)
    for node in ngot.nodes:
        if node.id in ngot.singletons:
            maxi_id += 1
            node.cluster_id = maxi_id

    # find all intra-cluster links (those that are connecting two nodes of a cluster)
    intra_links = set()
    all_links = set()
    for link in edges:
        all_links.add(link[0]+"-"+link[1])
        for cluster in cluster_set:
            if link[0] in cluster.cluster_nodes and link[1] in cluster.cluster_nodes:
                cluster.cluster_links.append(link[0]+"-"+link[1])
                intra_links.add(link[0]+"-"+link[1])
                link[2]["cluster_id"] = cluster.id
    inter_links = all_links - intra_links
    ngot.clusters = cluster_set
    ngot.transit_links = list(inter_links)
    ngot.nodes_dic = map_ngot_nodes_2_dic(ngot)
    # print(ngot)
    return ngot
