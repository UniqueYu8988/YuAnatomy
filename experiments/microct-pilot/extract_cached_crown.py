"""Recover only complete, CRC-verified ZIP entries from existing cache; no network."""
import json,struct,zlib,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent;CACHE=ROOT/'cache/cohort-389-1680';OUT=ROOT/'source/cohort-389-1680';OUT.mkdir(exist_ok=True)
spec=json.loads((CACHE/'interval.json').read_text());start=spec['start'];blocksize=16*1024*1024
index={i['name']:i for i in json.loads((ROOT/'source/cohort-screening/45-zip-index.json').read_text())}
def read(offset,n):
    chunks=[]
    while n:
        base=start+((offset-start)//blocksize)*blocksize;p=CACHE/f'bytes-{base}.bin'
        if not p.exists():raise FileNotFoundError
        pos=offset-base;take=min(n,p.stat().st_size-pos)
        if take<=0:raise FileNotFoundError
        with p.open('rb') as f:f.seek(pos);b=f.read(take)
        if len(b)!=take:raise FileNotFoundError
        chunks.append(b);offset+=take;n-=take
    return b''.join(chunks)
records={}
for p in sorted(CACHE.glob('bytes-*.bin'),key=lambda p:int(p.stem.split('-')[1])):
    base=int(p.stem.split('-')[1]);data=p.read_bytes();prefix=b''
    if base>start:
        try:prefix=read(base-3,3)
        except FileNotFoundError:pass
    data=prefix+data;base-=len(prefix);position=0
    while True:
        i=data.find(b'PK\x03\x04',position)
        if i<0:break
        position=i+4;offset=base+i
        try:
            h=struct.unpack('<4s5H3I2H',read(offset,30))
            if h[-2]>300 or h[-1]>1000:continue
            name=read(offset+30,h[-2]).decode('utf-8')
            if name not in index or '/rec/Tooth045_rec' not in name:continue
            entry=index[name];z=int(Path(name).stem[-8:])
            if not 389<=z<=1680:continue
            assert not h[2]&8 and h[3]==8
            assert (h[6],h[7],h[8])==(entry['crc32'],entry['compressedBytes'],entry['bytes'])
            compressed=read(offset+30+h[-2]+h[-1],h[7]);b=zlib.decompress(compressed,-15)
            assert len(b)==h[8] and zlib.crc32(b)==h[6]
            target=OUT/Path(name).name;tmp=target.with_suffix('.part');tmp.write_bytes(b);tmp.replace(target)
            records[z]={'section':z,'file':target.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'crc32':h[6]}
        except (FileNotFoundError,UnicodeDecodeError):continue
reused=[]
for p in (ROOT/'source/cohort-screening').glob('Tooth045_rec*.png'):
    z=int(p.stem[-8:])
    if not 389<=z<=1680 or z in records:continue
    name='45/rec/'+p.name;entry=index[name];b=p.read_bytes()
    assert len(b)==entry['bytes'] and zlib.crc32(b)==entry['crc32']
    (OUT/p.name).write_bytes(b)
    records[z]={'section':z,'file':p.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'crc32':entry['crc32'],'reusedSparseSample':True}
    reused.append(z)
missing=sorted(set(range(389,1681))-records.keys())
result={**spec,'files':[records[z] for z in sorted(records)],'recoveredCount':len(records),'missingSections':missing,
        'complete':not missing,'wholeArchiveHashVerified':False,'networkUsed':False,'reusedSparseSections':reused}
(OUT/('manifest.json' if not missing else 'manifest.partial.json')).write_text(json.dumps(result,indent=2))
ranges=[]
for z in sorted(records):
    if ranges and ranges[-1][1]+1==z:ranges[-1][1]=z
    else:ranges.append([z,z])
print(json.dumps({'recovered':len(records),'missing':len(missing),'availableRanges':ranges,'reusedSparseSections':reused,'networkUsed':False},indent=2))
