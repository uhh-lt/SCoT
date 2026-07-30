# SCoT
SCoT (Sense Clustering over Time) is a web application to view the senses of a word and their evolvement over time. 

## Documentation

* The complete **API Guide** is available in [`API-guide.md`](API-guide.md).
* Instructions for installing and deploying SCoT locally are available in [`installationGuide.md`](installationGuide.md).
* A detailed **User Guide**, including explanations of the interface and its features, is available on the [add URL here]().

## Publication

A detailed explanation of the theoretical background, architecture, and usage examples can be found in the following paper:

Haase, Anwar, Yimam, Friedrich, and Biemann (2021), *SCoT: Sense Clustering over Time*.

[Read the SCoT paper](https://www.dropbox.com/s/fqgwatcjhweryqi/Haase_Anwar_Yimam_Friedrich_Biemann_SCoT_2021.pdf?dl=0)

Further information about the developers, supervisors, and related publications is available through the GitHub pages and website of the Language Technology Group at the University of Hamburg.

## Demonstration

A video demonstrating the main functionalities of SCoT is available here:

[Watch the SCoT demonstration video](https://youtu.be/SbmfA4hKjvg)

## About SCoT Version II

This is the second version of SCoT. It has been substantially redesigned and expanded from the initial version, which was mainly developed by Inga Kempfert, Saba Anwar, Seid Muhie Yimam, and Chris Biemann.

Version 2 was led by Christian Haase at HITeC and includes the following major revisions:

* A revised graph model based on **Neighbourhood Graphs over Time**, including new graph-construction algorithms, stemming from Haase's MA Thesis 
* A completely redesigned frontend developed with Vue.js and D3.js.
* A revised application architecture, including an MVVM-based frontend component structure and a three-layer Python backend.
* An overhauled Python REST API.
* Support for features from multiple distributional thesauri.
* Full-text search using SQL and Elasticsearch databases.
* Support for connecting multiple databases.
* Additional context-information and analysis features.
* Improved Docker-based installation and deployment.
* new examples related to the research on linguistic polysemies and conceptual history (See paper and further publications in the paper)

## Contact

For questions about SCoT, contact:

Christian Haase <br>
Lead Dev Version 2 <br>
haase[at]informatik.uni-hamburg.de



