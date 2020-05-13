import records
import json

class Database:
	def __init__(self, collection, configfile = 'config.json'):
		with open(configfile) as config_file:
			config = json.load(config_file)
		if (collection in [*config["collections_info_backend"]]):
			self.db = records.Database(config["collections_info_backend"][collection])
		else:
			self.db = records.Database(config["collections_info_backend"]['default'])
	
	def get_features(self, word1, time_id):
		# get feature scores for a word ie its syntagmatic context
		#print("db get features in value", word1, time_id)
		features = {}
		f = self.db.query(
			'SELECT feature, score FROM similar_features '
			'WHERE word1=:tw and time_id=:td '
			'ORDER BY score DESC',
			tw=str(word1),
			td=int(time_id)
			)
		
		for row in f:
			features[row['feature']] = int(row['score'])
		#print("db get features out value", features)

		return features

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
			time_ids.append(int(r['id']))
		return time_ids


	# get the nodes for a target word from the database
	def get_nodes(
		self,
		target_word,
		paradigm_size,
		time_ids
		):
		
		nodes = []
		target_word_senses = self.db.query(
			'SELECT word2, time_id, score FROM similar_words '
			'WHERE word1=:tw AND word1!=word2 '
			'ORDER BY score DESC',
			tw=str(target_word) 
			)
		for row in target_word_senses:
			exists = False
			if row['time_id'] in time_ids and len(nodes) < int(paradigm_size):
				for node in nodes:
					if node[0] == row['word2']:
						exists = True
						if not row["time_id"] in node[1]["time_ids"]:
							node[1]["time_ids"].append(row['time_id'])
							node[1]["weights"].append(row['score'])
				
				if not exists:
					nodes.append([row['word2'], {"time_ids": [row['time_id']], "weights": [row["score"]], "target_text": row['word2']}])
		#print(nodes)
		return nodes

	# retrieve all the edges between the nodes
	def get_edges(self, nodes, density, time_ids):
		edges = []
		connections = []
		node_list = []
		singletons = []

		for node in nodes:
			node_list.append(node[0])

		con = self.db.query(
			'SELECT word1, word2, score, time_id '
			'FROM similar_words '
			'WHERE word1 IN :nodes AND word2 IN :nodes '
			'ORDER BY score DESC',
			nodes=node_list
			)


		for row in con:
			if not row['word1']==row['word2'] and row['time_id'] in time_ids \
				and len(connections)<=int(density)*len(node_list):
				connections.append([row['word1'], row['word2'], row['score'], row['time_id']])
				#print(row['word1'], row['word2'], row['score'], row['time_id'])
		
		potential_edges = {}
		singletons = []
		for c in connections:
			if c[0] in node_list and c[1] in node_list:
				# if there is no edge yet, append it
				if (c[0], c[1]) not in potential_edges:
					potential_edges[(c[0], c[1])] = (c[2], c[3])
				
		
		# filter out the singletons
		for n in node_list:
			exists = False
			for k,v in potential_edges.items():
				if n == k[0] or n == k[1]:
					exists = True
					edges.append((k[0], k[1], {'weight': v[0], 'weights': [v[0]], 'time_ids': [v[1]], 'source_text': k[0], 'target_text': k[1]}))

			if not exists:
				singletons.append(n)

				for node in nodes:
					if n == node[0]:
						nodes.remove(node)

		singletons = list(singletons)
		
		return edges, nodes, singletons