import sys, io, json, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1] / 'work/pulp-runtime'))
import numpy as np
from PIL import Image, ImageDraw
OUT = ROOT / 'output'; OUT.mkdir(exist_ok=True)
with zipfile.ZipFile(next((ROOT / 'source').glob('*.zip'))) as archive:
    names = sorted(n for n in archive.namelist() if n.lower().endswith(('.tif', '.tiff', '.png', '.bmp')) and not n.startswith('__MACOSX'))
    print('Images', len(names), names[:3], names[-3:], flush=True)
    if not names:
        print(archive.namelist()[:30]); raise SystemExit(1)
    indexes = np.linspace(0, len(names)-1, 12).astype(int)
    sheet = Image.new('RGB', (1200, 950), '#15202b'); draw = ImageDraw.Draw(sheet)
    meta = []
    for j, index in enumerate(indexes):
        im = Image.open(io.BytesIO(archive.read(names[index])))
        a = np.array(im)
        print(index, a.shape, a.dtype, np.percentile(a,[0,25,50,75,95,99,100]).tolist(), flush=True)
        meta.append({'index':int(index),'shape':list(a.shape),'dtype':str(a.dtype),'file':names[index]})
        im = im.convert('L'); im.thumbnail((290, 280))
        x,y = (j%4)*300, (j//4)*315
        sheet.paste(im,(x+(300-im.width)//2,y+25)); draw.text((x+10,y+5), f'z = {index}',fill='white')
    sheet.save(OUT / 'raw-contact-sheet.png')
    (OUT/'input-inspection.json').write_text(json.dumps({'count':len(names),'samples':meta},indent=2))
