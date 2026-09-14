"""Export unchanged native coronal ROI for offline orthogonal review."""
import gzip
import hashlib
import json
import audit_crown_artifacts as a

np = a.np
OUT = a.OUT / 'native-review'
OUT.mkdir(exist_ok=True)
origin = np.array([1250, 650, 730])
pitch = .00999999
raw = np.stack([a.source(z)[650-a.Y0:870-a.Y0,730-a.X0:900-a.X0]
                for z in range(1250,1551)]).astype(np.uint8)
prior = np.load(a.ROOT/'cache/crown-extension/candidate.npy',mmap_mode='r')
labels = np.array(prior[1250-389:1551-389,650-300:870-300,730-250:900-250])
assert raw.shape == labels.shape == (301,220,170)


def nrrd(array, name):
    p=OUT/name; o=origin[::-1]*pitch
    header=(f'NRRD0005\n# Source axes, not patient orientation\ntype: unsigned char\ndimension: 3\n'
            f'space dimension: 3\nsizes: {array.shape[2]} {array.shape[1]} {array.shape[0]}\n'
            f'space directions: ({pitch},0,0) (0,{pitch},0) (0,0,{pitch})\n'
            f'space origin: ({o[0]},{o[1]},{o[2]})\nspace units: "mm" "mm" "mm"\nencoding: gzip\n\n')
    payload=array.tobytes()
    p.write_bytes(header.encode()+gzip.compress(payload,compresslevel=6,mtime=0))
    decoded=gzip.decompress(p.read_bytes().split(b'\n\n',1)[1])
    assert decoded==payload
    return {'file':name,'decodedSha256':hashlib.sha256(decoded).hexdigest(),'roundTripPassed':True}


files=[nrrd(raw,'raw-native-10um.nrrd'),nrrd(labels,'prior-candidate-10um.nrrd')]
saved=np.load(a.OUT/'selected-observations.npz')
panels=[]
for z in [1358,1383,1450]:
    sl=(slice(650-a.Y0,870-a.Y0),slice(730-a.X0,900-a.X0))
    panels.append((f'Source section {z}',saved[f'raw_{z}'][sl],saved[f'ring_bilateral_{z}'][sl]))
a.save_panels(panels,a.OUT/'review-summary.png',['Original: unchanged','Filtered: NOT adopted'])
result={'originSectionYX':origin.tolist(),'shapeZYX':list(raw.shape),'pixelPitchMm':pitch,
        'sourceSections':[1250,1550],'files':files,'sourceHashes':a.HASHES,
        'priorCandidateUnmodified':True,'patientOrientationKnown':False,
        'limitations':['Native sampling is not accuracy. No expert reference contour.',
                       'Candidate label is the prior heuristic, not validated anatomy. Zero labels are not proof of absence.',
                       'No new mesh; no interpolation; no sharpening or contrast remapping in exported raw volume.',
                       'Data redistribution license unconfirmed; local research only.']}
(OUT/'manifest.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
(OUT/'README.md').write_text('''# 冠方局部原始影像复核包

两份 NRRD 共用源坐标，可在支持 NRRD 的离线体数据工具中叠加、切换三正交视图。

- raw-native-10um.nrrd：1250–1550 层，Y650:870、X730:900，原始 PNG 灰度不变。
- prior-candidate-10um.nrrd：上一轮阈值 30 候选的原样裁剪，仅用于对照，不是专家标注。

用 manifest.json 检查坐标、尺寸与解码哈希。轴是源图像轴，不能直接当作颊舌/近远中方向。
外部零标签不等于确认无髓腔；没有补层或补管。当前没有可计算真实漏分率的专家轮廓。
许可未确认，仅本地研究。处理后的灰度图没有覆盖这些原始体数据。
''',encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='sourceHashes'},indent=2))
