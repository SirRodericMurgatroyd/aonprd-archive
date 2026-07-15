"""Generic same-host website mirror crawler (stdlib only).

Breadth-first crawl from the configured seeds, following links found in
HTML (href/src/srcset/poster attributes and inline style url(...)) and CSS
(url(...) and @import). Pages on config.HOSTS are saved under site/ and
recursed into; assets on config.EXTERNAL_HOSTS are saved under
external/<host>/ and parsed only if they are CSS (for fonts/images).
Everything else is ignored.

URL-to-file mapping mirrors the URL structure: path /a/b.html -> site/a/b.html,
a trailing slash becomes index.html, and a query string stays in the file
name (Spells.aspx?ID=5 -> "Spells.aspx?ID=5"; note such names are not
portable to Windows filesystems).

The crawl is resumable: files already on disk are not refetched, but they
are re-parsed so link discovery still completes. Failures are recorded in
manifest.json rather than aborting the crawl. Visited-URL bookkeeping is
case-insensitive because the sites are served by IIS, which treats paths
case-insensitively.
"""

import datetime
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import deque
from html.parser import HTMLParser
from pathlib import Path

from . import config

USER_AGENT = "aonprd-archive/0.1 (archival tool)"
MAX_RETRIES = 4
RETRYABLE_STATUSES = {429, 500, 502, 503, 504}


class LinkExtractor(HTMLParser):
    TAG_ATTRIBUTES = {
        "a": ["href"],
        "area": ["href"],
        "link": ["href"],
        "img": ["src", "srcset"],
        "script": ["src"],
        "source": ["src", "srcset"],
        "iframe": ["src"],
        "frame": ["src"],
        "embed": ["src"],
        "input": ["src"],
        "video": ["src", "poster"],
        "audio": ["src"],
    }

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []

    def handle_starttag(self, tag, attrs):
        wanted = self.TAG_ATTRIBUTES.get(tag)
        if not wanted:
            return
        for name, value in attrs:
            if name not in wanted or not value:
                continue
            if name == "srcset":
                for candidate in value.split(","):
                    parts = candidate.split()
                    if parts:
                        self.links.append(parts[0])
            else:
                self.links.append(value)


CSS_URL = re.compile(r"""url\(\s*["']?([^"')\s]+)["']?\s*\)""")
CSS_IMPORT = re.compile(r"""@import\s+["']([^"']+)["']""")


def normalize(base_url, link):
    """Resolve a link against its page and normalize; None if uncrawlable."""
    absolute = urllib.parse.urljoin(base_url, link.strip())
    absolute, _ = urllib.parse.urldefrag(absolute)
    parts = urllib.parse.urlsplit(absolute)
    if parts.scheme not in ("http", "https") or not parts.netloc:
        return None
    host = parts.netloc.lower()
    host = config.CANONICAL_HOSTS.get(host, host)
    # Our hosts are reachable over https regardless of how links spell it.
    scheme = "https" if host in config.HOSTS else parts.scheme
    # Site HTML contains raw spaces etc. in hrefs (browsers encode these
    # silently, urllib refuses them); escape while leaving existing
    # %-escapes intact.
    path = urllib.parse.quote(parts.path or "/", safe="/%:@")
    query = urllib.parse.quote(parts.query, safe="=&+%:@/?")
    return urllib.parse.urlunsplit((scheme, host, path, query, ""))


def host_of(url):
    return urllib.parse.urlsplit(url).netloc.lower()


def visit_key(url):
    """Case-insensitive identity, matching IIS path semantics."""
    parts = urllib.parse.urlsplit(url)
    return (parts.netloc.lower(), parts.path.lower(), parts.query.lower())


def local_path(url):
    parts = urllib.parse.urlsplit(url)
    host = parts.netloc.lower()
    path = urllib.parse.unquote(parts.path)
    if path.endswith("/"):
        path += "index.html"
    relative = path.lstrip("/")
    if parts.query:
        query = urllib.parse.unquote_plus(parts.query).replace("/", "%2F")
        relative = f"{relative}?{query}"
    base = "site" if host in config.HOSTS else f"external/{host}"
    return Path(base) / relative


def is_html_name(name):
    lowered = name.lower()
    return (".aspx" in lowered or lowered.endswith(".html")
            or lowered.endswith(".htm") or lowered == "index.html")


def content_kind(url, content_type):
    """'html', 'css', or 'other' — from Content-Type, else the file name."""
    if content_type:
        if "html" in content_type:
            return "html"
        if "css" in content_type:
            return "css"
        if content_type.split(";")[0].strip() not in ("", "application/octet-stream"):
            return "other"
    name = local_path(url).name
    if is_html_name(name):
        return "html"
    if name.lower().endswith(".css"):
        return "css"
    return "other"


