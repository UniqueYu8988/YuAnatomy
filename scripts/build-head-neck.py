"""Create a reproducible whole-mesh head/neck subset from an upstream models folder.
Usage: python scripts/build-head-neck.py PATH_TO_UPSTREAM_MODELS [PATH_TO_ORIGINAL_OBJ]
No triangles are cut: crossing structures are included by an explicit name rule.
"""
import json, gzip, struct, sys, re
from obj_geometry import read_obj
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]).resolve()
out = root / 'public' / 'head-neck'
out.mkdir(parents=True, exist_ok=True)
atlas = json.loads((source / 'atlas.json').read_text())
crossing = re.compile(r'cervicis|capitis|levator scapulae|descending part.*trapezius|longus colli|platysma|omohyoid|scalenus|sternocleidomastoid|sternohyoid|sternothyroid|deep cervical artery|thyrocervical|transverse cervical artery|common carotid artery|internal jugular vein', re.I)
parts = [p.copy() for p in atlas['parts'] if p['bounds'][0][1] >= 1.435 or (p['bounds'][1][1] > 1.435 and crossing.search(p['name']))]
# User-requested exclusions from this edition, not a claim about normal anatomy.
excluded_ids = {'FJ2554', 'FJ2555'}  # Right / Left major alar cartilage
parts = [p for p in parts if p['id'] not in excluded_ids]
obj_source = Path(sys.argv[2]).resolve() if len(sys.argv)>2 else root/'work/source-obj/obj'
missing = [p['id'] for p in parts if not (obj_source/(p['id']+'.obj')).is_file()]
if missing: raise RuntimeError(f'Missing {len(missing)} original OBJ files. Run scripts/fetch-source-obj.py first.')
# Correct upstream keyword-based display groupings; preserve original identifiers.
for p in parts:
    if p['id'] in {'FJ1532','FJ1532M'}: p['system'] = 'muscular'
    if p['id'] in {'FJ1730','FJ1731','FJ1752','FJ1767','FJ1814'}: p['system'] = 'nervous'
    if 'tooth' in p['name'].lower(): p['system'] = 'dental'
    if 'gingiva' in p['name'].lower(): p['system'] = 'digestive'
# Keep only fully represented concepts; do not label a partial body hierarchy complete.
ids = {p['id'] for p in parts}
concepts = [c for c in atlas['concepts'] if c['elements'] and set(c['elements']) <= ids]
known = {tuple(c['elements']) for c in concepts}
for p in parts:
    if (p['id'],) not in known:
        concepts.append({'id': p['id'], 'name': p['name'], 'elements': [p['id']]})
buffers = {}
blob = bytearray()
chunks = []
def flush():
    global blob
    if not blob: return
    name = f'head-neck-hd-{len(chunks)}.bin'
    (out / name).write_bytes(blob)
    compressed = gzip.compress(bytes(blob), compresslevel=9, mtime=0)
    (out / (name + '.gz')).write_bytes(compressed)
    chunks.append({'url': '/head-neck/' + name, 'bytes': len(blob), 'gzip': '/head-neck/' + name + '.gz', 'gzipBytes': len(compressed)})
    blob = bytearray()
for p in parts:
    positions,normals,indices,bounds = read_obj(obj_source/(p['id']+'.obj'))
    p['sourceTriangleCount'] = len(indices)//3
    p['vertexCount'] = len(positions)//3
    p['indexCount'] = len(indices)
    if len(blob) > 4_000_000: flush()
    for attr, values in [('positions',positions),('normals',normals),('indices',indices)]:
        while len(blob) % 4: blob.append(0)
        p[attr] = len(blob)
        blob.extend(values.tobytes())
    p['chunk'] = len(chunks)
    p['bounds'] = bounds
flush()
result = {'version': 'YuAnatomy 0.1 / BodyParts3D 4.0', 'scope': 'Whole-mesh head and neck subset; selected neck muscles and vessels retain their inferior extent. No skin, thorax, or whole trachea/esophagus.', 'parts': parts, 'concepts': concepts, 'chunks': chunks, 'triangles': sum(p['indexCount'] // 3 for p in parts)}
result['geometry'] = {'quality': 'published-obj', 'additionalSimplification': False, 'sourceArchive': 'isa_BP3D_4.0_obj_99.zip', 'note': 'All triangles from the published OBJ are retained. The official release itself is pre-reduced.'}
(out / 'atlas.json').write_text(json.dumps(result, separators=(',', ':')), encoding='utf-8')
report = {'sourceParts': len(atlas['parts']), 'parts': len(parts), 'concepts': len(concepts), 'triangles': result['triangles'], 'gzipBytes': sum(c['gzipBytes'] for c in chunks), 'selectionRule': 'minY >= 1.435m in source coordinates, plus named crossing neck structures; full meshes only', 'included': [{'id': p['id'], 'name': p['name'], 'system': p['system']} for p in parts], 'excludedCrossing': [{'id': p['id'], 'name': p['name']} for p in atlas['parts'] if p['bounds'][1][1] > 1.435 and p['id'] not in ids]}
(root / 'docs').mkdir(exist_ok=True)
report['explicitExclusions'] = [{'id': p['id'], 'name': p['name'], 'reason': 'Removed from YuAnatomy at user request'} for p in atlas['parts'] if p['id'] in excluded_ids]
report['geometry'] = result['geometry']
(root / 'docs' / 'model-coverage.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if not isinstance(v,list)}, indent=2))
