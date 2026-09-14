"""Same-specimen full-range reference and native-grid lumen candidates.

Disk-backed arrays limit memory use. Raw PNGs and earlier partial outputs stay
unchanged. Acquisition completeness is not completeness of anatomical segmentation.
"""
import argparse,csv,gzip,hashlib,json,sys,gc
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw,ImageFont
from skimage.measure import marching_cubes
import trimesh

SOURCE=ROOT/'source/specimen007';CACHE=ROOT/'cache/specimen007-full';OUT=ROOT/'output/specimen007-full'
CACHE.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
ORIGIN=np.array([497,550,600]);SHAPE=(3002,500,400);PITCH=.00999999
OUTER_ORIGIN=np.array([497,250,300]);OVERVIEW_SHAPE=(1501,525,450)
METHODS=[(m,t) for m in ['raw','gaussian06'] for t in [25,30,35]]
SEED=np.array([1434,791,789])-ORIGIN
PARAMS=dict(version=1,sourceRange=[497,3498],canalCropYX=[550,1050,600,1000],
            referenceCropYX=[250,1300,300,1200],thresholds=[25,30,35],
            gaussianSigma=.6,minimumEnclosedArea=4,referenceTissueMinimumArea=500)


def array(name,shape=SHAPE,dtype=np.uint8,reset=False):
    p=CACHE/name
    if p.exists() and not reset:
        a=np.load(p,mmap_mode='r+');assert a.shape==shape and a.dtype==dtype
        return a
    return np.lib.format.open_memmap(p,mode='w+',shape=shape,dtype=dtype)


def write_json(path,value):
    tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(value,indent=2),encoding='utf8');tmp.replace(path)


def enclosed(a,t):
    labels,_=ndi.label(a<t);sizes=np.bincount(labels.ravel());sizes[0]=0
    border=np.unique(np.r_[labels[0],labels[-1],labels[:,0],labels[:,-1]])
    ids=np.flatnonzero(sizes>=4);ids=ids[~np.isin(ids,border)]
    return np.isin(labels,ids)


