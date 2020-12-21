def ngot_interval(db, target_word, time_ids, paradigms, density):
	"""creates overlay with interval-graphs per time_id in time-ids
	step1: selects all nodes: 
	step2: selects all the edges: 
	
	Args:
		db ([type]): db for querying data for selected collections
		target_word ([type]): all neighbourhood graphs relate to target_word
		time_ids ([type]): one graph for each interval in time_ids
		paradigms ([type]): number of nodes per interval-graph
		density ([type]): [density]

	Returns:
		[type]: graphS
	"""
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