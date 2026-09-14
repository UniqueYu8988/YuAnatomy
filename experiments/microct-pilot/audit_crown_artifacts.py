"""Offline ring/denoising sensitivity experiment, not anatomical segmentation truth.

Source PNGs and prior candidates are read-only. Fixed filter settings are tested
with synthetic positive/negative controls before inspecting specimen outcomes.
"""
import csv
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1] / 'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from skimage.restoration import denoise_bilateral
from PIL import Image, ImageDraw, ImageFont

OUT = ROOT / 'output/crown-artifact-audit'
OUT.mkdir(parents=True, exist_ok=True)
Y0, Y1, X0, X1 = 550, 1000, 550, 1100
Z0, Z1 = 1250, 1550
METHODS = ['raw', 'gaussian06', 'bilateral', 'ring_gaussian06', 'ring_bilateral']
THRESHOLDS = [25, 30, 35]
PARAMS = dict(radial_sigma=9, cap=6, rmax=170, angles=360,
              bilateral_sigma_color_gray=5, bilateral_sigma_spatial=1, bilateral_window=7)
MANIFEST = {i['section']: i for i in json.loads(
    (ROOT / 'source/cohort-389-1680/manifest.json').read_text())['files']}
HASHES = {}


def source(z):
    i = MANIFEST[z]
    path = ROOT / 'source/cohort-389-1680' / i['file']
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    assert digest == i['sha256']
    HASHES[str(z)] = digest
    return np.asarray(Image.open(path), dtype=np.float32)[Y0:Y1, X0:X1]


def polar(a, center, radii, angles=360):
    theta = np.arange(angles) * (2 * np.pi / angles)
    yy = center[0] + np.sin(theta)[:, None] * radii
    xx = center[1] + np.cos(theta)[:, None] * radii
    return ndi.map_coordinates(a, [yy, xx], order=1, mode='nearest')


def fit_center(images):
    # Coherence of fine radial oscillations, restricted to a central disk.
    # These calibration planes are outside the evaluation range 1250--1550.
    rr = np.arange(8, 76, dtype=float)
    def score(c):
        values = []
        for a in images:
            p = polar(a, c, rr, 180)
            residual = p - ndi.gaussian_filter1d(p, 3, axis=1)
            values.append(float(np.std(np.median(residual, axis=0))))
        return float(np.mean(values))
    base = np.array([816-Y0, 816-X0], float)
    trials = [(score(base + [dy, dx]), base + [dy, dx])
              for dy in range(-5, 6) for dx in range(-5, 6)]
    best = max(trials, key=lambda x: x[0])[1]
    trials += [(score(best + [dy, dx]), best + [dy, dx])
               for dy in [-.5, 0, .5] for dx in [-.5, 0, .5]]
    score_best, center = max(trials, key=lambda x: x[0])
    return center, {'calibrationSections': [1035, 1100, 1200],
                    'sourceYX': (center + [Y0, X0]).tolist(), 'coherenceScore': score_best,
                    'method': 'Maximize robust radial high-frequency coherence in radius 8..75 pixels; not a scanner calibration.'}


def ring_correct(a, center):
    rr = np.arange(PARAMS['rmax'] + 1, dtype=float)
    p = polar(a, center, rr, PARAMS['angles'])
    # Local radial high-pass first; angular median rejects localized structures.
    residual = p - ndi.gaussian_filter1d(p, PARAMS['radial_sigma'], axis=1, mode='reflect')
    profile = np.median(residual, axis=0)
    profile = np.clip(profile, -PARAMS['cap'], PARAMS['cap'])
    profile *= np.clip((rr-6)/6, 0, 1) * np.clip((PARAMS['rmax']-rr)/15, 0, 1)
    yy, xx = np.indices(a.shape)
    radius = np.hypot(yy-center[0], xx-center[1])
    correction = np.interp(radius, rr, profile, left=0, right=0).astype(np.float32)
    return a-correction, correction


def bilateral(a):
    # Float input is explicitly kept in original 0..255 gray units.
    return denoise_bilateral(a.astype(np.float32), sigma_color=5, sigma_spatial=1,
                            win_size=7, bins=1000, mode='reflect', channel_axis=None)


def variants(a, center):
    fixed, correction = ring_correct(a, center)
    return {'raw': a, 'gaussian06': ndi.gaussian_filter(a, .6),
            'bilateral': bilateral(a), 'ring_gaussian06': ndi.gaussian_filter(fixed, .6),
            'ring_bilateral': bilateral(fixed)}, correction


