def ngot_interval(db, target_word, time_ids, paradigms, density):
	### creates overlay with interval-graphs per time_id in time-ids
	print("NGOT interval")
	# STEP 1: GET ALL NODES FROM EACH INTERVAl
	node_dic = {}
	for time_id in time_ids:
		result = db.get_nodes_interval(target_word, paradigms, time_id)
		
		for res in result:
			if res[0] not in node_dic:
				node_dic[res[0]] = res[1]
			else:
				# add time res[1]["time_ids"] zu node_dic[res[0]]["time_ids"]
				node_dic[res[0]]["time_ids"].append(res[1]["time_ids"][0])
				node_dic[res[0]]["weights"].append(res[1]["weights"][0])
	nodes = [[k,v] for k,v in node_dic.items()]
	print("total additiver graph nodes", len(nodes))
	remove_singletons = True
	# STEP 2 GET ALL EDGES 
	edges, nodes, singletons = db.get_edges_per_time(nodes, paradigms, density, time_ids, remove_singletons)
	# STEP 3 RETURN OVERLAY
	return edges, nodes, singletons

def ngot_overlay_global(db, target_word, time_ids, paradigms, density):
	# dynamic implementation of old scot-algorithm: nodes overlay, edges: global (scales with intervals)
	print("nodes global fixed/edges - global dyn - data fixed")
	nodes = db.get_nodes_overlay(target_word, paradigms, time_ids)
	edges, nodes, singletons = db.get_edges(nodes, density, time_ids)
	return edges, nodes, singletons

def ngot_overlay(db, target_word, time_ids, paradigms, density):
	print("NGOT overlay")
	# NGOT - Overlay-fixed (expands global nodes dynamically)
	# Edges in time, fixed global overlay edges, scaled
	nodes = db.get_nodes_overlay(target_word, paradigms, time_ids)
	edges, nodes, singletons = db.get_edges_in_time(nodes, density, time_ids)
	return edges, nodes, singletons

def ngot_global(db, target_word, time_ids, paradigms, density):
	print("NGOT global")
	# NOT IMPLEMENTED FULLY YET
	# background fixing dynamic for edges - static for nodes (currently)
	# Nodes not scaled yet for global algo - global searches for paradigms * |time-ids |
	nodes = db.get_nodes_global(target_word, paradigms, time_ids)
	edges, nodes, singletons = db.get_edges(nodes, density, time_ids)
	return edges, nodes, singletons