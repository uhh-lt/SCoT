import sys
from pathlib import Path
print(Path(__file__).resolve().parents[1])
sys.path.append(str(Path(__file__).resolve().parents[1]))
from model.graph_data import OverlayGraph, OverlayCluster, OverlayLink, OverlayNode, InOutParameter
from dataclasses import dataclass, asdict
import json

# Create Graph-data
inout = InOutParameter()
inout.selected_intervals=[1,2]
print(asdict(inout))
graph = OverlayGraph()
graph.in_out_parameter = inout
print(json.dumps(asdict(graph)))
print(json.loads(json.dumps(asdict(graph))))
graph2 = OverlayGraph(**asdict(graph))
print(graph2)