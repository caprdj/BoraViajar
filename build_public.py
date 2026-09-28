"""Build an explicit allowlist of public assets; never publish travel data."""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / 'dist'
ASSETS = ['index.html', 'styles.css', 'app.js', 'core.js', 'stages.js', 'trips.js', 'trips-ui.js', 'comparison.js', 'comparison-ui.js', 'icon.svg', 'coast.svg',
          'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png']
def build():
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()
    for name in ASSETS:
        target = OUTPUT / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, target)
    (OUTPUT / '.nojekyll').write_text('', encoding='utf-8')
    print('Versão pública preparada em dist, sem dados pessoais de viagem.')


if __name__ == '__main__':
    build()
