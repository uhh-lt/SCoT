function call_graph() {
	var url = '/sense_graph' + '/' + encodeURIComponent(target_word) + '/' + start_year + '/' + end_year + '/' + direct_neighbours + '/' + density + '/' + mode
	render_graph(url);
}