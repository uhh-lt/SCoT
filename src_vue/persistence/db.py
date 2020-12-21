from abc import ABC, abstractmethod
from typing import Dict, List, Protocol
import records
import json

class DatabaseInterface(Protocol):
	# ------ GENERAL COLLECTION INFORMATION
	@abstractmethod
	def get_all_years(self, position) -> List[Dict[int, str]]:
		"""Gets all years from database
		Args:
			position ([type]): 
		Returns:
			List[Dict[int, str]]: [description]
		"""
		pass

	# ------ GRAPH
	# --------NODES (Gets nodes first)


	# --------EDGES (determines edges based on nodes in time-intervals)

	#------- FEATURES
	@abstractmethod
	def get_features(self, word1: str, time_id: int) -> Dict[str, float]:
		""" get syntagmatic feature and significance score for word1 from DB
		Args:
			word1 (str): paradigm
			time_id (int): in time_id
		Returns:
			Dict[str, float]: Dictionary of all features and scores
		"""
		pass



class Database(DatabaseInterface):
	def __init__(self, collection, configfile = './config/config.json') -> None:
		with open(configfile) as config_file:
			config = json.load(config_file)
		if (collection in [*config["collections_info_backend"]]):
			self.db = records.Database(config["collections_info_backend"][collection])
		else:
			self.db = records.Database(config["collections_info_backend"]['default'])
	
# --- COLLECTION INFORMATION

	def get_all_years(self, column_name) -> List[Dict[int, str]]:
		""" gets initial information on years and ids for collection 
		Args:
			column_name ([type]): start_years or end_years
		Returns:
			List[Dict[int, str]]: [description]
		"""
		years = []
		t = self.db.query('SELECT * FROM time_slices ORDER BY id ASC')
		for row in t:
			year = {}
			# value and text needed for vue dropdown
			year["value"] = int(row[column_name])
			year["text"] = str(row[column_name])
			# id needed for various operations
			year["id"] = int(row['id'])
			years.append(year)
		return years

# ------------------ GRAPH QUERY YEAR_TIME_ID RESOLVER

	def get_time_ids(self, start_year, end_year):
		""" frontend queries years - these are resolved to time-ids by this function
		Args:
			start_year ([type]): [description]
			end_year ([type]): [description]
		Returns:
			[type]: list of time-ids
		"""
		# get the corresponding ids for the start and end_year parameters
		time_ids = []
		t = self.db.query(
			'SELECT id FROM time_slices WHERE start_year>=:start AND end_year<=:end ORDER BY id ASC',
			start=start_year, end=end_year)

		for r in t:
			time_ids.append(int(r['id']))
		return time_ids

