import records
import json

class Database:
	def __init__(self):
		with open('config.json') as config_file:
			config = json.load(config_file)
		self.db = records.Database(config['database'])

	def get_all_years(self, position):
		years = []
		t = self.db.query(
			'SELECT * FROM time_slices')
		for row in t:
			year = {}
			year["value"] = int(row[position])
			year["text"] = str(row[position])
			years.append(year)
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
		target_word,
		paradigms,
		time_ids
		):
		#if not time_diff:
			#nodes = set()
		senses = self.get_neighbouring_nodes_time_diff(
			target_word,
			paradigms,
			time_ids
			)
			#nodes.update(direct_neighbours)
		return senses
		# else:
		# 	node_anno = {}

		# 	senses = self.get_neighbouring_nodes(target_word, paradigms, time_ids)

		# 	birth_time_ids = []
		# 	min_time_id = self.get_min_time_id()
		# 	for i in range(min_time_id, min(time_ids)):
		# 		birth_time_ids.append(i)

		# 	death_time_ids = []
		# 	max_time_id = self.get_max_time_id()
		# 	for i in range(max(time_ids)+1, max_time_id+1):
		# 		death_time_ids.append(i)

		# 	prev_senses = self.get_neighbouring_nodes(target_word, paradigms, birth_time_ids)
		# 	seq_senses = self.get_neighbouring_nodes(target_word, paradigms, death_time_ids)

		# 	# in senses, but not in prev senses
		# 	births = senses - prev_senses
		# 	deaths = senses - seq_senses
		# 	print("senses = " + str(senses))
		# 	print("prev_senses = " + str(prev_senses))
		# 	print("births = " + str(births))


		# 	for sense in senses:
		# 		if sense in births and not sense in deaths and not min_time_id in time_ids:
		# 			node_anno[sense] = "birth"
		# 		elif sense in deaths and not sense in births and not max_time_id in time_ids:
		# 			node_anno[sense] = "death"
		# 		elif sense in births and sense in deaths and not min_time_id in time_ids and not max_time_id in time_ids:
		# 			node_anno[sense] = "shortlived"
		# 		else:
		# 			node_anno[sense] = "normal"
		# 	#print(node_anno)
			
		# 	return senses, node_anno

	def get_neighbouring_nodes_time_diff(
			self,
			target_word,
			size,
			time_ids):

		nodes = []
		target_word_senses = self.db.query(
		'SELECT word1, time_id FROM similar_words ' 
		'WHERE word2=:tw AND word1!=word2 '
		'ORDER BY score DESC LIMIT 1000',
		tw=target_word 
		)
		#print(target_word_senses)
		print(time_ids);
		for row in target_word_senses:
			exists = False
			if row['time_id'] in time_ids and len(nodes) < size:
				print(row['time_id'])
				for node in nodes:
					if node[0] == row['word1']:
						#print(node[0], node[1])
						exists = True
						node[1]["time_ids"].append(row['time_id'])
				
				if not exists:
					nodes.append([row['word1'], {"time_ids": [row['time_id']]}])

		return nodes


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
		node_list = []
		for node in nodes:
			node_list.append(node[0])

		con = self.db.query(
			'SELECT word1, word2, score, time_id '
			'FROM similar_words '
			'WHERE word1 IN :nodes AND word2 IN :nodes '
			'ORDER BY score DESC',
			nodes=node_list)
		# nodes=list(nodes) when using get_neighbouring_nodes

		for row in con:
			if not row['word1']==row['word2'] and row['time_id'] in time_ids and len(connections)<=density*len(node_list):
				connections.append([row['word1'], row['word2'], row['score']])
		
		potential_edges = {}
		#singletons = set()
		singletons = []
		for c in connections:
			if c[0] in node_list and c[1] in node_list:
				if (c[0], c[1]) not in potential_edges:
					potential_edges[(c[0], c[1])] = c[2]
				else:
					weight = c[2]
					avg = (potential_edges[(c[0], c[1])] + weight) / 2

		#print(nodes)
		#print(potential_edges)
		
		for n in node_list:
			exists = False
			for k,v in potential_edges.items():
				if n == k[0] or n == k[1]:
					exists = True
					edges.append((k[0], k[1], {'weight': v}))

			if not exists:
				#singletons.add(n)
				singletons.append(n)

				for node in nodes:
					if n == node[0]:
						nodes.remove(node)
		
		#nodes = nodes - singletons
		# for node in nodes:
		# 	if node[0] in singletons:
		# 		nodes.remove(node)

		singletons = list(singletons)

		return edges, nodes, singletons

	def close():
		self.db.close()