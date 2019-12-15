# Interacting with the Graph

This section describes how the user can manipulate the graph directly.

[Hover over Nodes](#hover-over-nodes)

[Dragging Nodes](#dragging-nodes)

[The Node Options Menu](#the-node-options-menu)

* [Assigning a Node to a Different Cluster](#asigning-a-node-to-a-different-cluster)
* [Creating a New Cluster for a Node](#creating-a-new-cluster-for-a-node)
* [Deleting a Node](#deleting-a-node)


## Hover over Nodes

When hovering over a node in the graph only the node itself and its neighbouring nodes and the edges connecting them are faded in. This way, the user can explore the direct vicinity of a node more easily.

<!-- TODO: replace screenshot -->
![Fade In Neighbouring Nodes](./images/mouseover_node.png)


## Dragging Nodes

In the edit column the dragging behaviour of the nodes can be selected.

![Dragging Behaviour Setting](./images/dragging_restart_sim.png)

SCoT provides two different types of dragging behaviours for nodes. The default dragging behaviour is "Keep force for dragging (no brush available)".
Using this dragging behaviour, only one node at a time can be selected. The user selects a node by clicking on it. Then the selected node is marked with a red circle around it.

<!-- TODO: replace screenshot -->
![Selected Node](./images/selected_node.png)

The selected node can then be moved to a different position through drag & drop. The nodes in the graph reposition themselves automatically according to the force simulation, as long as they have not been moved manually before. If a node as been dragged to a different position, it stays in that position, even if the simulation parameters are changed.

The other dragging behaviour is "Enable brush and single node movement". Using the dragging behaviour pauses the simulation, meaning you can select a node and drag it around without any other nodes following. You can also *brush* over several nodes to select them. To use the brush, hold down and drag the cursor, which the opens up a kind of box. All the nodes in this box are selected and can be dragged at the same time maintaining their exact positions to each other. To drag multiple selected nodes, click on one of those nodes and drag it to its new position. The other nodes are moved simultaneously. Again, nodes that have been dragged are fixed to their position from then on.

With the button "Restart Simulation" the user can release all the fixed nodes.


## The Node Options Menu

When the user selects a node, a button "Options" is faded in in the navbar. When clicking on the "Options" button, a drop down menu opens with functions to manipulate the selected node. For normal nodes, there are three functions available to the user.

<!-- TODO: insert screenshot of node options menu -->

 1. Assigning the node to a different cluster
 2. Creating a new cluster and assigning the node to it
 3. Delete the node from the graph

### Assigning a Node to a Different Cluster
In case the user does not agree with the system's hypothesis, they can assign a node to a different existing cluster.

After selecting the option "Assign to different cluster", a modal is opened,  which shows the selected node, its current cluster, and an input field in which the user can enter the new cluster of the node.

![Change Cluster Assignment](./images/change_cluster_assignment.png)

On clicking "OK", the node's colour changes to the one of the newly assigned cluster. It also changes the cluster in the cluster list.

If cluster labels are used, they do not automatically update, but have to be deleted manually and reentered with the updated clusters via the edit function of the respective cluster.

### Creating a New Cluster for a Node
TBA

## Deleting a Node
<!-- normal node -->

<!-- cluster node -->
Cluster labels can also be deleted via selecting them (clicking on them) and then pressing `BACKSPACE`.

**Note of caution:** Currently, selected cluster nodes are always deleted when pressing `BACKSPACE`. So please check, if any cluster nodes are selected beforehand!