# serve.py: a static server for the scene behind portless. Run from the folder that holds
# `underpass/`:  portless underpass.dotfiles python3 -I <skill>/scripts/serve.py
# Python's default http.server speaks HTTP/1.0 with a listen queue of 5, so the proxy returns 502
# for some of the parallel module loads and the page stays black. HTTP/1.1, a deep queue and
# no-store fix both, and every reload picks up edited modules.
import http.server
import os


class H(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


class S(http.server.ThreadingHTTPServer):
    request_queue_size = 256


S((os.environ.get('HOST', '127.0.0.1'), int(os.environ.get('PORT', '8000'))), H).serve_forever()
