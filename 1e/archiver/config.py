"""Site-specific crawl configuration for aonprd.com (Pathfinder 1e).

The 1e site is server-rendered ASP.NET WebForms: entity pages are
`<Type>.aspx?ID=n`, list pages plain `.aspx`, and there is no public
JSON/elasticsearch API (search runs server-side). All content is reachable
by following links from the homepage's navigation and list pages, so a
breadth-first page crawl captures the site. Third-party assets (Google
Fonts, analytics, social links) are skipped, matching the 2e archive's
convention.
"""

SITE = "https://aonprd.com/"

# Hosts whose pages are crawled recursively (saved under site/).
HOSTS = {"aonprd.com"}

# Hosts fetched for referenced assets only, never recursed into.
EXTERNAL_HOSTS = set()

# Alias hosts folded into their canonical spelling before crawling.
CANONICAL_HOSTS = {"www.aonprd.com": "aonprd.com"}

SEEDS = [SITE]


def skip_url(url):
    """Skip the unbounded parts of the URL space.

    Search results (`Search.aspx?Query=...`) form an infinite space and are
    generated server-side, so they cannot be archived meaningfully; the
    bare Search.aspx landing page is still crawled.
    """
    from urllib.parse import urlsplit

    parts = urlsplit(url)
    return parts.path.lower().endswith("/search.aspx") and bool(parts.query)
