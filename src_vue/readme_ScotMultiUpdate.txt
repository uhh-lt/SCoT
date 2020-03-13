--------- ENGLISH

The Scot multi-database enabled the use of different collections/databases
A separate database is used for each Scot collection
The following changes have been made to Scot, which also require new settings in the Config.json

1 Config.json
The config.json is the most important point to set up the different collections with their keys, db-strings and frontend information
All parts of the application need to know on which collection/db they operate. Thus, setting the collection/db key in config.json is important

Here is an example - en_books and fi_news are the collection-keys

	"host" : "127.0.0.1", ## Identifies the host where scot.py is running
	"databases" : {
		"default" : "mysql://user:password@localhost/scot", # default must be present to catch key errors
		"en_books" : "mysql://user:password@localhost/scot", # assign a database connection string to each collection
		"fi_news" : "mysql://user:password@localhost/scot2"
	},
	"databases_info":{ display name for the frontend
		"English Books": "en_books"
		"Finnish News" : "fi_news" 
	}

2. vue.js
Since the frontend needs a default start value at startup before it gets the information about all collections from the backend,
you must enter two start values in vue.js in data:, e.g.
db : "en_books",
db_key: "English Books"  (please ignore the _key addition here - this is just a reminder that key and value have switched in the frontend)

That's all for configuration. -----------------------------------------------------------------------------------------------

To enable Scot to handle the multiple databases, the following internal changes have been made

3. vue.js / index.html
Dropdown-selector-box to switch databases
when switching over, the timeslices in the frontend are queried and displayed again (there are differences between fi-news and google books, for example)

4. scot.py - REST
the rest interface has been changed. Since the collections are hierarchical resources, they are at the top of the URL in the Rest interface
There the parameters are passed and transferred to the DB.py

5. db.py - database connector
When initializing the dao (dy.py), the collection key (see config) is passed to the constructor of db.py. db.py then searches for the
matching db-connection-string from the config.json If the key is wrong, it takes the default connection

 
Enjoy.
If you have any questions, email me at haase@informatik.uni-hamburg.de


--------------------- GERMAN


Das Scot-Multi-Database-Update gibt Scot die Möglichkeit, verschiedene Collections/Datenbanken zu nutzen
Für jede Scot-Collection wird eine eigene Datenbank genutzt
Dafür wurden die folgenden Änderungen an Scot durchgeführt, die auch neue Einstellungen in der Config.json erfordern

1. Config.json
Die config.json ist der wichtigste punkt, um die verschiedenen Collections mit ihren keys, db-strings und Frontend-Informationen einzurichten
Zentrale Mittel, damit alle Teile der Anwendung wissen, auf welcher Collection sie operieren ist der Collection key in der config.json
-- also hier z.B. en_books, fi_news 

Hier ist ein Beispiel:

	"host" : "127.0.0.1", ## Bezeichnet den Host auf dem scot.py läuft
	"databases" : {
		"default" : "mysql://user:password@localhost/scot", # default muss vorhanden seien, um key fehler abzufangen
		"en_books" : "mysql://user:password@localhost/scot", # hier einfach jeder collection einen datenbank-connection string zuweisen
		"fi_news" : "mysql://user:password@localhost/scot2"
	},
	"databases_info":{ # hier allen collections einen Anzeige-Namen im Frontend zuweisen
		"English Books": "en_books",
		"Finnish News" : "fi_news" 
	}

2. vue.js
Da das Frontend beim Starten einen Standard-Startwert benötigt, bevor es vom Backend die Informationen über alle Collections bekommt,
muss man in der vue.js zwei Startwerte in data: eintragen, also z.B.
db : "en_books",
db_key: "English Books", 

Das ist alles für die Konfiguration.----------------------------------------------------------------------

Damit Scot mit den multiplen Datenbanken umgehen kann, wurden ferner folgende interne Änderungen vorgenommen

3. vue.js / index.html
Dropdown-selector-box, um datenbanken umzuschalten
beim umschalten werden die time-slices im frontend neu abgefragt und angezeigt (sie sind z.B. zwischen fi-news und google books unterschiedlich)

4. Scot.py - REST
die Rest-Schnittstelle wurde geändert. Da die Collections hierarchische Ressourcen sind, stehen sie in der Rest-Schnittstelle in der URL an erster Stelle
Dort werden die parameter übergeben und an die DB.py übergeben

5. Db.py - database connector
Bei der Initialisierung des Dao (dy.py) wird dem Constructor von Db.py der Collection-key (siehe config) übergeben. die db.py sucht sich dann den
dazu passenden db-connection-string aus der config.json. Wenn der key falsch ist, nimmt sie die default-connection

That's it. 
Enjoy.
Wenn ihr Fragen habt, mailt mir unter haase@informatik.uni-hamburg.de


	