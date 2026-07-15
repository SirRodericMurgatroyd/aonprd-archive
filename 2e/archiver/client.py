"""HTTP client for the AonPRD elasticsearch endpoint.

The site exposes a read-only elasticsearch proxy at
https://elasticsearch.aonprd.com/aon/_search. Only the _search action is
permitted for anonymous users (_mapping etc. return 403), so everything here
goes through search requests.
"""

import json
import time
import urllib.error
import urllib.request

SEARCH_URL = "https://elasticsearch.aonprd.com/aon/_search"
USER_AGENT = "aonprd-archive/0.1 (archival tool)"

# Statuses worth retrying: throttling and transient server errors.
RETRYABLE_STATUSES = {429, 500, 502, 503, 504}
MAX_RETRIES = 5


def search(body, timeout=60):
    """POST a search body to the aon index and return the parsed response."""
    data = json.dumps(body).encode("utf-8")
    request = urllib.request.Request(
        SEARCH_URL,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
        method="POST",
    )
    last_error = None
    for attempt in range(MAX_RETRIES):
        if attempt:
            time.sleep(2 ** attempt)
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return json.load(response)
        except urllib.error.HTTPError as err:
            if err.code not in RETRYABLE_STATUSES:
                raise
            last_error = err
        except (urllib.error.URLError, TimeoutError) as err:
            last_error = err
    raise RuntimeError(f"search failed after {MAX_RETRIES} attempts: {last_error}")


def get_categories():
    """Return {category: doc_count} for every category in the index."""
    response = search({
        "size": 0,
        "aggs": {"categories": {"terms": {"field": "category", "size": 1000}}},
    })
    buckets = response["aggregations"]["categories"]["buckets"]
    return {bucket["key"]: bucket["doc_count"] for bucket in buckets}


def iter_category(category, page_size=500, delay=0.2):
    """Yield every document (_source) in a category.

    Uses search_after pagination sorted on id.keyword, which is unique and
    present on every document, so no point-in-time context is needed.
    """
    search_after = None
    while True:
        body = {
            "size": page_size,
            "query": {"term": {"category": category}},
            "sort": [{"id.keyword": "asc"}],
        }
        if search_after is not None:
            body["search_after"] = search_after
        response = search(body)
        hits = response["hits"]["hits"]
        if not hits:
            return
        for hit in hits:
            yield hit["_source"]
        search_after = hits[-1]["sort"]
        if delay:
            time.sleep(delay)
