"""Serve only the app's public assets. No notebook or user backup is exposed."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import argparse
import socket
import webbrowser

ROOT = Path(__file__).resolve().parent
PUBLIC = {'index.html', 'styles.css', 'app.js', 'core.js', 'stages.js', 'trips.js', 'trips-ui.js', 'icon.svg', 'coast.svg', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        name = urlsplit(self.path).path.lstrip('/') or 'index.html'
        if name not in PUBLIC:
            self.send_error(404)
            return
        self.path = '/' + name
        super().do_GET()

    def do_HEAD(self):
        name = urlsplit(self.path).path.lstrip('/') or 'index.html'
        if name not in PUBLIC:
            self.send_error(404)
            return
        self.path = '/' + name
        super().do_HEAD()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        super().end_headers()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', default=8765, type=int)
    parser.add_argument('--open', action='store_true')
    args = parser.parse_args()
    try:
        server = ThreadingHTTPServer((args.host, args.port), Handler)
    except OSError as error:
        raise SystemExit(f'Não foi possível iniciar na porta {args.port}: {error}')
    print(f'\nBora Viajar\nComputador: http://localhost:{args.port}', flush=True)
    if args.host == '0.0.0.0':
        addresses = {info[4][0] for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET)}
        for address in sorted(addresses):
            if not address.startswith('127.'):
                print(f'Celular no mesmo Wi-Fi: http://{address}:{args.port}', flush=True)
        print('Mantenha esta janela aberta. Para encerrar, pressione Ctrl+C.', flush=True)
    if args.open:
        webbrowser.open(f'http://localhost:{args.port}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
