"""Streaming export checks plus raw PNG coordinate checks for the paired study."""
import sys,json,gzip,hashlib,re,argparse
from pathlib import Path
ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--partial',action='store_true');args=parser.parse_args()
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from PIL import Image
import trimesh
OUT=ROOT/('output/paired-specimen-partial' if args.partial else 'output/paired-specimen');CACHE=ROOT/'cache/paired-specimen-v2'
report=json.loads((OUT/'report.json').read_text());pitch=report['sourcePixelPitchMm'];origin=np.array(report['originSectionYX'])
names={'raw-overview-20um.nrrd':'raw-overview.npy','tissue-overview-20um.nrrd':'tissue-overview.npy',
       'envelope-overview-20um.nrrd':'envelope-overview.npy','cavity-candidate-10um.nrrd':'candidate-native.npy'}
checks=[]
for info in report['volumes']:
    if info['file']=='observed-overview-20um.nrrd':
        observed=np.array([z not in report['missingSourceSections'] for z in range(389,2974,2)],np.uint8)
        a=np.broadcast_to(observed[:,None,None],(1293,440,475))
    else:a=np.load(CACHE/names[info['file']],mmap_mode='r')
    sha=hashlib.sha256();count=0
    with (OUT/info['file']).open('rb') as f:
        lines=[]
        while True:
            line=f.readline();assert line,'Incomplete NRRD header'
            if line==b'\n':break
            lines.append(line.decode().strip())
        fields=dict(x.split(': ',1) for x in lines if ': ' in x and not x.startswith('#'))
        assert tuple(map(int,fields['sizes'].split()))==a.shape[::-1]
        o=np.array(list(map(float,fields['space origin'].strip('()').split(','))))
        d=np.array(list(map(float,re.findall(r'-?\d+(?:\.\d+)?(?:e[+-]?\d+)?',fields['space directions'])))).reshape(3,3)
        assert np.allclose(o,origin[::-1]*pitch,rtol=0,atol=1e-10)
        assert np.allclose(d,np.eye(3)*pitch*info['sourceSamplingStep'],rtol=0,atol=1e-10)
        with gzip.GzipFile(fileobj=f,mode='rb') as g:
            for z in range(0,len(a),8):
                expected=a[z:z+8].tobytes();actual=g.read(len(expected))
                assert actual==expected,f'Export payload differs: {info["file"]}, z={z}'
                sha.update(actual);count+=len(actual)
            assert g.read(1)==b''
    assert sha.hexdigest()==info['decodedSha256'] and count==info['decodedBytes']
    checks.append(info['file'])
raw=np.load(CACHE/'raw-overview.npy',mmap_mode='r')
sections=[z for z in [389,713,741,891,1035,1357,1681,2005,2431,2747,2827,2973] if z not in report['missingSourceSections']]
for z in sections:
    folder='cohort-389-1680' if z<=1680 else 'cohort-branch' if z<=2004 else 'cohort-2005-2973'
    a=np.array(Image.open(ROOT/'source'/folder/f'Tooth045_rec{z:08}.png'))
    assert np.array_equal(raw[(z-389)//2],a[300:1180:2,250:1200:2])
for info in report['meshes']:
    m=trimesh.load(OUT/info['file'],process=False)
    assert len(m.faces)==info['triangles'] and m.is_watertight and m.is_winding_consistent and m.volume>0
result={'passed':True,'decodedVolumesMatchCacheAndHashes':checks,'sourcePNGCoordinateChecks':sections,
        'meshChecksPassed':True,'completeSourceAcquisition':report['completeSourceAcquisition'],
        'scope':'Export integrity and source coordinates; not independent anatomy or clinical accuracy. Missing source planes remain unknown.'}
(OUT/'validation.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