def prepare(records,available=False):
    raw=array('raw-canal.npy');overview=array('raw-overview.npy',OVERVIEW_SHAPE)
    env=array('envelope-overview.npy',OVERVIEW_SHAPE)
    masks={f'{m}_{t}':array(f'enclosed-{m}_{t}.npy') for m,t in METHODS}
    cp=CACHE/'prepare-checkpoint.json'
    old=json.loads(cp.read_text()) if cp.exists() else {'parameters':PARAMS,'planes':{}}
    assert old['parameters']==PARAMS,'Preparation parameters changed; use a new cache directory'
    finished=old['planes']
    for z in range(497,3499):
        if z not in records:
            assert available;continue
        r=records[z]
        if finished.get(str(z),{}).get('sourceSha256')==r['sha256']:continue
        b=(SOURCE/r['file']).read_bytes();assert hashlib.sha256(b).hexdigest()==r['sha256']
        full=np.array(Image.open(SOURCE/r['file']));assert full.shape==(1632,1632) and full.dtype==np.uint8
        k=z-497;a=full[550:1050,600:1000];raw[k]=a
        soft=ndi.gaussian_filter(a.astype(np.float32),.6)
        for m,t in METHODS:masks[f'{m}_{t}'][k]=enclosed(a if m=='raw' else soft,t)
        stats={'sourceSha256':r['sha256']}
        if k%2==0:
            wide=full[250:1300,300:1200];labels,_=ndi.label(ndi.gaussian_filter(wide.astype(np.float32),.6)>=30)
            counts=np.bincount(labels.ravel());counts[0]=0
            body=np.isin(labels,np.flatnonzero(counts>=500))
            assert not body[[0,-1],:].any() and not body[:,[0,-1]].any(),f'Reference crop clips retained tissue at {z}'
            overview[k//2]=wide[::2,::2];env[k//2]=ndi.binary_fill_holes(body)[::2,::2]
            stats['referenceTissuePixels']=int(body.sum())
        finished[str(z)]=stats
        if k%50==0:
            for v in [raw,overview,env,*masks.values()]:v.flush()
            write_json(cp,old);print('PREPARE',z,'/',3498,flush=True)
    for v in [raw,overview,env,*masks.values()]:v.flush()
    write_json(cp,old)
    return raw,overview,env,finished


def connected_variant(name,signature,raw):
    meta=OUT/f'connectivity-{name}.json';path=CACHE/f'candidate-{name}.npy'
    if meta.exists() and path.exists():
        info=json.loads(meta.read_text())
        if info.get('signature')==signature:return array(path.name),info
    masks=np.load(CACHE/f'enclosed-{name}.npy',mmap_mode='r')
    labels=array('labels-working.npy',dtype=np.uint32,reset=True)
    print('LABEL',name,flush=True)
    components=int(ndi.label(masks,output=labels));labels.flush()
    sz,sy,sx=SEED;window=labels[sz,sy-12:sy+13,sx-12:sx+13];yy,xx=np.where(window>0)
    assert len(yy),'Missing seed candidate';d=(yy-12)**2+(xx-12)**2;i=d.argmin();assert d[i]<=144
    root=int(window[yy[i],xx[i]]);candidate=array(path.name,reset=True)
    areas=[];lo=np.array([SHAPE[1],SHAPE[2]]);hi=np.zeros(2,dtype=int)
    centers={}
    for k in range(SHAPE[0]):
        mask=labels[k]==root;candidate[k]=mask;count=int(mask.sum());areas.append(count)
        if count:
            points=np.argwhere(mask);lo=np.minimum(lo,points.min(0));hi=np.maximum(hi,points.max(0))
            centers[str(k+497)]=(points.mean(0)+ORIGIN[1:]).tolist()
    candidate.flush();del labels,masks;gc.collect()
    zs=np.flatnonzero(areas);assert len(zs) and np.array_equal(zs,np.arange(zs[0],zs[-1]+1))
    assert np.all(lo>0) and np.all(hi<np.array(SHAPE[1:])-1)
    t=int(name.rsplit('_',1)[1]);method=name.rsplit('_',1)[0]
    endpoint=np.array(centers[str(int(zs[-1])+497)])-ORIGIN[1:]
    cy,cx=np.round(endpoint).astype(int);probes=[]
    for k in range(int(zs[-1])+1,min(SHAPE[0],int(zs[-1])+11)):
        a=raw[k].astype(np.float32)
        if method!='raw':a=ndi.gaussian_filter(a,.6)
        lab,_=ndi.label(a<t);borders=np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]])
        label=int(lab[cy,cx])
        probes.append(dict(section=k+497,anchorSourceYX=(np.array([cy,cx])+ORIGIN[1:]).tolist(),
                           grayAtAnchor=float(a[cy,cx]),lowGrayReachesROIBorder=bool(label>0 and label in borders)))
    info=dict(signature=signature,method=method,threshold=t,allEnclosedComponentCount=components,
              firstSection=int(zs[0])+497,lastSection=int(zs[-1])+497,continuousPlaneCount=len(zs),
              voxelCount=sum(areas),maxAreaPixels=max(areas),areas=areas,centers=centers,
              localBoundsZYX=[[int(zs[0]),*lo.tolist()],[int(zs[-1]),*hi.tolist()]],
              overlapAt1434To1435=int((candidate[1434-497]&candidate[1435-497]).sum()),
              afterEndAnchorProbes=probes,
              limitation='Border contact is an image/ROI event, not a confirmed anatomical foramen.')
    write_json(meta,info)
    print('CONNECTED',name,info['firstSection'],info['lastSection'],info['voxelCount'],flush=True)
    return candidate,info


