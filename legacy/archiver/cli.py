"""Command-line interface for the legacy.aonprd.com archiver."""

import argparse

from . import crawler


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog="archiver",
        description="Archive the legacy Pathfinder Reference Document "
                    "(legacy.aonprd.com)",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    crawl = subparsers.add_parser(
        "crawl",
        help="mirror the site to site/ (and CDN assets to external/); "
             "resumable, run from the legacy/ directory",
    )
    crawl.add_argument("--delay", type=float, default=0.1,
                       help="seconds between requests (default: 0.1)")
    crawl.set_defaults(func=lambda args: crawler.crawl(delay=args.delay))

    serve = subparsers.add_parser(
        "serve",
        help="serve the mirror for local browsing (maps query-string "
             "URLs to their archived files)",
    )
    serve.add_argument("--port", type=int, default=8000,
                       help="port to listen on (default: 8000)")
    serve.set_defaults(func=lambda args: crawler.serve(port=args.port))

    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
