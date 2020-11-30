from dataclasses import dataclass, field, asdict
from typing import List, Dict

""" 
This class combines all app.collection data for the frontend
The data is drawn from the config file and 
the databases and relates mostly to the 
corpora and intervals
TODO this data should be sent to the frontend for initialisaiton
Currently, to much single information is queried from the backend, such as individual start years
 """
# stores the initialized appCollections-Information for querying
appCollections : AppCollections = None

@dataclass
class Collection:
    # unique id
    collection_key: str = None
    # diplay elements
    collection_name: str = None
    # intervals [sorted asc]
    intervals: List[int]
    # start_dates [sorted asc] in ISO - Number 20201002-01
    # Must be different to end date [thus identifying unique number]
    start_dates: List[int]
    # end_dates
    end_dates: List[int]

@dataclass
class AppCollections:
    collections: List [Collection]


