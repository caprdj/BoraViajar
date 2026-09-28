import json
import struct
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class PublicBuildTests(unittest.TestCase):
    def test_public_defaults_do_not_include_personal_itinerary(self):
        script = (ROOT / 'dist/app.js').read_text(encoding='utf-8')
        self.assertNotIn('fortaleza_2026', script)
        self.assertNotIn('Jericoacoara 2026', script)
        self.assertNotIn('2026-10-31', script)
        self.assertIn("version:2,trips:[],active_trip_id:null,combined_scenarios:[]", script)
        self.assertNotIn('Minha próxima viagem', script)
        self.assertIn("const STORE = 'meu-percurso-v1'", script)

    def test_manifest_is_relative_to_project_path(self):
        manifest = json.loads((ROOT / 'dist/manifest.webmanifest').read_text(encoding='utf-8'))
        self.assertEqual(manifest['name'], 'Bora Viajar')
        self.assertEqual(manifest['scope'], './')
        self.assertEqual(manifest['start_url'], './#viagens')
        for icon in manifest['icons']:
            self.assertTrue((ROOT / 'dist' / icon['src']).is_file())
        self.assertTrue((ROOT / 'dist/comparison.js').is_file())
        self.assertTrue((ROOT / 'dist/comparison-ui.js').is_file())

    def test_public_copy_uses_current_branding(self):
        html = (ROOT / 'dist/index.html').read_text(encoding='utf-8')
        scripts = ''.join(
            (ROOT / 'dist' / name).read_text(encoding='utf-8')
            for name in ('app.js', 'stages.js', 'trips-ui.js')
        )
        self.assertIn('<footer>Feito para planejar com calma.</footer>', html)
        self.assertIn('src="icons/icon-192.png"', html)
        self.assertIn('VERSÃO 2.2', html)
        self.assertTrue((ROOT / 'dist/planning.js').is_file())
        self.assertTrue((ROOT / 'dist/planning-ui.js').is_file())
        for obsolete_text in ('Uma viagem,', 'Minha próxima viagem', 'Um destino de cada vez.'):
            self.assertNotIn(obsolete_text, html + scripts)

    def test_original_icons_are_used_at_declared_sizes(self):
        expected = {192: 'icon-192.png', 512: 'icon-512.png'}
        for size, name in expected.items():
            data = (ROOT / 'dist/icons' / name).read_bytes()
            self.assertEqual(data[:8], b'\x89PNG\r\n\x1a\n')
            self.assertEqual(struct.unpack('>II', data[16:24]), (size, size))
        self.assertTrue((ROOT / 'dist/icon.svg').exists())
        self.assertFalse((ROOT / 'dist/icons/plane-192.png').exists())

    def test_no_private_files_are_in_public_build(self):
        for path in (ROOT / 'dist').rglob('*'):
            self.assertNotIn(path.suffix, ['.ipynb', '.csv'])
            self.assertNotIn('backup', path.name.lower())
