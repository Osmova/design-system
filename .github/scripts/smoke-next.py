#!/usr/bin/env python3
"""Serve an assembled preview under /next/ and fetch every page's linked scripts and styles."""
import argparse
import functools
import http.server
from pathlib import Path
import re
import tempfile
import threading
import urllib.request
from urllib.parse import urljoin, urlsplit

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


PAGES = ("/next/", "/next/index.html", "/next/storybook/", "/next/storybook/iframe.html")


def smoke(site):
    with tempfile.TemporaryDirectory() as root:
        (Path(root) / "next").symlink_to(Path(site).resolve(), target_is_directory=True)
        handler = functools.partial(QuietHandler, directory=root)
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = "http://127.0.0.1:%d" % server.server_address[1]
        checked = set()
        try:
            for page in PAGES:
                with urllib.request.urlopen(base + page, timeout=30) as response:
                    html = response.read().decode("utf-8")
                assets = re.findall(r'(?:src|href)=["\']([^"\']+\.(?:js|css)(?:\?[^"\']*)?)["\']', html)
                if not assets:
                    raise RuntimeError("No static assets in " + page)
                for asset in assets:
                    url = urljoin(base + page, asset)
                    path = urlsplit(url).path
                    if not path.startswith("/next/"):
                        raise RuntimeError(page + " references an asset outside /next/: " + asset)
                    with urllib.request.urlopen(url, timeout=30) as response:
                        response.read()
                    checked.add(path)
        finally:
            server.shutdown()
        print("smoke-next: %d pages, %d assets resolved under /next/" % (len(PAGES), len(checked)))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site", nargs="?", default="site-next")
    smoke(parser.parse_args().site)
