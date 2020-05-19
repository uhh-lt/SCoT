# Parameter Input and General Settings

[Back to user guide contents list](userGuide.md)

A sidebar to change the general settings of SCoT and enter the parameters for rendering and updating a graph is located to the left side of the page.

## Content

* [Rendering a Graph from the Database](#rendering-a-new-graph-from-the-database)
* [Rendering a Graph from a File](#rendering-a-graph-from-a-file)
* [Update a Graph](#updating-a-graph)


## Parameter Input for Rendering a Graph
When the user first opens SCoT, they may either render a new graph by entering the required parameters in the left column or they can load a previously stored graph again from a file.

The image shows a new session.

![Clean new session](./images/02_settings.jpb "New Session")

[To the top](#parameter-input-and-general-settings)


### Rendering a New Graph from the Database

If the user wants to render a new graph from the database, he or she needs to specify some parameters.

![Enter Parameters](./images/enter_parameters.png "Enter parameters"){:height="35%" width="35%"}

First, the user needs to enter a target word.

<!-- Leave note -->
**Note:** For the Google Books data, the respective part-of-speech tag needs to be appended to the query word. The correct query word for “crisis” would therefore be “crisis/NN” or “crisis/NNP”. The data uses the [Penn Treebank POS tags](https://www.ling.upenn.edu/courses/Fall_2003/ling001/penn_treebank_pos.html). Other data might have different tags, or none.

If the user enters a target word, for which there is no match in the database, they will recieve the following alert.

![No Matching Target word found in database](./images/alert_no_matching_target.png)


Secondly, the user needs to be specify how many nodes the graph should contain (a.k.a. "Number of neighbours"), as well as the maximum number of edges on a node. default, the number of neighbours is set to 100 (regulating the number of visible paradigms) and the maximum number of edges per paradigm is set to 30 (regulating the density of the graph, smaller numbers result usually in more clusters).

Last but not least, the user has to specify the time period in which the collocations should occur. Per default, this is set to encompass all the time slices (1520 - 2008 for Google Books).

Another parameter is the mode. However, a graph is always rendered in the sense clustering mode, so I recommend to just leave it as it is when rendering a new graph. The "Time Diff" mode is described in a separate [section](timeDiff.md).

[To the top](#parameter-input-and-general-settings)


### Rendering a Graph From a File

See [the functions of the navbar](navbar.md) for more information

[To the top](#parameter-input-and-general-settings)


### Updating a Graph

![Update the graph](./images/update_graph.png)

The user can change the number of nodes and edges in a rendered graph. This can be done via the "Update" function. The user can specify the desired values and change the graph, without starting a new session. However, the cluster will be different after updating the graph, because the clustering algorithm is currently executed anew.

[To the top](#parameter-input-and-general-settings)
