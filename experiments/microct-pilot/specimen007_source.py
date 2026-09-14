"""Verified public-range acquisition for a second mandibular-canine specimen.

Only archive entries selected explicitly are read; third-party code is never run.
Use --screen first; --sections FIRST:LAST acquires a contiguous source interval.
"""
import argparse
import hashlib
import io
import json
import re
import sys
import threading
import time
import urllib.error
import urllib.request
import zipfile
import zlib
from http.client import IncompleteRead
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SOURCE = ROOT/'source/specimen007'; SOURCE.mkdir(parents=True, exist_ok=True)
CACHE = ROOT/'cache/specimen007'; CACHE.mkdir(parents=True, exist_ok=True)
OUT = ROOT/'output/specimen007-screening'; OUT.mkdir(parents=True, exist_ok=True)
BLOCK = 4*1024*1024


class RemoteArchive(io.RawIOBase):
    def __init__(self, offline=False):
        meta=json.loads((SOURCE/'guid.json').read_text())['data']
        self.source=meta['links']['download']; self.size=int(meta['attributes']['size'])
        self.etag='"'+meta['attributes']['extra']['hashes']['md5']+'"'
        self.pos=0; self.transferred=0; self.stop=threading.Event(); self.lock=threading.Lock(); self.offline=offline

    def block(self, start):
        if self.stop.is_set():raise RuntimeError('Acquisition stopped')
        size=min(BLOCK,self.size-start); path=CACHE/f'bytes-{start}.bin'
        checksum=path.with_suffix('.sha256')
        if path.exists() and checksum.exists():
            b=path.read_bytes()
            assert len(b)==size and hashlib.sha256(b).hexdigest()==checksum.read_text().strip(), 'Cache integrity failure'
            return b
        if self.offline:raise RuntimeError(f'Missing verified offline block: {start}')
        for attempt in range(3):
            if self.stop.is_set():raise RuntimeError('Acquisition stopped')
            try:
                req=urllib.request.Request(self.source,headers={'Range':f'bytes={start}-{start+size-1}'})
                with urllib.request.urlopen(req,timeout=40) as r:
                    assert r.status==206
                    assert r.headers.get('Content-Range')==f'bytes {start}-{start+size-1}/{self.size}'
                    assert r.headers.get('ETag')==self.etag, 'Archive version changed'
                    b=r.read(size+1)
                assert len(b)==size
                tmp=path.with_suffix('.part');tmp.write_bytes(b);tmp.replace(path)
                checksum.write_text(hashlib.sha256(b).hexdigest())
                with self.lock:self.transferred+=size
                return b
            except (urllib.error.URLError,TimeoutError,ConnectionError,IncompleteRead) as e:
                code=getattr(e,'code',None)
                if code in [401,403] or (code is not None and code not in [429,500,502,503,504]) or attempt==2:
                    self.stop.set()
                    raise RuntimeError(f'Public download failed: {type(e).__name__}, HTTP {code}; stopped') from None
                time.sleep(2*(attempt+1))

    def seekable(self):return True
    def readable(self):return True
    def tell(self):return self.pos
    def seek(self, offset, whence=0):
        self.pos=offset if whence==0 else self.pos+offset if whence==1 else self.size+offset
        if not 0<=self.pos<=self.size:raise ValueError('Invalid seek')
        return self.pos
    def read(self,n=-1):
        n=self.size-self.pos if n<0 else min(n,self.size-self.pos)
        if n==0:return b''
        if not 0<n<=32*1024*1024:raise ValueError('Acquisition read limit')
        end=self.pos+n; pieces=[]
        while self.pos<end:
            start=self.pos//BLOCK*BLOCK;b=self.block(start)
            take=min(end-self.pos,len(b)-(self.pos-start))
            pieces.append(b[self.pos-start:self.pos-start+take]);self.pos+=take
        return b''.join(pieces)


