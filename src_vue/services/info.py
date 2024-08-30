from persistence.documentdb import Documentdb
from persistence.db import Database, get_db
from model.ngot_model import NGOTStats
import pandas as pd
import json
import itertools


def collections_info(config):
    print("debug collection info")
    # add information about intervals
    # print(config)
    config_fe = config["collections_info_frontend"]
    for collection in config_fe:
        key = config_fe[collection]["key"]
        db = Database(config, get_db(config, key))
        config_fe[collection]['start_years'] = db.get_all_years("start_year")
        config_fe[collection]['end_years'] = db.get_all_years("end_year")
        config_fe[collection]['is_ES_available'] = key in config["collections_info_elastic"].keys()
    # print(config_fe)
    return json.dumps(config_fe)


def get_edge_info(config, collection, word1, word2, time_id):
    # See Mitra(2015)
    # get edge-score explanation = intersection of two word features in one time-id, from database
    # Param word1 (str, not null, valid)
    # Param word2 (str, not null, valid)
    # Param collection (str, not null, valid)
    # Param time_id(int, not null, valid)
    # Preconditions (see conditions after params)
    # RETURNS
    # dictionary1 word1: {"feature": score} (nullable - there may not be any data in this time-id), ordered by score desc
    # dictionary2 word2: {"feature": score} (nullable - there may not be anay data in this time-id), ordered by score desc
    # intersection set of keys (str) (nullable - there may not be any overlap)
    # max values 1 und 2 (nullable )
    print(f'word1: {word1}, word2: {word2} time_id {time_id}')
    db = Database(config, get_db(config, collection))
    res1_dic = db.get_features(word1, time_id)
    res2_dic = db.get_features(word2, time_id)

    if len(res1_dic) > 0 and len(res2_dic) > 0:

        # put results into intersection-set of res1 and res2
        res_set = set(res1_dic.keys()).intersection(set(res2_dic.keys()))
        # determine maxima (sets are ordered by db in desc - thus first is the maximum)
        max1 = list(res1_dic.values())[0]
        max2 = list(res2_dic.values())[0]
        print(f'max1: {max1}, max2:{max2}')
        print(f'f1: {list(res1_dic.keys())[0]}, f2:{list(res2_dic.keys())[0]}')
        print(f'f1 N: {len(res1_dic)}, f2 N:{len(res2_dic)} shared f N:{len(res_set)}')

        return res1_dic, res2_dic, res_set, max1, max2

    else:
        return {}, {}, set(), 0, 0


def simbim(config, collection, data, word1, word2, time_id):
    # Param: collection
    # Param: word1, word2
    # Param: time-id
    # Returns_ dictionary with result-set error or Zero-code (in case result set is empty)
    # the response_dictionary is limited to max 200
    # get intersection of node-contexts (res_set), context-dics and max values
    res1_dic, res2_dic, res_set, max1, max2 = get_edge_info(
        config, collection, word1, word2, time_id)
    # print(f'{word1} features: {res1_dic}')
    if len(res1_dic) == 0 or len(res2_dic) == 0 or len(res_set) == 0:
        # check if zero-error
        return {"error": "zero values"}
    else:
        # calc return dictionary and normalize values
        # format of dic = {"1": {"score": 34, "key": "wort", "score2": 34}, "2": ...}
        return_dic = {}
        index_count = 0
        for key in res_set:
            return_dic[str(index_count)] = {"score": float(
                res1_dic[key]/max1), "key": str(key), "score2": float(res2_dic[key]/max2)}
            index_count += 1
        # limit response dictionary by top 100 values for each score (ie max 200)
        res_dic_topn = {}
        topn = 100
        if (len(return_dic) > 2*topn):
            # select topN for score1
            return_dic = {k: v for k, v in sorted(
                return_dic.items(), key=lambda item: item[1]["score"], reverse=True)}
            score1key = list(return_dic.keys())[:topn]
            for key in score1key:
                res_dic_topn[key] = return_dic[key]
            # now for score2
            return_dic = {k: v for k, v in sorted(
                return_dic.items(), key=lambda item: item[1]["score2"], reverse=True)}
            score2key = list(return_dic.keys())[:topn]
            for key in score2key:
                res_dic_topn[key] = return_dic[key]
            return_dic = res_dic_topn
        return_dic["error"] = "none"
        return return_dic


