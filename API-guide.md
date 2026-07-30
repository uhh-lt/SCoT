# SCoT API Reference

This page is for users who want to call the SCoT backend directly and extract data without using the Vue interface.

SCoT exposes a Flask REST API. If you run SCoT with Docker, in this repository's `docker-compose.yml`, the app is exposed on:

```text
BASE_URL=http://localhost:10020
```

If you run SCoT another way, replace this with the host and port you use to open the interface. For example, native Flask development commonly uses `http://localhost:5000`.


## 1. GET /api/collections - discover datasets

**Purpose:** List available corpora and their metadata (year ranges, defaults, whether Elasticsearch is available).

**Request:**

```bash
curl "$BASE_URL/api/collections"
```

**Response:** JSON object keyed by display name, e.g.:

**Response Shape:**

```bash
"English--Google Books-Syntactic Ngrams--1520-2008--8 Slices--": {
    "key": "en_gbooks_8",
    "target": "bar/NN",  # <- Target word as stored in the DB; how the corpus was dependency-parsed, this can be word/POS, word#POS, or simply word.
    "p": 30,
    "d": 15,
    "is_public": true/false,
    "is_ES_available": true/false,
    "start_years": [
      { "id": 1, "text": "1900", "value": 1900 } , ...
    ],
    "end_years": [
      { "id": 1, "text": "1900", "value": 1900 } , ...
    ]
  }

... (Same structure listed for ALL available corpora)

}
```

- Use the nested `key` value as `collection_key` in later requests.
- `start_years` and `end_years` contain all valid year values for the collection.
- `is_ES_available` controls whether document endpoints can return example sentences.

## 2. POST /api/collections/{collection}/autocomplete - validate target word

**Purpose:** Check whether a word exists in the collection and get suggestions for a partial target-word query.

**Path Parameters**: Collection key

**Request Body**:
- `query`: Partial or complete word.

**Request Shape:**

Example - if the collection key is: "en_coha"
```bash
curl -X POST "$BASE_URL/api/collections/en_coha/autocomplete" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ban"
  }'
```

**Response:** Array of suggestion strings, e.g. ["bank", "banking", "banks", ..]


## 3. POST /api/collections/sense_graph - main data extraction

**Purpose:** Build a clustered semantic graph for a target word over a selected time range. 
This is the main endpoint for extracting SCoT graph data.

**Request Shape** (`NGOTProperties` — see `model/ngot_model.py`):

```bash
curl -X POST "$BASE_URL/api/collections/sense_graph" \
  -H "Content-Type: application/json" \
  -d '{
    "collection_key": "en_coha",
    "start_year": 1820,
    "end_year": 2019,
    "target_word": "bar#NN",

    "n_nodes": 30,                 # <- Number of nearest-neighbor nodes requested
    "density": 15,                 # <- value used to derive edge count
    "e_edges": 160,                # <- Number of directed edges requested
    "graph_type": "ngot_overlay",  # <- One of ngot_overlay, ngot_interval, or scot_scaled

    "cluster_target_filter": true/false,
    "remove_singletons": false/true
  }'

```

Also, set the Graph-type-specific fields:

| graph_type | Set these fields |
| --- | --- |
| `ngot_overlay` | `number_of_ngot_nodes`, `number_of_ngot_directed_edges` |
| `ngot_interval` | `number_of_static_nodes_per_interval`, `number_of_static_directed_edges_per_interval`, `number_of_static_nodes_global`, `number_of_static_directed_edges_global` |
| `scot_scaled` | `number_of_ngot_nodes`, `number_of_static_directed_edges_global` |

**Response Shape:**

```bash
{
  "props": { collection info ..., selected_time_ids: [..], weight_stats {}, etc." },
  "nodes": [ { "id": "...", "target_text": "...", "weight": .., "time_ids": [...], "cluster_id": 1, ..} ...  ],
  "links": [ { "id": "...", "source": "...", "target": "...", "weight": .., "time_ids": [...], "cluster_id": , ..}   ... ],
  "clusters": [ { "cluster_id": , "cluster_name": "...", "cluster_nodes": [...], "cluster_links": [...], ..}  ... ],
  "singletons": [],
  "transit_links": []
}
```

- The backend derives `selected_time_ids` from `start_year` and `end_year`.
- Node and link `time_ids` show which time slices contain that item.
- `cluster_id` connects nodes and links to entries in `clusters`.
<!-- - Use `selected_time_ids` when requesting documents or time-based evidence. -->

## 4. POST /api/reclustering

**Purpose:** Runs automatic Chinese Whispers reclustering on an existing graph.

Use this when you already have an NGOT graph object and want the backend to recompute clusters.

**Request:**

Send the full graph object returned by `POST /api/collections/sense_graph`.


**Response Shape:**

Returns the same NGOT graph shape as `POST /api/collections/sense_graph`, with updated cluster information.

```bash
{
  "props": {},
  "nodes": [],
  "links": [],
  "singletons": [],
  "clusters": [],
  "transit_links": []
}
```

- The request must include `nodes` and `links`.
- The backend rebuilds internal node and link dictionaries before clustering.

## 5. POST /api/collections/{collection}/simbim - shared contexts between two words

**Purpose:** Returns shared context features that explain why two words are semantically connected.

