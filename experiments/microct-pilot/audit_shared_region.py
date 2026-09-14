"""Raw slice connectivity at the downstream shared-space candidate; no anatomical label."""
import sys, json, csv
from pathlib import Path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1] / 'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from PIL import Image, ImageDraw

OUT = ROOT / 'output/shared-region-audit'
OUT.mkdir(parents=True, exist_ok=True)
raw = np.load(ROOT / 'cache/root-tracking/raw.npy', mmap_mode='r')
with (ROOT / 'output/root-tracking/profiles.csv').open() as f:
    profiles = {(int(r['section']), r['track']): r for r in csv.DictReader(f) if int(r['threshold']) == 30}
rows = []
examples = {}
for z in range(2420, 2551):
    section = np.array(raw[z - 2004])
    anchors = []
    for name in ['A', 'B']:
        r = profiles[z, name]
        anchors.append((round(float(r['sourceY']) - 350), round(float(r['sourceX']) - 480)))
    for sigma in [0, .6]:
        data = section if sigma == 0 else ndi.gaussian_filter(section.astype(np.float32), sigma)
        for threshold in [25, 30, 35]:
            labels, _ = ndi.label(data < threshold)
            a, b = [int(labels[p]) for p in anchors]
            borders = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
            valid = bool(a and b and a not in borders and b not in borders)
            joined = valid and a == b
            rows.append({'section': z, 'sigma': sigma, 'threshold': threshold,
                         'bothAnchorsEnclosed': valid, 'connectedInSameRawPlane': joined,
                         'anchorIntensities': [float(data[p]) for p in anchors]})
            if sigma == 0 and threshold == 30 and z in [2431, 2460, 2500, 2538]:
                examples[z] = (section, labels == a if joined else np.zeros(section.shape, bool), anchors)
summary = []
for sigma in [0, .6]:
    for t in [25, 30, 35]:
        r = [x for x in rows if x['sigma'] == sigma and x['threshold'] == t]
        hits = [x['section'] for x in r if x['connectedInSameRawPlane']]
        summary.append({'sigma': sigma, 'threshold': t, 'testedSections': len(r),
                        'bothAnchorsEnclosedCount': sum(x['bothAnchorsEnclosed'] for x in r),
                        'connectedCount': len(hits), 'connectedSections': hits})
sheet = Image.new('RGB', (920, 4 * 300), '#18232b')
draw = ImageDraw.Draw(sheet)
for i, (z, (data, mask, anchors)) in enumerate(examples.items()):
    pts = np.array(anchors); lo = np.maximum(pts.min(0) - 28, 0); hi = np.minimum(pts.max(0) + 29, data.shape)
    sl = (slice(lo[0], hi[0]), slice(lo[1], hi[1]))
    gray = (np.clip(data[sl].astype(float) / 90, 0, 1) * 255).astype('uint8')
    rgb = np.repeat(gray[:, :, None], 3, axis=2)
    overlay = rgb.copy(); overlay[mask[sl]] = (overlay[mask[sl]] * .4 + np.array([45, 200, 170]) * .6).astype('uint8')
    for col, frame in enumerate([rgb, overlay]):
        im = Image.fromarray(frame); im.thumbnail((410, 258), Image.Resampling.NEAREST)
        sheet.paste(im, (col * 460 + (460 - im.width) // 2, i * 300 + 30))
        draw.text((col * 460 + 14, i * 300 + 8), f'Source {z}: ' + ('raw' if col == 0 else 'raw <30 shared component'), fill='white')
sheet.save(OUT / 'raw-shared-comparison.png')
(OUT / 'report.json').write_text(json.dumps({'summary': summary, 'rows': rows,
    'limitations': ['Anchors come from nominal tracker, not independent manual annotations.',
    'Raw connectivity is independent of smoothing but not of intensity threshold or image artifacts.',
    'Counts are algorithm sensitivity, not anatomical prevalence.',
    'Only in-plane six-neighbor-equivalent (4-connected 2D) paths are tested; no interpolated links.']}, indent=2))
print(json.dumps([{k:v for k,v in r.items() if k != 'connectedSections'} for r in summary], indent=2))
