"""Center sensitivity, low-contrast stress controls and source-data checks."""
import csv
import hashlib
import json
import audit_crown_artifacts as audit

np, ndi = audit.np, audit.ndi
OUT = audit.OUT
base = json.loads((OUT/'report.json').read_text())
old = list(csv.DictReader((audit.ROOT/'output/crown-extension/profiles.csv').open()))
anchor = next(r for r in old if int(r['section']) == 1550 and int(r['threshold']) == 30)
seed = np.array([float(anchor['sourceY'])-audit.Y0, float(anchor['sourceX'])-audit.X0])
centers = [(811.,817.), (818.,816.), (816.,816.)]
states = {(c,t):dict(point=seed.copy(), missing=0, previous=None, first=True, strictAlive=True)
          for c in centers for t in audit.THRESHOLDS}
rows = []
for z in range(1550, 1349, -1):
    raw = audit.source(z)
    for c in centers:
        corrected, _ = audit.ring_correct(raw, np.array(c)-[audit.Y0,audit.X0])
        smoothed = ndi.gaussian_filter(corrected, .6)
        for t in audit.THRESHOLDS:
            mask, row = audit.track_plane(smoothed, states[c,t], t)
            row.update(section=z, centerSourceY=c[0], centerSourceX=c[1], threshold=t)
            rows.append(row)
    if z%50 == 0: print('CENTER SENSITIVITY',z,flush=True)
summary = []
for c,t in states:
    rr = [r for r in rows if (r['centerSourceY'],r['centerSourceX'])==c and r['threshold']==t]
    kept = [r['section'] for r in rr if r['connectedToStartPlane']]
    summary.append(dict(centerSourceYX=c, threshold=t,
                        firstBottomConnectedSection=min(kept) if kept else None))
weak, pictures = audit.control_experiment(target_gray=28)
audit.save_panels(pictures, OUT/'low-contrast-controls.png',
                  ['Known weak-contrast truth','Added rings + noise','Ring + bilateral'],(0,60))
for name, records in [('center-sensitivity.csv',rows),('low-contrast-controls.csv',weak)]:
    with (OUT/name).open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=list(records[0]));w.writeheader();w.writerows(records)

# Independent saved-output checks; do not turn synthetic success into anatomy approval.
saved=np.load(OUT/'selected-observations.npz')
count=0
for key in saved.files:
    if key.startswith('raw_'):
        z=int(key.split('_')[-1]);raw=audit.source(z)
        assert np.array_equal(saved[key],raw.astype(np.uint8))
        count+=1
assert count==7
tracking=list(csv.DictReader((OUT/'tracking.csv').open()))
assert len(tracking)==301*5*3
for m in audit.METHODS:
    for t in audit.THRESHOLDS:
        rr=[r for r in tracking if r['method']==m and int(r['threshold'])==t]
        assert [int(r['section']) for r in rr]==list(range(1550,1249,-1))
        strict=[int(r['section']) for r in rr if r['connectedToStartPlane']=='True']
        assert strict==list(range(1550,min(strict)-1,-1)) if strict else True
for z,digest in base['sourceHashes'].items():
    i=audit.MANIFEST[int(z)]
    path=audit.ROOT/'source/cohort-389-1680'/i['file']
    assert hashlib.sha256(path.read_bytes()).hexdigest()==digest==i['sha256']
assert all(r['falsePositive']==0 for r in weak if r['kind']=='empty')
files={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.iterdir()
       if p.suffix in ['.npz','.csv','.png']}
result=dict(centerSensitivity=summary, lowContrastControls=weak,
            validation=dict(passed=True, sourcePNGHashesVerified=len(base['sourceHashes']),
                            savedRawPlanesMatched=count, trackingRows=len(tracking),
                            noGapBridgingInReportedConnectivity=True, emptyControlNoFalseCanals=True,
                            artifactFileHashes=files),
            limitation='Synthetic known truth only; no expert tooth contour or anatomical accuracy certificate.')
(OUT/'sensitivity-and-validation.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(summary,indent=2),flush=True)
for r in weak:
    if r['addedRings'] and r['method'] in ['raw','ring_bilateral']: print(r,flush=True)
