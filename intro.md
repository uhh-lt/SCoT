# Introduction

[Back to user guide contents list](userGuide.md)

You can find SCoT at <http://ltdemos.informatik.uni-hamburg.de/scot/>

SCoT is a scholarly software for the graph-based analysis of distributional semantics over time. The software has emerged from interdisciplinary cooperation among computer scientists, computational linguists and humanities scholars. It has been propelled forward by the growing availability of very large corpora of time-sliced digitized texts such as Google Books. There are manifold use cases. SCoT has been used, for example, to unearth the changing meaning of "network" from the fishing-metaphors of the medieval ages to the digital era.

The user starts the programm by selecting a target-word and a precalculated corpus, including the original Google Books corpus. The calculation of the semantic similarity metrics is done beforehand by the JoBim-Framework. SCoT is thus part of a larger NLP-Pipeline consisting of the JoBim-Text-Framework [Part 1] and the SCoT-application [Part 2]. 

The main task of SCoT is to analyse these metrics in relation to the target-word with a clustered graph. The most similar words and their interrelations are projected onto a graph. The user can control the size and density of the graph with two parameters, the maximum number of (most) similar words to the main target-word and the density of the interrelations.

The values are then projected onto the graph by SCoT's main algorithm which was designed by Biemann. This main algorithm chooses the most similar words across all time-slices. The key to the analysis is the global threshold of paradigms [nodes] and their interrelations [edges] that is set by the user. This global limit determines which nodes are considered "relevant" and "irrelevant" across all time-slices and thus determines the resulting senses of the target word. Each corpus comes with a pre-set but it is highly recommended to try out various parameters to get a "feel" for their effect.

 After the user clicks on "Render Graph" - the algorithm runs in several stages. Firstly, it chooses the maximum similar values to the target word. These provide the nodes. Within this reference-frame of paradigms, the algorithm determines the edges. The graph is then clustered with the Chinese Whispers Algorithms by Biemann which runs in O(n). The resulting graph is thus a combination of maximum-values across time-slices. The time-slices can be gathered from the tool-tips of the nodes and edges and can also be visualized in various ways in the time-diff mode. 


![A clustered graph](./images/graph_for_intro.png "Clustered graph for target word 'happiness/NN', 100 nodes, 30 edges per node, 1520-2008" )

After the initial graph has been calculated by SCoT, the user can edit and correct clusters in different ways. The clustering algorithm is non-deterministic, which means that the system may provide different clusterings for the same graph if the algorithm is executed again. The user can also press a "recluster"-button to observe the variance of possible clustering solutions.

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
