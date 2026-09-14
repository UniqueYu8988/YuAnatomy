"""Finite complete acquisition, whole-archive hash check, then offline extraction."""
import hashlib
import json
import time
import urllib.request
import urllib.error
from http.client import IncompleteRead
from concurrent.futures import ThreadPoolExecutor, as_completed
from specimen007_source import RemoteArchive, SOURCE, CACHE, ROOT, BLOCK, acquire

OUT=ROOT/'output/specimen007-complete';OUT.mkdir(parents=True,exist_ok=True)
remote=RemoteArchive();started=time.monotonic()
GROUP=4*BLOCK  # one fresh public redirect, at most 16 MiB; retain 4 MiB caches
expected=json.loads((SOURCE/'guid.json').read_text())['data']['attributes']['extra']['hashes']
done=0


def checkpoint(state,**extra):
    payload=dict(state=state,archiveBytes=remote.size,completedBlockBytes=done,
                 newTransferredBytes=remote.transferred,elapsedSeconds=round(time.monotonic()-started,1),
                 publicSource=remote.source,**extra)
    tmp=OUT/'progress.tmp';tmp.write_text(json.dumps(payload,indent=2));tmp.replace(OUT/'progress.json')


def fetch(offset):
    offsets=list(range(offset,min(offset+GROUP,remote.size),BLOCK))
    if all((CACHE/f'bytes-{o}.bin').exists() and (CACHE/f'bytes-{o}.sha256').exists() for o in offsets):
        return sum(len(remote.block(o)) for o in offsets)
    size=min(GROUP,remote.size-offset)
    for attempt in range(3):
        if remote.stop.is_set():raise RuntimeError('Acquisition stopped')
        try:
            req=urllib.request.Request(remote.source,headers={'Range':f'bytes={offset}-{offset+size-1}'})
            with urllib.request.urlopen(req,timeout=45) as r:
                assert r.status==206 and r.headers.get('Content-Range')==f'bytes {offset}-{offset+size-1}/{remote.size}'
                assert r.headers.get('ETag')==remote.etag
                b=r.read(size+1)
            assert len(b)==size
            for o in offsets:
                part=b[o-offset:o-offset+min(BLOCK,remote.size-o)]
                path=CACHE/f'bytes-{o}.bin';tmp=path.with_suffix('.part')
                tmp.write_bytes(part);tmp.replace(path)
                path.with_suffix('.sha256').write_text(hashlib.sha256(part).hexdigest())
            with remote.lock:remote.transferred+=size
            return size
        except (urllib.error.URLError,TimeoutError,ConnectionError,IncompleteRead) as e:
            code=getattr(e,'code',None)
            if code in [401,403] or (code is not None and code not in [429,500,502,503,504]) or attempt==2:
                remote.stop.set()
                raise RuntimeError(f'Public download failed: {type(e).__name__}, HTTP {code}; stopped') from None
            time.sleep(2*(attempt+1))


try:
    with ThreadPoolExecutor(max_workers=4) as pool:
        pending=[pool.submit(fetch,o) for o in range(0,remote.size,GROUP)]
        for k,future in enumerate(as_completed(pending),1):
            try:done+=future.result()
            except Exception:
                remote.stop.set()
                for f in pending:f.cancel()
                raise
            if k%4==0 or done==remote.size:
                checkpoint('downloading')
                print('BLOCK_BYTES',done,'/',remote.size,'NEW',remote.transferred,
                      'SECONDS',round(time.monotonic()-started),flush=True)
    checkpoint('hashing')
    offline=RemoteArchive(offline=True);md5=hashlib.md5();sha=hashlib.sha256();total=0
    for o in range(0,offline.size,BLOCK):
        b=offline.block(o);md5.update(b);sha.update(b);total+=len(b)
    actual=dict(md5=md5.hexdigest(),sha256=sha.hexdigest())
    assert total==remote.size and actual==expected,'Whole archive integrity failure'
    validation=dict(passed=True,archiveBytes=total,actual=actual,expected=expected,
                    publicSource=remote.source,method='Stream exact ordered verified cache blocks; no second ZIP copy.')
    (OUT/'whole-archive-validation.json').write_text(json.dumps(validation,indent=2))
    checkpoint('extracting',wholeArchiveHashVerified=True)
    manifest,_=acquire((497,3498),offline=True)
    assert len(manifest['files'])==3002
    assert [r['section'] for r in manifest['files']]==list(range(497,3499))
    manifest['fullArchiveHashVerified']=True;manifest['wholeArchiveHashes']=actual
    manifest['wholeArchiveValidation']='../../output/specimen007-complete/whole-archive-validation.json'
    tmp=SOURCE/'manifest.tmp';tmp.write_text(json.dumps(manifest,indent=2),encoding='utf8');tmp.replace(SOURCE/'manifest.json')
    checkpoint('complete',sourcePNGCount=3002,wholeArchiveHashVerified=True)
    print('COMPLETE: 3002 source PNGs, whole archive MD5/SHA256 matched',flush=True)
except Exception as e:
    checkpoint('failed',errorType=type(e).__name__,error=str(e)[:200])
    raise