def nrrd(a,name,origin,step=1):
    path=OUT/name;p=PITCH*step;o=np.array(origin)[::-1]*PITCH
    header=(f'NRRD0005\n# Source axes, not patient orientation\ntype: unsigned char\ndimension: 3\nspace dimension: 3\n'
            f'sizes: {a.shape[2]} {a.shape[1]} {a.shape[0]}\nspace directions: ({p},0,0) (0,{p},0) (0,0,{p})\n'
            f'space origin: ({o[0]},{o[1]},{o[2]})\nspace units: "mm" "mm" "mm"\nencoding: gzip\n\n')
    digest=hashlib.sha256()
    with path.open('wb') as f:
        f.write(header.encode())
        with gzip.GzipFile(fileobj=f,mode='wb',compresslevel=1,mtime=0) as g:
            for k in range(0,len(a),8):
                b=np.asarray(a[k:k+8],dtype=np.uint8).tobytes();g.write(b);digest.update(b)
    check=hashlib.sha256();size=0
    with path.open('rb') as f:
        while f.readline()!=b'\n':pass
        with gzip.GzipFile(fileobj=f,mode='rb') as g:
            while b:=g.read(1024*1024):check.update(b);size+=len(b)
    assert check.hexdigest()==digest.hexdigest() and size==a.size
    return dict(file=name,decodedSha256=check.hexdigest(),decodedBytes=size,roundTripPassed=True,
                shapeZYX=list(a.shape),originSectionYX=np.array(origin).tolist(),samplingStep=step)


def surface(a,name,origin,step=1,method='lewiner'):
    v,f,_,_=marching_cubes(np.pad(a,1),.5,allow_degenerate=False,method=method)
    v=((v-1)*step+origin)[:,::-1]*PITCH
    mesh=trimesh.Trimesh(vertices=v,faces=f,process=False)
    if mesh.volume<0:mesh.invert()
    assert mesh.is_watertight and mesh.is_winding_consistent
    mesh.export(OUT/name)
    result=dict(file=name,triangles=len(mesh.faces),vertices=len(mesh.vertices),watertight=True,
                windingConsistent=True,samplingStep=step,marchingCubesMethod=method,
                bounds=mesh.bounds.tolist(),isoLevel=.5)
    del mesh,v,f;gc.collect();return result


