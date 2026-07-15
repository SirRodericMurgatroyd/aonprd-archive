# 1e archive — aonprd.com

Archives the [Archives of Nethys Pathfinder 1e site](https://aonprd.com/).

The site is server-rendered ASP.NET WebForms: entity pages are
`<Type>.aspx?ID=n` (e.g. `Spells.aspx?ID=5`), list pages plain `.aspx`,
and there is no public JSON or elasticsearch API — search runs server-side
via `Search.aspx?Query=…` (verified: the `elasticsearch.aonprd.com` host
used by the 2e site only exposes the 2e index). The archive is therefore a
page crawl: a breadth-first mirror following every same-host link from the
homepage's navigation and list pages.

## Usage

Requires Python 3.8+; no third-party dependencies. Run from this directory:

```sh
python3 -m archiver crawl            # mirror the site (resumable)
python3 -m archiver crawl --delay 0.5   # be gentler
python3 -m archiver serve            # browse the mirror at localhost:8000
```

Browsing this mirror needs the bundled `serve` command (not a plain static
file server and not `file://`): pages are archived under file names that
include their query string (`Spells.aspx?ID=5`), so a server has to map
request path + query string onto those files, and give `.aspx` files a
`text/html` content type. `serve` does exactly that and nothing else.

The crawl skips files already on disk (but still parses them for links),
so it can resume after interruption and incremental re-runs only fetch
what's missing. A full crawl takes hours and produces gigabytes.

## Contents

- `archiver/` — the CLI package. `crawler.py` is the generic mirror
  crawler shared with the legacy archive; `config.py` holds this site's
  specifics.
- `site/...` — the mirrored site. File paths mirror URLs including the
  query string: `Spells.aspx?ID=5` is saved as `site/Spells.aspx?ID=5`
  (note: such file names are not portable to Windows filesystems).
- `manifest.json` — crawl timestamp, fetch counts, and any URLs that
  failed.

## Notes

- **Search is not archivable**: results are generated server-side from an
  unbounded query space, so `Search.aspx?Query=…` URLs are skipped (the
  bare `Search.aspx` landing page is kept). Entity *content* is all
  reachable through list pages, so nothing is lost except the search
  function itself.
- Coverage is link-based: a page no other page links to would be missed.
  Entity list pages on this site enumerate their IDs, so coverage should
  be complete in practice.
- Links are not rewritten; files are byte-for-byte what the server
  returned. `www.aonprd.com` links are folded into `aonprd.com`; URL paths
  are treated case-insensitively (IIS). Third-party assets (Google Fonts,
  analytics, social widgets) are not archived, matching the 2e archive's
  convention.
