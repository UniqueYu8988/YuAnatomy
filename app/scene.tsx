import { loadCanalModel, CANAL_MODEL_BOUNDS, type CanalModel } from "./canal-model";
import { measurePoints, retainedByPlane } from "./measurement";
import { useEffect, useRef } from "react";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createExplosionLayout } from "./explosion-layout";
import { createDentalFrame, type DentalFrame } from "./dental-unfold";
import { decodeModelResponse } from "./model-download";
import { PointerTap } from "./pointer-tap";
import { SYSTEMS, type Atlas, type SceneState, type RulerMeasurement } from "./anatomy";
import { getStudyEntry } from "./study";
import { createPulpCavityGeometry, loadPulpData } from "./pulp-generator";
import { FASCIAL_SPACES } from "./fascial-spaces";
import { getDentalToothByMesh } from "./dental-data";

interface Props {
  atlas: Atlas;
  state: SceneState;
  onSelect: (id: string) => void;
  onProgress: (n: number) => void;
  onError: (s: string) => void;
  onMeasure?: (measurement: RulerMeasurement | null) => void;
  onSelectFascialSpace?: (spaceId: string) => void;
}
export default function AnatomyScene({
  atlas,
  state,
  onSelect,
  onProgress,
  onError,
  onMeasure,
  onSelectFascialSpace,
}: Props) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(state),
    select = useRef(onSelect),
    measure = useRef(onMeasure),
    selectFascial = useRef(onSelectFascialSpace);
  latest.current = state;
  select.current = onSelect;
  measure.current = onMeasure;
  selectFascial.current = onSelectFascialSpace;
  useEffect(() => {
    const el = host.current!;
    let disposed = false,
      frame = 0,
      dirty = true,
      ready = false,
      lastView = "",
      lastReset = -1,
      lastIsolate = "",
      layoutKey = "",
      amount = 0;
    let lastState: SceneState | null = null;
    const isVisible = (p: Atlas["parts"][number], s: SceneState) =>
      s.canalMode ? false : s.fascialMode ? (p.system === "dental" || (p.system === "skeletal" && /mandible|maxilla|zygomatic|temporal bone|sphenoid/i.test(p.name)) || /BP3-FMA490/.test(p.id) || /mylohyoid|geniohyoid|genioglossus|hyoglossus|sublingual|submandibular gland/i.test(p.name)) : s.isolate
        ? s.selected.includes(p.id)
        : !s.hidden?.includes(p.id) &&
          (s.selected.includes(p.id) ||
            ((!s.scope || s.scope.includes(p.id)) && s.visible.includes(p.system)));
    const abort = new AbortController();
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      onError("无法启动 3D 视窗，请使用支持并启用 WebGL 的浏览器。");
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1.5 : 2));
    renderer.setClearColor("#f2f3f3");
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.localClippingEnabled = true;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "交互式模型：拖动旋转，滚轮或双指缩放，点击结构查看详情。",
    );
    const scene = new T.Scene(),
      camera = new T.PerspectiveCamera(34, 1, 0.005, 100),
      controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(1.3, 0.98, 3.3);
    controls.target.set(0, 0.88, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.085;
    controls.minDistance = 0.07;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI * 0.96;
    controls.addEventListener("change", () => {
      dirty = true;
    });
    const pmrem = new T.PMREMGenerator(renderer),
      room = new RoomEnvironment(),
      env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    room.dispose();
    pmrem.dispose();
    scene.add(new T.HemisphereLight(0xffffff, 0xa7acb2, 1.05));
    const key = new T.DirectionalLight(0xfffaf4, 2.3);
    key.position.set(-2, 4, 3);
    scene.add(key);
    const rim = new T.DirectionalLight(0xe9f0ff, 1.8);
    rim.position.set(2, 2, -3);
    scene.add(rim);
    const ground = new T.Mesh(
      new T.CircleGeometry(30, 96),
      new T.MeshStandardMaterial({ color: 0xd5d9dc, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.019;
    scene.add(ground);
    const platform = new T.Mesh(
      new T.CylinderGeometry(0.68, 0.7, 0.028, 100),
      new T.MeshStandardMaterial({ color: 0xeeeeec, metalness: 0.12, roughness: 0.67 }),
    );
    platform.position.y = -0.016;
    scene.add(platform);
    const ring = new T.Mesh(
      new T.RingGeometry(0.63, 0.632, 128),
      new T.MeshBasicMaterial({
        color: 0x8c969f,
        transparent: true,
        opacity: 0.4,
        side: T.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.001;
    scene.add(ring);
    const innerRing = new T.Mesh(
      new T.RingGeometry(0.55, 0.551, 128),
      new T.MeshBasicMaterial({
        color: 0xa4aeb8,
        transparent: true,
        opacity: 0.16,
        side: T.DoubleSide,
      }),
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.001;
    scene.add(innerRing);
    const width = T.MathUtils.ceilPowerOfTwo(atlas.parts.length),
      data = new Float32Array(width * 4),
      partTexture = new T.DataTexture(data, width, 1, T.RGBAFormat, T.FloatType);
    partTexture.needsUpdate = true;
    const rotationData = new Float32Array(width * 4);
    for (let i = 0; i < width; i++) rotationData[i * 4 + 3] = 1;
    const rotationTexture = new T.DataTexture(rotationData, width, 1, T.RGBAFormat, T.FloatType);
    rotationTexture.needsUpdate = true;
    const rotations = atlas.parts.map(() => new T.Quaternion());
    const targetRotations = atlas.parts.map(() => new T.Quaternion());
    const dentalFrames = new Map<string, DentalFrame>();
    const dentalTeeth = atlas.parts.map((p) => getDentalToothByMesh(p.id));
    let targetMesialAngle = 0;
    let targetOcclusalAngle = 0;
    let currentMesialAngle = 0;
    let currentOcclusalAngle = 0;
    let isToothDragging = false;
    let toothDragPointerId = -1;
    let toothDragLastX = 0;
    let toothDragLastY = 0;
    let toothDragIsRight = false;
    let toothDragIsLower = false;
    const interactiveEuler = new T.Euler();
    const interactiveQuat = new T.Quaternion();
    const finalTargetRot = new T.Quaternion();
    const injectRotation = (shader: Parameters<T.MeshStandardMaterial["onBeforeCompile"]>[0]) => {
      shader.uniforms.partRotation = { value: rotationTexture };
      shader.vertexShader = "uniform sampler2D partRotation;\nvec3 rotatePart(vec3 v, vec4 q) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("transformed += state.xyz;", "transformed = rotatePart(transformed, texture2D(partRotation, stateUv)) + state.xyz;");
      shader.vertexShader = shader.vertexShader.replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nobjectNormal = rotatePart(objectNormal, texture2D(partRotation, vec2((partIndex + 0.5) / stateWidth, 0.5)));\n#ifdef USE_TANGENT\nobjectTangent = rotatePart(objectTangent, texture2D(partRotation, vec2((partIndex + 0.5) / stateWidth, 0.5)));\n#endif");
    };
    const selectedData = new Uint8Array(width * 4),
      selectionTexture = new T.DataTexture(selectedData, width, 1);
    selectionTexture.needsUpdate = true;
    const materials: T.Material[] = [],
      geometries: T.BufferGeometry[] = [],
      pickers: (T.Mesh | undefined)[] = [],
      centers = atlas.parts.map((p) =>
        new T.Vector3()
          .fromArray(p.bounds[0])
          .add(new T.Vector3().fromArray(p.bounds[1]))
          .multiplyScalar(0.5),
      );
    const offsets: T.Vector3[] = [],
      bounds = atlas.parts.map(
        (p) =>
          new T.Box3(
            new T.Vector3().fromArray(p.bounds[0]),
            new T.Vector3().fromArray(p.bounds[1]),
          ),
      );
    let packingWidth = 1,
      packingHeight = 1;
    const markerPositions = new Float32Array(atlas.parts.length * 3),
      markerGeometry = new T.BufferGeometry();
    markerGeometry.setAttribute("position", new T.BufferAttribute(markerPositions, 3));
    const markerMaterial = new T.PointsMaterial({
      color: 0x64748b,
      size: 5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.72,
      depthTest: false,
    });
    markerMaterial.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <clipping_planes_fragment>",
        "#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;",
      );
    };
    const markers = new T.Points(markerGeometry, markerMaterial);
    markers.frustumCulled = false;
    markers.renderOrder = 10;
    markers.visible = false;
    scene.add(markers);
    const pulpGroups: (T.Group | undefined)[] = [];
    const clipPlane = new T.Plane();
    let lastClippingKey = "";
    let lastRctMode: boolean | undefined = undefined;
    const hover = document.createElement("div");
    hover.className = "part-hover";
    hover.setAttribute("role", "tooltip");
    hover.hidden = true;
    el.appendChild(hover);

    // Stencil Solid Clipping Caps Setup
    const stencilBackMat = new T.MeshBasicMaterial({
      depthWrite: false,
      depthTest: false,
      colorWrite: false,
      stencilWrite: true,
      stencilFunc: T.AlwaysStencilFunc,
      side: T.BackSide,
      stencilFail: T.KeepStencilOp,
      stencilZFail: T.IncrementWrapStencilOp,
      stencilZPass: T.IncrementWrapStencilOp,
    });
    const stencilFrontMat = new T.MeshBasicMaterial({
      depthWrite: false,
      depthTest: false,
      colorWrite: false,
      stencilWrite: true,
      stencilFunc: T.AlwaysStencilFunc,
      side: T.FrontSide,
      stencilFail: T.KeepStencilOp,
      stencilZFail: T.DecrementWrapStencilOp,
      stencilZPass: T.DecrementWrapStencilOp,
    });
    const injectStencilShader = (mat: T.MeshBasicMaterial) => {
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.partState = { value: partTexture };
        shader.uniforms.stateWidth = { value: width };
        shader.vertexShader =
          "attribute float partIndex; uniform sampler2D partState; uniform float stateWidth; varying float partVisible;\n" +
          shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w;",
        );
        injectRotation(shader);
        shader.fragmentShader = "varying float partVisible;\n" + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <clipping_planes_fragment>",
          "#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;",
        );
      };
    };
    injectStencilShader(stencilBackMat);
    injectStencilShader(stencilFrontMat);

    const capGeo = new T.PlaneGeometry(3, 3);
    const capMat = new T.MeshStandardMaterial({
      color: 0xeadcc9,
      roughness: 0.68,
      metalness: 0.05,
      stencilWrite: true,
      stencilRef: 0,
      stencilFunc: T.NotEqualStencilFunc,
      stencilFail: T.ReplaceStencilOp,
      stencilZFail: T.ReplaceStencilOp,
      stencilZPass: T.ReplaceStencilOp,
      side: T.DoubleSide,
    });
    const capMesh = new T.Mesh(capGeo, capMat);
    capMesh.renderOrder = 2;
    capMesh.frustumCulled = false;
    capMesh.visible = false;
    capMesh.onAfterRender = (r) => {
      r.clearStencil();
    };
    scene.add(capMesh);
    const stencilGroup = new T.Group();
    stencilGroup.visible = false;
    scene.add(stencilGroup);

    // Stencil Pulp Cavity Clipping Caps Setup (Red Cut Cross-Section)
    const pulpStencilBackMat = new T.MeshBasicMaterial({
      depthWrite: false,
      depthTest: false,
      colorWrite: false,
      stencilWrite: true,
      stencilFunc: T.AlwaysStencilFunc,
      side: T.BackSide,
      stencilFail: T.KeepStencilOp,
      stencilZFail: T.IncrementWrapStencilOp,
      stencilZPass: T.IncrementWrapStencilOp,
    });
    const pulpStencilFrontMat = new T.MeshBasicMaterial({
      depthWrite: false,
      depthTest: false,
      colorWrite: false,
      stencilWrite: true,
      stencilFunc: T.AlwaysStencilFunc,
      side: T.FrontSide,
      stencilFail: T.KeepStencilOp,
      stencilZFail: T.DecrementWrapStencilOp,
      stencilZPass: T.DecrementWrapStencilOp,
    });
    const pulpCapGeo = new T.PlaneGeometry(3, 3);
    const pulpCapMat = new T.MeshStandardMaterial({
      color: 0xc85057,
      roughness: 0.65,
      metalness: 0,
      stencilWrite: true,
      stencilRef: 0,
      stencilFunc: T.NotEqualStencilFunc,
      stencilFail: T.ReplaceStencilOp,
      stencilZFail: T.ReplaceStencilOp,
      stencilZPass: T.ReplaceStencilOp,
      side: T.DoubleSide,
      depthTest: true,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const pulpCapMesh = new T.Mesh(pulpCapGeo, pulpCapMat);
    pulpCapMesh.renderOrder = 5;
    pulpCapMesh.frustumCulled = false;
    pulpCapMesh.visible = false;
    pulpCapMesh.onAfterRender = (r) => {
      r.clearStencil();
    };
    scene.add(pulpCapMesh);

    // 3D Interactive Ruler Setup
    const rulerGroup = new T.Group();
    rulerGroup.visible = false;
    scene.add(rulerGroup);

    const sphereGeoA = new T.SphereGeometry(1, 16, 16);
    const sphereMatA = new T.MeshBasicMaterial({ color: 0x06b6d4, depthTest: false });
    const markerA = new T.Mesh(sphereGeoA, sphereMatA);
    markerA.renderOrder = 20;
    markerA.visible = false;
    rulerGroup.add(markerA);

    const sphereGeoB = new T.SphereGeometry(1, 16, 16);
    const sphereMatB = new T.MeshBasicMaterial({ color: 0x10b981, depthTest: false });
    const markerB = new T.Mesh(sphereGeoB, sphereMatB);
    markerB.renderOrder = 20;
    markerB.visible = false;
    rulerGroup.add(markerB);

    const lineGeo = new T.BufferGeometry();
    lineGeo.setAttribute("position", new T.BufferAttribute(new Float32Array(6), 3));
    const lineMat = new T.LineBasicMaterial({
      color: 0x00f2fe,
      depthTest: false,
      transparent: true,
      opacity: 0.95,
      linewidth: 2,
    });
    const rulerLine = new T.Line(lineGeo, lineMat);
    rulerLine.renderOrder = 19;
    rulerLine.visible = false;
    rulerGroup.add(rulerLine);

    let rulerPointA: T.Vector3 | null = null;
    let rulerPointB: T.Vector3 | null = null;
    let rulerPreview: T.Vector3 | null = null;
    let rulerPartA: Atlas["parts"][number] | null = null;
    let rulerPartB: Atlas["parts"][number] | null = null;

    const rulerBadge = document.createElement("div");
    rulerBadge.className = "ruler-3d-badge";
    rulerBadge.hidden = true;
    el.appendChild(rulerBadge);
    const endpointLabels = ["A", "B"].map((name) => {
      const label = document.createElement("span"); label.className = "ruler-point-label";
      label.textContent = name; label.hidden = true; el.appendChild(label); return label;
    });

    // Fascial Spaces & Clinical Infection Spread Setup
    const fascialGroup = new T.Group();
    fascialGroup.visible = false;
    scene.add(fascialGroup);

    const fascialMeshes = new Map<string, T.Mesh>();
    fetch("/fascial/atlas.json", { signal: abort.signal }).then(async (response) => {
      if (!response.ok) throw Error("间隙示意目录加载失败");
      const manifest = await response.json() as { bytes: number; url: string; gzip: string; parts: { id: string; vertexCount: number; indexCount: number; positions: number; indices: number }[] };
      const buffer = await decodeModelResponse(await fetch(manifest.gzip, { signal: abort.signal }), manifest.bytes, true);
      if (disposed) return;
      for (const part of manifest.parts) {
        const space = FASCIAL_SPACES.find((s) => s.id === part.id);
        if (!space) throw Error("未知间隙结构");
        const geometry = new T.BufferGeometry();
        geometry.setAttribute("position", new T.BufferAttribute(new Float32Array(buffer, part.positions, part.vertexCount * 3), 3));
        geometry.setIndex(new T.BufferAttribute(new Uint32Array(buffer, part.indices, part.indexCount), 1));
        geometry.computeVertexNormals();
        const material = new T.MeshStandardMaterial({ color: space.color, transparent: true, opacity: .7, roughness: .7, depthWrite: false, side: T.FrontSide });
        const mesh = new T.Mesh(geometry, material);
        mesh.userData = { spaceId: space.id }; mesh.renderOrder = 5;
        mesh.visible = latest.current.fascialActiveSpaceId === space.id;
        fascialGroup.add(mesh); fascialMeshes.set(space.id, mesh);
      }
      dirty = true;
    }).catch((error) => { if (!disposed && error.name !== "AbortError") onError("间隙示意加载失败，请刷新重试。"); });
    let canalModel: CanalModel | null = null;
    let lastCanalKey = "";
    let lastCanalMode = false;
    const canalLoading = loadCanalModel(abort.signal).then((model) => {
      if (disposed) { model.dispose(); return; }
      canalModel = model; scene.add(model.group); lastCanalKey = ""; dirty = true;
    });
    const fascialUniform = { value: 0 };
    let lastFascialClip = "";
    let lastFascialMode = false;
    let lastFascialPathId = "";
    let lastFascialSpaceId = "";
    type Target = {
      index: number;
      x: number;
      y: number;
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
    let targets: Target[] = [];
    const projected = new T.Vector3();
    const findTarget = (x: number, y: number, radius: number) => {
      let best = -1,
        score = Infinity;
      for (const t of targets) {
        const dx = Math.max(t.left - x, 0, x - t.right),
          dy = Math.max(t.top - y, 0, y - t.bottom),
          distance = Math.hypot(dx, dy);
        if (distance > radius) continue;
        const candidate = distance + Math.hypot(t.x - x, t.y - y) * 0.025;
        if (candidate < score) {
          score = candidate;
          best = t.index;
        }
      }
      return best;
    };
    const materialFor = (system: string) => {
      const m = new T.MeshStandardMaterial({
        color: SYSTEMS.find((s) => s.id === system)?.color ?? "#aebbb8",
        metalness: 0.08,
        roughness: 0.53,
        side: T.DoubleSide,
        transparent: system === "integumentary",
        opacity: system === "integumentary" ? 0.1 : 1,
        depthWrite: system !== "integumentary",
      });
      m.onBeforeCompile = (shader) => {
        shader.uniforms.fascialMode = fascialUniform;
        shader.uniforms.partState = { value: partTexture };
        shader.uniforms.selectionState = { value: selectionTexture };
        shader.uniforms.stateWidth = { value: width };
        shader.vertexShader =
          "attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; varying float partVisible; varying float partSelected;\n" +
          shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w; partSelected = texture2D(selectionState, stateUv).r;",
        );
        injectRotation(shader);
        shader.fragmentShader =
          "uniform float fascialMode; varying float partVisible; varying float partSelected;\n" + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <clipping_planes_fragment>",
          "#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;",
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.85, 0.78), partSelected * 0.75); if (fascialMode > 0.5) diffuseColor.a *= mix(0.12, 0.55, partSelected);",
        );
      };
      materials.push(m);
      return m;
    };
    const mats = new Map(SYSTEMS.map((s) => [s.id, materialFor(s.id)]));
    let loaded = 0;
    const loadChunk = async (ci: number) => {
      const chunk = atlas.chunks[ci],
        compressed = !!chunk.gzip && typeof DecompressionStream !== "undefined";
      const response = await fetch(compressed ? chunk.gzip! : chunk.url, { signal: abort.signal });
      const buffer = await decodeModelResponse(response, chunk.bytes, compressed);
      if (disposed) return;
      const groups = new Map<string, T.BufferGeometry[]>();
      atlas.parts.forEach((p, i) => {
        if (p.chunk !== ci) return;
        const g = new T.BufferGeometry();
        g.setAttribute(
          "position",
          new T.BufferAttribute(new Float32Array(buffer, p.positions, p.vertexCount * 3), 3),
        );
        // GPU normalized signed-short normals keep the complete atlas compact in memory.
        g.setAttribute(
          "normal",
          new T.BufferAttribute(new Int16Array(buffer, p.normals, p.vertexCount * 3), 3, true),
        );
        g.setIndex(new T.BufferAttribute(new Uint32Array(buffer, p.indices, p.indexCount), 1));
        const dentalFrame = createDentalFrame(p, atlas.parts, g.attributes.position.array);
        if (dentalFrame) dentalFrames.set(p.id, dentalFrame);
        layoutKey = "";
        g.boundingBox = bounds[i].clone();
        g.computeBoundingSphere();
        const pick = new T.Mesh(g);
        pick.matrixAutoUpdate = false;
        pickers[i] = pick;
        geometries.push(g);
        g.setAttribute(
          "partIndex",
          new T.BufferAttribute(new Float32Array(p.vertexCount).fill(i), 1),
        );
        const list = groups.get(p.system) ?? [];
        list.push(g);
        groups.set(p.system, list);
      });
      groups.forEach((gs, system) => {
        const geometry = mergeGeometries(gs, false);
        if (!geometry) throw new Error("模型组装失败，请刷新后重试。");
        geometries.push(geometry);
        const mesh = new T.Mesh(geometry, mats.get(system as never));
        mesh.frustumCulled = false;
        mesh.renderOrder = 3;
        scene.add(mesh);

        const backMesh = new T.Mesh(geometry, stencilBackMat);
        backMesh.frustumCulled = false;
        backMesh.renderOrder = 1;
        stencilGroup.add(backMesh);

        const frontMesh = new T.Mesh(geometry, stencilFrontMat);
        frontMesh.frustumCulled = false;
        frontMesh.renderOrder = 1;
        stencilGroup.add(frontMesh);
      });
      lastState = null;
      loaded++;
      onProgress(Math.round((loaded / atlas.chunks.length) * 95));
      dirty = true;
    };
    (async () => {
      try {
        let cursor = 0;
        const [pulpData] = await Promise.all([
          loadPulpData(atlas, abort.signal),
          canalLoading,
          ...Array.from({ length: 3 }, async () => {
            while (cursor < atlas.chunks.length) {
              const i = cursor++;
              await loadChunk(i);
            }
          }),
        ]);
        if (!disposed) {
          for (const part of pulpData.manifest.parts) {
            const index = atlas.parts.findIndex((p) => p.id === part.id);
            const group = createPulpCavityGeometry(part, pulpData.buffer);
            const pulpMesh = group.children[0] as T.Mesh;
            pulpMesh.renderOrder = 6;

            const pulpBackMesh = new T.Mesh(pulpMesh.geometry, pulpStencilBackMat);
            pulpBackMesh.renderOrder = 4;
            pulpBackMesh.frustumCulled = false;
            group.add(pulpBackMesh);

            const pulpFrontMesh = new T.Mesh(pulpMesh.geometry, pulpStencilFrontMat);
            pulpFrontMesh.renderOrder = 4;
            pulpFrontMesh.frustumCulled = false;
            group.add(pulpFrontMesh);

            pulpGroups[index] = group;
            scene.add(group);
          }
          lastClippingKey = "";
          ready = true;
          onProgress(100);
          dirty = true;
        }
      } catch (e) {
        if (!disposed) onError(e instanceof Error ? e.message : "模型加载失败，请刷新后重试。");
      }
    })();
    const fit = (view: string, extent = 0) => {
      const box = new T.Box3();
      atlas.parts.forEach((p, i) => {
        if (isVisible(p, latest.current)) box.union(bounds[i]);
      });
      if (latest.current.canalMode) box.set(new T.Vector3(...CANAL_MODEL_BOUNDS[0]), new T.Vector3(...CANAL_MODEL_BOUNDS[1]));
      if (latest.current.fascialMode && !box.isEmpty()) { box.max.y = Math.min(box.max.y, .305); box.min.y = Math.max(box.min.y, .19); }
      if (box.isEmpty()) box.set(new T.Vector3(-0.15, 0, -0.15), new T.Vector3(0.15, 0.42, 0.15));
      const center = box.getCenter(new T.Vector3()),
        size = box.getSize(new T.Vector3());
      const normalDistance =
        (Math.max(size.y, size.x / camera.aspect, size.z) /
          (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)))) *
        1.32;
      const atlasDistance =
        (Math.max(packingHeight, packingWidth / camera.aspect) /
          (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)))) *
        1.2;
      const distance = T.MathUtils.lerp(
        Math.max(latest.current.canalMode ? .04 : .07, normalDistance),
        Math.max(0.2, atlasDistance),
        extent,
      );
      const direction =
        view === "front"
          ? new T.Vector3(0, 0, 1)
          : view === "back"
            ? new T.Vector3(0, 0, -1)
            : view === "side"
              ? new T.Vector3(1, 0, 0)
              : new T.Vector3(0.55, 0.15, 1).normalize();
      const orbit = new T.Spherical().setFromVector3(direction);
      orbit.theta *= 1 - extent;
      orbit.phi = T.MathUtils.lerp(orbit.phi, Math.PI / 2, extent);
      direction.setFromSpherical(orbit);
      const targetCenter = center.clone();
      // Keep the same center throughout expansion and collapse.
      targetCenter.y += Math.min(0.016, size.y * 0.03);
      controls.target.copy(targetCenter);
      camera.position.copy(controls.target).addScaledVector(direction, distance);
      controls.update();
      dirty = true;
    };
    const resize = () => {
      layoutKey = "";
      lastState = null;
      renderer.setPixelRatio(
        Math.min(devicePixelRatio, el.clientWidth < 768 || el.clientHeight < 600 ? 1.5 : 2),
      );
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
      fit(latest.current.view, amount);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    const raycaster = new T.Raycaster(),
      pointer = new T.Vector2(),
      tap = new PointerTap(),
      worldBox = new T.Box3(),
      hitPoint = new T.Vector3();
    const pickSurface = () => {
      let result: { index: number; point: T.Vector3; distance: number } | null = null;
      pickers.forEach((mesh, i) => {
        if (!mesh || data[i*4+3] < .5) return;
        worldBox.copy(bounds[i]).applyMatrix4(mesh.matrixWorld);
        if (!raycaster.ray.intersectBox(worldBox, hitPoint)) return;
        const hit = raycaster.intersectObject(mesh, false).find((h) =>
          !latest.current.clipping?.enabled || retainedByPlane(h.point.toArray(), clipPlane.normal.toArray(), clipPlane.constant));
        if (hit && (!result || hit.distance < result.distance)) result = { index: i, point: hit.point, distance: hit.distance };
      });
      return result as { index: number; point: T.Vector3; distance: number } | null;
    };
    let rulerContext = "";
    const down = (e: PointerEvent) => {
      hover.hidden = true;
      tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === "touch" ? 12 : 5);
      const s = latest.current;
      const isDentalUnfolded = s.preset === "dental" && amount > 0.85;
      if (isDentalUnfolded && e.button === 0) {
        isToothDragging = true;
        toothDragPointerId = e.pointerId;
        toothDragLastX = e.clientX;
        toothDragLastY = e.clientY;
        const rect = renderer.domElement.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        const hitIndex = findTarget(startX, startY, 24);
        const hitTooth = hitIndex >= 0 ? dentalTeeth[hitIndex] : null;
        if (hitTooth) {
          toothDragIsRight = hitTooth.quadrant === 2 || hitTooth.quadrant === 3;
          toothDragIsLower = hitTooth.quadrant === 3 || hitTooth.quadrant === 4;
        } else {
          toothDragIsRight = startX >= rect.width / 2;
          toothDragIsLower = startY >= rect.height / 2;
        }
        try {
          renderer.domElement.setPointerCapture(e.pointerId);
        } catch {}
      }
    };
    const move = (e: PointerEvent) => {
      tap.move(e.pointerId, e.clientX, e.clientY);
      if (isToothDragging && e.pointerId === toothDragPointerId) {
        const dx = e.clientX - toothDragLastX;
        const dy = e.clientY - toothDragLastY;
        toothDragLastX = e.clientX;
        toothDragLastY = e.clientY;

        const deltaMesial = (toothDragIsRight ? -dx : dx) * 0.008;
        const deltaOcclusal = (toothDragIsLower ? -dy : dy) * 0.008;

        targetMesialAngle += deltaMesial;
        targetOcclusalAngle = Math.max(-1.55, Math.min(1.55, targetOcclusalAngle + deltaOcclusal));
        renderer.domElement.style.cursor = "grabbing";
        dirty = true;
        return;
      }
      if (latest.current.rulerMode) {
        if (amount > .0001) return;
        hover.hidden = true;
        renderer.domElement.style.cursor = "crosshair";
        if (rulerPointA && !rulerPointB) {
          const rect = renderer.domElement.getBoundingClientRect();
          pointer.set(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            (-(e.clientY - rect.top) / rect.height) * 2 + 1,
          );
          raycaster.setFromCamera(pointer, camera);
          const hoverHit = e.buttons ? null : pickSurface()?.point;
          rulerPreview = hoverHit?.clone() ?? null;
          if (hoverHit) {
            const posAttr = rulerLine.geometry.attributes.position as T.BufferAttribute;
            posAttr.setXYZ(0, rulerPointA.x, rulerPointA.y, rulerPointA.z);
            posAttr.setXYZ(1, (hoverHit as T.Vector3).x, (hoverHit as T.Vector3).y, (hoverHit as T.Vector3).z);
            posAttr.needsUpdate = true;
            rulerLine.geometry.computeBoundingSphere();
            rulerLine.visible = true;
            const dist = rulerPointA.distanceTo(hoverHit) * 1000;
            rulerBadge.hidden = false;
            rulerBadge.innerHTML = `<span class="ruler-pill-badge">${dist.toFixed(1)} mm</span>`;
            projected.copy(rulerPointA).add(hoverHit).multiplyScalar(0.5).project(camera);
            rulerBadge.style.left = `${((projected.x + 1) * el.clientWidth) / 2}px`;
            rulerBadge.style.top = `${((1 - projected.y) * el.clientHeight) / 2}px`;
            dirty = true;
          } else { rulerLine.visible = false; rulerBadge.innerHTML = '<span class="ruler-pill-badge hint">A · 请选择终点 B</span>'; dirty = true; }
        }
        return;
      }
      if (e.buttons || amount < 0.5 || e.pointerType === "touch") {
        hover.hidden = true;
        return;
      }
      const rect = el.getBoundingClientRect(),
        x = e.clientX - rect.left,
        y = e.clientY - rect.top,
        index = findTarget(x, y, 12);
      hover.hidden = index < 0;
      renderer.domElement.style.cursor = index < 0 ? (latest.current.preset === "dental" && amount > 0.85 ? "grab" : "grab") : "pointer";
      if (index >= 0) {
        const part = atlas.parts[index];
        const study = getStudyEntry(part.conceptId, [part.id]);
        hover.textContent = study?.displayName
          ? `${study.displayName} · ${part.name}`
          : part.name;
        hover.style.left = `${Math.max(8, Math.min(x + 14, el.clientWidth - 280))}px`;
        hover.style.top = `${Math.max(8, Math.min(y + 18, el.clientHeight - 55))}px`;
      }
    };
    const cancel = (e: PointerEvent) => {
      tap.cancel(e.pointerId);
      if (e.pointerId === toothDragPointerId) {
        isToothDragging = false;
        try {
          renderer.domElement.releasePointerCapture(e.pointerId);
        } catch {}
      }
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId === toothDragPointerId) {
        isToothDragging = false;
        try {
          renderer.domElement.releasePointerCapture(e.pointerId);
        } catch {}
      }
      const validTap = tap.up(e.pointerId, e.clientX, e.clientY);
      if (!validTap || !ready || latest.current.canalMode) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);

      if (latest.current.rulerMode) {
        if (amount > 0.0001) return;
        const hit = pickSurface();
        if (!hit) return;
        const part = atlas.parts[hit.index];
        const label = { ...part, name: getStudyEntry(part.conceptId, [part.id])?.displayName ?? part.name };
        if (!rulerPointA) {
          rulerPointA = hit.point.clone(); rulerPartA = label;
          markerA.position.copy(rulerPointA); markerA.visible = true;
          rulerBadge.innerHTML = '<span class="ruler-pill-badge hint">A · 请选择终点 B</span>';
          measure.current?.(measurePoints(rulerPointA.toArray(), rulerPointA.toArray(), label));
        } else if (!rulerPointB) {
          rulerPointB = hit.point.clone(); rulerPartB = label;
          markerB.position.copy(rulerPointB); markerB.visible = true;
          const pos = rulerLine.geometry.attributes.position as T.BufferAttribute;
          pos.setXYZ(0, ...rulerPointA.toArray()); pos.setXYZ(1, ...rulerPointB.toArray()); pos.needsUpdate = true;
          rulerLine.geometry.computeBoundingSphere(); rulerLine.visible = true;
          const result = measurePoints(rulerPointA.toArray(), rulerPointB.toArray(), rulerPartA ?? undefined, rulerPartB);
          measure.current?.(result);
          rulerBadge.innerHTML = `<span class="ruler-pill-badge active">A ↔ B · ${result.distanceMm.toFixed(1)} mm</span>`;
        } // Completed pairs remain fixed until the explicit reset button is used.
        rulerBadge.hidden = false; dirty = true;
        return;
      }

      if (latest.current.fascialMode) {
        const fascialHits = raycaster.intersectObjects(fascialGroup.children.filter((m) => m.visible), false);
        const hitSpace = fascialHits.find((h) => h.object.userData?.spaceId && (!latest.current.clipping?.enabled || retainedByPlane(h.point.toArray(), clipPlane.normal.toArray(), clipPlane.constant)));
        if (hitSpace?.object.userData?.spaceId) {
          selectFascial.current?.(hitSpace.object.userData.spaceId);
          return;
        }
      }

      let nearest = Infinity,
        found = -1;
      const hasSolid = atlas.parts.some(
        (p, i) => p.system !== "integumentary" && data[i * 4 + 3] > 0.5,
      );
      pickers.forEach((mesh, i) => {
        if (
          !mesh ||
          data[i * 4 + 3] < 0.5 ||
          (hasSolid && atlas.parts[i].system === "integumentary")
        )
          return;
        worldBox.copy(bounds[i]).applyMatrix4(mesh.matrixWorld);
        if (!raycaster.ray.intersectBox(worldBox, hitPoint)) return;
        const hits = raycaster.intersectObject(mesh, false);
        if (hits[0] && hits[0].distance < nearest) {
          nearest = hits[0].distance;
          found = i;
        }
      });
      if (found < 0 && amount > 0.45)
        found = findTarget(
          e.clientX - rect.left,
          e.clientY - rect.top,
          e.pointerType === "touch" ? 24 : 16,
        );
      if (found >= 0) {
        hover.hidden = true;
        select.current(atlas.parts[found].id);
      }
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointermove", move);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", cancel);
    const dblclick = () => {
      if (latest.current.preset === "dental" && amount > 0.85) {
        targetMesialAngle = 0;
        targetOcclusalAngle = 0;
        dirty = true;
      }
    };
    renderer.domElement.addEventListener("dblclick", dblclick);
    const clock = new T.Clock();
    let lastExtent = -1;
    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05),
        s = latest.current;
      const isDentalPreset = s.preset === "dental";
      const isDentalUnfolded = isDentalPreset && amount > 0.85;
      const unfoldFactor = isDentalPreset ? Math.max(0, Math.min(1, (amount - 0.7) / 0.25)) : 0;

      const anglesMoving =
        Math.abs(currentMesialAngle - targetMesialAngle) > 1e-4 ||
        Math.abs(currentOcclusalAngle - targetOcclusalAngle) > 1e-4;
      if (anglesMoving) {
        currentMesialAngle = T.MathUtils.damp(currentMesialAngle, targetMesialAngle, 14, dt);
        currentOcclusalAngle = T.MathUtils.damp(currentOcclusalAngle, targetOcclusalAngle, 14, dt);
        dirty = true;
      }

      const changed =
        lastState?.visible !== s.visible ||
        lastState?.selected !== s.selected ||
        lastState?.isolate !== s.isolate ||
        lastState?.scope !== s.scope ||
        lastState?.hidden !== s.hidden ||
        lastState?.canalMode !== s.canalMode ||
        lastState?.fascialMode !== s.fascialMode ||
        lastState?.fascialActiveSpaceId !== s.fascialActiveSpaceId;
      const moving = Math.abs(amount - s.explode) > 0.0001;
      if (moving) {
        amount = T.MathUtils.damp(amount, s.explode, 8, dt);
        dirty = true;
      }
      if (changed || moving || (unfoldFactor > 0 && (anglesMoving || dirty)) || lastExtent < 0) {
        const visible = new Set(s.visible),
          selection = new Set(s.selected);
        const visibleParts = atlas.parts.filter((p) => isVisible(p, s));
        const nextLayoutKey =
          visibleParts.map((p) => p.id).join(",") + ":" + camera.aspect.toFixed(3);
        if (nextLayoutKey !== layoutKey) {
          const layout = createExplosionLayout(visibleParts, camera.aspect, dentalFrames);
          packingWidth = layout.width;
          packingHeight = layout.height;
          const layoutBounds = new T.Box3();
          atlas.parts.forEach((p, i) => { if (isVisible(p, s)) layoutBounds.union(bounds[i]); });
          const layoutCenter = layoutBounds.isEmpty() ? new T.Vector3(0, .25, 0) : layoutBounds.getCenter(new T.Vector3());
          atlas.parts.forEach((p, i) => {
            const cell = layout.cells.get(p.id);
            targetRotations[i].copy(cell?.rotation ?? new T.Quaternion());
            offsets[i] = cell ? new T.Vector3(cell.x + layoutCenter.x, cell.y + layoutCenter.y, layoutCenter.z).sub(cell.centerOffset ?? new T.Vector3()) : centers[i].clone();
          });
          layoutKey = nextLayoutKey;
          if (amount > 0.05 && !s.isolate) fit(s.view, amount);
        }

        atlas.parts.forEach((p, i) => {
          const c = centers[i],
            destination = offsets[i];
          const tooth = dentalTeeth[i];
          if (tooth && unfoldFactor > 0.001) {
            const effMesial = currentMesialAngle * unfoldFactor;
            const effOcclusal = currentOcclusalAngle * unfoldFactor;
            const q = tooth.quadrant;
            const yaw = (q === 1 || q === 4) ? -effMesial : effMesial;
            const pitch = (q === 1 || q === 2) ? -effOcclusal : effOcclusal;
            interactiveEuler.set(pitch, yaw, 0, "YXZ");
            interactiveQuat.setFromEuler(interactiveEuler);
            finalTargetRot.copy(targetRotations[i]).premultiply(interactiveQuat);
            rotations[i].identity().slerp(finalTargetRot, amount);
          } else {
            // One reversible path, with the same progress used for camera framing.
            rotations[i].identity().slerp(targetRotations[i], amount);
          }
          rotations[i].toArray(rotationData, i * 4);
          const movedCenter = c.clone().lerp(destination, amount);
          const rotatedCenter = c.clone().applyQuaternion(rotations[i]);
          const dx = movedCenter.x - rotatedCenter.x,
            dy = movedCenter.y - rotatedCenter.y,
            dz = movedCenter.z - rotatedCenter.z;
          const selected = s.fascialMode ? !!FASCIAL_SPACES.find((space) => space.id === s.fascialActiveSpaceId)?.boundaryParts.includes(p.id) : selection.has(p.id);
          data.set([dx, dy, dz, isVisible(p, s) ? 1 : 0], i * 4);
          selectedData[i * 4] = selected ? 255 : 0;
          markerPositions.set(
            data[i * 4 + 3] > 0.5 ? [movedCenter.x, movedCenter.y, movedCenter.z] : [10000, 10000, 10000],
            i * 3,
          );
          const mesh = pickers[i];
          if (mesh) {
            mesh.quaternion.copy(rotations[i]);
            mesh.position.set(dx, dy, dz);
            mesh.updateMatrix();
            mesh.updateMatrixWorld(true);
          }
        });
        rotationTexture.needsUpdate = true;
        partTexture.needsUpdate = true;
        selectionTexture.needsUpdate = true;
        markerGeometry.attributes.position.needsUpdate = true;
        lastState = s;
        lastExtent = amount;
        dirty = true;
      }
      if (s.view !== lastView || s.reset !== lastReset) {
        fit(s.view, amount);
        lastView = s.view;
        lastReset = s.reset;
        targetMesialAngle = 0;
        targetOcclusalAngle = 0;
      }
      if (moving && !s.isolate)
        fit(s.view, amount);
      const isolateKey = s.isolate
        ? s.selected.join(",") + ":" + s.reset + ":" + s.view + ":" + camera.aspect
        : "";
      if (isolateKey !== lastIsolate || (s.isolate && moving)) {
        fit(s.view, 0);
        lastIsolate = isolateKey;
      }
      controls.minDistance = s.canalMode ? .028 : .07;
      controls.enableRotate = !isDentalUnfolded && amount < 0.8;
      controls.enablePan = !isDentalUnfolded;
      controls.mouseButtons.LEFT = amount < 0.8 ? T.MOUSE.ROTATE : T.MOUSE.PAN;
      controls.touches.ONE = amount < 0.8 ? T.TOUCH.ROTATE : T.TOUCH.PAN;
      ground.visible = platform.visible = ring.visible = innerRing.visible = false;
      markers.visible = amount > 0.75;
      controls.autoRotate = !s.rulerMode && s.rotate && !s.isolate && amount < 0.4;
      controls.autoRotateSpeed = 0.65;
      controls.update();
      if (controls.autoRotate) dirty = true;

      // Update Clipping Plane
      const clipping = s.clipping;
      const clippingKey = clipping?.enabled
        ? `${s.canalMode}:${clipping.axis}:${clipping.offset}:${clipping.inverted}:${clipping.solidCap !== false}`
        : "disabled";
      if (clippingKey !== lastClippingKey) {
        lastClippingKey = clippingKey;
        if (clipping?.enabled) {
          const targetBox = new T.Box3();
          atlas.parts.forEach((p, i) => {
            if (isVisible(p, s)) targetBox.union(bounds[i]);
          });
          if (s.canalMode) targetBox.set(new T.Vector3(...CANAL_MODEL_BOUNDS[0]), new T.Vector3(...CANAL_MODEL_BOUNDS[1]));
          if (targetBox.isEmpty()) {
            targetBox.set(new T.Vector3(-0.15, 0, -0.15), new T.Vector3(0.15, 0.42, 0.15));
          }
          const minV =
            clipping.axis === "x"
              ? targetBox.min.x
              : clipping.axis === "y"
                ? targetBox.min.y
                : targetBox.min.z;
          const maxV =
            clipping.axis === "x"
              ? targetBox.max.x
              : clipping.axis === "y"
                ? targetBox.max.y
                : targetBox.max.z;
          const posVal = T.MathUtils.lerp(minV, maxV, (clipping.offset + 100) / 200);

          const normal = new T.Vector3(
            clipping.axis === "x" ? (clipping.inverted ? 1 : -1) : 0,
            clipping.axis === "y" ? (clipping.inverted ? 1 : -1) : 0,
            clipping.axis === "z" ? (clipping.inverted ? 1 : -1) : 0,
          );
          const constant = (clipping.inverted ? -1 : 1) * posVal;
          clipPlane.set(normal, constant);

          materials.forEach((m) => {
            m.clippingPlanes = [clipPlane];
            m.clipIntersection = false;
          });
          stencilBackMat.clippingPlanes = [clipPlane];
          stencilFrontMat.clippingPlanes = [clipPlane];
          pulpStencilBackMat.clippingPlanes = [clipPlane];
          pulpStencilFrontMat.clippingPlanes = [clipPlane];

          const planePoint = clipPlane.normal.clone().multiplyScalar(-clipPlane.constant);
          capMesh.position.copy(planePoint);
          capMesh.lookAt(planePoint.clone().add(clipPlane.normal));

          pulpCapMesh.position.copy(planePoint);
          pulpCapMesh.lookAt(planePoint.clone().add(clipPlane.normal));

          const solid = !s.canalMode && clipping.solidCap !== false;
          capMesh.visible = solid;
          stencilGroup.visible = solid;
          pulpCapMesh.visible = solid;

          pulpGroups.forEach((g) => {
            g?.traverse((child) => {
              if (child instanceof T.Mesh && child.material) {
                child.material.clippingPlanes = [clipPlane];
              }
            });
          });
        } else {
          materials.forEach((m) => {
            m.clippingPlanes = [];
          });
          stencilBackMat.clippingPlanes = [];
          stencilFrontMat.clippingPlanes = [];
          pulpStencilBackMat.clippingPlanes = [];
          pulpStencilFrontMat.clippingPlanes = [];
          capMesh.visible = false;
          stencilGroup.visible = false;
          pulpCapMesh.visible = false;
          pulpGroups.forEach((g) => {
            g?.traverse((child) => {
              if (child instanceof T.Mesh && child.material) {
                child.material.clippingPlanes = [];
              }
            });
          });
        }
        dirty = true;
      }

      const canalKey = JSON.stringify([s.canalMode, s.canalType, s.canalSection, s.canalShell, s.canalShellOpacity, clippingKey]);
      if (canalKey !== lastCanalKey) {
        lastCanalKey = canalKey; canalModel?.update(s, clipPlane);
        if (!!s.canalMode !== lastCanalMode) { lastCanalMode = !!s.canalMode; fit(s.view, amount); }
        dirty = true;
      }
      const nextRulerContext = JSON.stringify([s.rulerMode, s.rulerReset, s.scope, s.hidden, s.visible, s.isolate, s.isolate ? s.selected : [], s.clipping]);
      if (nextRulerContext !== rulerContext) {
        rulerContext = nextRulerContext;
        rulerPointA = rulerPointB = rulerPreview = null; rulerPartA = rulerPartB = null;
        markerA.visible = markerB.visible = rulerLine.visible = false;
        rulerBadge.hidden = true; measure.current?.(null); dirty = true;
      }
      for (const marker of [markerA, markerB]) {
        const pixelScale = 2 * camera.position.distanceTo(marker.position) * Math.tan(T.MathUtils.degToRad(camera.fov / 2)) / Math.max(1, el.clientHeight);
        marker.scale.setScalar(pixelScale * 4);
      }
      // Update Ruler visibility & 3D badge projection
      if (!s.rulerMode && rulerGroup.visible) {
        rulerGroup.visible = false;
        markerA.visible = false;
        markerB.visible = false;
        rulerLine.visible = false;
        rulerBadge.hidden = true;
        rulerPointA = null;
        rulerPointB = null;
        dirty = true;
      } else if (s.rulerMode && !rulerGroup.visible) {
        rulerGroup.visible = true;
        dirty = true;
      }
      if (s.rulerMode && rulerPointA && !rulerBadge.hidden) {
        const endpoint = rulerPointB ?? rulerPreview;
        const mid = endpoint ? rulerPointA.clone().add(endpoint).multiplyScalar(0.5) : rulerPointA;
        projected.copy(mid).project(camera);
        rulerBadge.style.visibility = projected.z >= -1 && projected.z <= 1 ? "visible" : "hidden";
        if (projected.z >= -1 && projected.z <= 1) {
          rulerBadge.style.left = `${((projected.x + 1) * el.clientWidth) / 2}px`;
          rulerBadge.style.top = `${((1 - projected.y) * el.clientHeight) / 2}px`;
        }
      }

      [rulerPointA, rulerPointB].forEach((point, i) => {
        const label = endpointLabels[i]; label.hidden = !s.rulerMode || !point;
        if (point) {
          projected.copy(point).project(camera); label.hidden ||= projected.z < -1 || projected.z > 1;
          label.style.left = `${(projected.x+1)*el.clientWidth/2+7}px`;
          label.style.top = `${(1-projected.y)*el.clientHeight/2+5}px`;
        }
      });
      // Show one constrained space, with its actual boundary structures highlighted.
      if (s.fascialMode !== lastFascialMode || s.fascialActiveSpaceId !== lastFascialSpaceId || s.fascialPathId !== lastFascialPathId) {
        const modeChanged = !!s.fascialMode !== lastFascialMode;
        lastFascialMode = !!s.fascialMode; lastFascialSpaceId = s.fascialActiveSpaceId || ""; lastFascialPathId = s.fascialPathId || "";
        fascialGroup.visible = !!s.fascialMode; fascialUniform.value = s.fascialMode ? 1 : 0;
        fascialMeshes.forEach((mesh,id) => {
          mesh.visible = id === s.fascialActiveSpaceId;
          (mesh.material as T.Material).clippingPlanes = s.clipping?.enabled ? [clipPlane] : [];
        });
        mats.forEach((material, system) => {
          const translucent = !!s.fascialMode || system === "integumentary" || (system === "dental" && !!s.rctMode);
          material.transparent = translucent; material.depthWrite = !translucent; material.needsUpdate = true;
        });
        if (modeChanged) fit(s.view, amount);
        dirty = true;
      }
      if (clippingKey !== lastFascialClip) {
        lastFascialClip = clippingKey;
        fascialMeshes.forEach((mesh) => { (mesh.material as T.Material).clippingPlanes = s.clipping?.enabled ? [clipPlane] : []; });
        dirty = true;
      }

      // Update RCT Translucency & Pulp Geometry
      if (s.rctMode !== lastRctMode) {
        lastRctMode = s.rctMode;
        const dentalMat = mats.get("dental");
        if (dentalMat) {
          dentalMat.transparent = !!s.rctMode || !!s.fascialMode;
          dentalMat.opacity = s.rctMode ? 0.38 : 1.0;
          dentalMat.roughness = s.rctMode ? 0.18 : 0.53;
          dentalMat.depthWrite = !s.rctMode && !s.fascialMode;
          dentalMat.needsUpdate = true;
        }
        dirty = true;
      }

      const showPulp = !s.canalMode && (!!s.rctMode || !!s.clipping?.enabled);
      if (showPulp) {
        atlas.parts.forEach((p, i) => {
          const pulp = pulpGroups[i];
          if (!pulp) return;
          const vis = isVisible(p, s);
          pulp.visible = vis;
          if (vis) {
            pulp.quaternion.copy(rotations[i]);
            pulp.position.copy(centers[i]).applyQuaternion(rotations[i]).add(new T.Vector3(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]));
          }
        });
      } else {
        pulpGroups.forEach((g) => {
          if (g && g.visible) g.visible = false;
        });
      }

      if (dirty) {
        renderer.render(scene, camera);
        targets = [];
        if (amount > 0.45) {
          const hasSolid = atlas.parts.some(
            (p, i) => p.system !== "integumentary" && data[i * 4 + 3] > 0.5,
          );
          atlas.parts.forEach((p, i) => {
            if (data[i * 4 + 3] < 0.5 || (hasSolid && p.system === "integumentary")) return;
            let left = Infinity,
              right = -Infinity,
              top = Infinity,
              bottom = -Infinity;
            for (let corner = 0; corner < 8; corner++) {
              projected
                .set(
                  p.bounds[corner & 1 ? 1 : 0][0],
                  p.bounds[corner & 2 ? 1 : 0][1],
                  p.bounds[corner & 4 ? 1 : 0][2],
                )
                .applyQuaternion(rotations[i])
                .add(new T.Vector3(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]))
                .project(camera);
              const x = ((projected.x + 1) * el.clientWidth) / 2,
                y = ((1 - projected.y) * el.clientHeight) / 2;
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
            projected
              .copy(centers[i])
              .applyQuaternion(rotations[i])
              .add(new T.Vector3(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]))
              .project(camera);
            if (projected.z < -1 || projected.z > 1) return;
            targets.push({
              index: i,
              x: ((projected.x + 1) * el.clientWidth) / 2,
              y: ((1 - projected.y) * el.clientHeight) / 2,
              left,
              right,
              top,
              bottom,
            });
          });
        }
        dirty = false;
      }
    };
    animate();
    const contextLost = (e: Event) => {
      e.preventDefault();
      onError("设备已暂停 3D 视窗，请刷新页面后继续。");
    };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    return () => {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      pulpGroups.forEach((g) => {
        if (g) {
          scene.remove(g);
          g.traverse((c) => {
            if (c instanceof T.Mesh) {
              c.geometry.dispose();
              if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
              else c.material.dispose();
            }
          });
        }
      });
      canalModel?.dispose();
      scene.traverse((o) => {
        if (o instanceof T.Mesh && !geometries.includes(o.geometry)) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => m.dispose());
        }
      });
      env.dispose();
      rotationTexture.dispose();
      partTexture.dispose();
      selectionTexture.dispose();
      markerGeometry.dispose();
      markerMaterial.dispose();
      hover.remove();
      capGeo.dispose();
      capMat.dispose();
      stencilBackMat.dispose();
      stencilFrontMat.dispose();
      sphereGeoA.dispose();
      sphereMatA.dispose();
      sphereGeoB.dispose();
      sphereMatB.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      rulerBadge.remove(); endpointLabels.forEach((label) => label.remove());
      fascialMeshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as T.Material).dispose();
      });
      renderer.domElement.removeEventListener("dblclick", dblclick);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [atlas]);
  return <div className="scene" ref={host} />;
}
