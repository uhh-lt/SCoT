new Vue({
   el: "#vue-app",
   data: {
   		target_word : "",
   		// TODO read from DB!
     	start_year : 0,
     	end_year : 0,
     	senses : 0,
     	edges : 0,
     	time_diff : false,
     	birth_start : 0,
     	birth_end : 0,
     	death_start : 0,
     	death_end : 0,
     	start_years : [{
     		value : 1520, text: "1520"
     	}, {
     		value : 1909, text: "1909"
     	}, {
     		value : 1954, text: "1954"
     	}, {
     		value : 1973, text: "1973"
     	}, {
     		value: 1987, text: "1987"
     	}, {
     		value: 1996, text: "1996" 
     	}, {
     		value : 2002, text: "2002"
     	}, {
     		value : 2006, text: "2006"
     	}],
     	end_years : [{
     		value : 1908, text: "1908"
     	}, {
     		value : 1953, text: "1953"
     	}, {
     		value : 1972, text: "1972"
     	}, {
     		value : 1986, text: "1986"
     	}, {
     		value: 1995, text: "1995"
     	}, {
     		value: 2001, text: "2001" 
     	}, {
     		value : 2005, text: "2005"
     	}, {
     		value : 2008, text: "2008"
     	}]
	},
	methods: {
		getURL: function() {
			console.log(this.target_word)
			var target_word = this.target_word;
			var start_year = this.start_year;
			var end_year = this.end_year;
			var senses = this.senses;
			var edges = this.edges;
			var time_diff = this.time_diff;

			var birth_start = this.birth_start;
			var birth_end = this.birth_end;
			var death_start = this.death_start;
			var death_end = this.death_end;


			var url = '/sense_graph' + '/' + encodeURIComponent(target_word) + '/' + start_year + '/' + end_year + '/' + senses + '/' + edges + '/' + time_diff + '/' + birth_start + '/' + birth_end + '/' + death_start + '/' +death_end;

			render_graph(url, time_diff);
		}
	}

});