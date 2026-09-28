import importlib.util
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import urlopen
from http.server import ThreadingHTTPServer

spec = importlib.util.spec_from_file_location('travel_server', Path(__file__).resolve().parents[1] / 'server.py')
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_public_assets(self):
        for asset in ['', 'styles.css', 'app.js', 'core.js', 'comparison.js', 'comparison-ui.js', 'coast.svg', 'icons/icon-192.png']:
            with urlopen(self.url + '/' + asset) as response:
                self.assertEqual(response.status, 200)

    def test_private_files_not_exposed(self):
        for asset in ['server.py', 'Planejador_de_Viagens_v1.ipynb', '../README.md', '%2e%2e/README.md', 'tests/']:
            with self.assertRaises(HTTPError) as caught:
                urlopen(self.url + '/' + asset)
            self.assertEqual(caught.exception.code, 404)


if __name__ == '__main__':
    unittest.main()
