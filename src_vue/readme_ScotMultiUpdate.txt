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


	