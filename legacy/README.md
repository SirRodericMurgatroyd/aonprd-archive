# legacy archive — legacy.aonprd.com

Archives the [legacy Pathfinder Reference Document](https://legacy.aonprd.com/),
the old Paizo PRD site. It is a pure static website — hand-written `.html`
pages organized by book (`coreRulebook/`, `advancedPlayerGuide/`, …) with
stylesheets and images under `include/` — so the archive is a straight
static mirror produced by a breadth-first crawl.

## Usage

Requires Python 3.8+; no third-party dependencies. Run from this directory:

```sh
python3 -m archiver crawl            # mirror the site (resumable)
python3 -m archiver crawl --delay 0.5   # be gentler
python3 -m archiver serve            # browse the mirror at localhost:8000
```

The mirror is directly browsable — pages are plain `.html` files with
relative links, so opening `site/index.html` via `file://` mostly works.
The `serve` command is a nicety here (it serves `site/` with correct
content types), unlike for the 1e mirror where it's required.

The crawl skips files already on disk (but still parses them for links),
so it can resume after interruption and incremental re-runs only fetch
what's missing.

## Contents

- `archiver/` — the CLI package. `crawler.py` is the generic mirror
  crawler shared with the 1e archive; `config.py` holds this site's
  specifics.
- `site/...` — the mirrored site, file paths mirroring URL paths
  (`site/coreRulebook/races.html` = the same path on the live site;
  a trailing-slash URL becomes `index.html`).
- `external/cdn.paizo.com/...` — would hold the stylesheets/scripts the
  site pulls from Paizo's CDN, but as of the 2026-07-15 crawl all three
  referenced CDN files (jquery-ui/dataTables CSS+JS) already 404 on the
  live CDN, so this directory does not exist and the pages render without
  them on the live site too. See `manifest.json` failures.
- `manifest.json` — crawl timestamp, fetch counts, and any URLs that
  failed (e.g. references that 404 on the live site).

## Notes

- Links inside the pages are not rewritten in any way; the files are
  byte-for-byte what the server returned. Relative links work when
  browsing the mirror locally; the few absolute links and CDN references
  do not.
- The crawler treats URL paths case-insensitively (the site is served by
  IIS) and only follows links on this host, plus asset fetches from the
  allowlisted CDN.
