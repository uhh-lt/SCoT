# Introduction

You can find SCoT at <http://ltdemos.informatik.uni-hamburg.de/scot/>.

SCoT was developed in the context of digital humanities. The aim is to provide a means to help linguists and others interested in diachronic semantics to visualize the different senses of a word over time. 

![A clustered graph](./images/graph_for_intro.png "Clustered graph for target word 'happiness/NN', 100 nodes, 30 edges per node, 1520-2008" )

The main idea is that the user enters a word they are interested in and the different senses of the queried word are displayed in a clustered graph of its collocations for a selected time interval. Collocations are words that appear in the same context or window as the queried word. The clusters are visualized via the node colours. An edge is drawn between two nodes if they also appear in the same context. The clusters are calculated using the Chinese Whispers algorithm and are only a first hypothesis. The user can edit and correct this hypothesis in different ways. The clustering algorithm is non-deterministic, which means that the system may provide different hypotheses for the same graph if the algorithm is executed again.

**Note**: SCoT currently runs on a reduced database of Google Books ranging from 1520 to 2008. The data is split into eight time slices. This means that no exact years or time periods other than these time slices can be queried.

**Note:** Since currently I am working with a reduced database, there are only a limited number of target words available. 
These include:
"crisis/NN", "freedom/NN", "happiness/NN", "legitimate/JJ", "revolution/NN", "life/NN", "public/NN", "diversity/NN", "theory/NN", "history/NN", "scandal/NN", "experience/NN", "bank/NN", "sausage/NN", "hate/NN", "elephant/NN", "number/NN", "chain/NN"

## General Structure
![The general structure](./images/general_structure.png "The general structure of the user interface" )