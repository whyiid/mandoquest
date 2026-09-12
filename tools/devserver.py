#!/usr/bin/env python3
"""Dev server for MandoQuest that refuses to be cached.

`python3 -m http.server` sends no cache headers, so Chrome applies its own
heuristic and keeps serving a stale data.js/app.js from disk cache — surviving
a reload, a new tab, and even clearing Service Worker + Cache Storage. That
makes local verification untrustworthy: the page under test is not the file on
disk. This sends no-store on every response so what you see is what you saved.

Production is unaffected — GitHub Pages serves the real caching headers, and
offline still works through the service worker in sw.js.

    python3 tools/devserver.py [port]
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write('%s\n' % (fmt % args))


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    handler = partial(NoCacheHandler, directory=str(ROOT))
    print(f'MandoQuest dev server (no-store) on http://localhost:{port}')
    ThreadingHTTPServer(('127.0.0.1', port), handler).serve_forever()
