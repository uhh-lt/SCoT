import records

class Database:
	def __init__(self):
		self.db = records.Database('mysql://inga@127.0.0.1/scot')

	def get_all_years(self, position):
		years = {}
		t = self.db.query(
			'SELECT :year_type FROM time_slices',
			year_type=position)
		for row in t:
			years["value"] = row[position]
		return years

	def get_time_ids(self, start_year, end_year):
		time_ids = []

		t = self.db.query(
		'SELECT id FROM time_slices WHERE start_year>=:start AND end_year<=:end',
		start=start_year, end=end_year)

		for r in t:
			time_ids.append(r['id'])
		return time_ids

	def get_max_time_id(self):
		max = self.db.query(
			'SELECT max(id) FROM time_slices')[0]['max(id)']
		return max

	def get_min_time_id(self):
		min = self.db.query(
			'SELECT min(id) FROM time_slices')[0]['min(id)']
		return min


	def get_nodes(
		self,
		time_diff,
		target_word,
		paradigms,
		time_ids
		):
		if not time_diff:
			#nodes = set()
			senses = self.get_neighbouring_nodes(
				target_word,
				paradigms,
				time_ids
				)
			#nodes.update(direct_neighbours)
			return senses, {}
		else:
			node_anno = {}

			senses = self.get_neighbouring_nodes(target_word, paradigms, time_ids)

			birth_time_ids = []
			min_time_id = self.get_min_time_id()
			for i in range(min_time_id, min(time_ids)):
				birth_time_ids.append(i)

			death_time_ids = []
			max_time_id = self.get_max_time_id()
			for i in range(max(time_ids)+1, max_time_id+1):
				death_time_ids.append(i)

			prev_senses = self.get_neighbouring_nodes(target_word, paradigms, birth_time_ids)
			seq_senses = self.get_neighbouring_nodes(target_word, paradigms, death_time_ids)

			# in senses, but not in prev senses
			births = senses - prev_senses
			deaths = senses - seq_senses
			print("senses = " + str(senses))
			print("prev_senses = " + str(prev_senses))
			print("births = " + str(births))


			for sense in senses:
				if sense in births and not sense in deaths and not min_time_id in time_ids:
					node_anno[sense] = "birth"
				elif sense in deaths and not sense in births and not max_time_id in time_ids:
					node_anno[sense] = "death"
				elif sense in births and sense in deaths and not min_time_id in time_ids and not max_time_id in time_ids:
					node_anno[sense] = "shortlived"
				else:
					node_anno[sense] = "normal"
			#print(node_anno)
			
			return senses, node_anno

	# def get_neighbouring_nodes_time_diff(
	# 		self,
	# 		target_word,
	# 		size,
	# 		time_ids):

	# 	nodes = {}
	# 	target_word_senses = self.db.query(
	# 	'SELECT word1, time_id FROM similar_words ' 
	# 	'WHERE word2=:tw AND word1!=word2 '
	# 	'ORDER BY score DESC LIMIT 1000',
	# 	tw=target_word 
	# 	)
	# 	#print(target_word_senses)
	# 	for row in target_word_senses:
	# 		if row['time_id'] in time_ids and len(nodes)<=size-1:
	# 			if row['word1'] in nodes:
	# 				if not row['time_id'] in nodes[row['word1']]:
	# 					nodes[row['word1']].append(row['time_id'])
	# 			else:
	# 				nodes[row['word1']] = [row['time_id']]
	# 	#print(nodes)
	# 	return nodes


	def get_neighbouring_nodes(
		self,
		target_word,
		size,
		time_ids
		):
		nodes = set()
		target_word_senses = self.db.query(
			'SELECT word1, time_id FROM similar_words ' 
			'WHERE word2=:tw AND word1!=word2 '
			'ORDER BY score DESC LIMIT 1000',
			tw=target_word 
			)
		#print(target_word_senses)
		for row in target_word_senses:
			if row['time_id'] in time_ids and len(nodes)<=size-1:
				nodes.add(row['word1'])
		#print(nodes)
		return nodes


	def get_edges(self, nodes, density, time_ids):
		edges = []
		connections = []
		con = self.db.query(
			'SELECT word1, word2, score, time_id '
			'FROM similar_words '
			'WHERE word1 IN :nodes AND word2 IN :nodes '
			'ORDER BY score DESC',
			nodes=list(nodes))

		for row in con:
			if not row['word1']==row['word2'] and row['time_id'] in time_ids and len(connections)<=density*len(nodes):
				connections.append([row['word1'], row['word2'], row['score']])
		
		potential_edges = {}
		for c in connections:
			if c[0] in nodes and c[1] in nodes:
				if (c[0], c[1]) not in potential_edges:
					potential_edges[(c[0], c[1])] = c[2]
				else:
					weight = c[2]
					avg = (potential_edges[(c[0], c[1])] + weight) / 2
		for k,v in potential_edges.items():
			edges.append((k[0], k[1], {'weight': v}))
		
		return edges

	def close():
		self.db.close()