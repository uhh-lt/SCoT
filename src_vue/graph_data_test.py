from tests.graph_data import Graph, OverlayCluster, OverlayLink, OverlayNode, InOutParameter
from dataclasses import dataclass, asdict
import json

# Create Graph-data
inout = InOutParameter()
inout.selected_intervals=[1,2]
print(asdict(inout))
graph = Graph(inout)
print(json.dumps(asdict(graph)))
print(json.loads(json.dumps(asdict(graph))))
graph2 = Graph(**asdict(graph))
print(graph2)