# Introduction

[Back to user guide contents list](userGuide.md)

You can find SCoT at <http://ltdemos.informatik.uni-hamburg.de/scot/>

SCoT is a scholarly software for the graph-based analysis of distributional semantics over time. The software has emerged from interdisciplinary cooperation among computer scientists, computational linguists and humanities scholars. It has been propelled forward by the growing availability of very large corpora of time-sliced digitized texts such as Google Books. There are manifold use cases. SCoT has been used, for example, to unearth the changing meaning of "network" from the fishing-metaphors of the medieval ages to the digital era.

![A clustered graph](./images/00appwithgraph.jpg "Clustered graph for target word 'happiness/NN', 100 nodes, 30 edges per node, 1520-2008" )

The user starts the programm by selecting a precalculated corpus [1] and a target-word [2]. The corpora include the original Google Books corpus. The calculation of the semantic similarity metrics is not done by SCoT. The metrics are precalculated by the JoBim-Framework. The main task of SCoT is to analyse these metrics in relation to the target-word with a clustered graph[8]. 

The most similar words and their interrelations are projected onto a graph. The user can control the size and density of the graph with two parameters, the maximum number of (most) similar words to the main target-word [3] and the density of the interrelations. [4] The values are then projected onto the graph by SCoT's main algorithm which was designed by Biemann. This main algorithm chooses the most similar words across all time-slices. The key to the analysis is the global threshold of paradigms [nodes] and their interrelations [edges] that is set by the user. This global limit determines which nodes are considered "relevant" and "irrelevant" across the selected time-slices [5,6] and thus determines the resulting senses of the target word. Each corpus comes with a pre-set but it is highly recommended to try out various parameters to get a "feel" for their effect.

 After the user clicks on "Render Graph" [7] - the algorithm runs in several stages. Firstly, it chooses the maximum similar values to the target word. These provide the nodes. Within this reference-frame of paradigms, the algorithm determines the edges. The graph is then clustered with the Chinese Whispers Algorithms by Biemann. 
 
 ## General Structure
![The general structure](./images/01workspace_arrow_start.jpg "The general structure of the user interface" )
The picture above shows the general structure of the web page after a graph was rendered for the query "happiness/NN".

 
 The resulting graph is a combination of maximum-values across time-slices. The time-slices can be gathered from the tool-tips of the nodes [4] and edges [5] and can also be visualized in various ways in the time-diff mode. After the initial graph has been calculated by SCoT, the user can edit and correct clusters in different ways. 
 Most of these functions are available via these three roots:
 [1] The Start-Button enables the shaping of the graph and the editing of the view settings that shape the display of the graph
 [More info on the settings sidebar](renderingGraph.md)  
 [2] The Analysis Button - brings up the cluster analysis section with the time-diff mode
 [More info on the analysis options](clusters.md)  
 [3] The Search Field allows the searching of nodes in the graph
 [4] The Nodes provide tooltips and can be clicked for contextual information
 [5] The edges provide tooltips and can be clicked for contextual information
 [More info on the contextual mode via nodes and edges]
 
 