# Anatomy data attribution

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (updated 2025-02-27)
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Source geometry: `isa_BP3D_4.0_obj_99.zip`, BodyParts3D 4.0.
- English names and relationships: IS-A and PART-OF concept, element, and inclusion tables from the same archive.
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical concepts. https://doi.org/10.1093/nar/gkn613

Historical Human Atlas adaptations (superseded by the current OBJ restoration below): axes and units converted from millimeters/Z-up to meters/Y-up; translated to rest at the stage; geometry simplified using meshoptimizer with 0.2% relative error limit per structure; normals quantized to signed 16-bit; packed into binary chunks; curated display system groupings and colors. The source contains 2,234 individual OBJ meshes; all remain represented. The combined hierarchy contains 3,432 named FMA concepts, which may reference multiple meshes. Original source identity is preserved in the manifest.

Source OBJ comments mention an older CC BY-SA 2.1 Japan license. The official current database license linked above supersedes that legacy text and explicitly permits redistribution and adaptation under CC BY 4.0.

BodyParts3D represents an adult male reference anatomy based on TARO MRI and anatomical illustration refinements. It is not a complete model of every possible human anatomical structure or variation. This interface is educational and is not a clinical tool.

## Historical assets (not included in the current release)

Earlier repository revisions included female reference anatomy: Kristen Browne and Heidi Schlehlein, Human Reference Atlas / HuBMAP, *3D Reference Organ Set for Female v1.5* (2023). CC BY 4.0. Geometry adapted for this viewer.

- Source DOI: https://doi.org/10.48539/HBM352.BTSQ.586
- Dataset: https://lod.humanatlas.io/ref-organ/united-female/v1.5
- Original GLB: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb
- License: https://creativecommons.org/licenses/by/4.0/

Adaptations: translated native meter/Y-up coordinates onto the stage, coincident vertices welded and source normals averaged, geometry simplified with a 0.2% per-structure relative error bound, and normals quantized. Colors and display systems are curated for this interface. All 888 source meshes are represented, with 1,073 source nodes available as selectable individual or compound concepts.

This is a reference assembly with whole-body surface and selected organs, including female reproductive anatomy. Its skeleton and muscle coverage is partial. It is not a complete model of every human structure or a single-person scan. Eight placenta/umbilical structures are classified under Pregnancy reference and hidden by default.

## YuAnatomy regional edition

YuAnatomy is derived from Human Atlas by ashemag (MIT), https://github.com/ashemag/human-atlas. Upstream copyright and license are retained in LICENSE.

This edition selects 591 complete head/neck meshes, retaining selected neck muscles and vessels with their inferior extent. The coordinates are translated by -1.30 meters on Y, preserving scale and source orientation. Geometry is repacked into regional binary chunks and gzip files. Current geometry has been rebuilt from the published OBJ archive; all its triangles are preserved, reversing the additional Human Atlas meshoptimizer simplification. The published OBJ itself is pre-reduced. Only source concepts whose listed members are retained are included, plus per-mesh search records where needed. This does not imply that a concept's complete real-world anatomy is modeled.

Display grouping corrections: FJ1730, FJ1731, FJ1752, FJ1767 and FJ1814 (ventricular structures) move from the upstream cardiac display category to nervous; teeth have their own dental category; gingiva moves from skeletal to digestive. Original names and identifiers are retained.

The complete body skin, thorax, trachea and esophagus are excluded. Regional surface landmarks (hair, eyebrow and lip) remain optional. Internal tooth tissues, roots/canals as independently selectable structures, and unmodeled details are not supplied by this edition. See docs/model-coverage.json in the source package for the included mesh list and selection rule.

FJ1532 and FJ1532M (levator scapulae) move from the upstream skeletal display category to muscular. The source mesh names do not include standalone masseter, temporalis, buccinator, parotid gland, facial nerve, or trigeminal nerve entries; related branches may exist. No complete dental curriculum coverage is claimed.

User-requested edition exclusion: Right major alar cartilage (FJ2554 / FMA59505) and Left major alar cartilage (FJ2555 / FMA59506) are removed from packaged geometry and searchable concepts. This records an edition-specific selection, not a claim that these structures are absent from normal anatomy.

Current geometry: 591 meshes, 1,970,872 triangles from isa_BP3D_4.0_obj_99.zip. Every OBJ entry was verified against archive CRC32 and length. The source vertex/face data is retained, with coordinate conversion, Float32 positions and signed-16-bit normals. User-supplied YuAnatomy branding is used for application and shortcut icons.

YuAnatomy pulp schematics (public/pulp) are new derived surfaces computed from the BodyParts3D tooth exteriors by the YuAnatomy project, distributed under CC BY 4.0 with the source attribution above. They are not supplied internal anatomy, scanned pulp, or clinically validated root canal reconstructions. Their computationally closed endpoints do not represent anatomical foramina. Geometry-generation code is MIT; see docs/pulp-models.md for methods and limitations.

新增咀嚼肌的独立来源与 CC BY-SA 2.1 Japan 授权详见 [mastication/ATTRIBUTION.md](mastication/ATTRIBUTION.md)。原有基础模型许可不变。

间隙教学包的改编和原始材料许可参见 [fascial/ATTRIBUTION.md](fascial/ATTRIBUTION.md)。
