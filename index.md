SCoT (Sense Clustering over Time) [Verison2] is a web application to view the sense-clusters of a word and their evolvement over time. The idea is to help scholars and scientists interested in diachronic distributional semantics visualize and analyse the clusters on a graph. 

The functionalities and usage are described in the [user guide](userGuide.md). If you would like to deploy SCoT yourself or keep working on it see the [installation guide](installationGuide.md) for developers for more information.

The project is maintained by the [Language Technology Group at Universität Hamburg](https://www.inf.uni-hamburg.de/en/inst/ab/lt/home.html). Version 2 of SCoT is a major update which was developed by Christian Haase. Inga Kempfert was the lead dev of Version 1. Scot uses data that are calculated with JoBim. It is thus part of a larger NLP-pipeline. Calcuations with JoBim for the SCoT-data of Version 2 were done by Seid Yimam and Saba Anwar. The underlying concepts and algorithms for SCoT are based on the publications by Biemann, Friedrich, Riedel et. al.. (see below) The time-slicing of Google books was pioneered by Goldberg and Orwant.

**Developers:**
* [Christian Haase](https://www2.informatik.uni-hamburg.de/fiona/pers.php?lang=de#haase) [Version 2]
* [Inga Kempfert](https://github.com/IngaKe) [Version 1]
* [Saba Anwar](https://www.inf.uni-hamburg.de/en/inst/ab/lt/people/saba-anwar.html)

**Supervision:**
* [Seid Muhie Yimam](https://seyyaw.github.io/)
* [Alexander Friedrich](https://www.philosophie.tu-darmstadt.de/institut_phil/mitarbeiter_innen_phil/wissenschaftlichemitarbeiter_innen_phil/friedrich_pwt/index.de.jsp)
* [Chris Biemann](https://www.inf.uni-hamburg.de/en/inst/ab/lt/people/chris-biemann.html)


**References:**
* Kempfert, I., Anwar, S., Friedrich, A., Biemann, C. (2020): Digital History of Concepts: Sense Clustering over Time. 42. Jahrestagung der Deutschen Gesellschaft für Sprachwissenschaft (DGfS), Hamburg, Germany. ([abstract pdf](https://www.inf.uni-hamburg.de/en/inst/ab/lt/publications/2020-kempfertetal-dgfs-scot.pdf))
* Friedrich, A. and Biemann, C. (2016): Digitale Begriffsgeschichte? Methodologische Überlegungen und exemplarische Versuche am Beispiel moderner Netzsemantik, in: Forum Interdisziplinäre Begriffsgeschichte 5(2):78-96 ([pdf](https://www.zfl-berlin.org/files/zfl/downloads/publikationen/forum_begriffsgeschichte/ZfL_FIB_5_2016_2_FriedrichBiemann.pdf))
* Riedl, Martin, Steuer, Richard, Biemann, Chris (2014): Distributed Distributional Similarities of Google Books over the Centuries, in: Proceedings of the 9th International Conference on Language Resources and Evaluation (LREC 14), pp. 1401-1405, Reykjavik, Iceland. ([pdf](http://www.lrec-conf.org/proceedings/lrec2014/pdf/274_Paper.pdf))
* Goldberg, Yoav, Orwant, Jon (2013): A Dataset of Syntactic-Ngrams over Time from a Very Large Corpus of English Books. ([pdf](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/41603.pdf))
* Biemann, Chris (2006): Chinese Whispers - an Efficient Graph Clustering Algorithm and its Application to Natural Language Processing Problems. In: Association for Computational Linguistics (Hg.): TextGraphs-1 Proceedings of the First Workshop on Graph Based Methods for Natural Language Processing. Stroudsburg, S. 73–80.