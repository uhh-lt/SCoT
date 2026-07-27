<!-- # Cluster-Analysis-Menu

[Back to user guide contents list](userGuide.md)

After clicking the Analyse Clusters button in the navigation bar, SCoT opens the Cluster Analysis Menu on the right-hand side of the screen. This panel allows users to inspect, compare, edit, and analyze the clusters generated from the graph.

![Analysis Menu](./images/main-right-bar.png)


## Contents
* [Editing the Clusters](#editing-the-clusters)
* [Edit Cluster Name](#edit-cluster-name-&-colour)
* [Edit Cluster Colour](#edit-cluster-name-&-colour)
* [Nodes Plot](#view-nodes-plot)
* [Cluster Context Analysis](#cluster-context-analysis)
* [Delete Complete Cluster](#delete-complete-cluster)


[To the top](#editing-the-graph-via-the-functions-of-the-editing-sidebar)

## Editing the Clusters

Each cluster is displayed as an expandable panel in the analysis menu.
For every cluster, SCoT provides:
* the number of nodes in the cluster,
* a nodes plot,
* option to change cluster name/color,
* option to show the context-words that are shared by all nodes of the cluster,
* and cluster deletion functionality.

Clusters are colour-coded and correspond directly to the colours used in the graph visualization.


![Cluster List](./images/nodes-detail.png)

When hovering over the cluster and context buttons, all the nodes and edges in the graph belonging to the cluster are faded in in the graph.

![Fade In Cluster](./images/hover-over-a-cluster.png)


In some cases, nodes are not connected to any other in the graph. They are only neighbours of the target word. Then, the nodes are not rendered in the graph, but they are listed under "Singletons" in the edit column.

![Singletons](./images/singleton.png)


## Edit Cluster Name & Colour

The program only numbers the clusters and it is up to the user to name the cluster. Users can rename clusters and also assign custom colours through the Name section.

The user can:
* change the cluster name,
* display the cluster label inside the graph,
* and select a custom cluster colour using the colour picker.

![Edit Cluster Name & Colour](./images/cluster-name-color.png){:height="40%" width="40%"}

The user can enter the new name in the text input field "Change cluster name". The name of the cluster is automatically updated while typing. The user can also select a different cluster colour by clicking on the colour field with the label "Select cluster colour" when editing a cluster. Then a colour picker opens and the user can select the new colour. Your colour picker may look different to the one in the image, since the appearance of the colour picker depends on your browser. The colour of the circle next to the cluster name is directly updated. 

However, the graph updates with the new name and color after clicking "Update Clusters" at the bottom of the analysis panel. The user can edit multiple clusters before clicking the "Update Clusters" button to make the updated visible in the graph.

[To the top](#editing-the-graph-via-the-functions-of-the-editing-sidebar)

## View Nodes Plot

The Nodes Plot shows the aggregated average frequency and similarity of cluster nodes across different time intervals. It helps users observe how strongly connected and how frequently used the cluster terms are over time.

Users can also compare multiple clusters in the same plot by selecting "Add other clusters" from the list below the graph. This makes it easier to identify semantic trends, changes in importance, and similarities or differences between clusters over time.

<p align="center">
  <table>
    <tr>
      <td align="center">
        <img src="./images/nodes-plot-1.png" alt="Single cluster nodes plot" width="100%">
        <br>
        <em>Single cluster nodes plot</em>
      </td>
      <td align="center">
        <img src="./images/nodes-plot-all.png" alt="Multiple cluster comparison plot" width="100%">
        <br>
        <em>Multiple cluster comparison plot</em>
      </td>
    </tr>
  </table>
</p>

Users can interact with the graph by "zooming-in or zooming-out" and can also download the generated plot via the "camera icon" at the top. 

## Cluster Context Analysis

The context section shows the most significant syntagmatic contexts of the nodes of a cluster.

![Cluster Context](./images/cluster-context.png)


By clicking the "Context" button, a table opens to the left which shows all context words/features for all nodes in the selected cluster across all selected time intervals. It adds up their significance scores, normalizes them, and returns the top 200 context words. Which means it shows the most important shared context words for the cluster overall. 

The "Context-Target-Filtered" on the other hand, first gets the context words of the original target word, then only keeps cluster context words that also appear in the target word’s context set. In simple words, it shows only the cluster context words that are also relevant to the main target word, making the result more focused.


By selecting context-words and clicking “Context-Frequency Plot”, users can generate a temporal visualization of context frequency over time. This plot helps users analyze when a context emerged, how important a context became, and whether a context increased or declined historically.

The selected context words are listed below for reference.

![Cluster context table](./images/cluster-context-bar.png)
![Cluster context frequency plot](./images/cluster-context-plot.png)


Users can filter the context-words using the search field to focus on specific semantic patterns of a target word. Calculations can take long. It is recommended to query only clusters with 20 or less nodes.

![Filtered context words](./images/context-filtered.png)


## Delete Complete Cluster

Complete cluster can be deleted via the button with the trash icon. The user then has to confirm the deletion in a confirmation message. When the user confirms all the nodes and links of the cluster are deleted.

![Confirm Cluster Deletion](./images/delete-cluster.png){:height="75%" width="75%"}


[To the top](#editing-the-graph-via-the-functions-of-the-editing-sidebar) -->

# Cluster-Analysis-Menu {#cluster-analysis}

[Back to user guide contents list](userGuide.md)

After clicking the Analyse Clusters button in the navigation bar, SCoT opens the Cluster Analysis Menu on the right-hand side of the screen. This panel allows users to inspect, compare, edit, and analyze the clusters generated from the graph.

![Analysis Menu](./images/main-right-bar.png)

As shown in the image above, the sidebar contains three main tabs:

1) Cluster Tab - for inspecting and editing clusters, changing cluster names and colours, viewing node plots, analyzing shared context words, and deleting clusters. <br>
2) Time-Diff Tab - for analyzing how nodes change across time intervals, including which nodes appear, disappear, remain stable, or occur only briefly. <br>
3) Functions Tab - for trying advanced graph tools such as reclustering, editing node-cluster assignments, calculating centrality, and resizing nodes by semantic similarity.

This page discusses the functionalities of the Cluster Tab. To learn about the other tabs, continue with:

[Time-Diff Mode](timeDiff.md) <br>
[Functions Menu](Functions.md)


## Contents
* 1) [Editing the Clusters](#editing-the-clusters)
* 2) [Edit Cluster Name](#edit-cluster-name-and-colour)
* 3) [Edit Cluster Colour](#edit-cluster-name-and-colour)
* 4) [Nodes Plot](#view-nodes-plot)
* 5) [Cluster Context Analysis](#cluster-context-analysis)
* 6) [Delete Complete Cluster](#delete-complete-cluster)


[To the top](#cluster-analysis)

## Editing the Clusters {#editing-the-clusters}

Each cluster is displayed as an expandable panel in the analysis menu.
For every cluster, SCoT provides:
* the number of nodes in the cluster,
* a nodes plot,
* option to change cluster name/color,
* option to show the context-words that are shared by all nodes of the cluster,
* and cluster deletion functionality.

Clusters are colour-coded and correspond directly to the colours used in the graph visualization.


![Cluster List](./images/nodes-detail.png){:height="50%" width="50%"}

When hovering over the cluster and context buttons, all the nodes and edges in the graph belonging to the cluster are faded in in the graph.

![Fade In Cluster](./images/hover-over-a-cluster.png)


In some cases, nodes are not connected to any other in the graph. They are only neighbours of the target word. Then, the nodes are not rendered in the graph, but they are listed under "Singletons" in the edit column.

![Singletons](./images/singleton.png)


## Edit Cluster Name & Colour {#edit-cluster-name-and-colour}

The program only numbers the clusters and it is up to the user to name the cluster. Users can rename clusters and also assign custom colours through the Name section.

The user can:
* change the cluster name,
* display the cluster label inside the graph,
* and select a custom cluster colour using the colour picker.

![Edit Cluster Name & Colour](./images/cluster-name-color.png){:height="40%" width="40%"}

The user can enter the new name in the text input field "Change cluster name". The name of the cluster is automatically updated while typing. The user can also select a different cluster colour by clicking on the colour field with the label "Select cluster colour" when editing a cluster. Then a colour picker opens and the user can select the new colour. Your colour picker may look different to the one in the image, since the appearance of the colour picker depends on your browser. The colour of the circle next to the cluster name is directly updated. 

However, the graph updates with the new name and color after clicking "Update Clusters" at the bottom of the analysis panel. The user can edit multiple clusters before clicking the "Update Clusters" button to make the updated visible in the graph.

[To the top](#cluster-analysis)

## View Nodes Plot {#view-nodes-plot}

The Nodes Plot shows the aggregated average frequency and similarity of cluster nodes across different time intervals. It helps users observe how strongly connected and how frequently used the cluster terms are over time.

Users can also compare multiple clusters in the same plot by selecting "Add other clusters" from the list below the graph. This makes it easier to identify semantic trends, changes in importance, and similarities or differences between clusters over time.

<p align="center">
  <table>
    <tr>
      <td align="center">
        <img src="./images/nodes-plot-1.png" alt="Single cluster nodes plot" width="100%">
        <br>
        <em>Single cluster nodes plot</em>
      </td>
      <td align="center">
        <img src="./images/nodes-plot-all.png" alt="Multiple cluster comparison plot" width="100%">
        <br>
        <em>Multiple cluster comparison plot</em>
      </td>
    </tr>
  </table>
</p>

Users can interact with the graph by "zooming-in or zooming-out" and can also download the generated plot via the "camera icon" at the top. 

## Cluster Context Analysis {#cluster-context-analysis}

The context section shows the most significant syntagmatic contexts of the nodes of a cluster.

![Cluster Context](./images/cluster-context.png)


By clicking the "Context" button, a table opens to the left which shows all context words/features for all nodes in the selected cluster across all selected time intervals. It adds up their significance scores, normalizes them, and returns the top 200 context words. Which means it shows the most important shared context words for the cluster overall. 

The "Context-Target-Filtered" on the other hand, first gets the context words of the original target word, then only keeps cluster context words that also appear in the target word’s context set. In simple words, it shows only the cluster context words that are also relevant to the main target word, making the result more focused.


By selecting context-words and clicking “Context-Frequency Plot”, users can generate a temporal visualization of context frequency over time. This plot helps users analyze when a context emerged, how important a context became, and whether a context increased or declined historically.

The selected context words are listed below for reference.

![Cluster context table](./images/cluster-context-bar.png){:height="50%" width="50%"} <br>
![Cluster context frequency plot](./images/cluster-context-plot.png){:height="50%" width="50%"}


Users can filter the context-words using the search field to focus on specific semantic patterns of a target word. Calculations can take long. It is recommended to query only clusters with 20 or less nodes.

![Filtered context words](./images/context-filtered.png){:height="50%" width="50%"}

[To the top](#cluster-analysis)


## Delete Complete Cluster {#delete-complete-cluster}

Complete cluster can be deleted via the button with the trash icon. The user then has to confirm the deletion in a confirmation message. When the user confirms all the nodes and links of the cluster are deleted.

![Confirm Cluster Deletion](./images/delete-cluster.png){:height="75%" width="75%"}


[To the top](#cluster-analysis)

---

To analyze how nodes change across selected time intervals continue with: [Time-Diff Tab](timeDiff.md)
