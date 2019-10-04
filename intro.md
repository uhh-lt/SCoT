# Introduction

You can find SCoT at <http://ltdemos.informatik.uni-hamburg.de/scot/>.

SCoT was developed in the context of digital humanities. The aim is to provide a means to help linguists and those interested in diachronic semantics to visualize the different senses of a word over time. 

![A clustered graph](./images/graph_for_intro.png "Clustered graph for target word 'happiness/NN', 100 nodes, 30 edges per node, 1520-2008" )

The main idea is that the user enters a word he or she is interested in and the different senses of the queried word are displayed in a clustered graph of its collocations for a select time interval. Collocations are words that appear in the same context or window as the queried word. The clusters are visualized through the colour of the nodes. An edge is drawn between two nodes if they are also appear in the same context. The clusters are calculated using the Chinese Whispers algorithm and are only a first hypothesis. The final aim is, that the user can edit and correct this hypothesis in different ways. The clustering algorithm is non-deterministic, which means that the system may provide different hypotheses for the same graph if the algorithm is executed again.

**Note**: SCoT currently runs on a reduced database of Google Books ranging from 1520 to 2008. The data is split into eight time slices. This means that no exact years or time periods other than these time slices can be queried.
