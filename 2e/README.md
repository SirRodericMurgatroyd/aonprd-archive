# 2e archive — 2e.aonprd.com

Archives the structured game-entity data behind the
[Archives of Nethys Pathfinder 2e site](https://2e.aonprd.com/) by querying
the site's public elasticsearch endpoint
(`https://elasticsearch.aonprd.com/aon/_search`).

Every document in the index has a `category` field (creature, spell, feat,
…). The archiver downloads each category with `search_after` pagination and
writes one JSON file per entity type, each an array of the raw
elasticsearch `_source` documents.

## Usage

Requires Python 3.8+; no third-party dependencies. Run from this directory:

```sh
# List entity types and document counts from the live index
python3 -m archiver categories

# Download everything to data/, generate data/README.md schema docs,
# download referenced images to images/ and frontend assets to assets/
python3 -m archiver all

# Or piecemeal:
python3 -m archiver fetch creature spell   # just some categories
python3 -m archiver fetch                  # everything
python3 -m archiver schema                 # regenerate docs from data/
python3 -m archiver images                 # download referenced images
python3 -m archiver assets                 # download frontend assets
```

## Contents

- `archiver/` — the CLI package.
- `data/<entity-type>.json` — one file per category (pluralized, e.g.
  `creatures.json`, `feats.json`), a JSON array of raw documents.
- `data/manifest.json` — archive timestamp and per-category document
  counts.
- `data/README.md` — generated schema documentation. The elasticsearch
  `_mapping` API is not exposed to anonymous users, so field types are
  inferred from the documents themselves, along with how many documents in
  each category carry each field and an example value.
- `images/...` — every image referenced by the archived documents,
  mirroring the site's URL structure:
  `https://2e.aonprd.com/Images/Monsters/Foo.webp` is saved as
  `images/Monsters/Foo.webp`. References are gathered from the `image`
  field (creatures, ancestries, archetypes, classes, creature families,
  deities), the `icon_image` field (classes, deities), and paths embedded
  in markdown (rules diagrams, sidebar icons). The site serves paths
  case-insensitively and references spell the prefix both `/Images/` and
  `/images/`, so paths are deduplicated case-insensitively. The `images`
  command skips already-downloaded files, so it can resume after
  interruption. One referenced image (`/Images/Monsters/Zimiezek.webp`)
  404s on the live server itself.
- `assets/...` — the site's frontend files for reference: the homepage
  and search-page HTML shells, stylesheets (including the extensionless
  `/themes` CSS with every theme's variables), scripts, fonts (notably
  `Pathfinder-Icons.ttf` for action glyphs), the nethys-search JS bundle,
  and the static `/json-data` files (aggregation data, page index, and
  per-page-hash document payloads used for link previews). Third-party CDN
  assets (jquery, fomantic-ui, showdown, lodash, Google Fonts) are skipped.

## Notes on the data

- `markdown` holds the full rendered stat block in the site's markdown
  dialect (with custom tags like `<title>`, `<traits>`, `<actions>`);
  most other fields are the structured versions of the same information.
  Together with `text`, this duplicates the content of the site's
  server-rendered pages, so the data archive carries the complete content
  of the site even though page HTML is not archived.
- Documents include legacy/remaster cross-references (`legacy_id`,
  `remaster_id`) and an `exclude_from_search` flag; the archive keeps
  everything, excluded documents included.
- How the production site works, for the record: pages are server-rendered
  ASP.NET from a private database; the open-source
  [nethys-search](https://github.com/galdiuz/nethys-search) Elm app powers
  the search page and link-hover previews from the public elasticsearch
  index archived here. (A docker-based local replica was prototyped and
  dropped — recreating the site is messier than it's worth; the raw data
  is the archive.)
