# YuAnatomy 0.1 verification

Checked on 2026-09-06, Windows, Node.js 24.13.0, Chromium through agent-browser. Phone checks used viewport emulation, not physical phones.

## Automated checks

- `npm run check`: passed (TypeScript).
- `npm run validate`: passed; 593 unique meshes, 1,192 concept records, 759,544 triangles. Binary buffer lengths, gzip equivalence, index ranges, translated bounding boxes and concept references verified.
- Regional exclusions and key jaw/cervical structures checked.
- All five presets are nonempty; exploded layouts have no overlapping bounding-box cells at 0.46, 1 and 1.7 aspect ratios.
- Tap, drag, canceled pointer and multi-pointer sequences checked.
- `npm run build`: passed. Vite reports a size advisory for the bundled Three.js application (about 712 kB minified / 195 kB gzip); not a build failure.

## Browser flow

- Development and production-preview pages load, canvas renders, no page errors or error alert in final production run.
- Actual production requests contain only `/head-neck/atlas.json` and ten regional gzip chunks. `dist` contains no full-body `models` directory.
- Five presets exercised. Nerves & vessels: 309 meshes; Muscles: 114 meshes.
- Search `mandible` → select → isolate: one visible mesh, camera fits the mandible; heading shows FMA52748.
- Hide mandible → visible count decreases from 590 to 589; restore → 590.
- Direct canvas click selected the left upper eyelid tarsal plate and opened its detail panel.
- System checkboxes alter displayed count. Hiding the muscular preset's only layer shows the empty-state message; Restore this view recovers all 114 meshes.
- Slider keyboard End reaches 100%, lays out visible meshes, switches to front view and disables incompatible view controls.
- Native About dialog opens with focus and source links; Escape closes it.
- Mobile Browse → search → choose → isolate works. Selection shortcut opens details, isolate returns to model area.
- Screenshots inspected at 1440×1000, 390×844, 320×568 and 844×390. No horizontal page overflow in measured mobile/landscape checks. Landscape has a smaller model viewport; zoom remains available.

Screenshots are saved locally under `outputs/`; source archive excludes this working evidence directory.

## Limits

No physical-device GPU or true pinch-gesture performance test was performed. No clinical or textbook completeness validation was performed. Source model omissions are documented in README.md and the coverage inventory. No cloud deployment, anatomical translation, textbook content, account system or AI integration is included.

## UI localization update

Chinese navigation, controls, statuses, empty states, operating instructions, accessibility labels and loading errors were added. Anatomical names, source IDs, layer category names, anatomical scope text and original attribution remain unchanged. Document language is zh-CN.

TypeScript and production build passed. Chromium desktop (1440×1000) and mobile (390×844) screenshots were checked. English search `mandible` → selection → “单独显示” works and preserves `mandible` / `FMA52748`. Mobile navigation opens and closes with Chinese controls. No browser page errors or horizontal overflow were detected. The atlas manifest and anatomy definitions have identical SHA-256 hashes to their pre-localization versions.

## Paired cartilage removal

Removed FJ2554 and FJ2555 at user request and made the exclusions reproducible in build-head-neck.py. Current validation passes with 591 meshes, 1,181 searchable records and 758,806 triangles. Checks ensure neither mesh can return and no major alar cartilage concept remains searchable. Historical counts above describe the earlier version.

## Published OBJ restoration and branding

Restored all published source OBJ triangles: 1,970,872 triangles, 591 meshes, 1,181 concepts, 25,504,846 compressed geometry bytes. Independently counted each OBJ face list; all 591 match the packaged triangle counts. Region IDs and excluded cartilage remain unchanged. Source files passed ZIP CRC32 and byte-length validation.

TypeScript and production build passed. Desktop overview, English mandible search, isolation, mobile viewport rendering, and new icon loading checked in Chromium. The favicon points to /branding/icon-256.png and the application image loads at 256px intrinsic resolution. No browser page errors or unfinished loading state were observed.

Created Desktop/YuAnatomy.lnk with the supplied rounded icon, absolute project working directory and hidden PowerShell launcher. Invoked the shortcut with the existing server available. A stop-existing-server/cold-start test was blocked by automatic approval review, so cold start was not verified. No physical mobile GPU performance measurements were made.
# 2026-09-06 髓腔示意修复

- 替换运行时包围盒/圆柱生成器，交付 28 颗牙的离线表面约束曲面：666,944 个三角形，二进制 12,005,664 bytes，gzip 6,267,679 bytes。
- 冠部采用平滑截面包络；根部沿真实牙体内部求路径并连续渐细，修复全局轴错位、穿模、分支断开及粗细突变。外部 591 个网格、1,970,872 个三角形保持不变。
- 生成端逐牙验证后，`npm run validate` 使用独立 JavaScript BVH/射线算法重新检查全部髓腔三角形、闭合边绕序、单一连通分量、源几何与资源哈希。最小整面几何证书余量约 0.058 mm；这是算法验证余量，不是医学尺寸。
- 通过故意移出牙体、放大三角形以及删除表面三种负例，确认几何校验会拒绝错误数据。
- `npm run check`、`npm run validate`、`npm run build` 通过。Vite 保留主 JS 包大于 500 kB 的体积提示，没有编译错误。
- 浏览器检查覆盖全牙列、16 与 36 单牙、剖切、拆解排列及 390×844 手机布局；页面错误列表为空。修复固定 16 mm 相机偏移造成单牙被底部工具栏遮挡的问题。
- 本机截图位于 `outputs/pulp-all-teeth.png`、`outputs/pulp-16-final.png`、`outputs/pulp-36-final.png`、`outputs/pulp-section-final.png`、`outputs/pulp-exploded-final.png`、`outputs/pulp-mobile-final.png`。未进行真实手机硬件性能基准测试。
- 页面、README、AGENTS.md 与 `docs/pulp-models.md` 明确区分外形推算示意和真实扫描解剖。当前模型不表达真实根管数量、分型、细小支管或根尖孔，也不支持临床操作长度判断。