def control_experiment(target_gray=20):
    rng = np.random.default_rng(451109)
    yy, xx = np.indices((256, 256)); center = np.array([128., 128.])
    rr = np.hypot(yy-center[0], xx-center[1])
    rings = 4*np.sin(rr*1.3) + 3*np.sin(rr*.47)
    noise = rng.normal(0, 2, rr.shape)
    rows = []
    illustrations = []
    for kind, radius in [('empty', 0), ('offset', 2), ('offset', 4), ('offset', 8),
                         ('centered', 8), ('real_annulus', 2)]:
        target = np.zeros(rr.shape, bool)
        if kind == 'offset': target = (yy-83)**2+(xx-112)**2 <= radius**2
        if kind == 'centered': target = rr <= radius
        if kind == 'real_annulus': target = np.abs(rr-50) <= radius
        clean = np.full(rr.shape, 45., np.float32); clean[target] = target_gray
        for has_ring in [False, True]:
            observed = (clean + noise + (rings if has_ring else 0)).astype(np.float32)
            methods, _ = variants(observed, center)
            domain = rr < 110
            for method, filtered in methods.items():
                pred = (filtered < 30) & domain
                tp = int((pred & target).sum()); fp = int((pred & ~target).sum()); fn = int((~pred & target).sum())
                rows.append(dict(kind=kind, radiusPixels=radius, targetGray=target_gray, addedRings=has_ring, method=method,
                                 truePositive=tp, falsePositive=fp, falseNegative=fn,
                                 dice=2*tp/(2*tp+fp+fn) if target.any() else None,
                                 rmse=float(np.sqrt(np.mean((filtered[domain]-clean[domain])**2)))))
            if has_ring and (kind, radius) in [('offset', 2), ('offset', 8), ('real_annulus', 2)]:
                illustrations.append((f'{kind}, radius {radius}px', clean, observed, methods['ring_bilateral']))
    assert len(rows) == 60
    # A constant image must not gain dark canals through ring correction.
    constant = np.full((256, 256), 45, np.float32)
    corrected, _ = ring_correct(constant, center)
    assert np.allclose(corrected, constant)
    return rows, illustrations


def track_plane(a, state, t):
    labels, _ = ndi.label(a < t)
    sizes = np.bincount(labels.ravel()); sizes[0] = 0
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    ids = np.flatnonzero(sizes >= 4); ids = ids[~np.isin(ids, border)]
    previous = state['previous']; overlap = False; area = 0; status = 'stopped-after-gap'
    chosen = np.zeros(a.shape, bool)
    if state['missing'] <= 3:
        cy, cx = np.round(state['point']).astype(int)
        cy, cx = int(np.clip(cy, 12, a.shape[0]-13)), int(np.clip(cx, 12, a.shape[1]-13))
        window = labels[cy-12:cy+13, cx-12:cx+13]
        yy, xx = np.where(np.isin(window, ids))
        label = 0
        if len(yy):
            d = (yy-12)**2 + (xx-12)**2; k = d.argmin()
            if d[k] <= 144: label = int(window[yy[k], xx[k]])
        if label:
            chosen = labels == label; area = int(chosen.sum())
            overlap = previous is not None and bool((chosen & previous).any())
            status = 'enclosed' if state['missing'] == 0 else 'reacquired'
            state.update(point=np.argwhere(chosen).mean(0), missing=0, previous=chosen)
        else:
            status = 'no-enclosed-candidate'
            state['missing'] += 1; state['previous'] = None
    # Reachability from the selected starting region, with no synthetic bridging.
    if state['strictAlive'] and (state['first'] or overlap) and area:
        strict = True
    else:
        strict = False; state['strictAlive'] = False
    state['first'] = False
    return chosen, dict(state=status, areaPixels=area, overlapPreviousPlane=overlap,
                       connectedToStartPlane=strict, sourceY=float(state['point'][0]+Y0),
                       sourceX=float(state['point'][1]+X0))


