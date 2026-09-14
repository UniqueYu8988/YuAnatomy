"""Read selected entries of an openly downloadable OSF ZIP via HTTP Range.
No notebook execution, no archive extraction, no full dataset download.
"""
import io,json,sys,urllib.request,urllib.error,zipfile,hashlib,time,zlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
from PIL import Image,ImageDraw
import numpy as np
OUT=ROOT/'output/cohort-screening';OUT.mkdir(parents=True,exist_ok=True)
SOURCE=ROOT/'source/cohort-screening';SOURCE.mkdir(parents=True,exist_ok=True)
class RemoteZip(io.RawIOBase):
    def __init__(self,url):
        self.pos=0;self.transferred=0;self.source=url
        self.refresh()
    def refresh(self):
        with urllib.request.urlopen(urllib.request.Request(self.source,method='HEAD'),timeout=30) as r:
            self.url=r.url;self.size=int(r.headers['Content-Length']);self.etag=r.headers.get('ETag')
        self.refreshed=time.monotonic()
    def seekable(self):return True
    def readable(self):return True
    def tell(self):return self.pos
    def seek(self,offset,whence=0):
        self.pos=offset if whence==0 else self.pos+offset if whence==1 else self.size+offset
        if self.pos<0:raise ValueError('negative seek')
        return self.pos
    def read(self,n=-1):
        n=self.size-self.pos if n<0 else min(n,self.size-self.pos)
        if n<=0:return b''
        if n>32*1024*1024:raise ValueError('Range read exceeds screening limit')
        start=self.pos;end=start+n-1
        for attempt in range(3):
            if time.monotonic()-self.refreshed>35:self.refresh()
            req=urllib.request.Request(self.url,headers={'Range':f'bytes={start}-{end}'})
            try:
                with urllib.request.urlopen(req,timeout=30) as r:
                    if r.status!=206 or not r.headers.get('Content-Range','').startswith(f'bytes {start}-{end}/'):raise ValueError('Server did not honor requested range')
                    b=r.read(n+1)
                break
            except (TimeoutError,urllib.error.HTTPError) as error:
                if attempt==2 or (isinstance(error,urllib.error.HTTPError) and error.code!=400):raise
                self.refresh()
        if len(b)!=n:raise ValueError('Short or excessive range response')
        self.pos+=n;self.transferred+=n;return b
remote=RemoteZip('https://osf.io/fqm4x/download')
def read_entry(z,i):
    target=SOURCE/Path(i.filename).name
    if target.exists():
        b=target.read_bytes()
        if len(b)==i.file_size and zlib.crc32(b)==i.CRC:return b
    b=z.read(i);target.write_bytes(b);return b
with zipfile.ZipFile(remote) as z:
    entries=z.infolist()
    (SOURCE/'45-zip-index.json').write_text(json.dumps([{'name':i.filename,'bytes':i.file_size,'compressedBytes':i.compress_size,'crc32':i.CRC} for i in entries],indent=2),encoding='utf-8')
    small=[i for i in entries if i.file_size<100000 and i.filename.lower().endswith(('.log','.txt','.json','.xml','.md','.ini'))]
    for i in small[:20]:
        b=read_entry(z,i)
        print('METADATA',i.filename,'CRC checked',flush=True)
    images=[i for i in entries if i.filename.lower().endswith(('.png','.tif','.tiff')) and '/rec/' in i.filename.lower()]
    if not images:images=[i for i in entries if i.filename.lower().endswith(('.png','.tif','.tiff'))]
    images.sort(key=lambda i:i.filename)
    print('ARCHIVE',len(entries),'IMAGE_COUNT',len(images),'FIRST',images[0].filename if images else None,flush=True)
    records=[];thumbs=[]
    for index in np.linspace(0,len(images)-1,min(9,len(images))).astype(int):
        i=images[index]
        if i.file_size>50*1024*1024:continue
        b=read_entry(z,i)
        im=Image.open(io.BytesIO(b));a=np.array(im)
        records.append({'archiveName':i.filename,'orderedIndex':int(index),'shape':list(a.shape),'dtype':str(a.dtype),'min':int(a.min()),'max':int(a.max()),'sha256':hashlib.sha256(b).hexdigest(),'crcCheckedByZipfile':True})
        if a.ndim==2:
            lo,hi=np.percentile(a,[1,99.8]);display=(np.clip((a-lo)/max(1,hi-lo),0,1)*255).astype('uint8');im=Image.fromarray(display)
        im=im.convert('RGB');im.thumbnail((380,360));thumbs.append((im,Path(i.filename).name))
        print('SAMPLE',records[-1],flush=True)
    report={'source':'https://osf.io/fqm4x/download','archiveBytes':remote.size,'archiveETag':remote.etag,'transferredBytes':remote.transferred,'imageCount':len(images),'samples':records,'warning':'Partial archive only: per-entry CRC checked, full archive checksum not verified. Review source license before distribution. Display windowing is for visualization only.'}
    (OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    sheet=Image.new('RGB',(1200,3*400),'#18232b');draw=ImageDraw.Draw(sheet)
    for k,(im,name) in enumerate(thumbs):
        x=k%3*400;y=k//3*400;sheet.paste(im,(x+(400-im.width)//2,y+30));draw.text((x+8,y+8),name,fill='white')
    sheet.save(OUT/'contact-sheet.png')
print('DONE',remote.transferred,'bytes downloaded',flush=True)
