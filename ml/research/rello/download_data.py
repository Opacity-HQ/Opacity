"""Retrieve official Rello/MusVis releases and researcher DGames repository bytes."""
import hashlib
import io
import json
from pathlib import Path
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parent
RAW = ROOT / 'data' / 'raw'

def get(url):
    with urllib.request.urlopen(url, timeout=90) as response:
        return response.read()

def main():
    RAW.mkdir(parents=True, exist_ok=True)
    manifest = []
    def save(name, data, url, **extra):
        (RAW / name).write_bytes(data)
        manifest.append(dict(file=name, url=url, bytes=len(data),
                             sha256=hashlib.sha256(data).hexdigest(), **extra))
    url = 'https://www.kaggle.com/api/v1/datasets/download/luzrello/dyslexia'
    archive = zipfile.ZipFile(io.BytesIO(get(url)))
    for name in ('Dyt-desktop.csv', 'Dyt-tablet.csv'):
        save(name, archive.read(name), url, source='official author Kaggle archive')
    meta = json.loads(get('https://api.figshare.com/v2/articles/17714708'))
    save('musvis_metadata.json', json.dumps(meta, indent=2).encode(),
         'https://api.figshare.com/v2/articles/17714708')
    for f in meta['files']:
        save(f['name'], get(f['download_url']), f['download_url'],
             figshare_version=meta['version'], license=meta['license'])
    repo = 'https://api.github.com/repos/Rauschii/DGamesDataSet'
    info = json.loads(get(repo + '/commits/main'))
    commit = info['sha']
    for name in ('dataset_dgames.csv', 'feature_description_Dgames.xlsx', 'README.md', 'LICENSE'):
        url = f'https://raw.githubusercontent.com/Rauschii/DGamesDataSet/{commit}/{name}'
        save(name, get(url), url, commit=commit)
    (ROOT / 'source_manifest.json').write_text(json.dumps(manifest, indent=2))
    print('Downloaded', len(manifest), 'source files')

if __name__ == '__main__':
    main()
