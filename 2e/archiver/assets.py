"""Archive the site's frontend assets.

The 2e.aonprd.com pages are ASP.NET shells that provide chrome (header, nav
menus, theme gallery); the content pane of every page — entity pages, rules,
even the homepage — is an embedded `<nethys-search no-ui="true">` element,
the open-source nethys-search Elm app (github.com/galdiuz/nethys-search),
which renders documents client-side from the elasticsearch index plus two
static JSON files served from the /json-data path.

This module downloads everything needed to replicate that frontend:
- the homepage HTML shell (chrome, nav menus, theme gallery markup);
- all same-origin stylesheets and scripts the shell references, including
  the extensionless /themes stylesheet (CSS variables for every theme);
- fonts and images referenced by those stylesheets (via url(...));
- the nethys-search JS bundle from elasticsearch.aonprd.com;
- /json-data/<index>-aggs.json (search filter data) and
  /json-data/<index>-index.json (page-hash -> document ids);
- favicon and opensearch.xml.

Third-party CDN assets (jquery, fomantic-ui, showdown, lodash, Google Fonts)
are intentionally skipped; they are versioned and mirrored widely.
"""

import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from .client import USER_AGENT, search
from .images import SITE_URL

ELASTIC_URL = "https://elasticsearch.aonprd.com/"

HTML_REF = re.compile(r'(?:href|src)="([^"]+)"')
CSS_REF = re.compile(r'url\(["\']?([^"\')]+)["\']?\)')

EXTRA_PATHS = ["/favicon.ico", "/opensearch.xml"]


def fetch(url, timeout=60):
    """GET a URL, returning (bytes, content_type)."""
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read(), response.headers.get("Content-Type", "")


def local_path(assets_dir, url):
    """Map a URL to a local file path mirroring its host-relative path."""
    parsed = urllib.parse.urlparse(url)
    path = urllib.parse.unquote(parsed.path).lstrip("/")
    if not path:
        path = "index.html"
    return Path(assets_dir) / path


def shell_references(html):
    """Yield asset URLs referenced by a page shell worth archiving.

    Keeps same-origin paths and the nethys-search bundle; skips other hosts
    (CDNs, analytics, ads) and page links.
    """
    for ref in HTML_REF.findall(html):
        if ref.startswith("//") or ref.startswith("#"):
            continue
        if ref.startswith(ELASTIC_URL):
            yield ref
            continue
        if "://" in ref:
            continue
        path = ref.split("?")[0].split("#")[0]
        # Assets only: stylesheets, scripts, icons, and the /themes endpoint.
        if re.search(r"\.(css|js|png|ico|xml|svg|webp|woff2?)$", path) or path == "/themes":
            yield ref


def css_references(css_text, base_url):
    """Yield same-origin absolute URLs for url(...) references in a stylesheet."""
    for ref in CSS_REF.findall(css_text):
        if ref.startswith("data:"):
            continue
        url = urllib.parse.urljoin(base_url, ref.split("?")[0].split("#")[0])
        if url.startswith(SITE_URL) or url.startswith(ELASTIC_URL):
            yield url


def json_data_urls():
    """URLs of the static JSON files the nethys-search app loads.

    The index name (e.g. aon81) comes from any search hit's _index, since
    the 'aon' name the proxy exposes is an alias. Besides the aggs and index
    files, the app fetches a per-page document payload from
    /json-data/<hash>.json, where the hashes are exactly the keys of the
    index file.
    """
    response = search({"size": 1})
    index = response["hits"]["hits"][0]["_index"]
    index_url = f"{ELASTIC_URL}json-data/{index}-index.json"
    content, _ = fetch(index_url)
    page_hashes = json.loads(content)
    return [f"{ELASTIC_URL}json-data/{index}-aggs.json", index_url] + [
        f"{ELASTIC_URL}json-data/{page_hash}.json" for page_hash in page_hashes
    ]


# Page shells to archive: the homepage (chrome, nav menus, theme gallery)
# and the search page, whose <nethys-search> element runs in full-UI mode —
# unlike every other page, where the app only provides link previews and the
# content is server-rendered.
SHELLS = {"/": "index.html", "/Search.aspx": "Search.aspx"}


def download_all(assets_dir):
    """Download the frontend asset set. Returns the number of files saved."""
    saved = 0
    queue = [urllib.parse.urljoin(SITE_URL, path) for path in EXTRA_PATHS]
    queue += json_data_urls()

    for path, filename in SHELLS.items():
        shell, _ = fetch(urllib.parse.urljoin(SITE_URL, path))
        html = shell.decode("utf-8", errors="replace")
        queue.extend(
            urllib.parse.urljoin(SITE_URL, ref) for ref in shell_references(html)
        )
        shell_path = Path(assets_dir) / filename
        shell_path.parent.mkdir(parents=True, exist_ok=True)
        shell_path.write_bytes(shell)
        print(f"saved {shell_path}", file=sys.stderr)
        saved += 1
    seen = set()
    while queue:
        url = queue.pop(0)
        bare = url.split("?")[0]
        if bare in seen:
            continue
        seen.add(bare)
        destination = local_path(assets_dir, bare)
        try:
            content, content_type = fetch(url)
        except urllib.error.HTTPError as err:
            print(f"  missing ({err.code}): {url}", file=sys.stderr)
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)
        saved += 1
        print(f"saved {destination}", file=sys.stderr)
        if "css" in content_type or bare.endswith(".css"):
            css_text = content.decode("utf-8", errors="replace")
            queue.extend(css_references(css_text, url))
    return saved
