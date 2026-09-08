import sys,json,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from PIL import Image
OUT=ROOT/'output';(OUT/'slices').mkdir(exist_ok=True);(OUT/'vendor').mkdir(exist_ok=True)
vol=np.load(ROOT/'cache/volume.npy',mmap_mode='r');masks=np.load(ROOT/'cache/masks.npz');pulp=masks['pulp'];tooth=masks['tooth']
for z in range(len(vol)):
    Image.fromarray(vol[z]).save(OUT/f'slices/{z:04d}.png')
    rgba=np.zeros((*vol.shape[1:],4),np.uint8);rgba[pulp[z]]=[236,58,79,155]
    Image.fromarray(rgba).save(OUT/f'slices/{z:04d}-mask.png')
    if z%250==0:print('Preview slices',z,flush=True)
three=ROOT.parents[1]/'node_modules/three'
for source,name in [('build/three.module.js','three.module.js'),('examples/jsm/controls/OrbitControls.js','OrbitControls.js'),('examples/jsm/loaders/PLYLoader.js','PLYLoader.js'),('LICENSE','THREE-LICENSE.txt')]:
    shutil.copy2(three/source,OUT/'vendor'/name)
shutil.copy2(ROOT/'preview.html',OUT/'index.html')
shutil.copy2(ROOT/'ATTRIBUTION.md',OUT/'ATTRIBUTION.md')
print('Preview ready',flush=True)
