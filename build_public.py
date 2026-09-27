"""Build an explicit allowlist of public assets; never publish travel data."""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / 'dist'
ASSETS = ['index.html', 'styles.css', 'app.js', 'core.js', 'stages.js', 'trips.js', 'trips-ui.js', 'icon.svg', 'coast.svg',
          'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png']
PUBLIC_TRIP = {
    'id': 'minha_viagem', 'nome': 'Minha próxima viagem', 'origem': '',
    'destino_principal': {'cidade': '', 'estado': ''},
    'data_inicio': None, 'data_fim': None, 'motivo': '', 'evento': {},
    'destinos_adicionais': [],
    'preferencias': {'ritmo': 'moderado', 'interesses': [], 'baixa_prioridade': []},
}


def build():
    OUTPUT.mkdir(exist_ok=True)
    for name in ASSETS:
        target = OUTPUT / name
        target.parent.mkdir(parents=True, exist_ok=True)
        if name == 'app.js':
            source = (ROOT / name).read_text(encoding='utf-8')
            start = source.index('const defaultTrip = ')
            end = source.index('\nconst initial =', start)
            source = source[:start] + 'const defaultTrip = ' + json.dumps(PUBLIC_TRIP, ensure_ascii=False) + ';' + source[end:]
            target.write_text(source, encoding='utf-8')
        else:
            shutil.copyfile(ROOT / name, target)
    (OUTPUT / '.nojekyll').write_text('', encoding='utf-8')
    print('Versão pública preparada em dist, sem a configuração pessoal da viagem.')


if __name__ == '__main__':
    build()
