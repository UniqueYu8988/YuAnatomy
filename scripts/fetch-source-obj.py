"""Fetch only this edition's OBJ entries from the official ZIP using HTTP ranges.
Each decompressed entry is checked against the ZIP's CRC32 and byte length.
"""
import io, json, zipfile, urllib.request, zlib, struct, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
URL='https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip'
root=Path(__file__).resolve().parents[1]
out=root/'work/source-obj/obj'
out.mkdir(parents=True,exist_ok=True)
size=int(urllib.request.urlopen(urllib.request.Request(URL,method='HEAD'),timeout=30).headers['Content-Length'])
def fetch(start,end):
    for attempt in range(4):
        try:
            req=urllib.request.Request(URL,headers={'Range':f'bytes={start}-{end-1}','Accept-Encoding':'identity'})
            with urllib.request.urlopen(req,timeout=45) as r:
                assert r.status==206 and r.headers['Content-Range'].startswith(f'bytes {start}-')
                data=r.read()
                assert len(data)==end-start
                return data
        except Exception:
            if attempt==3: raise
            time.sleep(attempt+1)
class RemoteZip(io.RawIOBase):
    def __init__(self): self.pos=0
    def seekable(self): return True
    def tell(self): return self.pos
    def seek(self,offset,whence=0):
        self.pos=offset if whence==0 else self.pos+offset if whence==1 else size+offset
        return self.pos
    def read(self,n=-1):
        end=size if n<0 else min(size,self.pos+n)
        if end<=self.pos:return b''
        data=fetch(self.pos,end);self.pos=end;return data
with zipfile.ZipFile(RemoteZip()) as z: entries={Path(i.filename).stem:i for i in z.infolist() if i.filename.endswith('.obj')}
atlas=json.loads((root/'public/head-neck/atlas.json').read_text(encoding='utf-8'))
def download(p):
    i=entries[p['id']];dest=out/(p['id']+'.obj')
    if dest.exists():
        d=dest.read_bytes()
        if len(d)==i.file_size and zlib.crc32(d)==i.CRC:return p['id']
    chunk=fetch(i.header_offset,min(size,i.header_offset+i.compress_size+4096))
    assert chunk[:4]==b'PK\x03\x04'
    fn,extra=struct.unpack_from('<HH',chunk,26)
    offset=30+fn+extra
    compressed=chunk[offset:offset+i.compress_size]
    assert len(compressed)==i.compress_size
    data=zlib.decompress(compressed,-15) if i.compress_type==8 else compressed
    assert len(data)==i.file_size and zlib.crc32(data)==i.CRC,p['id']
    dest.write_bytes(data)
    return p['id']
with ThreadPoolExecutor(max_workers=12) as pool:
    futures=[pool.submit(download,p) for p in atlas['parts']]
    for n,f in enumerate(as_completed(futures),1):
        f.result()
        if n%50==0 or n==len(futures):print(f'Verified {n}/{len(futures)} original OBJ files',flush=True)
(out.parent/'source.json').write_text(json.dumps({'url':URL,'archiveBytes':size,'files':len(atlas['parts']),'verification':'ZIP CRC32 and uncompressed byte length'},indent=2),encoding='utf-8')
