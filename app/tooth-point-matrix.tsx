import { useEffect, useRef, useState } from "react";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Atlas } from "./anatomy";
import type { DentalToothData } from "./dental-data";
import { decodeModelResponse } from "./model-download";
import { RotateCw, X } from "lucide-react";

interface ToothWireframeProps {
  atlas: Atlas;
  tooth: DentalToothData;
  onClose?: () => void;
}

let chunk0BufferCache: Promise<ArrayBuffer> | null = null;
function getChunk0(atlas: Atlas): Promise<ArrayBuffer> {
  if (!chunk0BufferCache) {
    const chunk = atlas.chunks[0];
    const compressed = !!chunk.gzip && typeof DecompressionStream !== "undefined";
    chunk0BufferCache = fetch(compressed ? chunk.gzip! : chunk.url).then((res) =>
      decodeModelResponse(res, chunk.bytes, compressed),
    );
  }
  return chunk0BufferCache;
}

export default function ToothPointMatrix({ atlas, tooth, onClose }: ToothWireframeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let disposed = false;
    let animId = 0;

    const width = el.clientWidth || 280;
    const height = el.clientHeight || 350;

    // Three.js Scene
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(36, width / height, 0.001, 10);
    camera.position.set(0, 0, 0.06);

    const renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Pure transparent background
    el.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.4;
    controls.enablePan = false;
    controls.minDistance = 0.015;
    controls.maxDistance = 0.15;

    let geometry: T.BufferGeometry | null = null;
    let wireMat: T.MeshBasicMaterial | null = null;
    let wireMesh: T.Mesh | null = null;

    setLoading(true);

    getChunk0(atlas)
      .then((buffer) => {
        if (disposed) return;

        const p = atlas.parts.find((item) => item.id === tooth.meshId);
        if (!p) return;

        const positions = new Float32Array(buffer, p.positions, p.vertexCount * 3);
        const indices = new Uint32Array(buffer, p.indices, p.indexCount);

        geometry = new T.BufferGeometry();
        geometry.setAttribute("position", new T.BufferAttribute(new Float32Array(positions), 3));
        geometry.setIndex(new T.BufferAttribute(new Uint32Array(indices), 1));
        geometry.computeVertexNormals();
        geometry.center();

        // Clean, crisp medical sky-blue wireframe lines
        wireMat = new T.MeshBasicMaterial({
          color: 0x0284c7,
          wireframe: true,
          transparent: true,
          opacity: 0.9,
        });
        wireMesh = new T.Mesh(geometry, wireMat);
        scene.add(wireMesh);

        // Compute precise bounding box and unclipped framing
        geometry.computeBoundingBox();
        const box = geometry.boundingBox!;
        const size = new T.Vector3();
        box.getSize(size);

        const vFovRad = (camera.fov * Math.PI) / 360;
        const hFovRad = Math.atan(Math.tan(vFovRad) * camera.aspect);

        // Max horizontal width when rotating 360 degrees around Y
        const maxH = Math.max(Math.hypot(size.x, size.z), size.x, size.z);

        // Fit both vertical height and horizontal rotation with safety margin
        // 1.22 gives clean padding top and bottom, so roots and crowns (even tall canines) are NEVER clipped
        const distV = ((size.y / 2) / Math.tan(vFovRad)) * 1.22;
        const distH = ((maxH / 2) / Math.tan(hFovRad)) * 1.25;
        const dist = Math.max(distV, distH);

        camera.position.set(0, 0, dist);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();

        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load tooth wireframe geometry:", err);
      });

    const animate = () => {
      if (disposed) return;
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(el);

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.dispose();
      if (geometry) geometry.dispose();
      if (wireMat) wireMat.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [atlas, tooth.meshId]);

  return (
    <div className="tooth-corner-pip" aria-label="3D 牙体线框微观特写">
      <div className="corner-pip-header">
        <div className="corner-pip-badge">
          <span className="corner-fdi-tag">FDI {tooth.fdi}</span>
          <span className="corner-tooth-name">{tooth.name}</span>
        </div>
        <div className="corner-pip-actions">
          <span className="corner-pip-tag" title="360° 自动巡检自转">
            <RotateCw size={11} className="spin-icon" />
            自转
          </span>
          {onClose && (
            <button
              type="button"
              className="corner-pip-close"
              onClick={onClose}
              title="关闭牙体线框"
              aria-label="关闭牙体线框"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
      <div className="corner-pip-viewport" ref={containerRef}>
        {loading && (
          <div className="corner-pip-loading">
            <span className="wireframe-loading-dot" />
            <span>三维线框载入中…</span>
          </div>
        )}
      </div>
    </div>
  );
}
