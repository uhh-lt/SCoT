function call_graph() {
	console.log("call graph");
	var target_word = document.getElementsByName('target_word')[0].value;
	console.log(encodeURIComponent(target_word))
	var start_year = document.querySelector('input[name="start_year"]:checked').value;
	var end_year = document.querySelector('input[name="end_year"]:checked').value;
	var direct_neighbours = document.getElementsByName('direct_neighbours')[0].value;
	var density = document.getElementsByName('density')[0].value;
	var mode = document.querySelector('input[name="mode"]:checked').value;
	//var url = "/graph/" + encodeURIComponent(target_word) + "/" + start_year + "/" + end_year + "/" + direct_neighbours + "/" +indirect_neighbours + "/" + density + "/" + mode;
		//console.log(url)
	var url = '/sense_graph' + '/' + encodeURIComponent(target_word) + '/' + start_year + '/' + end_year + '/' + direct_neighbours + '/' + density + '/' + mode
	render_graph(url);
}