In SCoT, an edge represents similarity. Similarity is explained through shared syntagmatic context words, also called BIMs.

**Path Parameters**: Collection key

**Request Body:**
- `word1`: First word. Often the graph target word or edge source.
- `word2`: Second word. Another word or edge target.
- `time_id`: Time id to query.

**Request:**

```bash
curl -X POST "$BASE_URL/api/collections/en_coha/simbim" \
  -H "Content-Type: application/json" \
  -d '{
    "word1": "bar/NN",
    "word2": "shop/NN",
    "time_id": 7
  }'
```

**Response Shape:**

```bash
{
  "1035": {
      "key": "-by_pobj/stop/VB",  # <- shared context feature
      "score": 0.00524..,         # <- normalized score for word1
      "score2": 0.0311..          # <- normalized score for word2
  },
  "1057": {
      "key": "nn/towels/NNS",
      "score": 0.00193..,
      "score2": 0.0187..
  },
  "error": "none"
}
```

If there are no shared features:

```json
{
  "error": "zero values"
}
```
- The response is limited to the top shared features.

## 6. POST /api/cluster_information - cluster-level context words

**Purpose:** Returns context features that are significant for a cluster.

Use this after creating a graph. Pass the cluster nodes and their time ids to get the most important shared context words for that cluster.

**Request Body:**
- `collection`: Collection key
- `nodes`: Objects with label and time_id
- `props`: Graph props from the NGOT response.

**Request:**
```bash
curl -X POST "$BASE_URL/api/cluster_information" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "en_coha",
    "nodes": [
      { "label": "store/NN", "time_id": 1 },
      { "label": "shop/NN", "time_id": 3 },
      ..
    ],
    "props": { "target_word": "bar/NN", "cluster_target_filter": true, "selected_time_ids": [1,2,3] }
}'
```

**Response Shape:**

```bash
{"-above_pobj/room/NN":[0.01958.. , {"1": 17.0, "3": 253.0}],
"-amod/downtown/JJ":[0.00475361..  ,  {"1": 33.0, "3": 68.0}] ..
}
```

- Each key is a context word/feature; value is `[normalized_score, { time_id: frequency, ... }]`. Limited to top 200.

## 7. POST /api/collections/{collection}/documents - example sentences

**Purpose:** Returns example sentences containing a word and a context feature.

This endpoint requires Elasticsearch/document search to be configured for the collection.

**Path Parameters:** Collection key

**Request Body:**
- jo: Main word
- bim: Context feature word
- collection_key: Collection key
- time_ids: selected time ids from the graph response
- time_slices: time slices as strings, matching time_ids.

**Request:**

```bash
curl -X POST "$BASE_URL/api/collections/en_coha/documents" \
  -H "Content-Type: application/json" \
  -d '{
    "jo": "bar#NN",
    "bim": "salad#NN#nn",
    "collection_key": "en_coha",
    "time_ids": [1, 2, 3, 4],
    "time_slices": ["1820", "1856", "1881"]
  }'
```

**Response Shape:**

```bash
{
  "docs": [
    {"doc": "time-slice: Example sentence containing the words. [source-name]"}, 
    {"doc": .. }
    ..
  ]
}
```

If no documents are found: "doc": "No Results."

- Call `GET /api/collections` and check `is_ES_available` before using this endpoint.

## 8. POST /api/collections/{collection}/documents_scroll - bulk sentence export

**Purpose:** Same input as `/documents`. Returns ALL matching example documents as a tab-separated string.

Use this endpoint when you want export-style document data instead of the short document list.

```json
{
  "json_docs": "date\tsentence\tsource\n..."
}
```


## 9. POST /api/collections/{collection}/wordfeaturecounts - feature frequency over time


**Purpose:** Returns time-series counts for a context feature with two words.

Use this after `simbim` or `cluster_information` when you want to see how a feature changes over time for two words.

**Path Parameters:** Collection key

**Request Body:**
- word1: First word
- word2: Second word
- feature: Context feature word

**Request:**

```bash
curl -X POST "$BASE_URL/api/collections/en_coha/wordfeaturecounts" \
  -H "Content-Type: application/json" \
  -d '{
    "word1": "bar/NN",
    "word2": "shop/NN",
    "feature": "nn/towels/NNS"
  }'
```

### Response Shape

```json
{
  "bar/NN": { "1": 12, "2": 8, "3": "null" , ..},
  "shop/NN": { "1": 5, "2": 9, "3": 3  , ..}
}
```
- Keys inside each word object are time_id values and the value is the count.

## Typical Workflow

1. Call `GET /api/collections` to find available collections, year ranges, default target words, and whether example documents are available.
2. Choose a collection key, target word, year range, graph type, and graph size settings.
3. Call `POST /api/collections/sense_graph` to create a clustered semantic graph.
4. Use values from the graph response, such as `nodes`, `links`, `clusters`, `time_ids`, and `selected_time_ids`, to fetch supporting information.
5. To call evidence endpoints use `simbim`, `cluster_information`, `documents`, or `wordfeaturecounts`.


## Error and Availability Notes
- Missing required fields may result in a server error.
- Invalid collection keys may result in a server error.
- Private collection access depends on server configuration. `/api/verify-key` only checks whether a key exists in the configured access-key file.
