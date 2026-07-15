"""Download entity data per category and write it to JSON files."""

import datetime
import json
import sys
from pathlib import Path

from . import client

IRREGULAR_PLURALS = {
    "rules": "rules",  # already plural
    "equipment": "equipment",  # mass noun
}


def plural_slug(category):
    """Pluralize a kebab-case category slug for its output filename."""
    if category in IRREGULAR_PLURALS:
        return IRREGULAR_PLURALS[category]
    if category.endswith("ss"):
        return category + "es"
    if category.endswith("s"):
        return category
    if category.endswith("y") and category[-2] not in "aeiou":
        return category[:-1] + "ies"
    return category + "s"


def output_path(data_dir, category):
    return Path(data_dir) / f"{plural_slug(category)}.json"


def fetch_category(category, data_dir, page_size=500):
    """Download every document in a category to <data_dir>/<plural>.json.

    Returns the number of documents written.
    """
    documents = list(client.iter_category(category, page_size=page_size))
    path = output_path(data_dir, category)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(documents, handle, ensure_ascii=False, indent=1)
        handle.write("\n")
    return len(documents)


def fetch_all(categories, data_dir, page_size=500):
    """Fetch the given categories (or all of them) and write a manifest.

    Returns {category: count}.
    """
    available = client.get_categories()
    if categories:
        unknown = sorted(set(categories) - set(available))
        if unknown:
            raise SystemExit(f"unknown categories: {', '.join(unknown)}")
        selected = {name: available[name] for name in categories}
    else:
        selected = available

    counts = {}
    for index, (category, expected) in enumerate(sorted(selected.items()), 1):
        print(f"[{index}/{len(selected)}] {category} ({expected} docs)...",
              end=" ", flush=True, file=sys.stderr)
        count = fetch_category(category, data_dir, page_size=page_size)
        counts[category] = count
        status = "ok" if count == expected else f"WARNING: expected {expected}"
        print(f"{count} saved ({status})", file=sys.stderr)

    write_manifest(data_dir, counts)
    return counts


def write_manifest(data_dir, counts):
    """Record what was archived and when in <data_dir>/manifest.json."""
    manifest_path = Path(data_dir) / "manifest.json"
    manifest = {}
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest.setdefault("source", client.SEARCH_URL)
    manifest["archived_at"] = (
        datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    )
    categories = manifest.setdefault("categories", {})
    for category, count in counts.items():
        categories[category] = {
            "file": output_path("", category).name,
            "count": count,
        }
    manifest["total"] = sum(entry["count"] for entry in categories.values())
    with manifest_path.open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=1)
        handle.write("\n")
