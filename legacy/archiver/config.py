"""Site-specific crawl configuration for legacy.aonprd.com.

The legacy Pathfinder Reference Document is a pure static site: hand-written
.html pages organized by book (coreRulebook/, advancedPlayerGuide/, ...)
plus stylesheets and images under include/. Its stylesheets also pull a few
files from cdn.paizo.com, which are archived too since that host's lifespan
is equally uncertain.
"""

SITE = "https://legacy.aonprd.com/"

# Hosts whose pages are crawled recursively (saved under site/).
HOSTS = {"legacy.aonprd.com"}

# Hosts fetched for referenced assets only, never recursed into
# (saved under external/<host>/).
EXTERNAL_HOSTS = {"cdn.paizo.com"}

# Alias hosts folded into their canonical spelling before crawling.
CANONICAL_HOSTS = {}

SEEDS = [SITE]


def skip_url(url):
    """Return True for URLs that must not be crawled. None for this site."""
    return False
