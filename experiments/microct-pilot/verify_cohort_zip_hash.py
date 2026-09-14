"""Verify the original whole ZIP by streaming cached contiguous ranges and two small edges."""
import json,hashlib,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'output/download-recovery';CACHE=ROOT/'cache/cohort-389-1680'
folders=[ROOT/'cache'/name for name in ['cohort-389-1680','cohort-branch','cohort-2005-2973']]
specs=[json.loads((p/'interval.json').read_text()) for p in folders];size=specs[0]['archiveSize'];step=16*1024*1024
assert all(s['archiveSize']==size and s['etag']==specs[0]['etag'] for s in specs)
assert all(a['endExclusive']==b['start'] for a,b in zip(specs,specs[1:]))
parts=[]
for folder,spec in zip(folders,specs):
    for start in range(spec['start'],spec['endExclusive'],step):
        n=min(step,spec['endExclusive']-start);p=folder/f'bytes-{start}.bin'
        assert p.exists() and p.stat().st_size==n,f'Incomplete cache at offset {start}'
        parts.append((start,n,p))
for start,end in [(0,specs[0]['start']),(specs[-1]['endExclusive'],size)]:
    n=end-start;assert 0<n<=4*1024*1024;p=CACHE/f'archive-edge-{start}.bin'
    if not p.exists() or p.stat().st_size!=n:
        req=urllib.request.Request('https://osf.io/download/fqm4x/',headers={'Range':f'bytes={start}-{end-1}'})
        with urllib.request.urlopen(req,timeout=45) as r:
            assert r.status==206 and r.headers.get('Content-Range')==f'bytes {start}-{end-1}/{size}' and r.headers.get('ETag')==specs[0]['etag']
            b=r.read(n+1)
        assert len(b)==n;tmp=p.with_suffix('.part');tmp.write_bytes(b);tmp.replace(p)
    parts.append((start,n,p))
sha=hashlib.sha256();md5=hashlib.md5();position=0
for start,n,p in sorted(parts):
    assert start==position
    with p.open('rb') as f:
        while b:=f.read(4*1024*1024):sha.update(b);md5.update(b);position+=len(b)
assert position==size
expected=json.loads((ROOT/'source/cohort-screening/file.json').read_text())['data']['attributes']['extra']['hashes']
assert sha.hexdigest()==expected['sha256'] and md5.hexdigest()==expected['md5']
result={'wholeArchiveHashVerified':True,'archiveBytes':position,'sha256':sha.hexdigest(),'md5':md5.hexdigest(),
        'method':'Streamed contiguous cached ranges and public-source edge bytes; no need for a second physical ZIP copy.'}
(OUT/'whole-archive-validation.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
