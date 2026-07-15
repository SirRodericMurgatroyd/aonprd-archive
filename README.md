# aonprd-archive

Archives the [Archives of Nethys](https://aonprd.com/) family of Pathfinder
reference sites for posterity, since the sites are not long for this world.
One subdirectory per site, each with its own README:

| Directory | Site | Status | Approach |
| --- | --- | --- | --- |
| [`2e/`](2e/README.md) | [2e.aonprd.com](https://2e.aonprd.com/) — Pathfinder 2e | **complete** (2026-07-15) | structured JSON from the site's public elasticsearch index, plus images and frontend assets |
| [`1e/`](1e/README.md) | [aonprd.com](https://aonprd.com/) — Pathfinder 1e | **complete** (2026-07-15) | server-rendered ASP.NET with no public JSON/elasticsearch API, so a breadth-first page crawl (search itself is server-side and not archivable) |
| [`legacy/`](legacy/README.md) | [legacy.aonprd.com](https://legacy.aonprd.com/) — the old Pathfinder Reference Document | **complete** (2026-07-15) | pure static HTML site, mirrored by a breadth-first crawl (its three cdn.paizo.com asset references already 404 on the live CDN) |

## Layout convention

Each site directory contains an `archiver/` Python package (stdlib-only)
run from inside that directory, e.g.:

```sh
cd 2e
python3 -m archiver all
```

with output directories (`data/`, `images/`, …) relative to the site
directory. See each site's README for specifics.
