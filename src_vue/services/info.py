from persistence.documentdb import Documentdb
from persistence.db import Database, get_db
import json


def collections_info(config):
    print("debug collection info")
    # add information about intervals
    print(config)
    config_fe = config["collections_info_frontend"]
    for collection in config_fe:
        key = config_fe[collection]["key"]
        db = Database(get_db(config, key))
        config_fe[collection]['start_years'] = db.get_all_years("start_year")
        config_fe[collection]['end_years'] = db.get_all_years("end_year")

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

    db = Database(get_db(config, collection))
    res1_dic = db.get_features(word1, time_id)
    res2_dic = db.get_features(word2, time_id)

    if len(res1_dic) > 0 and len(res2_dic) > 0:

        # put results into intersection-set of res1 and res2
        res_set = set(res1_dic.keys()).intersection(set(res2_dic.keys()))

        # print(res_set)
        # determine maxima (sets are ordered by db in desc - thus first is the maximum)
        max1 = list(res1_dic.values())[0]
        max2 = list(res2_dic.values())[0]
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
    # use all occurrences of node in selected time-id [max strength time id]
    # calculate score by adding all significances + dividing by number of nodes
    # Params: nodes with time-ids
    # Returns dictionary of words with Score: averaged normalized over all nodes based on max-time-id
    # Precondition: data not null and valid
    # Postcondition: the response is limited to max 200
    # measure execution time of db-queries
    print(data['collection'])
    import time
    start_time = time.time()
    # algo
    from collections import defaultdict
    nodes = set()
    for node in data["nodes"]:
        nodes.add((node["label"], node["time_id"]))
    # print("nodes", nodes)
    print("-------------------------------------------------------")
    print("in cluster info (1) anzahl unique nodes - alle nodes ", len(nodes))
    # get features (ie context word2 and score) for all unique nodes in all time-ids
    # print("collection", data["collection"])
    db = Database(get_db(config, data["collection"]))
    feature_dic = {}
    for node in nodes:
        feature_dic[node] = db.get_features(node[0], node[1])
    print("-------------------------------------------------------")
    print(" in cluster info (2) after db query --- %s seconds ---" %
          (time.time() - start_time))
    # print("feature_dic", feature_dic)
    res_dic_all = defaultdict(int)
    for k, v in feature_dic.items():
        for k, v2 in v.items():
            res_dic_all[k] += v2
    print("-------------------------------------------------------")
    # print("res_dic_all", res_dic_all)
    # normalize and sort significance values
    res_dic_all = {k: v for k, v in sorted(
        res_dic_all.items(), key=lambda x: x[1], reverse=True)}
    maxi = list(res_dic_all.values())[0]
    for k, v in res_dic_all.items():
        res_dic_all[k] = float(v/maxi)
    # limit response dictionary to topn
    topn = 200
    dic_res = {}
    keys = list(res_dic_all.keys())[:topn]
    for index in range(len(keys)):
        dic_res[keys[index]] = res_dic_all[keys[index]]

    print(" cluster info (3) after algo --- %s seconds ---" %
          (time.time() - start_time))
    # print("dictionary cluster ", dic_res)

    return dic_res


def documents(collection, data):
    # retrieves sentences which contain one jo and one bim [also called wort1=jo, wort2=bim]
    # Param: collection_key
    # Param: jo [wort1], bim [wort2]
    # [Param: time-id - not implemented yet]
    # Returns_ elasticsearch response
    # the response_dictionary is limited to max 200
    jo = str(data["jo"])
    bim = str(data["bim"])
    # time_id = int(data["time_id"])
    collection_key = str(data["collection_key"])
    print(jo, bim, collection_key)

    # get host, port and index from config
    with open('./config/config.json') as config_file:
        config = json.load(config_file)
    es_host = config["collections_info_elastic"][collection_key]["es_host"]
    es_port = config["collections_info_elastic"][collection_key]["es_port"]
    es_index = config["collections_info_elastic"][collection_key]["es_index"]
    print(es_index, es_host, es_port)

    # init with host, port
    documentdb = Documentdb(es_host, es_port)

    # Todo search with specific index instead of collection_key
    ret = []
    res = documentdb.search(jo, bim, es_index)
    ret_set = set()
    for hit in res["hits"]["hits"]:
        text = hit["_source"]["date"][:10] + " [" + str(hit["_source"]["time_slice"]) + "] : " \
            + hit["_source"]["sentence"] + \
            " [" + hit["_source"]["source"] + "] "
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