def acquire(sections=None, offline=False):
    remote=RemoteArchive(offline=offline)
    manifest_path=SOURCE/'manifest.json'
    manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {'files':[]}
    records={i['section']:i for i in manifest['files']}
    with zipfile.ZipFile(remote) as archive:
        entries=archive.infolist()
        index=[dict(name=i.filename,bytes=i.file_size,compressedBytes=i.compress_size,crc32=i.CRC,
                    localHeaderOffset=i.header_offset) for i in entries]
        (SOURCE/'archive-index.json').write_text(json.dumps(index,indent=2),encoding='utf-8')
        images={int(re.search(r'(\d{8})\.png$',i.filename,re.I).group(1)):i for i in entries
                if re.search(r'Tooth007_rec\d{8}\.png$',i.filename,re.I)}
        assert images, 'No matching reconstruction series'
        ids=sorted(images)
        assert ids==list(range(ids[0],ids[-1]+1)), 'Source index has gaps'
        if sections is None:
            selected=[ids[int(k)] for k in np.linspace(0,len(ids)-1,17).astype(int)]
        else:
            first,last=sections;selected=list(range(first,last+1));assert set(selected)<=images.keys()
        for i in entries:
            if i.filename.lower().endswith('.log') and i.file_size<100000:
                target=SOURCE/Path(i.filename).name
                if not target.exists() or zlib.crc32(target.read_bytes())!=i.CRC:
                    target.write_bytes(archive.read(i))
        if sections is not None:
            # Prefetch only blocks covering requested entries; at most four requests.
            starts=sorted(i.header_offset for i in entries)
            ends=dict(zip(starts,starts[1:]+[archive.start_dir]))
            blocks=set()
            for z in selected:
                i=images[z]
                if z in records and (SOURCE/records[z]['file']).exists():continue
                blocks.update(range(i.header_offset//BLOCK*BLOCK,ends[i.header_offset],BLOCK))
            with ThreadPoolExecutor(max_workers=4) as pool:
                def prefetch(b):return len(remote.block(b))
                pending=[pool.submit(prefetch,b) for b in sorted(blocks)]
                try:
                    for k,future in enumerate(as_completed(pending),1):
                        future.result()
                        if k%8==0 or k==len(pending):print('PREFETCH',k,'/',len(pending),'NEW_BYTES',remote.transferred,flush=True)
                except Exception:
                    remote.stop.set()
                    for future in pending:future.cancel()
                    raise
        for k,z in enumerate(selected):
            i=images[z];target=SOURCE/Path(i.filename).name
            if target.exists():
                b=target.read_bytes();assert len(b)==i.file_size and zlib.crc32(b)==i.CRC
            else:
                b=archive.read(i);assert zlib.crc32(b)==i.CRC
                tmp=target.with_suffix('.part');tmp.write_bytes(b);tmp.replace(target)
            a=np.array(Image.open(io.BytesIO(b)))
            assert a.ndim==2
            records[z]=dict(section=z,file=target.name,archiveName=i.filename,bytes=len(b),crc32=i.CRC,
                            sha256=hashlib.sha256(b).hexdigest(),shape=list(a.shape),dtype=str(a.dtype))
            manifest=dict(specimen='007',publicSource=remote.source,archiveBytes=remote.size,archiveETag=remote.etag,
                          sourceImageCount=len(ids),sourceRange=[ids[0],ids[-1]],files=[records[x] for x in sorted(records)],
                          fullArchiveHashVerified=False,licenseStatus='Unconfirmed: local research only')
            tmp=manifest_path.with_suffix('.tmp');tmp.write_text(json.dumps(manifest,indent=2),encoding='utf-8');tmp.replace(manifest_path)
            if sections is None or k%25==0:print('SOURCE',z,'ACQUIRED',len(records),'NEW_BYTES',remote.transferred,flush=True)
    print('AVAILABLE',len(records),'/',len(ids),'NEW_BYTES',remote.transferred,flush=True)
    return manifest,selected


def contact(manifest,selected):
    font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
    w,h=420,450;sheet=Image.new('RGB',(w*4,h*((len(selected)+3)//4)),'#f1f4f3');draw=ImageDraw.Draw(sheet)
    records={i['section']:i for i in manifest['files']}
    stats=[]
    for k,z in enumerate(selected):
        r=records[z];a=np.asarray(Image.open(SOURCE/r['file']))
        # Fixed display window, not a per-image normalization or data change.
        gray=(np.clip(a.astype(float)/100,0,1)*255).astype(np.uint8)
        im=Image.fromarray(gray).convert('RGB');im.thumbnail((w-12,h-40))
        x=k%4*w;y=k//4*h;sheet.paste(im,(x+(w-im.width)//2,y+30))
        draw.text((x+10,y+7),f'Specimen007 / section {z}',font=font,fill='#193e37')
        stats.append(dict(section=z,minimum=int(a.min()),maximum=int(a.max()),percentiles=np.percentile(a,[1,50,99]).tolist()))
    sheet.save(OUT/'sparse-contact.png')
    (OUT/'sparse-report.json').write_text(json.dumps(dict(selectedSections=selected,stats=stats,
         displayWindow=[0,100],warning='Sparse images cannot establish continuity or complete pulp anatomy.'),indent=2))


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--sections',help='inclusive FIRST:LAST');args=p.parse_args()
    bounds=tuple(map(int,args.sections.split(':'))) if args.sections else None
    manifest,selected=acquire(bounds)
    if bounds is None:contact(manifest,selected)
