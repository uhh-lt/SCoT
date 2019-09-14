# User Guide


## Introduction

SCoT can be found at: <http://ltdemos.informatik.uni-hamburg.de/scot/>

SCoT was developed in the context of the digital humanities. The aim is to provide a means to help linguists and those interested in diachronic semantics to visualize the different senses of a word over time. 

![A clustered graph](./images/graph_for_intro.png "Clustered graph for target word 'happiness/NN', 100 nodes, 30 edges per node, 1520-2008" )

The main idea is that the user enters the word he or she is interested in and the different senses of this word are displayed in a clustered graph of its collocations for a certain time period. Collocations are words that appear in the same context as the queried word. The clusters are visualized through the colour of the nodes. An edge is drawn between two nodes if they are also collocations. The clusters are calculated using the Chinese Whispers algorithm and are only a first hypothesis. The clustering algorithm is non-deterministic, which means that the system may provide different hypotheses for the same graph if the algorithm is executed again.

**Note**: SCoT currently runs on a reduced database of Google Books ranging from 1520 to 2008. The data is split into eight time slices. This means that no exact years or time periods other than these time slices can be queried.


## Rendering a Graph
When the user first opens SCoT, he or she as two options to render a graph.

![Clean new session](./images/new_session.png "New Session")

The user can either query the database or load an already existing graph from a json file.

### Rendering a Graph from the Database
If the user wants to render a new graph from the database, he or she needs to specify some parameters.

![Enter Parameters](./images/Enter_data_to_render_from_db.png "Enter parameters")

First, the user needs to enter a target word.

**Note:** Since currently I am working with a reduced database, there are only a limited number of target words available. 
These include:
"crisis", "freedom", "development", "system", "culture", "work", "labour", "labor", "security", "safety", "autonomy", "order", "experience", "normality", "medium", "communication", "value", "worth", "network", "complexity", "program", "programme", "diversity", "change", "life", "sabotage".

**Note:** For all words the respective part-of-speech tag needs to be appended to the query word. This is due to disambiguation purposes. The correct query words for "crisis" would therefore be "crisis/NN". The data uses the [Penn Treebank POS tags](https://www.ling.upenn.edu/courses/Fall_2003/ling001/penn_treebank_pos.html).


Secondly, it needs to be specified how many nodes the graph should have (aka. "Number of neighbours"), as well as the maximum number of edges on a node. Per default the number of neighbours is set to 100 and the maximum number of edges is set to 30. Feel free to change them as you please.

Another parameter is the mode. However, a graph is always rendered in the sense clustering mode, so I recommend to just leave it as it is when rendering a new graph. "time diff" is described in a later section.

Last but not least, the user has to specify the time period in which the collocations should occur. Per default this is set to the whole period of time.


### Rendering a Graph from a json file
You can save a graph you have been working on to a json file by clicking on the "Save Graph" button in the top right-hand corner. Then the graph is downloaded as "graph.json". Where your graph is saved depends on your browser settings.

The json file has the following format (pseudo code):
```
{
  "links": [
    {
      "source": "joy/NN",
      "target": "delight/NN",
      "weight": "314"
    },
    ...
    ],
  "nodes": [
    {
      "id": "joy/NN",
      "x": 515.5573938806319,
      "y": 477.98070940597063,
      "class": "0",
      "cluster_name": "0",
      "cluster_node": "false",
      "colour": "#a6cee3",
      "time_ids": "7,5,6,4,8,3,2,1"
    },
    ...
    ],
  "singletons": [
    "unhappiness/NN",
    "misery/NN"
  ],
  "target": "happiness/NN",
  "link_distance": 100,
  "charge": -10,
  "start_year": 1520,
  "end_year": 2008,
  "time_diff": false
}
```

The graph in the json file can be loaded into SCoT again via the "Load Graph" button in the top right-hand corner. When clicking on the button a panel is opened where you can browse for your desired json file in your file system.

![Load graph from file](./images/load_graph1.png)

Select your file, click "Render" and continue to work on your graph.

## Interacting with the Graph
There are many ways to interact with the graph, examine and manipulate it.
Most of the manipulation functionalities are only available in the sense clustering mode.
The functionality buttons are only faded in, if a graph is rendered.

![Functionality buttons](./images/buttons_in_navbar.png)

By clicking on the button "Recluster", the clustering algorithm is executed on the graph again, potentially resulting in a different hypothesis.

Clicking on the "Edit Graph" button opens up a column to the right of the graph with options to edit and examine the graph.

![Edit column](./images/scot_with_edit_column.png)

The functionalities available in the edit column are explained in detail in the sections below.

The button "Reset Zoom" resets all the zooming and panning activity to 0. You can zoom into the graph by scrolling in the box with the graph and pan by pressing and the moving the cursor within the box.

![Zoom](./images/zoom_in.png)

The graph is rendered using a force simulation, which means that the positions of nodes are automatically calculated according to different parameters such as the charge between them. 

### Editing the Graph
The user can edit different aspects of the graph, e.g. manipulate simulation parameters, add nodes, name clusters amongst others.

#### Dragging Nodes
In the edit column the dragging behaviour of the nodes can be selected.

![Dragging Behaviour Setting](./images/set_dragging_behaviour.png)

SCoT provides two different types of dragging behaviours for nodes. The default dragging behaviour is "Keep force for dragging (no brush available)".
Using this dragging behaviour, only one node at a time can be selected. The user selects a node by clicking on it. Then the selected node is marked with a red circle around it.

![Selected Node](./images/selected_node.png)

The selected node can then be moved to a different position through drag & drop. The nodes in the graph reposition themselves automatically according to the force simulation, as long as they have not been moved manually before. If a node as been dragged to a different position, it stays in that position, even if the simulation parameters are changed.

The other dragging behaviour is "Enable brush and single node movement". Using the dragging behaviour pauses the simulation, meaning you can select a node and drag it around without any other nodes following. You can also *brush* over several nodes to select them. To use the brush, hold down and drag the cursor, which opens up a box. All the nodes in this box are selected and can be dragged at the same time maintaining their exact positions to each other. To drag selected nodes, click on one of those nodes and drag it to its new position. The other nodes stay in the exact relative position to the dragged node.

#### Manipulate the Simulation
SCoT lets you edit two simulation parameters: the charge strength between the nodes and the link distance.
The default value for the charge strength is -10, the default value for the link distance is 100.
A graph with 100 nodes, 30 edges and these simulation parameter values looks like this:

![Default Graph](./images/graph_default_simulation_settings.png)

Changing the charge strength influences the repelling forces between the nodes. The same graph with a charge strength of -252 and the default link distance looks as follows:

![Graph Charge -252](./images/graph_charge-252_linkdistance100.png)

As a rule of thumb, a negative charge strength pushes the nodes further apart, simulating repulsion, and a positive charge strength pushes nodes together, simulating gravity or attraction.

The link distance influences the distance between nodes and therefore the length of the edges between them. A high link distance means a long distance between nodes, a low link distance means a small distance between nodes. The following example shows and graph with a link distance of 360 and the default charge.

![Graph Link Distance 360](./images/graph_charge-10_linkdistance360.png) 

#### Fade in Neighbours on Hover over Node
TBA

#### Add new Nodes to the Graph
TBA


### Edit Clusters
TBA

#### Edit Cluster Name
TBA

#### Edit Cluster Colour
TBA

#### Add / Delete Cluster Node
TBA

#### Assign a Node to a Different Cluster
TBA

#### Reclustering
TBA

## Time Diff Mode
TBA