def fetch(url, timeout=60):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_error = None
    for attempt in range(MAX_RETRIES):
        if attempt:
            time.sleep(2 ** attempt)
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.read(), response.headers.get("Content-Type", "")
        except urllib.error.HTTPError as err:
            if err.code not in RETRYABLE_STATUSES:
                raise
            last_error = err
        except (urllib.error.URLError, TimeoutError) as err:
            last_error = err
    raise RuntimeError(f"failed after {MAX_RETRIES} attempts: {last_error}")


def extract_links(url, content, kind):
    if kind not in ("html", "css"):
        return []
    text = content.decode("utf-8", errors="replace")
    if kind == "html":
        parser = LinkExtractor()
        try:
            parser.feed(text)
        except Exception:
            pass
        raw = parser.links + CSS_URL.findall(text)  # inline style attributes
    else:
        raw = CSS_URL.findall(text) + CSS_IMPORT.findall(text)
    links = []
    for link in raw:
        normalized = normalize(url, link)
        if normalized:
            links.append(normalized)
    return links


def try_sitemap(queue):
    """Seed the queue from sitemap.xml if the site has one."""
    for host in config.HOSTS:
        try:
            content, _ = fetch(f"https://{host}/sitemap.xml")
        except Exception:
            continue
        locs = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", content.decode("utf-8", "replace"))
        for loc in locs:
            normalized = normalize(f"https://{host}/", loc)
            if normalized:
                queue.append(normalized)
        print(f"seeded {len(locs)} urls from {host}/sitemap.xml", file=sys.stderr)


def crawl(delay=0.1):
    queue = deque(config.SEEDS)
    try_sitemap(queue)
    visited = set()
    fetched = skipped = 0
    failures = {}

    while queue:
        url = queue.popleft()
        key = visit_key(url)
        if key in visited:
            continue
        visited.add(key)
        if host_of(url) not in config.HOSTS and host_of(url) not in config.EXTERNAL_HOSTS:
            continue
        if config.skip_url(url):
            continue

        destination = local_path(url)
        if destination.exists():
            content = destination.read_bytes()
            kind = content_kind(url, "")
            skipped += 1
        else:
            try:
                content, content_type = fetch(url)
            except Exception as err:
                failures[url] = getattr(err, "code", None) or str(err)
                print(f"  failed: {url} ({failures[url]})", file=sys.stderr)
                continue
            kind = content_kind(url, content_type)
            try:
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(content)
            except OSError as err:
                failures[url] = str(err)
                print(f"  cannot save: {url} ({err})", file=sys.stderr)
                continue
            fetched += 1
            if fetched % 100 == 0:
                print(f"[fetched {fetched}, queue {len(queue)}]",
                      file=sys.stderr, flush=True)
            if delay:
                time.sleep(delay)

        # Only recurse into pages on our hosts; external assets are
        # parsed for their CSS dependencies only.
        if host_of(url) in config.HOSTS or kind == "css":
            for link in extract_links(url, content, kind):
                if visit_key(link) not in visited:
                    queue.append(link)

    manifest = {
        "site": config.SITE,
        "crawled_at": datetime.datetime.now(datetime.timezone.utc)
            .isoformat(timespec="seconds"),
        "fetched": fetched,
        "already_present": skipped,
        "failures": failures,
    }
    Path("manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"done: {fetched} fetched, {skipped} already present, "
          f"{len(failures)} failures (see manifest.json)", file=sys.stderr)


def serve(port=8000):
    """Serve the mirror for local browsing.

    A plain static file server can't serve this mirror: pages are stored
    under file names that include their query string ("Spells.aspx?ID=5"),
    and .aspx files need a text/html content type. This handler applies the
    same URL-to-file mapping as the crawl.
    """
    import http.server
    import mimetypes

    class MirrorHandler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            target = local_path(urllib.parse.urljoin(config.SITE, self.path))
            if not target.is_file():
                self.send_error(404)
                return
            if is_html_name(target.name):
                content_type = "text/html; charset=utf-8"
            else:
                guessed, _ = mimetypes.guess_type(target.name.split("?")[0])
                content_type = guessed or "application/octet-stream"
            content = target.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)

        def log_message(self, format, *args):
            pass

    print(f"serving mirror at http://localhost:{port}/", file=sys.stderr)
    http.server.ThreadingHTTPServer(("", port), MirrorHandler).serve_forever()
