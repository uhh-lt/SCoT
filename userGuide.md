# User Guide


## Introduction

SCoT can be found at: <http://ltdemos.informatik.uni-hamburg.de/scot/>

SCoT was developed in the context of the digital humanities. The aim is to provide a means to help linguists and those interested in diachronic semantics to visualize the different senses of a word over time. The main idea is that the user enters the word he or she is interested in and the different senses of this word are displayed in a clustered graph of its collocations for a certain time period. Collocations are words that appear in the same context as the queried word. The clusters are visualized through the colour of the nodes. An edge is drawn between two nodes if they are also collocations. The clusters are calculated using the Chinese Whispers algorithm and are only a first hypothesis. The clustering algorithm is non-deterministic, which means that the system may provide different hypotheses for the same graph if the algorithm is executed again.

**Note**: SCoT currently runs on a reduced database of Google Books ranging from 1520 to 2008. The data is split into eight time slices. This means that no exact years or time periods other than these time slices can be queried.


## Rendering a Graph
When the user first opens SCoT, he or she as two options to render a graph.
![Clean new session](/images/new_session.png "New Session")
He can either query the database or load an already existing graph from a json file.

### Rendering a Graph from the Database


### Rendering a Graph from a json file


## Maninpulating the Graph