# ---------------------- GRAPH NODES AND EDGES

	def get_nodes_global(
		self,
		target_word,
		max_paradigms,
		selected_time_ids
		):
		# sglobal node function - ie searches nodes regardless of overlay or time-interval
		# SCALES PARADIGMS WITH THE NUMBER OF TIME-IDS
		# max_paradigms = max_paradigms * len(selected_time_ids)
		# get the nodes for a target word from the database
		# PARAM target_word is str
		# PARAM max_paradigms
		# PARAM selected_time_ids is int-array
		# RETURNS nodes
		
		nodes = []
		target_word_senses = self.db.query(
			'SELECT word2, time_id, score FROM similar_words '
			'WHERE word1=:tw AND word1!=word2 '
			'ORDER BY score DESC',
			tw=target_word
			)
		fullNodeCounter = 0
		for row in target_word_senses:
			exists = False
			if int(row['time_id']) in selected_time_ids and fullNodeCounter < max_paradigms:
				for node in nodes:
					if node[0] == str(row['word2']):
						exists = True
						if not int(row["time_id"]) in node[1]["time_ids"]:
							node[1]["time_ids"].append(int(row['time_id']))
							node[1]["weights"].append(float(row['score']))
							fullNodeCounter += 1
				
				if not exists:
					nodes.append([str(row['word2']), {"time_ids": [int(row['time_id'])], "weights": [float(row["score"])], "target_text": str(row['word2'])}])
					fullNodeCounter +=1
		#print(nodes)
		return nodes


	def get_nodes_interval(
		self,
		target_word,
		max_paradigms,
		selected_time_id
		):
		# Node function for interval-graph with one selected time_id
		# get the nodes for a target word from the database
		# PARAM target_word is str
		# PARAM max_paradigms [max required data for this interval] = LIMIT
		# PARAM selected_time_ids is int-array
		# RETURNS nodes

		nodes = []
		target_word_senses = self.db.query(
			'SELECT word2, time_id, score FROM similar_words '
			'WHERE word1=:tw AND word1!=word2 AND time_id=:ti '
			'ORDER BY score DESC '
			'LIMIT :li'
			,
			li=max_paradigms,
			ti=selected_time_id,
			tw=target_word
			)
		for row in target_word_senses:
			nodes.append([str(row['word2']), {"time_ids": [int(row['time_id'])], "weights": [float(row["score"])], "target_text": str(row['word2'])}])
		return nodes
	
	def get_nodes(
		self,
		target_word,
		max_paradigms,
		selected_time_ids
		):
		# standard node function for all graph-algos
		# scot and scotti-global fix the global number of nodes in the overlay with the same algorithm
		# scotte-interval fixed the global number of nodes in one interval
		# get the nodes for a target word from the database
		# PARAM target_word is str
		# PARAM max_paradigms
		# PARAM selected_time_ids is int-array
		# RETURNS nodes

		nodes = []
		target_word_senses = self.db.query(
			'SELECT word2, time_id, score FROM similar_words '
			'WHERE word1=:tw AND word1!=word2 '
			'ORDER BY score DESC',
			tw=target_word
			)
		for row in target_word_senses:
			exists = False
			if int(row['time_id']) in selected_time_ids and len(nodes) < max_paradigms:
				for node in nodes:
					if node[0] == str(row['word2']):
						exists = True
						if not int(row["time_id"]) in node[1]["time_ids"]:
							node[1]["time_ids"].append(int(row['time_id']))
							node[1]["weights"].append(float(row['score']))
				
				if not exists:
					nodes.append([str(row['word2']), {"time_ids": [int(row['time_id'])], "weights": [float(row["score"])], "target_text": str(row['word2'])}])
		#print(nodes)
		return nodes
	
	def get_stable_nodes(
		self,
		target_word,
		max_paradigms,
		selected_time_ids,
		factor
		):
		# gets Stable Graph - ie only nodes that occur at least in factor*len(time_ids) time_ids
		# PARAM factor
		# PARAM target_word is str
		# PARAM max_paradigms
		# PARAM selected_time_ids is int-array
		# RETURNS 
		
		nodes = []
		target_word_senses = self.db.query(
			'SELECT word2, time_id, score FROM similar_words '
			'WHERE word1=:tw AND word1!=word2 '
			'ORDER BY score DESC',
			tw=target_word
			)
		
		# put all into node_list 
		for row in target_word_senses:
			exists = False
			if int(row['time_id']) in selected_time_ids:
				for node in nodes:
					if node[0] == str(row['word2']):
						exists = True
						if not int(row["time_id"]) in node[1]["time_ids"]:
							node[1]["time_ids"].append(int(row['time_id']))
							node[1]["weights"].append(float(row['score']))
				
				if not exists:
					nodes.append([str(row['word2']), {"time_ids": [int(row['time_id'])], "weights": [float(row["score"])], "target_text": str(row['word2'])}])
		
		#filter by those that exist in more than factor selected time_ids until max threshold reached
		#print("nodes erste runde")
		
		nodes_stable = []
		for node in nodes:
			#print("node time_ids", node[1]["time_ids"])
			if float(len(set(node[1]["time_ids"]).intersection(set(selected_time_ids)))) >= factor*len(set(selected_time_ids)) and len(nodes_stable) < max_paradigms:
				nodes_stable.append(node)
			

		
		#print("nodes_stable", nodes_stable)
		return nodes_stable
		
	def get_all_nodes(
		self,
		time_ids
		):
		# experimental for target-word "Xall" - get all nodes
		# get the nodes for all words target word from the database
		# precondition_ time_ids not null, is integer
		# postcondition: nodes array words - str-type, time-id int, score -float, target-text str
		nodes = []
		nodeset = set()
		target_word_senses = self.db.query(
			'SELECT * FROM similar_words'
			)
		for row in target_word_senses:
			if row['time_id'] in time_ids:
				word1 = str(row["word1"])
				word2 = str(row["word2"])
											
				if word2 not in nodeset:
					nodes.append([str(row['word2']), {"time_ids": [int(row['time_id'])], "weights": [float(row["score"])], "target_text": str(row['word2'])}])
					nodeset.add(word2)
				if word1 not in nodeset:
					nodes.append([str(row['word1']), {"time_ids": [int(row['time_id'])], "weights": [float(row["score"])], "target_text": str(row['word1'])}])
					nodeset.add(word1)
				
		#print(nodes)
		return nodes

	def get_edges(self, nodes, max_edges, time_ids):
		# LEGACY standard edge function for SCoT - NOT USED ANYMORE
		# This queries and counts all single directed edges
		# There are THREE problems with this algorithm:
		# 1. Massive problem it does not scale with the the number of time-ids
		# !! Attention this was probably NOT intended !! This algorithm is problemati!!! 
		# This has been temporarily solved in the frontend - by scaling max_edges for the graph-type "max_across_slices" by factor i
		# There is also a second problem:
		# 2. Edges can be set independent of time_ids 
		# this can result in node1 from time2, node 2 from time4, and edge from time5 (ie pseudo-nodes)
		# this results in "invisible nodes" (ie node from time5 is implicitly present due to edge from that id)
		# 3. Data-Structure - singleton information that is filtered out - deletes nodes from datastructre (this is not a good idea)

		# Param: nodes
		# Para: max_edges = Supremum of Cardinality of Set of Edges
		# Param: time_ids
		#
		edges = []
		connections = []
		node_list = []
		singletons = []
		print("scot param in directed max_edges", max_edges)
			
		for node in nodes:
			node_list.append(node[0])
			
		con = self.db.query(
			'SELECT word1, word2, score, time_id '
			'FROM similar_words '
			'WHERE word1 IN :nodes AND word2 IN :nodes '
			'ORDER BY score DESC',
			nodes=node_list
			)

		# get global maximum of edges - max edges
		for row in con:
			if not str(row['word1'])==str(row['word2']) and int(row['time_id']) in time_ids \
				and len(connections)<int(max_edges):
				connections.append([str(row['word1']), str(row['word2']), float(row['score']), int(row['time_id'])])
				
		# filter global max-set of edges by those MAX-TIME-IDS CONNECTIONS that connect two nodes in graph globally (regardless of time-ids of nodes..)
		potential_edges = {}
		singletons = []
		for c in connections:
			if c[0] in node_list and c[1] in node_list:
				# if there is no edge yet, append it -- RESULTS IN MAX ONLY EDGE WHICH MAY HAVE A TIME_ID DIFFERENT TO NODES
				# print(node_dic[c[0]])
				if (c[0], c[1]) not in potential_edges:
					potential_edges[(c[0], c[1])] = (c[2], c[3]) 
		#print("filtered set of potential_edges", potential_edges)
		# map to edge format
		for k,v in potential_edges.items():
			edges.append((k[0], k[1], {'weight': v[0], 'weights': [v[0]], 'time_ids': [v[1]], 'source_text': k[0], 'target_text': k[1]}))
		# filter out the singletons (ie those nodes that have no connecting edge)
		for n in node_list:
			exists = False
			for k,v in potential_edges.items():
				if n == k[0] or n == k[1]:
					exists = True
			if not exists:
				singletons.append(n)
				#removes singletons from graph
				for node in nodes:
					if n == node[0]:
						nodes.remove(node)
		singletons = list(singletons)
		print("max across slices filters out overlay edges!!! -> count of dir edges = overlayd directed edges")
		return edges, nodes, singletons
		
	def get_edges_in_time(self, nodes, max_edges, time_ids):
		# EDGE ALGORITHM FOR NGOT-Overlay
		# This scales datapoints to get |overlay-nodes| = max_edges/2
		# Scales, Edges in Time-Intevals, Logic for Overlay-centric approach
		# No PseudoNodes, overlay information for edges
		edges = []
		connections = []
		node_list = []
		singletons = []
		node_dic = {}
		i = len(time_ids)
		print("number intervals", i)
		print("ngot overlay param in max_ed", max_edges)
	
		for node in nodes:
			node_list.append(node[0])
			node_dic[node[0]] = node[1]
		#print(node_dic)
		#{'a': {'time_ids': [2, 1], 'weights': [0.474804, 0.289683], 'target_text': 'a'},
		
		# QUERY ALL DIRECTED EDGES THAT FULFIL BASIC CRITERIA (WORD1, WORD2, in Selected Time-ids) in ALL SELECTED TIME-IDS
		con = self.db.query(
			'SELECT word1, word2, score, time_id '
			'FROM similar_words '
			'WHERE word1 IN :nodes AND word2 IN :nodes AND time_id IN :time_ids '
			'ORDER BY score DESC',
			nodes=node_list,
			time_ids = time_ids
			)
		
		# get all // alternativ restrict already here: to  global_max = max_edges * i
		for row in con:
			if not str(row['word1'])==str(row['word2']) and int(row['time_id']) in time_ids:
				#and len(connections)<int(global_max):
				connections.append([str(row['word1']), str(row['word2']), float(row['score']), int(row['time_id'])])
		print("ngot overlay all possible directed edges", len(connections))

		# filter global max-set of edges by those which correspond to the more specific time-ids of teh nodes
		# REDUCTION1: begin time overlay process of edges
		potential_edges = {}
		singletons = []
		for c in connections:
			try:
				if c[3] in node_dic[c[0]]["time_ids"] and c[3] in node_dic[c[1]]["time_ids"]:
						
					if (c[0], c[1]) not in potential_edges:
						potential_edges[(c[0], c[1])] = ([c[2]], [c[3]]) 
					else:
				 		potential_edges[(c[0], c[1])][0].append(c[2])
				 		potential_edges[(c[0], c[1])][1].append(c[3])
			except:
				continue
		print ("potential directed time-overlayd edges", len(potential_edges))

		#REDUCTION2: reduce max undirected edges to the number of global overlay undirected edges = max_edges in total
		overlay = []
		for key in potential_edges.keys():
			if ((key[0], key[1]) in overlay or (key[1], key[0]) in overlay):
				continue
			else:
				overlay.append((key[0], key[1]))
		
		# shorten overlay to max global (time-overlaid) length
		undirected = int((max_edges+1)/2)
		# check that is not larger than all potential edges (check macht klarer)
		if undirected > int((len(potential_edges)+1)/2):
			undirected = int((len(potential_edges)+1)/2)
		overlay = overlay[:undirected]
		print("overlay UNDIRECTED laenge adated to available edges", len(overlay))
		# trim potential edges to values in overlay (which is shortened already)
		potential_edges_new = {}
		for key,value in potential_edges.items():
			if (key[0], key[1]) in overlay or (key[1], key[0]) in overlay:
				potential_edges_new[key] = value

		print("new time-overlaid directed edges", len(potential_edges_new))
		# map to edge format
		for k,v in potential_edges_new.items():
			edges.append((k[0], k[1], {'weight': max(v[0]), 'weights': v[0], 'time_ids': v[1], 'source_text': k[0], 'target_text': k[1]}))
		
		# filter out the singletons (ie those nodes that have no connecting edge)
		for n in node_list:
			exists = False
			for k,v in potential_edges_new.items():
				if n == k[0] or n == k[1]:
					exists = True
			if not exists:
				singletons.append(n)
				#filter out singletons
				for node in nodes:
					if n == node[0]:
						nodes.remove(node)

		singletons = list(singletons)
		print("attention directed edges are already time-overlaid")
		return edges, nodes, singletons

	def get_edges_per_time(self, nodes, max_paradigms, max_edges, time_ids, remove_singletons):
		# EDGE Algo for NGOT - Interval
		# Algorithm is part of a projection that creates an overlay graph from all single graphs in each time-id with the same params
		# algorithm allocates nodes and edges per time slice based on parametes and overlays them both! 
		# thus for each slice there is the same max of edges: the max per time-slice = max_paradigms * max edge
		# PARAM: Nodes is of form [['a', {'time_ids': [2, 1], 'weights': [0.474804, 0.289683], 'target_text': 'a'}]]
		# PARAM: max paradigms, max edges are the params for the graph per time-slice
		# PARAM: time-ids - the slices in which one graph each is created
		# RETURNS Edges, nodes_filtered, and singletons of the overaly graph
		# IMPLEMENTATION NOTE: The query to the DB is expensive. Thus, all edges are requested and filtered here.
		
		# VARS -----------------------------
		# RETURN-VARS of Overlay graph
		edges = []
		singletons = []
		nodes_filtered = []
		# HILFSVARIABLEN -----------------------------
		# Edges from DB (all possible ones)
		connections = []
		# Filteres Edges in different form than final edges
		potential_edges = {}
		# various forms of nodes for easier handling
		node_dic = {}
		node_list = []
		for node in nodes:
			node_list.append(node[0])
			node_dic[node[0]] = node[1]
		#print(nodes)
		# 1. --------- get all edges over all time-ids which connect all the nodes

		con = self.db.query(
			'SELECT word1, word2, score, time_id '
			'FROM similar_words '
			'WHERE word1 IN :nodes AND word2 IN :nodes AND time_id IN :time_ids '
			'ORDER BY score DESC',
			nodes=node_list,
			time_ids = time_ids
			)

		# prepare var for allocating edges up until local max reached (ie per slice)
		con_dic = {}
		for time_id in time_ids:
			con_dic[time_id] = []
		
		# allocate edge to dic (in descending order until global graph thresholds and local node thresholds reached)
		# control local threshold for each node with node_time_freq (node, tid) = freq
		# TODO - SOMETHING IS WRONG HERE -- GETS edges that -- ABER NODES NICHT DABEI????
		# loesung - max all possible edges hier- filter wieder anwerfen
		node_time_freq = {}
		# edges factor max_paradigms * max_edges
		print ("max edges para", max_edges)
		for row in con:
			word1 = str(row['word1'])
			word2 = str(row['word2'])
			time_id = int(row['time_id'])
			# print("w1", word1, "w2", word2, "timeid", time_id)
			if not word1 == word2 and time_id in time_ids \
				and word1 in node_dic and word2 in node_dic \
				and time_id in node_dic[word1]['time_ids'] and time_id in node_dic[word2]['time_ids'] \
				and len(con_dic[int(row['time_id'])]) < max_edges: # removed check here to allow later filtering
				
				con_dic[int(row['time_id'])].append([str(row['word1']), str(row['word2']), float(row['score']), int(row['time_id'])])
		
		# convert dic to connections - array
		for k in con_dic.keys():
			for el in con_dic[k]:
				connections.append(el)
		
		# Overlay all edges############################
		edge_dic_temp = {}
		for k in con_dic.keys():
			for el in con_dic[k]:
				# zwischenspeicher k[0] - k[1]
				if ((el[0], el[1]) not in edge_dic_temp.keys()):
					edge_dic_temp[(el[0], el[1])]={"weights": [el[2]], "time_ids": [el[3]]}
				else:
					edge_dic_temp[(el[0], el[1])]["weights"].append(el[2])
					edge_dic_temp[(el[0], el[1])]["time_ids"].append(el[3])
					
		#print(edge_dic_temp)	
		
		for k, v in edge_dic_temp.items():
			edges.append((k[0], k[1], {'weight': max(v["weights"]), 'weights': v["weights"], 'time_ids': v["time_ids"], 'source_text': k[0], 'target_text': k[1]}))

		#print(edges)		
		# # create edge-node list
		edge_node_set = {k[0] for k in edges}.union({k[1] for k in edges})
		# # filter out the singletons (ie those nodes that have no connecting edge)
		singleton_set = set(node_list) - edge_node_set
		# NEW END ############################################################
		# 		
		# transform potential edges to correct edge-format 
		# for k,v in potential_edges.items():
		# 	edges.append((k[0], k[1], {'weight': v[0], 'weights': [v[0]], 'time_ids': [v[1]], 'source_text': k[0], 'target_text': k[1]}))
		
		# remove singletons from nodes
		if remove_singletons:
			for node in nodes:
				if node[0] in edge_node_set:
					nodes_filtered.append(node)
			nodes = nodes_filtered
		# return singletons als liste
		singletons = list(singleton_set)

		print("anzahl time overlayed directed edges additive graph", len(edges))
		#print (edges)
		return edges, nodes, singletons

# FEATURES ---------------------------------------------------------------------------------------------
	def get_features(self, word1: str, time_id: int)-> Dict[str, float]:
		
		features: Dict(str, float) = {}
		f = self.db.query(
			'SELECT feature, score FROM similar_features '
			'WHERE word1=:tw and time_id=:td '
			'ORDER BY score DESC',
			tw=str(word1),
			td=int(time_id)
			)
		for row in f:
			features[str(row['feature'])] = float(row['score'])
		return features