import records

class Database:
	def __init__(self):
		self.db = records.Database('mysql://inga@localhost/scot')

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

	def get_nodes(
		self,
		time_diff,
		target_word,
		paradigms,
		time_ids
		):
		if not time_diff:
			nodes = set()
			direct_neighbours = self.get_neighbouring_nodes(
				target_word,
				paradigms,
				time_ids
				)
			nodes.update(direct_neighbours)
			return nodes
		else:
			pass


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


	def get_edges(self, time_diff, nodes, density, time_ids):
		edges = []
		if not time_diff:
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