def save_panels(rows, path, titles, window=(0, 80), delta=False):
    width, height = 285, 325
    sheet = Image.new('RGB', (width*len(titles), height*len(rows)+45), '#f2f5f4')
    draw = ImageDraw.Draw(sheet)
    try: font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 16)
    except OSError: font = ImageFont.load_default()
    for c, title in enumerate(titles): draw.text((c*width+10, 10), title, font=font, fill='#183c37')
    for r, (label, *arrays) in enumerate(rows):
        for c, a in enumerate(arrays):
            if delta and c == len(arrays)-1:
                strength = np.clip(np.abs(a)/6, 0, 1)
                rgb = np.full((*a.shape, 3), 245., float)
                red = np.array([213, 71, 63]); blue = np.array([53, 99, 183])
                color = np.where((a>=0)[..., None], red, blue)
                rgb = rgb*(1-strength[..., None])+color*strength[..., None]
            else:
                gray = np.clip((a-window[0])/(window[1]-window[0]), 0, 1)*255
                rgb = np.repeat(gray[..., None], 3, axis=-1)
            im = Image.fromarray(rgb.astype(np.uint8)); im.thumbnail((width-15, height-40))
            sheet.paste(im, (c*width+(width-im.width)//2, 45+r*height+23))
        draw.text((r*0+10, 45+r*height), label, font=font, fill='#183c37')
    sheet.save(path)


def main():
    controls, control_panels = control_experiment()
    save_panels(control_panels, OUT/'synthetic-controls.png', ['Known synthetic truth', 'Added rings + noise', 'Ring + bilateral'], (0, 60))
    center, center_report = fit_center([source(z) for z in [1035, 1100, 1200]])
    print('CENTER', center_report, flush=True)
    old = list(csv.DictReader((ROOT/'output/crown-extension/profiles.csv').open()))
    anchor = next(r for r in old if int(r['section']) == Z1 and int(r['threshold']) == 30)
    seed = np.array([float(anchor['sourceY'])-Y0, float(anchor['sourceX'])-X0])
    states = {(m,t):dict(point=seed.copy(), missing=0, previous=None, first=True, strictAlive=True)
              for m in METHODS for t in THRESHOLDS}
    records = []; panels = []; profiles = []; sample_arrays = {}
    selected = [1250, 1300, 1358, 1383, 1400, 1450, 1550]
    for z in range(Z1, Z0-1, -1):
        raw = source(z); methods, correction = variants(raw, center)
        for (m,t), state in states.items():
            mask, row = track_plane(methods[m], state, t)
            row.update(section=z, method=m, threshold=t)
            records.append(row)
            if z in selected and t == 30: sample_arrays[f'mask_{m}_{z}'] = mask
        # Report a descriptive ring-energy proxy, not a clinical accuracy score.
        for m, a in methods.items():
            p = polar(a, center, np.arange(12, 90, dtype=float))
            r = p-ndi.gaussian_filter1d(p, 9, axis=1)
            profiles.append(dict(section=z, method=m, radialResidualStd=float(np.std(np.median(r, axis=0)))))
        if z in selected:
            # Source coordinates Y630:870 X700:930, equal window for each column.
            sl = (slice(630-Y0, 870-Y0), slice(700-X0, 930-X0))
            panels.append((f'Section {z}', raw[sl], methods['gaussian06'][sl], methods['bilateral'][sl],
                           methods['ring_bilateral'][sl], -correction[sl]))
            sample_arrays[f'raw_{z}'] = raw.astype(np.uint8)
            sample_arrays[f'ring_bilateral_{z}'] = methods['ring_bilateral']
        if (Z1-z)%50 == 0: print('ARTIFACT AUDIT', z, flush=True)
    panels.reverse()
    save_panels(panels, OUT/'native-image-comparison.png',
                ['Original PNG', 'Gaussian sigma 0.6', 'Bilateral', 'Ring + bilateral', 'Ring delta: red raises'], delta=True)
    np.savez_compressed(OUT/'selected-observations.npz', **sample_arrays,
                        sourceCropYX=np.array([Y0,Y1,X0,X1]), ringCenterSourceYX=center+[Y0,X0])
    summaries = []
    for m in METHODS:
        for t in THRESHOLDS:
            rr = [r for r in records if r['method'] == m and r['threshold'] == t]
            kept = [r['section'] for r in rr if r['areaPixels']]
            strict = [r['section'] for r in rr if r['connectedToStartPlane']]
            summaries.append(dict(method=m, threshold=t, firstCandidateSection=min(kept) if kept else None,
                                  firstBottomConnectedSection=min(strict) if strict else None,
                                  maxAreaPixels=max(r['areaPixels'] for r in rr),
                                  reacquiredCount=sum(r['state']=='reacquired' for r in rr),
                                  adjacentNonOverlapCount=sum(r['areaPixels']>0 and not r['overlapPreviousPlane'] for r in rr[1:])))
    for name, rows in [('tracking.csv', records), ('radial-proxy.csv', profiles), ('synthetic-controls.csv', controls)]:
        with (OUT/name).open('w', newline='', encoding='utf-8') as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
    report = dict(sourceRange=[Z0,Z1], sourceCropYX=[Y0,Y1,X0,X1], sourceHashes=HASHES,
                  parameters=PARAMS, centerFit=center_report, trackingSummary=summaries,
                  controlRows=controls, constantControlPassed=True,
                  referenceStatus='No expert ground-truth contour is available. Existing automated anchor is not independent truth.',
                  decision='Exploratory only; no new cavity mesh or production replacement.',
                  limitations=['Ring model can subtract real concentric anatomy; synthetic controls are not tooth validation.',
                               'Radial residual proxy is optimized by the correction and is not independent evidence of accuracy.',
                               'Fixed gray thresholds are sensitivity probes, not tissue-specific calibration.',
                               'Tracking only covers 1250..1550, not all coronal sections; reaching 1250 is censored.',
                               'No missing-plane interpolation, dilation, or generated chamber.'])
    (OUT/'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(summaries, indent=2), flush=True)


if __name__ == '__main__': main()