def cluster_information(config, data):
    # calculates a list of the normalized cumulated significance scores
    # of all syntagmatic context words of all paradigms of a cluster across all time-ids
    # ALTERNATIVELY (if target-filter set): the cumulated list can be filtered.
    # This is achieved by creating a set of target features across all time-ids as filter.
    # Params: nodes with time-ids
    # Returns dictionary of words with Score: averaged normalized over all nodes based on max-time-id
    # Precondition: data not null and valid
    # Postcondition: the response is limited to max 200
    # Note:measures execution time of db-queries
    print("in cluster_information")#, data)
    import time
    start_time = time.time()
    # algo
    from collections import defaultdict
    nodes = set()
    for node in data["nodes"]:
        nodes.add((node["label"], node["time_id"]))
    # print("nodes", nodes)
    print("-------------------------------------------------------")
    print("in cluster_info (1)")# anzahl unique nodes - alle nodes ", len(nodes))
    # get features (ie context word2 and score) for all unique nodes in all time-ids
    db = Database(config, get_db(config, data["collection"]))
    feature_dic = {}
    for node in nodes:
        label = node[0]
        time_id = node[1]
        feature_dic[node] = db.get_features(label, time_id)
    # get target filter set
    if (data["props"]["cluster_target_filter"]):
        target = data["props"]["target_word"]
        time_ids = data["props"]["selected_time_ids"]
        target_set = db.get_feature_target_filter_set(target, time_ids)
        print("len filter target set", len(target_set))
    print("-------------------------------------------------------")
    print(" in cluster_info (2) after db query --- %s seconds ---" %
          (time.time() - start_time))
    res_dic_all = defaultdict(int)
    # cumulate the feature scores over all nodes and time-ids [could be changed...]
    # feature dic {{word,timeid}:{feature: score}}
    if (data["props"]["cluster_target_filter"]):
        for k, v in feature_dic.items():
            for k2, v2 in v.items():
                # items: {feature: score}
                if k2 in target_set:
                    res_dic_all[k2] += v2
    else:
        for k, v in feature_dic.items():
            for k2, v2 in v.items():
                # items: {feature: score}
                res_dic_all[k2] += v2
    print("-------------------------------------------------------")
    # normalize and sort significance values
    res_dic_all = {k: v for k, v in sorted(
        res_dic_all.items(), key=lambda x: x[1], reverse=True)}
    # print("res_dic_all", list(res_dic_all.values())[:100])
    maxi = list(res_dic_all.values())[0]
    for k, v in res_dic_all.items():
        res_dic_all[k] = float(v/maxi)
    # limit response dictionary to topn
    topn = 200
    dic_res = {}
    keys = list(res_dic_all.keys())[:topn]
    for index in range(len(keys)):
        dic_res[keys[index]] = res_dic_all[keys[index]]
    print("in cluster_info (3) after algo --- %s seconds ---" %
          (time.time() - start_time))
    # print("dictionary cluster ", dic_res)
    return dic_res


def documents(config, data):
    # retrieves sentences which contain one jo and one bim [also called wort1=jo, wort2=bim]
    # Param: collection_key
    # Param: jo [wort1], bim [wort2]
    # Param: time_slices
    # Returns_ elasticsearch response
    # the response_dictionary is limited to max 200
    jo = str(data["jo"])
    bim = str(data["bim"])
    time_slices = data["time_slices"]
    print(data)
    collection_key = str(data["collection_key"])
    # if not collection_key in config["collections_info_elastic"].keys():
    #     return {"docs": "This collection does not have any example docs."}
    # get host, port and index from config
    es_host = config["collections_info_elastic"][collection_key]["es_host"]
    es_port = config["collections_info_elastic"][collection_key]["es_port"]
    es_index = config["collections_info_elastic"][collection_key]["es_index"]

    # print(es_index, es_host, es_port)

    # init with host, port
    documentdb = Documentdb(es_host, es_port)

    # Todo search with specific index instead of collection_key
    ret = []
    res = documentdb.search(jo, bim, time_slices, es_index)
    ret_set = set()
    # print("hits:"+str(len(res["hits"]["hits"])))
    for hit in res["hits"]["hits"]:
        text = hit["_source"]["date"][:10] + ": " \
               + hit["_source"]["sentence"]   \
               + "[" + hit["_source"]["source"] + "] "

        ret_set.add(text)

    ret_list = list(ret_set)
    ret_list.sort()
    # print(ret_list)
    if len(ret_list) > 0:
        for text in ret_list:
            ret.append({"doc": text})
    else:
        ret.append({"doc": "No Results."})

    return {"docs": ret}


def documents_scroll(config, data):
    # retrieves sentences which contain one jo and one bim [also called wort1=jo, wort2=bim]
    # Param: collection_key
    # Param: jo [wort1], bim [wort2]
    # Param: time_slices
    # Returns_ elasticsearch response
    # the response_dictionary is limited to max 200
    jo = str(data["jo"])
    bim = str(data["bim"])
    time_slices = data["time_slices"]
    print(data)
    collection_key = str(data["collection_key"])
    # if not collection_key in config["collections_info_elastic"].keys():
    #     return {"docs": "This collection does not have any example docs."}
    # get host, port and index from config
    es_host = config["collections_info_elastic"][collection_key]["es_host"]
    es_port = config["collections_info_elastic"][collection_key]["es_port"]
    es_index = config["collections_info_elastic"][collection_key]["es_index"]

    # print(es_index, es_host, es_port)

    # init with host, port
    documentdb = Documentdb(es_host, es_port)

    # Todo search with specific index instead of collection_key
    ret = []
    res = documentdb.scroll(jo, bim, time_slices, es_index)
    json_data = []
    # print("hits:"+str(len(res["hits"]["hits"])))
    for hit in res:
        json_line = {"date": hit["_source"]["date"][:10],
                     "sentence": hit["_source"]["sentence"],
                     "source": hit["_source"]["source"]
                     }
        json_data.append(json_line)

    json_data = sorted(json_data, key=lambda x: x["date"])
    df = pd.DataFrame.from_dict(json_data, orient='columns')

    return {"json_docs": df.to_csv(sep='\t', index=False, encoding='utf-8')}


def compute_weight_stats(nodes):
    time_and_scores = [(w, t, n.id) for n in nodes for w,t in zip(n.weights, n.time_ids)]
    time_and_scores = sorted(time_and_scores, key=lambda t:t[0])
    # print(time_and_scores[0], time_and_scores[-1])
    all_scores = list(itertools.chain(*[n.weights for n in nodes]))
    ngot_stats = NGOTStats(time_and_scores[0], time_and_scores[-1], sum(all_scores)/len(all_scores))
    # print(sum(scores), len(scores))
    return ngot_stats