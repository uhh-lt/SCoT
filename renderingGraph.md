# Graph-Menu: Parameter Input and View Settings

[Back to user guide contents list](userGuide.md)

The "Graph properties" sidebar is located on the left-hand side of the interface and provides main controls for: creating and updating graphs, configuring graph parameters, and adjusting visualization and interaction settings.

## Content

* [Rendering a Graph from the Database](#rendering-a-new-graph-from-the-database)
* [Rendering a Graph from a File](#rendering-a-graph-from-a-file)

## Rendering a Graph from the Database
When opening SCoT, users can click the "Create Graph" button to open the Graph Menu and configure a new graph. The graph menu allows users to:
select a corpus,
define a target word,
choose a graph type,
and configure graph-generation parameters.

More information about graph generation can be found in the [Introduction](intro.md).

![Clean new session](./images/intro-1.png "Clustered graph for target word 'happiness/NN', 30 nodes, 15 edges per node, 1520-2008" )

### View Settings
The View section contains settings related to graph visualization and interaction.
Available options include:
- resetting the visualization to default settings,
- enabling interaction with the graph,
- selecting node dragging behaviour,
- and modifying force-simulation parameters.

SCoT uses a force-directed layout algorithm to position graph nodes dynamically.


![View settings](./images/view-properties.png "View settings")


## 1. Choosing the Dragging Behaviour

SCoT provides two different node-dragging modes.

![Dragging Behaviour Setting](./images/dragging-behavior.png)

### Single-Drag

Single-Drag is the default dragging behaviour.

- Only one node can be selected and moved at a time.
- The remaining nodes reposition automatically according to the force simulation. 
- Dragged node becomes fixed in its new position, which means that its position does not change if the force parameters are updated or other nodes dragged somewhere.

The user selects a node by clicking on it. Then the selected node is marked with a red circle around it.

![Selected Node](./images/selected_node.png)

### Multi-Drag

Multi-Drag allows users to select multiple nodes at the same time using a brush movement and dragging all of them at the same time to a different position. This dragging pauses the force simulation, meaning you can select a node and drag it around without any other nodes following. Again, nodes that have been dragged are fixed to their position from then on.

### Release Fixed Nodes

All manually dragged/fixed nodes can be released by clicking the "Release All Fixed" button. This allows the force simulation to reposition the nodes dynamically again.


[To the top](#editing-the-graph-via-the-functions-of-the-editing-sidebar)


## 2. Manipulate the Simulation

![Simulation Settings](./images/simulation_settings.png)

SCoT allows the user to edit two simulation parameters that are used to arrange the graph nodes:
- Charge Strength
- Link Distance

<!-- The default value for the charge strength is -50, the default value for the link distance is 50. -->
A graph with 100 nodes, 30 edges and simulation parameter values of charge strength = -50 and link distance = 50 looks like this:

![Default Graph](./images/graph_for_intro.png){:height="75%" width="75%"}

The user can change the value of the charge strength from values in the range of -200 to 100. Changing the charge strength influences the repelling forces between the nodes. The same graph with a charge strength of -100 and the default link distance looks as follows:

![Graph Charge -100](./images/graph_charge-100.png)

As a rule of thumb, a negative charge strength pushes the nodes further apart, simulating repulsion, and a positive charge strength pushes nodes together, simulating gravity or attraction.


The link distance influences the distance between nodes and therefore the length of the edges between them. A high link distance means a long distance between nodes, a low link distance means a small distance between nodes. The following example shows the graph with a link distance of 150 and the default charge.

![Graph Link Distance 360](./images/graph_linkdistance150.png) 

[To the top](#parameter-input-and-general-settings)





<!-- Leave note -->
**Note:** For the Google Books data, the respective part-of-speech tag needs to be appended to the query word. The correct query word for “crisis” would therefore be “crisis/NN” or “crisis/NNP”. The data uses the [Penn Treebank POS tags](https://www.ling.upenn.edu/courses/Fall_2003/ling001/penn_treebank_pos.html). Other data might have different tags, or none.

If the user enters a target word, for which there is no match in the database, they will recieve the following alert.

![No Matching Target word found in database](./images/target-not-found.png)

[To the top](#parameter-input-and-general-settings)

## Rendering a Graph From a File

A graph can also be rendered from a file as explained in the [Functions of Navbar](navbar.md). 

[To the top](#parameter-input-and-general-settings)

