SCoTTi (Semantic Clustering of Tags over Time) is a web application to analyse the topical clusters of hashtags and their evolvement over time. The idea is to help scholars and scientists interested in diachronic distributional semantics visualize and analyse the clusters on a graph.  
SCoTTi is a fork of the open-source software SCoT (Sense Clustering over Time). It is developed by Christian Haase for his Master Thesis at the FernUniversität Hagen. Christian Haase is also the lead developer of version 2 of SCoT. In which respects is SCoTTi different to SCoT?

1. SCoT is based on distributional semantics calculated with the JoBim-text-framework. SCoTTi, on the contrary, is based on a new custom semantic system developed by Christian Haase that analyses Hashtags in the context of "text-embedded metadata".
2. SCoT uses at its core a graph-optimized algorithm "over time" by Biemann, while SCoTTi uses a different core algorithm by Haase "in time". The SCoTTi-algorithm is optimized to distinguish more sharply between long-lived and short-lived hashtag-clusters.
3. SCoTTi offers additional functionality, in particular a choice of graph-shaping-algorithms that feed into a Machine Learning - Component that can utilize the semantic time-series of SCoTTi for transductive learning.

SCoTTi does not need a new user guide. It is recommended to follow the user guide for SCoT. Further information on SCoTTi will be published in Haase's master thesis.

The functionalities and usage of SCoT (and SCotti) are described in the [user guide](userGuide.md).   
If you would like to deploy or develop SCoT or SCoTTi yourself, see [installation guide](installationGuide.md).  
 The project SCoT is maintained by the [Language Technology Group at Universität Hamburg](https://www.inf.uni-hamburg.de/en/inst/ab/lt/home.html). 
 The project SCoTTi is maintained by Christian Haase.

*** SCOT-Developers:**
* [Christian Haase](https://www2.informatik.uni-hamburg.de/fiona/pers.php?lang=de#haase) [Version 2] - also developer of the fork SCoTTi
* [Inga Kempfert](https://github.com/IngaKe) [Version 1]
* [Saba Anwar](https://www.inf.uni-hamburg.de/en/inst/ab/lt/people/saba-anwar.html)

**Supervision of SCoT-development:**
* [Seid Muhie Yimam](https://seyyaw.github.io/)
* [Alexander Friedrich](https://www.philosophie.tu-darmstadt.de/institut_phil/mitarbeiter_innen_phil/wissenschaftlichemitarbeiter_innen_phil/friedrich_pwt/index.de.jsp)
* [Chris Biemann](https://www.inf.uni-hamburg.de/en/inst/ab/lt/people/chris-biemann.html)


**References:**
* Haase, C. (2020 - forthcoming): Semantisches Clustern von Tags in Zeit-Intervallen - ein Ansatz für die Analyse von Social Media-Streams. Master-Arbeit, FernUniversität Hagen.
* Kempfert, I., Anwar, S., Friedrich, A., Biemann, C. (2020): Digital History of Concepts: Sense Clustering over Time. 42. Jahrestagung der Deutschen Gesellschaft für Sprachwissenschaft (DGfS), Hamburg, Germany. ([abstract pdf](https://www.inf.uni-hamburg.de/en/inst/ab/lt/publications/2020-kempfertetal-dgfs-scot.pdf))
* Friedrich, A. and Biemann, C. (2016): Digitale Begriffsgeschichte? Methodologische Überlegungen und exemplarische Versuche am Beispiel moderner Netzsemantik, in: Forum Interdisziplinäre Begriffsgeschichte 5(2):78-96 ([pdf](https://www.zfl-berlin.org/files/zfl/downloads/publikationen/forum_begriffsgeschichte/ZfL_FIB_5_2016_2_FriedrichBiemann.pdf))
* Riedl, Martin, Steuer, Richard, Biemann, Chris (2014): Distributed Distributional Similarities of Google Books over the Centuries, in: Proceedings of the 9th International Conference on Language Resources and Evaluation (LREC 14), pp. 1401-1405, Reykjavik, Iceland. ([pdf](http://www.lrec-conf.org/proceedings/lrec2014/pdf/274_Paper.pdf))
* Goldberg, Yoav, Orwant, Jon (2013): A Dataset of Syntactic-Ngrams over Time from a Very Large Corpus of English Books. ([pdf](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/41603.pdf))
* Biemann, Chris (2006): Chinese Whispers - an Efficient Graph Clustering Algorithm and its Application to Natural Language Processing Problems. In: Association for Computational Linguistics (Hg.): TextGraphs-1 Proceedings of the First Workshop on Graph Based Methods for Natural Language Processing. Stroudsburg, S. 73–80.