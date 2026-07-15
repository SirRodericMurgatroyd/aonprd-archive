"""Infer per-category schemas from archived data and render them as markdown.

The elasticsearch _mapping API is not exposed to anonymous users, so the
schema is derived from the documents themselves: for every field we record
the JSON types observed, how many documents carry it, and an example value.
"""

import json
from pathlib import Path

EXAMPLE_MAX_LENGTH = 80


def type_name(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int):
        return "integer"
    if isinstance(value, float):
        return "number"
    if isinstance(value, str):
        return "string"
    if isinstance(value, dict):
        return "object"
    if isinstance(value, list):
        element_types = sorted({type_name(element) for element in value})
        if not element_types:
            return "array"
        return f"array of {' | '.join(element_types)}"
    return type(value).__name__


class FieldStats:
    def __init__(self):
        self.types = set()
        self.count = 0
        self.example = None

    def observe(self, value):
        self.count += 1
        self.types.add(type_name(value))
        if self.example is None and value not in (None, "", [], {}):
            self.example = value


def infer_schema(documents):
    """Return {field: FieldStats} across a list of documents."""
    fields = {}
    for document in documents:
        for key, value in document.items():
            fields.setdefault(key, FieldStats()).observe(value)
    return fields


def format_example(value):
    text = json.dumps(value, ensure_ascii=False)
    if len(text) > EXAMPLE_MAX_LENGTH:
        text = text[: EXAMPLE_MAX_LENGTH - 1] + "…"
    # Keep the markdown table intact.
    text = text.replace("|", "\\|").replace("\n", " ").replace("\r", "")
    return f"`{text}`"


def merge_types(types):
    # "array of x" variants collapse poorly when sorted; just join them all.
    return " \\| ".join(sorted(types - {"null"}) + (["null"] if "null" in types else []))


def render_category(category, filename, documents):
    fields = infer_schema(documents)
    total = len(documents)
    lines = [
        f"### {category}",
        "",
        f"{total} documents in [`{filename}`]({filename})",
        "",
        "| Field | Type | Present | Example |",
        "| --- | --- | --- | --- |",
    ]
    for name in sorted(fields):
        stats = fields[name]
        presence = "all" if stats.count == total else f"{stats.count}/{total}"
        example = format_example(stats.example) if stats.example is not None else ""
        lines.append(
            f"| `{name}` | {merge_types(stats.types)} | {presence} | {example} |"
        )
    lines.append("")
    return "\n".join(lines)


def generate_readme(data_dir, out_path=None):
    """Write schema documentation for every archived category.

    Returns the path of the generated file.
    """
    data_dir = Path(data_dir)
    out_path = Path(out_path) if out_path else data_dir / "README.md"
    manifest = json.loads((data_dir / "manifest.json").read_text(encoding="utf-8"))
    categories = manifest["categories"]

    summary = [
        "# Archives of Nethys (2e.aonprd.com) data archive",
        "",
        f"Archived from `{manifest['source']}` at {manifest['archived_at']}.",
        f"{manifest['total']} documents across {len(categories)} entity types.",
        "",
        "Each file is a JSON array of raw elasticsearch `_source` documents for one",
        "entity type (the index's `category` field). Schemas below are inferred from",
        "the data: the *Present* column shows how many documents carry each field,",
        "since most fields are optional.",
        "",
        "| Entity type | Documents | File |",
        "| --- | --- | --- |",
    ]
    sections = []
    for category in sorted(categories):
        entry = categories[category]
        filename = entry["file"]
        summary.append(
            f"| [{category}](#{category}) | {entry['count']} | [`{filename}`]({filename}) |"
        )
        documents = json.loads((data_dir / filename).read_text(encoding="utf-8"))
        sections.append(render_category(category, filename, documents))

    content = "\n".join(summary) + "\n\n## Schemas\n\n" + "\n".join(sections)
    out_path.write_text(content, encoding="utf-8")
    return out_path
