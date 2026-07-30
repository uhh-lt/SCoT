# Time Diff Mode {#time-diff-mode}

[Back to user guide contents list](userGuide.md)

When selecting "time diff" mode in the cluster-analysis sidebar on the right-hand side, two options are presented: "Interval" and "Time-Slices".

![Time Diff](./images/time-diff-modes.png)

## 1) Select Interval

With the option "Select Interval" the user can select a specific time interval within the time period selected for the graph and compare the smaller interval to the larger one.

In the example from Google Books data below, the interval from 1931 to 1972 is selected. Nodes that do not occur before 1520 and 1931 are categorized as *born* (green nodes), since they start to occur somewhere within the selected period. Nodes that do not occur between 1972 and 2008 are classified as *deceased* (red nodes), since they stop occurring within the the selected time period. Words that start and stop occurring within the selected time period are categorized as *shortlived* (yellow nodes). All other nodes occur consistently (grey nodes). Hovering over the button shows the nodes in the graph.

![Select Interval](./images/interval-details.png)

All the nodes of a category are listed when the user clicks on the button. When the user hovers over the main time-category button such as "Died before interval"  the nodes belonging to this category are faded in in the graph.

In the graph, the nodes are coloured accordingly when "Show Differences" is clicked. To regain the previous cluster colours in the graph, either switch to "Cluster" or "Functions" in the Cluster Analysis. Or choose "Reset Highlighting" from the top nav-bar. 

![Time Interval Graph](./images/colored-nodes.png)

[To the top](#time-diff-mode)

## 2) Skip through time slices

With the "Skip through time slices" option, you can look at each time slice of your originally selected time period of the graph individually. You can either use it directly when switching from the sense clustering mode or after changing the colour of the nodes via the "Select Interval" option. 

![Skip Through Time Slices](./images/skip_though.png)

**Note:** The "Select Interval" functionality and the "Skip through time slices" functionality are independent of each other.

[To the top](#time-diff-mode)

---

Continue with the [Functions Tab](Functions.md) to learn about graph editing tools.
