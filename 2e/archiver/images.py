"""Download the images referenced by archived documents.

Image references appear in three places:
- the `image` field (array of paths), mostly creatures but also ancestries,
  archetypes, classes, creature families, and deities;
- the `icon_image` field (string) on classes and deities;
- paths embedded in `markdown`/`search_markdown`, e.g. rules diagrams
  (`<image src="/images/Rules/Rules354.png" />`) and sidebar icons
  (`icon="/images/Icons/Sidebar_3_Locations.png"`).

A path like /Images/Monsters/Aapoph_Serpentfolk.webp is saved to
<images_dir>/Monsters/Aapoph_Serpentfolk.webp. The site serves paths
case-insensitively and references use both /Images/ and /images/, so paths
are deduplicated case-insensitively.
"""

import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from .client import USER_AGENT

SITE_URL = "https://2e.aonprd.com/"

EMBEDDED_REF = re.compile(r'(?:src|icon)="(/[Ii]mages/[^"]+)"')
IMAGE_PREFIX = re.compile(r"^/[Ii]mages/")

MAX_RETRIES = 4


def iter_document_refs(document):
    """Yield every image path referenced by one document."""
    yield from document.get("image") or []
    icon = document.get("icon_image")
    if icon:
        yield icon
    for value in document.values():
        if isinstance(value, str):
            yield from EMBEDDED_REF.findall(value)


def collect_image_paths(data_dir):
    """Return unique image paths across all archived JSON files.

    Deduplicated case-insensitively; the first-seen spelling wins. Broken
    references (no filename, no /Images/ prefix) are dropped.
    """
    seen = {}
    for path in sorted(Path(data_dir).glob("*.json")):
        if path.name == "manifest.json":
            continue
        for document in json.loads(path.read_text(encoding="utf-8")):
            for ref in iter_document_refs(document):
                if not IMAGE_PREFIX.match(ref) or not Path(ref).suffix:
                    continue
                seen.setdefault(ref.lower(), ref)
    return sorted(seen.values())


def local_path(images_dir, ref):
    """Map /Images/Monsters/Foo.webp to <images_dir>/Monsters/Foo.webp."""
    return Path(images_dir) / IMAGE_PREFIX.sub("", ref)


def download(ref, destination, timeout=60):
    """Fetch one image into destination. Returns the number of bytes saved."""
    url = urllib.parse.urljoin(SITE_URL, urllib.parse.quote(ref))
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_error = None
    for attempt in range(MAX_RETRIES):
        if attempt:
            time.sleep(2 ** attempt)
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                content = response.read()
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(content)
            return len(content)
        except urllib.error.HTTPError as err:
            if err.code == 404:
                raise
            last_error = err
        except (urllib.error.URLError, TimeoutError) as err:
            last_error = err
    raise RuntimeError(f"download failed after {MAX_RETRIES} attempts: {last_error}")


def download_all(data_dir, images_dir, delay=0.05):
    """Download every referenced image, skipping files that already exist.

    Returns (downloaded, skipped, missing) counts.
    """
    refs = collect_image_paths(data_dir)
    print(f"{len(refs)} unique images referenced", file=sys.stderr)
    downloaded = skipped = 0
    missing = []
    for index, ref in enumerate(refs, 1):
        destination = local_path(images_dir, ref)
        if destination.exists():
            skipped += 1
            continue
        try:
            download(ref, destination)
            downloaded += 1
        except urllib.error.HTTPError as err:
            missing.append(ref)
            print(f"  missing ({err.code}): {ref}", file=sys.stderr)
        if index % 100 == 0:
            print(f"[{index}/{len(refs)}]", file=sys.stderr)
        if delay:
            time.sleep(delay)
    print(f"downloaded {downloaded}, already present {skipped}, "
          f"missing {len(missing)}", file=sys.stderr)
    return downloaded, skipped, missing
