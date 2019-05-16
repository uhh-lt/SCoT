import records
import chineseWhispers

TARGET_WORD = "freedom/NN"
START_YEAR = 1909
END_YEAR = 1972
PARADIGMS = 10
PPARADIGMS = 10
DENSITY = 10
TIME_DIFF = False

def main():
	db = records.Database('mysql://inga@localhost/scot')
	time_ids = []
	t= db.query(
		'SELECT id FROM time_slices WHERE start_year>=:start AND end_year<=:end',
		start=START_YEAR, end=END_YEAR)
	for r in t:
		time_ids.append(r['id'])

	nodes = get_nodes(
	db,
	TIME_DIFF,
	TARGET_WORD,
	PARADIGMS,
	PPARADIGMS,
	time_ids
	)

	edges = get_edges(
		db,
		TIME_DIFF,
		nodes,
		DENSITY,
		time_ids
		)

	clusters_json = chineseWhispers.chinese_whispers(nodes, edges)
	print(clusters_json)



def get_edges(db, TIME_DIFF, nodes, DENSITY, time_ids):
	# TODO improve performance!
	edges = []
	if not TIME_DIFF:
		connections = []
		# con = db.query(
		# 	'SELECT DISTINCT word1, word2, count, time_id '
		# 	'FROM similar_words WHERE time_id IN :time_ids AND word1 IN :nodes AND word1!=word2 '
		# 	'ORDER BY COUNT DESC LIMIT :dens',
		# 	time_ids=time_ids,
		# 	nodes=list(nodes.keys()),
		# 	dens=DENSITY
		# 	)
		for node_id in nodes:
			con = db.query(
				'SELECT DISTINCT word2, count, time_id '
				'FROM similar_words WHERE time_id IN :t AND word1=:tw AND word1!=word2 '
				'ORDER BY COUNT DESC LIMIT :dens',
				t=time_ids, tw=node_id, dens=DENSITY)
			for row in con:
				connections.append([node_id, row['word2'], row['count'], row['time_id']])
		
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


def get_neighbouring_nodes(db, target_word_id, size, time_ids):
	node_ids = set()
	for tid in time_ids:
		target_word_senses = db.query(
			'SELECT word1 FROM similar_words WHERE word2=:tw AND time_id=:t AND word1!=word2 ORDER BY COUNT DESC LIMIT :p',
			tw=target_word_id, t=tid, p=size
			)
		for row in target_word_senses:
			node_ids.add(row['word1'])
	return node_ids


def add_id_and_text(db, node_ids):
	nodes = {}
	for node_id in node_ids:
		text = db.query('SELECT word FROM words WHERE id=:i',
			i=node_id)[0]['word']
		nodes[node_id] = text
	return nodes


def get_nodes(
	db, time_diff, target_word, paradigms, pparadigms, time_ids):
	if not time_diff:
		nodes = {}
		# get direct paradigms to target word
		target_word_id = db.query(
			'SELECT id FROM words WHERE word=:tw',
			tw=target_word)[0]['id']
		node_ids = get_neighbouring_nodes(
			db,
			target_word_id,
			paradigms,
			time_ids
			)
		nodes = add_id_and_text(db, node_ids)
		
		# get indirect paradigms to target word
		for node_id in node_ids:
			pnode_ids = get_neighbouring_nodes(
				db,
				node_id,
				pparadigms,
				time_ids
				)
			pnodes = add_id_and_text(db, pnode_ids)
			nodes.update(pnodes)
		return nodes
	else:
		pass

if __name__ == "__main__":
	main()