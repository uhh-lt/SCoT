# SCoT
SCoT (Sense Clustering over Time) is a web application to view the senses of a word and their evolvement over time. The idea is to help anyone interested in diachronic semantics visualize and compare the meanings a word had at different points in time.

This tool was initially developed in the context of the Master Project "Web Interfaces for Language Processing Systems" at the University of Hamburg in 2019.

For information about current developers, supervisors and related publications, see the GitHub-pages and WebPages of the Language Technology Group of the University of Hamburg.

------------------------------------------------------------
SCOT MULTIUPDATE 

The new Scot multi-collection version enables the use of different collections, such as English Google Books, Finnish News etc.
A separate database is used for each Scot collection

Changes:
The following changes have been made to Scot, which also require new settings in the Config.json
changes apply to app-files in folder src_vue

1 Config.json
The config.json is the most important point to set up the different collections with their keys, db-connection-strings and display names.
All parts of the application need to know on which collection/db they operate on. Thus, setting the collection key (ie en_books) in config.json is important. The key is used in the fronted, with respect to the sql-database and elasticsearch.
Here is an example - en_books and fi_news are the collection_keys

{
	"host" : "127.0.0.1",

"elasticsearch": {"host": "elasticsearch", "port": 9200},

	"collections_info_backend" : {
					"default" : "mysql://user:password@db/scot",
					"en_books" : "mysql://user:password@db/scot",
					"fi_news_tri" : "mysql://scot:scot@ltdatabase1/DT_finnews_trigram",
					"fi_news_bi" : "mysql://scot:scot@ltdatabase1/DT_finnews_bigram",
					"fi_news_dep" : "mysql://scot:scot@ltdatabase1/DT_finnews_dependency",
					"corona_news" : "mysql://scot:scot@ltdatabase1/scot_test"
	},
	"collections_info_frontend":{
			"English Books": {"key":"en_books", "target": "happiness/NN", "p": 100, "d": 30},
			"Finnish News Tri": {"key": "fi_news_tri", "target": "Yksi", "p": 100, "d": 30},
			"Finnish News Bi": {"key": "fi_news_bi", "target": "Yksi", "p": 100, "d": 30},
			"Finnish News Dep": {"key": "fi_news_dep", "target": "Yksi#NUM", "p": 100, "d": 30},
			"Corona News ElasticTest": {"key": "corona_news", "target": "covid19", "p": 20, "d": 2}
	}


}

That's all for configuration. -----------------------------------------------------------------------------------------------

To enable multiple collections, the following internal changes have been made

3. vue.js / index.html
Dropdown-selector-box to switch databases
when switching over, the timeslices in the frontend are queried and displayed again (there may be differences between fi-news and google books)

4. scot.py - REST
the rest interface has been changed. Since the collections are hierarchical resources, they are at the beginning of the URL in the Rest interface
There the parameters are passed and transferred to the DB.py

5. db.py - database connector
When initializing the dao (dy.py), the collection name (see config) is passed to the constructor of db.py. db.py then searches for the
matching db-connection-string from the config.json If the key is wrong, it takes the default connection

 
Enjoy.
If you have any questions, please do not hesitate emailing me at haase[at]informatik.uni-hamburg.de

Best,
Christian