def preview(raw,env,nominal,stable,possible,info):
    font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',19)
    sheet=Image.new('RGB',(1120,1250),'#f1f4f3');draw=ImageDraw.Draw(sheet)
    for c,axis in enumerate([1,2]):
        outer=env.any(axis=axis);ref=nominal[::2,::2,::2].any(axis=axis)
        agree=stable[::2,::2,::2].any(axis=axis);union=possible[::2,::2,::2].any(axis=axis)
        rgb=np.full((*outer.shape,3),241,np.uint8);rgb[outer]=[191,202,198]
        start=150 # native ROI begins 300 source pixels inside overview crop on both axes
        patch=rgb[:,start:start+ref.shape[1]];patch[union]=[222,151,68];patch[ref]=[29,150,123];patch[agree]=[18,104,85]
        im=Image.fromarray(rgb);im.thumbnail((520,1100));sheet.paste(im,(c*560+(560-im.width)//2,65))
        draw.text((c*560+22,18),'007 标本 · 源 '+('ZX' if axis==1 else 'ZY')+' 投影',font=font,fill='#193e37')
    draw.text((22,1178),'灰：牙体参考包络　绿：髓腔候选　橙：其他参数覆盖',font=font,fill='#193e37')
    draw.text((22,1210),'完整源范围；髓腔解剖完整性与末端开口仍待复核。',font=font,fill='#516963')
    sheet.save(OUT/'whole-specimen-projections.png')
    last=info['lastSection'];first=info['firstSection']
    selected=sorted(set([max(497,first-2),first,min(3498,first+20),1434,2500,last-2,last,min(3498,last+1)]))
    sheet=Image.new('RGB',(980,len(selected)*320),'#f1f4f3');draw=ImageDraw.Draw(sheet)
    for r,z in enumerate(selected):
        k=z-497;gray=(np.clip(raw[k].astype(float)/90,0,1)*255).astype(np.uint8)
        rgb=np.repeat(gray[...,None],3,axis=2);overlay=rgb.copy();overlay[nominal[k]>0]=[28,180,144]
        for c,a in enumerate([rgb,overlay]):
            im=Image.fromarray(a);im.thumbnail((450,285));sheet.paste(im,(c*490+(490-im.width)//2,r*320+28))
            draw.text((c*490+12,r*320+4),f'{z} · '+('原始灰度' if c==0 else '候选覆盖'),font=font,fill='#193e37')
    sheet.save(OUT/'crown-and-terminal-source.png')


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--prepare-existing',action='store_true');args=parser.parse_args()
    manifest=json.loads((SOURCE/'manifest.json').read_text());records={r['section']:r for r in manifest['files']}
    if not args.prepare_existing:
        assert manifest.get('fullArchiveHashVerified') and sorted(records)==list(range(497,3499))
    raw,overview,env,finished=prepare(records,args.prepare_existing)
    if args.prepare_existing:
        print('PREPARED',len(finished),'available planes; no complete result exported',flush=True);return
    assert len(finished)==3002
    signature=hashlib.sha256(json.dumps([PARAMS,[records[z]['sha256'] for z in sorted(records)]],sort_keys=True).encode()).hexdigest()
    candidates={};infos={}
    for m,t in METHODS:
        name=f'{m}_{t}';candidates[name],infos[name]=connected_variant(name,signature,raw)
    nominal=candidates['gaussian06_30'];stable=array('agreement.npy',reset=True);possible=array('union.npy',reset=True)
    agreement={n:{'intersection':0,'union':0} for n in candidates};outside=0
    for k in range(SHAPE[0]):
        variants=[v[k]>0 for v in candidates.values()]
        stable[k]=np.logical_and.reduce(variants);possible[k]=np.logical_or.reduce(variants)
        for name,a in candidates.items():
            agreement[name]['intersection']+=int((a[k]&nominal[k]).sum())
            agreement[name]['union']+=int((a[k]|nominal[k]).sum())
        if k%2==0:outside+=int(((nominal[k,::2,::2]>0)&~(env[k//2,150:400,150:350]>0)).sum())
    stable.flush();possible.flush()
    for name,r in agreement.items():
        r['diceToNominal']=2*r['intersection']/(infos[name]['voxelCount']+infos['gaussian06_30']['voxelCount'])
        r['jaccardToNominal']=r['intersection']/r['union']
    volumes=[nrrd(overview,'raw-overview-20um.nrrd',OUTER_ORIGIN,2),nrrd(env,'tooth-envelope-20um.nrrd',OUTER_ORIGIN,2),
             nrrd(raw,'raw-canal-region-10um.nrrd',ORIGIN),nrrd(nominal,'lumen-candidate-10um.nrrd',ORIGIN),
             nrrd(stable,'six-variant-agreement-10um.nrrd',ORIGIN),nrrd(possible,'six-variant-union-10um.nrrd',ORIGIN)]
    meshes=[surface(env[::2,::2,::2],'tooth-reference-40um.ply',OUTER_ORIGIN,4,'lorensen')]
    bounds=np.array(infos['gaussian06_30']['localBoundsZYX']);sl=tuple(slice(int(a),int(b)+1) for a,b in zip(bounds[0],bounds[1]))
    meshes.append(surface(np.array(nominal[sl]),'lumen-candidate-native.ply',ORIGIN+bounds[0]))
    preview(raw,env,nominal,stable,possible,infos['gaussian06_30'])
    summary=[{k:v for k,v in info.items() if k not in ['areas','centers','signature']} for info in infos.values()]
    report=dict(specimen='007',sourcePNGCount=3002,sourceRange=[497,3498],sourceAcquisitionComplete=True,
                fullArchiveHashVerified=True,pixelPitchMm=PITCH,parameters=PARAMS,signature=signature,
                candidateSummaries=summary,methodAgreement=agreement,volumes=volumes,meshes=meshes,
                candidateOutsideReferenceAt20umSamples=outside,
                limitations=['Full source acquisition does not prove a complete anatomical pulp chamber or canal system.',
                             'Canal labels retain native sampling; outer surface is every fourth source voxel, visualization only.',
                             'Enclosed-component rule omits background-connected openings; mesh end caps are algorithmic.',
                             'The native canal ROI is a bounded interior region; very distant accessory branches are not established.',
                             'Ring artifacts, bright speckles and parameter-sensitive boundaries remain; no clinical measurements.',
                             'Reference containment uses related segmentation, not independent anatomical validation.',
                             'Unknown data redistribution license; local research only; no replacement of application models.'])
    write_json(OUT/'report.json',report)
    print('FULL EXPORT COMPLETE',json.dumps(summary),flush=True)


if __name__=='__main__':main()
