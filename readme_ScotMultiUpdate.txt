
SCOT MULTIUPDATE 

The new Scot multi-database version enables the use of different collections/databases
A separate database is used for each Scot collection

Scope
App is already fully functional
Applies to files in folder src_vue

Changes:
The following changes have been made to Scot, which also require new settings in the Config.json

1 Config.json
The config.json is the most important point to set up the different collections with their names, db-connection-strings and frontend information.
All parts of the application need to know on which collection/db they operate on. Thus, setting the collection name in config.json is important.
For security reasons, these information need to be set twice (once for public frontend information, once for config of db-server and backend)
Here is an example - en_books and fi_news are the collection-names

	"host" : "127.0.0.1", ## Identifies the host where scot.py is running
	"databases" : { # information for backend
		"default" : "mysql://user:password@localhost/scot", # default must be present to catch name errors
		"en_books" : "mysql://user:password@localhost/scot", # assign a database connection string to each collection
		"fi_news" : "mysql://user:password@localhost/scot2"
	},
	"databases_info":{ # information for the frontend
		"English Books": "en_books" # collection name must match collection name above "en_books" == "en_books"
		"Finnish News" : "fi_news" 
	}

2. vue.js
Since the frontend needs a default start value at startup before it gets databases_info from the rest-api,
you must enter two start values in vue.js in data:, that match the frontend databases_info
db : "en_books",   // collection name
db_key: "English Books" // key in databases_info to select the collection name

That's all for configuration. -----------------------------------------------------------------------------------------------

To enable multiple databases, the following internal changes have been made

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





	
