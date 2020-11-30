from dataclasses import dataclass, field, asdict
from typing import List, Dict
from flask_sqlalchemy import SQLAlchemy

"""  
This dataclass defines SQL-ORM for the raw Graph, ie the one consisting of directed and not overlaid edges and node-information 
[A node in the network is really an edge between the target-word and the node]
If further defines the ORM for features-data
TODO: Migrate ORM to sqlalchemy later but keep records at the moment
"""



# ----------- ORMS
@dataclass
class RawLink:
    # RAW DATA FROM DB
    word1: str = None
    word2: str = None
    time_id: int = None
    score: float = None
    feature: str = None

@dataclass
class RawFeature:
    # RAW DATA FROM DB
    word1: str = None
    feature: str = None
    time_id: int = None
    score: float = None
    freq: int = None