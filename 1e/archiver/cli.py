"""Command-line interface for the aonprd.com (Pathfinder 1e) archiver."""

import argparse

from . import crawler


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog="archiver",
        description="Archive the Archives of Nethys Pathfinder 1e site "
                    "(aonprd.com)",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    crawl = subparsers.add_parser(
        "crawl",
        help="mirror the site to site/; resumable, run from the 1e/ directory",
    )
    crawl.add_argument("--delay", type=float, default=0.1,
                       help="seconds between requests (default: 0.1)")
    crawl.set_defaults(func=lambda args: crawler.crawl(delay=args.delay))

    serve = subparsers.add_parser(
        "serve",
        help="serve the mirror for local browsing (maps query-string "
             "URLs like Spells.aspx?ID=5 to their archived files)",
    )
    serve.add_argument("--port", type=int, default=8000,
                       help="port to listen on (default: 8000)")
    serve.set_defaults(func=lambda args: crawler.serve(port=args.port))

    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
