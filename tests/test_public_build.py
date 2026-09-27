import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class PublicBuildTests(unittest.TestCase):
    def test_public_defaults_do_not_include_personal_itinerary(self):
        script = (ROOT / 'dist/app.js').read_text(encoding='utf-8')
        self.assertNotIn('fortaleza_2026', script)
        self.assertNotIn('Jericoacoara 2026', script)
        self.assertNotIn('2026-10-31', script)
        self.assertIn('Minha próxima viagem', script)
        self.assertIn("const STORE = 'meu-percurso-v1'", script)

    def test_manifest_is_relative_to_project_path(self):
        manifest = json.loads((ROOT / 'dist/manifest.webmanifest').read_text(encoding='utf-8'))
        self.assertEqual(manifest['name'], 'Bora Viajar')
        self.assertEqual(manifest['scope'], './')
        for icon in manifest['icons']:
            self.assertTrue((ROOT / 'dist' / icon['src']).is_file())

    def test_no_private_files_are_in_public_build(self):
        for path in (ROOT / 'dist').rglob('*'):
            self.assertNotIn(path.suffix, ['.ipynb', '.csv'])
            self.assertNotIn('backup', path.name.lower())
