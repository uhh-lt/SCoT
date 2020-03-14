import records
import json

class Database:
	def __init__(self, collection, configfile = 'config.json'):
		with open(configfile) as config_file:
			config = json.load(config_file)
		if (collection in [*config["collections"]]):
			self.db = records.Database(config["collections"][collection])
		else:
			self.db = records.Database(config["collections"]['default'])

	def get_all_years(self, position):
		# get all the information on a certain column in the time_slices table, e.g. position='start_year'
		years = []
		t = self.db.query('SELECT * FROM time_slices')
		for row in t:
			year = {}
			year["value"] = int(row[position])
			year["text"] = str(row[position])
			years.append(year)
		return years


	def get_time_ids(self, start_year, end_year):
		# get the corresponding ids for the start and end_year parameters
		time_ids = []
		t = self.db.query(
			'SELECT id FROM time_slices WHERE start_year>=:start AND end_year<=:end',
			start=start_year, end=end_year)

		for r in t:
			time_ids.append(r['id'])
		return time_ids


	# TODO: delete this function, not needed
	def get_max_time_id(self):
		max = self.db.query(
			'SELECT max(id) FROM time_slices')[0]['max(id)']
		return max

	# TODO: delete this function, not needed
	def get_min_time_id(self):
		min = self.db.query(
			'SELECT min(id) FROM time_slices')[0]['min(id)']
		return min


	# get the nodes for a target word from the database
	# TODO: delete this function and replace everywhere
	def get_nodes(
		self,
		target_word,
		paradigms,
		time_ids
		):
		senses = self.get_neighbouring_nodes_time_diff(
			target_word,
			paradigms,
			time_ids
			)
		return senses

	# retrieve the neighbouring nodes (collocations) for a target word from the database
	def get_neighbouring_nodes_time_diff(
			self,
			target_word,
			size,
			time_ids):
		nodes = []
		target_word_senses = self.db.query(
			'SELECT word2, time_id FROM similar_words '
			'WHERE word1=:tw AND word1!=word2 '
			'ORDER BY score DESC',
			tw=target_word 
			)
		for row in target_word_senses:
			exists = False
			if row['time_id'] in time_ids and len(nodes) < size:
				for node in nodes:
					if node[0] == row['word2']:
						exists = True
						if not row["time_id"] in node[1]["time_ids"]:
							node[1]["time_ids"].append(row['time_id'])
				
				if not exists:
					nodes.append([row['word2'], {"time_ids": [row['time_id']]}])

		return nodes

	# TODO: delete function
	def get_neighbouring_nodes(
		self,
		target_word,
		size,
		time_ids
		):
		nodes = set()
		target_word_senses = self.db.query(
			'SELECT word2, time_id FROM similar_words '
			'WHERE word1=:tw AND word1!=word2 '
			'ORDER BY score DESC',
			tw=target_word
			)
		for row in target_word_senses:
			if row['time_id'] in time_ids and len(nodes)<=size-1:
				nodes.add(row['word2'])
		return nodes


	# retrieve all the edges between the nodes
	def get_edges(self, nodes, density, time_ids):
		edges = []
		connections = []
		node_list = []
		possible_singletons = []
		singletons = []

		for node in nodes:
			node_list.append(node[0])

		# Alternative way to find the edges, results in slightly different ones, differently distributed.
		# for node in node_list:
		# 	cons = self.db.query(
		# 		'SELECT DISTINCT word1, word2, score '
		# 		'FROM similar_words '
		# 		'WHERE word1 IN :nodes AND word2 = :node AND word1!=word2 AND time_id IN :time_ids '
		# 		'ORDER BY score DESC '
		# 		'LIMIT :density', nodes=node_list, node=node, time_ids=time_ids, density=density
		# 		)

		# 	if len(cons.all()) > 0:
		# 		for row in cons:
		# 			edges.append([row[0], row[1], {'weight': row[2]}])
		# 	else:
		# 		possible_singletons.append(node) # potential singletons, are not source

		# for s in possible_singletons:
		# 	is_singleton = True
		# 	for con in edges:
		# 		if s == con[0] or s == con[1]:
		# 			is_singleton = False

		# 	if is_singleton:
		# 		singletons.append(s)
		# 		for node in nodes:
		# 			if node[0] == s:
		# 				nodes.remove(node)


		con = self.db.query(
			'SELECT word1, word2, score, time_id '
			'FROM similar_words '
			'WHERE word1 IN :nodes AND word2 IN :nodes '
			'ORDER BY score DESC',
			nodes=node_list
			)


		for row in con:
			if not row['word1']==row['word2'] and row['time_id'] in time_ids \
				and len(connections)<=density*len(node_list):
				connections.append([row['word1'], row['word2'], row['score']])
		
		potential_edges = {}
		singletons = []
		for c in connections:
			if c[0] in node_list and c[1] in node_list:
				# if there is no edge yet, append it
				if (c[0], c[1]) not in potential_edges:
					potential_edges[(c[0], c[1])] = c[2]
				# if there is, average the weight (edges are independet of the time slices)
				else:
					weight = c[2]
					avg = (potential_edges[(c[0], c[1])] + weight) / 2
		
		# filter out the singletons
		for n in node_list:
			exists = False
			for k,v in potential_edges.items():
				if n == k[0] or n == k[1]:
					exists = True
					edges.append((k[0], k[1], {'weight': v}))

			if not exists:
				singletons.append(n)

				for node in nodes:
					if n == node[0]:
						nodes.remove(node)

		singletons = list(singletons)

		return edges, nodes, singletons

	def close():
		self.db.close()