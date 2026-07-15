"""Command-line interface for the AonPRD archiver."""

import argparse

from . import archive, assets, client, images, schema


def add_data_dir(parser):
    parser.add_argument(
        "--data-dir", default="data",
        help="directory for the archived JSON files (default: data)",
    )


def cmd_categories(_args):
    categories = client.get_categories()
    width = max(len(name) for name in categories)
    for name in sorted(categories):
        print(f"{name:<{width}}  {categories[name]:>6}")
    print(f"{'total':<{width}}  {sum(categories.values()):>6}")


def cmd_fetch(args):
    archive.fetch_all(args.categories, args.data_dir, page_size=args.page_size)


def cmd_schema(args):
    path = schema.generate_readme(args.data_dir, args.out)
    print(f"wrote {path}")


def cmd_images(args):
    images.download_all(args.data_dir, args.images_dir, delay=args.delay)


def cmd_assets(args):
    count = assets.download_all(args.assets_dir)
    print(f"saved {count} asset files to {args.assets_dir}")


def cmd_all(args):
    archive.fetch_all([], args.data_dir, page_size=args.page_size)
    path = schema.generate_readme(args.data_dir)
    print(f"wrote {path}")
    assets.download_all(args.assets_dir)
    images.download_all(args.data_dir, args.images_dir)


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog="archiver",
        description="Archive structured game data from 2e.aonprd.com",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser(
        "categories", help="list entity types and document counts"
    ).set_defaults(func=cmd_categories)

    fetch = subparsers.add_parser("fetch", help="download entity data to JSON files")
    fetch.add_argument(
        "categories", nargs="*",
        help="entity types to fetch (default: all of them)",
    )
    add_data_dir(fetch)
    fetch.add_argument("--page-size", type=int, default=500,
                       help="documents per request (default: 500)")
    fetch.set_defaults(func=cmd_fetch)

    schema_parser = subparsers.add_parser(
        "schema", help="generate schema documentation from downloaded data"
    )
    add_data_dir(schema_parser)
    schema_parser.add_argument(
        "--out", default=None,
        help="output markdown path (default: <data-dir>/README.md)",
    )
    schema_parser.set_defaults(func=cmd_schema)

    images_parser = subparsers.add_parser(
        "images", help="download images referenced by the archived data"
    )
    add_data_dir(images_parser)
    images_parser.add_argument(
        "--images-dir", default="images",
        help="directory for downloaded images (default: images)",
    )
    images_parser.add_argument("--delay", type=float, default=0.05,
                               help="seconds between downloads (default: 0.05)")
    images_parser.set_defaults(func=cmd_images)

    assets_parser = subparsers.add_parser(
        "assets", help="download frontend assets (CSS, fonts, JS, page shell)"
    )
    assets_parser.add_argument(
        "--assets-dir", default="assets",
        help="directory for downloaded assets (default: assets)",
    )
    assets_parser.set_defaults(func=cmd_assets)

    everything = subparsers.add_parser(
        "all",
        help="fetch every entity type, generate schema docs, "
             "download assets and images",
    )
    add_data_dir(everything)
    everything.add_argument(
        "--images-dir", default="images",
        help="directory for downloaded images (default: images)",
    )
    everything.add_argument(
        "--assets-dir", default="assets",
        help="directory for downloaded assets (default: assets)",
    )
    everything.add_argument("--page-size", type=int, default=500,
                            help="documents per request (default: 500)")
    everything.set_defaults(func=cmd_all)

    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
