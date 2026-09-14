"""Resume public OSF ranges with fresh redirects and small requests; never retry 401/403."""
import json,time,threading,urllib.request,urllib.error,argparse
from pathlib import Path
from http.client import IncompleteRead
from concurrent.futures import ThreadPoolExecutor,as_completed,CancelledError
ROOT=Path(__file__).resolve().parent;CACHE=ROOT/'cache/cohort-389-1680'
parser=argparse.ArgumentParser();parser.add_argument('--workers',type=int,choices=[1,2,3,4],default=4);args=parser.parse_args()
spec=json.loads((CACHE/'interval.json').read_text());STEP=16*1024*1024;SUB=4*1024*1024
ENTRY='https://osf.io/download/fqm4x/'
stop=threading.Event();events=[];lock=threading.Lock()
def event(data):
    with lock:events.append(data)
def fetch(offset,size):
    path=CACHE/f'recovery-sub-{offset}.bin'
    if path.exists() and path.stat().st_size==size:return path
    for attempt in range(3):
        if stop.is_set():raise CancelledError()
        try:
            # The public service obtains the redirect for each request. No stored signed URL.
            req=urllib.request.Request(ENTRY,headers={'Range':f'bytes={offset}-{offset+size-1}'})
            with urllib.request.urlopen(req,timeout=45) as r:
                assert r.status==206 and r.headers.get('Content-Range')==f'bytes {offset}-{offset+size-1}/{spec["archiveSize"]}'
                assert r.headers.get('ETag')==spec['etag'],'Source version differs from cached archive'
                b=r.read(size+1)
            assert len(b)==size
            tmp=path.with_suffix('.part');tmp.write_bytes(b);tmp.replace(path)
            event({'offset':offset,'bytes':size,'status':206});return path
        except (urllib.error.URLError,TimeoutError,ConnectionError,IncompleteRead) as error:
            code=getattr(error,'code',None);event({'offset':offset,'errorType':type(error).__name__,'status':code})
            if code in [401,403]:stop.set();raise
            if code is not None and code not in [429,500,502,503,504]:raise
            if attempt==2:raise
            time.sleep(2*(attempt+1))
    raise RuntimeError('Unreachable')
def block(offset):
    if stop.is_set():raise CancelledError()
    n=min(STEP,spec['endExclusive']-offset);p=CACHE/f'bytes-{offset}.bin'
    if p.exists() and p.stat().st_size==n:return n,True
    parts=[fetch(o,min(SUB,offset+n-o)) for o in range(offset,offset+n,SUB)]
    tmp=p.with_suffix('.part')
    with tmp.open('wb') as f:
        for part in parts:f.write(part.read_bytes())
    assert tmp.stat().st_size==n;tmp.replace(p)
    return n,False
done=0;new=0;failures=[]
def checkpoint(state='running'):
    out=ROOT/'output/download-recovery';out.mkdir(exist_ok=True)
    with lock:snapshot=list(events)
    payload={'state':state,'publicEntry':ENTRY,'workers':args.workers,'requestBytes':SUB,'completedIntervalBytes':done,'newIntervalBytes':new,'events':snapshot,'failures':failures}
    tmp=out/'recovery-progress.tmp';tmp.write_text(json.dumps(payload,indent=2));tmp.replace(out/'recovery-progress.json')
try:
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures=[pool.submit(block,o) for o in range(spec['start'],spec['endExclusive'],STEP)]
        for future in as_completed(futures):
            try:
                n,cached=future.result();done+=n
                if not cached:new+=n
                checkpoint()
                if not cached or done%(16*STEP)==0:print('VERIFIED_LENGTH_BYTES',done,'/',spec['endExclusive']-spec['start'],'NEW',new,flush=True)
            except CancelledError:pass
            except Exception as error:
                failures.append({'type':type(error).__name__,'status':getattr(error,'code',None)})
                print('FAILED',type(error).__name__,getattr(error,'code',''),flush=True)
                if stop.is_set():
                    for pending in futures:pending.cancel()
finally:
    out=ROOT/'output/download-recovery';out.mkdir(exist_ok=True)
    (out/'recovery-run.json').write_text(json.dumps({'publicEntry':ENTRY,'workers':args.workers,'requestBytes':SUB,
        'completedIntervalBytes':done,'newIntervalBytes':new,'events':events,'failures':failures,
        'authorizationFailureStoppedRequests':stop.is_set(),
        'note':'Range lengths and source ETag verified here; image CRC verification occurs in offline extraction.'},indent=2))
    checkpoint('partial' if failures else 'complete')
if failures:raise SystemExit(1)
print('ALL CACHED RANGES AVAILABLE; run extract_cached_crown.py for entry CRC verification',flush=True)
