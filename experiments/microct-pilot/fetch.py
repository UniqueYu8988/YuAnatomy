"""Fetch one CC BY 4.0 pretreatment volume; verify publisher MD5 and record SHA256."""
import hashlib, json, pathlib, urllib.request, zipfile
ROOT = pathlib.Path(__file__).resolve().parent
CACHE = ROOT / 'source'
CACHE.mkdir(parents=True, exist_ok=True)
record = json.load(urllib.request.urlopen('https://zenodo.org/api/records/3877625'))
(CACHE / 'record.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
keys = ['_info_ds-uct-002.txt', 'ds-uct-002_root_canal_strain_tomo1b_20um_8bits.zip']
for key in keys:
    entry = next(f for f in record['files'] if f['key'] == key)
    target = CACHE / key
    if not target.exists():
        partial = target.with_suffix(target.suffix + '.partial')
        with urllib.request.urlopen(entry['links']['self'], timeout=120) as response, partial.open('wb') as out:
            count = 0
            while block := response.read(2**20):
                out.write(block); count += len(block)
                if count % (20 * 2**20) == 0: print(f'{key}: {count/2**20:.0f} MiB', flush=True)
        partial.rename(target)
    digest = hashlib.md5(target.read_bytes()).hexdigest()
    assert 'md5:' + digest == entry['checksum'], (key, digest)
    print('Verified', key, target.stat().st_size, flush=True)
    if key.endswith('.zip'):
        with zipfile.ZipFile(target) as archive:
            listing = [{'name': f.filename, 'bytes': f.file_size} for f in archive.infolist()]
            (CACHE / 'zip-list.json').write_text(json.dumps(listing, indent=2), encoding='utf-8')
            print('Entries:', len(listing), 'first:', listing[:5], flush=True)
        (CACHE / 'checksum.json').write_text(json.dumps({'file': key, 'md5': digest, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}, indent=2))
print((CACHE / keys[0]).read_text(errors='replace'))
