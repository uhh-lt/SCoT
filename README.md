# SCoT

SCoT (Sense Clustering over Time) is a web application to view the senses of a word and their evolvement over time.

You will find a detailed explanation of the theoretical background, the architecture and usage examples in the following paper
Haase, Anwar, Yimam, Friedrich, Biemann (2021 - under consideration for EACL - Demo Paper)
https://www.dropbox.com/s/fqgwatcjhweryqi/Haase_Anwar_Yimam_Friedrich_Biemann_SCoT_2021.pdf?dl=0

This is the second version of the tool, which has been fundamentally revised from the first version that was initially developed by
Kempfert, Anwar, Yimam and Biemann. The revisions include:

- a fully revised and new graph-model of so-called Neighbourhood Graphs over Time, including new graph-building algorithms, stemming from Haase's MA Thesis
- a fully new designed frontend
- a fully revised new architecture of the application, including a new MVVM-frontend-component-layering (Vue.js) and a three-layer backend (Python)
- the ability to include features from multiple DTs and full text search via SQL and ElasticSearch-Databases
- the ability to connect multiple databases,
- various improved details in the application, including Docker-deployment details
- new examples related to the research on linguistic polysemies and conceptual history (See paper and further publications in paper)

You will find a video demonstrating the functionalities of SCoT here
https://youtu.be/SbmfA4hKjvg

If you have any questions, please do not hesitate emailing me at haase[at]informatik.uni-hamburg.de

Best, Christian Haase, Lead Dev Version 2
