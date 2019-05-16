import records

class Database:
	def __init__(self):
		self.db = records.Database('mysql://inga@localhost/scot')


	def get_time_ids(self, start_year, end_year):
		time_ids = []

		t= self.db.query(
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
		pparadigms,
		time_ids
		):
		if not time_diff:
			nodes = {}
			# get direct paradigms to target word
			target_word_id = self.db.query(
				'SELECT id FROM words WHERE word=:tw',
				tw=target_word)[0]['id']
			node_ids = self.get_neighbouring_nodes(
				target_word_id,
				paradigms,
				time_ids
				)
			nodes = self.add_id_and_text(node_ids)
			print(nodes)
			
			# get indirect paradigms to target word
			for node_id in node_ids:
				pnode_ids = self.get_neighbouring_nodes(
					node_id,
					pparadigms,
					time_ids
					)
				pnodes = self.add_id_and_text(pnode_ids)
				nodes.update(pnodes)
			print(len(nodes))
			return nodes
		else:
			pass

	def get_neighbouring_nodes(
		self,
		target_word_id,
		size,
		time_ids
		):
		node_ids = set()
		for tid in time_ids:
			target_word_senses = self.db.query(
				'SELECT word1 FROM similar_words ' 
				'WHERE word2=:tw AND time_id=:t AND word1!=word2 '
				'ORDER BY COUNT DESC LIMIT :p',
				tw=target_word_id, t=tid, p=size
				)
			for row in target_word_senses:
				node_ids.add(row['word1'])
		return node_ids

	def add_id_and_text(self, node_ids):
		nodes = {}
		for node_id in node_ids:
			text = self.db.query('SELECT word FROM words WHERE id=:i',
				i=node_id)[0]['word']
			nodes[node_id] = text
		return nodes

	def get_edges(self, time_diff, nodes, density, time_ids):
		edges = []
		if not time_diff:
			connections = []
			# con = db.query(
			# 	'SELECT DISTINCT word1, word2, count, time_id '
			# 	'FROM similar_words WHERE time_id IN :time_ids AND word1 IN :nodes AND word1!=word2 '
			# 	'ORDER BY COUNT DESC LIMIT :dens',
			# 	time_ids=time_ids,
			# 	nodes=list(nodes.keys()),
			# 	dens=DENSITY
			# 	)

			# -> word1 and word2 in nodes! -> density is the problem: density = density*len(nodes)?
			#for node_id in nodes:
			con = self.db.query(
				'SELECT word1, word2, count, time_id '
				'FROM similar_words WHERE time_id IN :t '
				'AND word1 IN :nodes AND word2 IN :nodes '
				'AND word1!=word2 '
				'ORDER BY COUNT DESC LIMIT :dens',
				t=time_ids, nodes=list(nodes.keys()), dens=density*len(nodes))

			for row in con:
				connections.append([row['word1'], row['word2'], row['count'], row['time_id']])
			
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