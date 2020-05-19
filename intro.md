# Introduction

[Back to user guide contents list](userGuide.md)

You can find SCoT at <http://ltdemos.informatik.uni-hamburg.de/scot/>.

SCoT was developed in the context of digital humanities to support a digital history of concepts. The aim is to provide a means to help linguists, philosophers and others interested in diachronic semantics to visualize the different senses of a word over time.

![A clustered graph](./images/graph_for_intro.png "Clustered graph for target word 'happiness/NN', 100 nodes, 30 edges per node, 1520-2008" )

The main idea is that users enter a word they are interested in and the different senses of the queried word are displayed in a clustered graph of its paradigms for a selected time interval. Paradigms are words that appear in contexts similar to the contexts of the queried target word. The clusters are visualized via the node colours. An edge is drawn between two nodes if they are paradigms, weighted by their respective context similarity. The clusters are calculated using the Chinese Whispers algorithm and should be understood as only a first automatic hypothesis. The user can edit and correct clusters in different ways. The clustering algorithm is non-deterministic, which means that the system may provide different clusterings for the same graph if the algorithm is executed again.

## General Structure
![The general structure](./images/01workspace_arrow_start.jpg "The general structure of the user interface" )
The picture above shows the general structure of the web page after a graph was rendered for the query "happiness/NN".

At the top, the user finds different ACTION BUTTONS.   
(1) START - slides out the settings menu on the left which enables the rendering of the graph and further graph-display settings
[More info on the settings sidebar](renderingGraph.md)  
(2) ANALYSIS - slides out the analysis menu on the right which provides analytical information about clusters and nodes
[More info on the analysis options](clusters.md)  
(3) TIME-MODE - switches the analysis mode to Time-Diff-Mode which enables diachronic comparisons  
(4) Search, Centrality and Recluster - Functions  
(5) LOAD and SAVE Buttons that enable loading and saving of the Graph in JSON-Format  
  
In the center of the page, the word sense graph is displayed. The user can interact with the graph in different ways.  
(5) EDGE-FEATURE - hovering over an edge brings up information about the edge. CLICKING on it brings out the context analysis slider!  
(6) NODE-FEATURE - hovering over the node in Time-Diff-Mode brings up information. CLICKING on it enables node-specific options, such as deleting or re-assigning to different cluster, that are available in the standard CLUSTER-ANALYSIS mode.  
  
In (4) and (2) the user can also view different centrality measures for the graph - one using betweenness centrality, the other highlighting nodes that are connected to more than one cluster in a balanced fashion ("hubs"). In (4) , the graph can be reclustered via a navbar function. Should the user have zoomed into the graph, the zoom can be reset via the settings menu (1) which also enables the setting of other graph-display options.   
  
**Note:** Many of the graph manipulation functionalities are only available in the sense clustering mode. The buttons to edit the graph are only faded in, if a graph is rendered.
