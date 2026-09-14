"""Fetch a contiguous ZIP byte interval and verify individual reconstruction PNGs."""
import io,json,sys,time,urllib.request,urllib.error,zipfile,zlib,struct,hashlib,argparse,threading
from concurrent.futures import ThreadPoolExecutor,as_completed,CancelledError
from pathlib import Path
ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--first',type=int,default=1681);parser.add_argument('--last',type=int,default=2004);parser.add_argument('--workers',type=int,default=3);args=parser.parse_args()
assert 389<=args.first<=args.last<=2973 and 1<=args.workers<=6
folder='cohort-branch' if (args.first,args.last)==(1681,2004) else f'cohort-{args.first}-{args.last}'
SOURCE=ROOT/'source'/folder;SOURCE.mkdir(parents=True,exist_ok=True)
CACHE=ROOT/'cache'/folder;CACHE.mkdir(parents=True,exist_ok=True)
class Remote(io.RawIOBase):
    def __init__(self):self.pos=0;self.refresh()
    def refresh(self):
        for attempt in range(3):
            try:
                with urllib.request.urlopen(urllib.request.Request('https://osf.io/fqm4x/download',method='HEAD'),timeout=30) as r:
                    size=int(r.headers['Content-Length']);etag=r.headers.get('ETag')
                    if hasattr(self,'etag'):assert etag==self.etag and size==self.size,'Archive changed during download'
                    self.url=r.url;self.size=size;self.etag=etag
                self.updated=time.monotonic();return
            except (TimeoutError,urllib.error.URLError) as error:
                if isinstance(error,urllib.error.HTTPError) and error.code not in [400,502,503,504]:raise
                if attempt==2:raise
    def seek(self,n,whence=0):
        self.pos=n if whence==0 else self.pos+n if whence==1 else self.size+n
        assert self.pos>=0
        return self.pos
    def tell(self):return self.pos
    def seekable(self):return True
    def readable(self):return True
    def read(self,n=-1):
        n=min(n if n>=0 else self.size-self.pos,self.size-self.pos)
        if n<=0:return b''
        assert n<=16*1024*1024
        start=self.pos;end=start+n-1
        for attempt in range(3):
            if time.monotonic()-self.updated>35:self.refresh()
            try:
                with urllib.request.urlopen(urllib.request.Request(self.url,headers={'Range':f'bytes={start}-{end}'}),timeout=45) as r:
                    assert r.status==206 and r.headers.get('Content-Range')==f'bytes {start}-{end}/{self.size}'
                    b=r.read(n+1)
                assert len(b)==n
                self.pos+=n;return b
            except (TimeoutError,urllib.error.URLError) as e:
                if attempt==2 or isinstance(e,urllib.error.HTTPError) and e.code not in [400,502,503,504]:raise
                self.refresh()
r=Remote()
with zipfile.ZipFile(r) as archive:
    allentries=archive.infolist()
    entries=[i for i in allentries if '/rec/Tooth045_rec' in i.filename and i.filename.endswith('.png') and args.first<=int(Path(i.filename).stem[-8:])<=args.last]
    entries.sort(key=lambda i:i.filename)
    assert len(entries)==args.last-args.first+1
    start=min(i.header_offset for i in entries)
    last=max(entries,key=lambda i:i.header_offset)
    end=min(i.header_offset for i in allentries if i.header_offset>last.header_offset)
    spec={'source':'https://osf.io/fqm4x/download','etag':r.etag,'archiveSize':r.size,'start':start,'endExclusive':end,'firstSection':args.first,'lastSection':args.last,'count':len(entries)}
    sp=CACHE/'interval.json'
    if sp.exists():assert json.loads(sp.read_text())==spec,'Cached interval belongs to different archive'
    else:sp.write_text(json.dumps(spec,indent=2))
    print('INTERVAL',json.dumps(spec),flush=True)
    parts=[];local=threading.local();stop_requests=threading.Event()
    def fetch_part(offset):
        if stop_requests.is_set():raise CancelledError()
        n=min(16*1024*1024,end-offset);p=CACHE/f'bytes-{offset}.bin'
        if not p.exists() or p.stat().st_size!=n:
            if not hasattr(local,'remote'):local.remote=Remote()
            worker=local.remote;assert worker.etag==r.etag and worker.size==r.size
            worker.seek(offset);b=worker.read(n);temporary=p.with_suffix('.part');temporary.write_bytes(b);temporary.replace(p)
        return p,n
    done=0;failures=[]
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures=[pool.submit(fetch_part,o) for o in range(start,end,16*1024*1024)]
        for future in as_completed(futures):
            try:
                p,n=future.result();parts.append(p);done+=n;print('BYTES',done,'/',end-start,flush=True)
            except CancelledError:continue
            except Exception as error:
                # Keep collecting independent completed chunks; do not hide progress while
                # the executor drains after an early failure. Never print signed URLs.
                failures.append(type(error).__name__)
                print('CHUNK_FAILED',type(error).__name__,getattr(error,'code',''),flush=True)
                if getattr(error,'code',None) in [401,403]:
                    stop_requests.set()
                    for pending in futures:pending.cancel()
                    print('ACCESS_DENIED: queued requests cancelled; retain cache without retrying authorization failures',flush=True)
    if failures:(CACHE/'last-failures.json').write_text(json.dumps({'failureTypes':failures,'accessDenied':stop_requests.is_set(),'cachedBytesCompletedThisRun':done},indent=2))
    assert not failures,f'{len(failures)} chunks failed ({set(failures)}); rerun to reuse verified entries and cached ranges'
    def read_local(offset,n):
        result=[]
        while n:
            block=start+((offset-start)//(16*1024*1024))*(16*1024*1024)
            p=CACHE/f'bytes-{block}.bin';position=offset-block;take=min(n,p.stat().st_size-position)
            assert take>0
            with p.open('rb') as f:f.seek(position);result.append(f.read(take))
            offset+=take;n-=take
        return b''.join(result)
    records=[]
    for i in entries:
        offset=i.header_offset
        header=struct.unpack('<4s5H3I2H',read_local(offset,30));assert header[0]==b'PK\x03\x04'
        payload=offset+30+header[-2]+header[-1];compressed=read_local(payload,i.compress_size)
        b=zlib.decompress(compressed,-15) if i.compress_type==8 else compressed if i.compress_type==0 else None
        assert b is not None and len(b)==i.file_size and zlib.crc32(b)==i.CRC
        target=SOURCE/Path(i.filename).name;target.write_bytes(b)
        records.append({'section':int(target.stem[-8:]),'file':target.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'crc32':i.CRC})
    spec['files']=records;spec['wholeArchiveHashVerified']=False
    (SOURCE/'manifest.json').write_text(json.dumps(spec,indent=2))
print(f'PASS: {len(entries)} consecutive PNG entries, sizes and CRCs verified',flush=True)
