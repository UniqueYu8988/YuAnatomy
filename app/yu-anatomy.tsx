import { CANAL_PATTERNS } from "./canal-patterns";
import { loadAtlas } from "./atlas-loader";
import { CanalClassification } from "./canal-classification";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Search,
  X,
  RotateCcw,
  Focus,
  EyeOff,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Scissors,
  PanelLeftClose,
  PanelLeftOpen,
  Ruler,
  Activity,
  Layers,
  HelpCircle,
} from "lucide-react";
import AnatomyScene from "./scene";
import NakedDock from "./naked-dock";
import ToothPointMatrix from "./tooth-point-matrix";
import {
  DENTAL_TEETH_DATA,
  getDentalToothByConcept,
  getDentalToothByMesh,
  type ToothCategory,
} from "./dental-data";
import {
  SYSTEMS,
  type Atlas,
  type Concept,
  type SceneState,
  type View,
  type RulerMeasurement,
} from "./anatomy";
import { inPreset, PRESETS, getStudyEntry, type PresetId } from "./study";
import {
  FASCIAL_SPACES,
  FASCIAL_SOURCES,
  INFECTION_PATHWAYS,
} from "./fascial-spaces";

const JAW_BONE_IDS = ["FJ3269", "FJ3289", "FJ3375"]; // Left maxilla, Mandible, Right maxilla

const initial: SceneState = {
  explode: 0,
  visible: SYSTEMS.filter((s) => s.id !== "integumentary").map((s) => s.id),
  selected: [],
  isolate: false,
  view: "front",
  rotate: false,
  reset: 0,
  hidden: [],
  clipping: {
    enabled: false,
    axis: "y",
    offset: 0,
    inverted: false,
    solidCap: true,
  },
  rctMode: false,
  rulerMode: false,
  fascialMode: false,
  fascialPathId: "wisdom-tooth-ramus",
  fascialStageIndex: 0,
  canalMode: false,
};

export default function YuAnatomy() {
  const dialog = useRef<HTMLDialogElement>(null);
  const helpDialog = useRef<HTMLDialogElement>(null);
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [state, setState] = useState<SceneState>(initial);
  const [preset, setPreset] = useState<PresetId>("dental");
  const [showJawBones, setShowJawBones] = useState(false);
  const [isFdiOpen, setIsFdiOpen] = useState(false);
  const fdiDockRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isFdiOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (fdiDockRef.current && !fdiDockRef.current.contains(e.target as Node)) {
        setIsFdiOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isFdiOpen]);
  const [hideCornerPip, setHideCornerPip] = useState(false);
  const [fdiFilter, setFdiFilter] = useState<"all" | ToothCategory>("all");
  const [detailTab, setDetailTab] = useState<"morphology" | "pulp" | "clinical">("morphology");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"knowledge" | "clipping">("knowledge");

  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<Concept | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [about, setAbout] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const priorCanalState = useRef<SceneState | null>(null);

  const openCanals = () => {
    if (state.canalMode) return;
    priorCanalState.current = state;
    setState((s) => ({
      ...s,
      canalMode: true,
      canalType: 0,
      canalSection: -1,
      canalShell: "transparent",
      canalShellOpacity: 0.19,
      explode: 0,
      isolate: false,
      rotate: false,
      view: "three-quarter",
      rulerMode: false,
      fascialMode: false,
      rctMode: false,
      clipping: { enabled: false, axis: "y", offset: 0, inverted: false, solidCap: false },
      reset: s.reset + 1,
    }));
    setDrawer(false);
  };

  const closeCanals = () =>
    setState((s) => ({
      ...(priorCanalState.current ?? s),
      hidden: priorCanalState.current?.hidden ?? s.hidden,
      canalMode: false,
      reset: s.reset + 1,
    }));

  const updateCanals = (patch: Partial<SceneState>) => setState((s) => ({ ...s, ...patch }));

  const selectSpace = (spaceId: string) => {
    const path = INFECTION_PATHWAYS.find((p) => p.stages.some((step) => step.spaceId === spaceId));
    setState((s) => ({
      ...s,
      fascialActiveSpaceId: spaceId,
      fascialPathId: path?.id ?? s.fascialPathId,
      fascialStageIndex: path?.stages.findIndex((step) => step.spaceId === spaceId) ?? 0,
    }));
  };

  const [rulerMeasurement, setRulerMeasurement] = useState<RulerMeasurement | null>(null);

  const currentPathway = useMemo(
    () => INFECTION_PATHWAYS.find((p) => p.id === (state.fascialPathId || "wisdom-tooth-ramus")),
    [state.fascialPathId],
  );
  const currentStage = useMemo(
    () => currentPathway?.stages[state.fascialStageIndex ?? 0],
    [currentPathway, state.fascialStageIndex],
  );
  const activeFascialSpace = useMemo(
    () =>
      FASCIAL_SPACES.find((s) => s.id === state.fascialActiveSpaceId) ??
      (currentStage?.spaceId ? FASCIAL_SPACES.find((s) => s.id === currentStage.spaceId) : null),
    [state.fascialActiveSpaceId, currentStage],
  );

  useEffect(() => {
    const c = new AbortController();
    loadAtlas(c.signal)
      .then((data) => setAtlas(data as Atlas))
      .catch((e) => {
        if (e.name !== "AbortError") setError("模型目录加载失败，请检查网络并刷新后重试。");
      });
    return () => c.abort();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (about) {
          setAbout(false);
          return;
        }
        if (helpOpen) {
          setHelpOpen(false);
          return;
        }
        if (drawer) {
          setDrawer(false);
          return;
        }
        setChosen(null);
        setState((s) => ({ ...s, selected: [], isolate: false }));
      }
      if (
        !about &&
        !helpOpen &&
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setDrawer(true);
        setTimeout(() => document.querySelector<HTMLInputElement>("#structure-search")?.focus(), 0);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [about, helpOpen, drawer]);

  useEffect(() => {
    if (about) dialog.current?.showModal();
  }, [about]);

  const parts = useMemo(() => new Map((atlas?.parts ?? []).map((p) => [p.id, p])), [atlas]);
  const scope = useMemo(
    () =>
      (atlas?.parts ?? [])
        .filter((p) => {
          if (preset === "dental") {
            return showJawBones
              ? p.system === "dental" || /mandible|maxilla/i.test(p.name)
              : p.system === "dental";
          }
          return inPreset(p, preset);
        })
        .map((p) => p.id),
    [atlas, preset, showJawBones],
  );
  const scopeSet = useMemo(() => new Set(scope), [scope]);

  const results = useMemo(() => {
    if (!atlas) return [];
    const q = query.trim().toLowerCase();
    return atlas.concepts.filter((c) => {
      if (!c.elements.some((id) => scopeSet.has(id))) return false;
      if (!q) return true;
      const entry = getStudyEntry(c.id, c.elements);
      const matchName = c.name.toLowerCase().includes(q);
      const matchCn = entry?.displayName?.toLowerCase().includes(q);
      const matchAlias = entry?.aliases?.some((a) => a.toLowerCase().includes(q));
      return matchName || matchCn || matchAlias;
    });
  }, [atlas, query, scopeSet]);

  const choose = (c: Concept) => {
    setChosen(c);
    setInspectorTab("knowledge");
    setState((s) => ({
      ...s,
      canalMode: false,
      visible: Array.from(
        new Set([
          ...s.visible,
          ...c.elements.map((id) => parts.get(id)?.system).filter(Boolean),
        ]),
      ) as SceneState["visible"],
      selected: c.elements,
      hidden: s.hidden?.filter((id) => !c.elements.includes(id)),
      isolate: false,
      rotate: false,
    }));
  };

  const changePreset = (id: PresetId) => {
    setPreset(id);
    setChosen(null);
    setQuery("");
    setState((s) => ({
      ...initial,
      view: id === "dental" ? "front" : "three-quarter",
      hidden: [],
      reset: s.reset + 1,
      rctMode: s.rctMode,
      clipping: s.clipping,
      canalMode: false,
      rulerMode: false,
      fascialMode: false,
      rotate: false,
    }));
  };

  const toggleJawBones = () => {
    setShowJawBones((prev) => !prev);
  };

  const jumpToDentalPreset = (fdi?: string) => {
    setPreset("dental");
    setIsFdiOpen(true);
    setState((s) => ({
      ...initial,
      hidden: [],
      reset: s.reset + 1,
      isolate: false,
    }));
    if (fdi) {
      selectToothByFdi(fdi);
    }
  };

  const fullReset = () => {
    setChosen(null);
    setQuery("");
    setRulerMeasurement(null);
    setIsFdiOpen(false);
    setState((s) => ({
      ...initial,
      view: preset === "dental" ? "front" : "three-quarter",
      hidden: [],
      selected: [],
      isolate: false,
      rotate: false,
      explode: 0,
      rctMode: false,
      clipping: {
        enabled: false,
        axis: preset === "dental" ? "z" : "y",
        offset: 0,
        inverted: false,
        solidCap: true,
      },
      rulerMode: false,
      rulerReset: (s.rulerReset ?? 0) + 1,
      fascialMode: false,
      canalMode: false,
      reset: s.reset + 1,
    }));
    setDrawer(false);
  };

  const reset = fullReset;

  const clear = () => {
    setChosen(null);
    setState((s) => ({ ...s, selected: [], isolate: false }));
  };

  const visible =
    atlas?.parts.filter((p) =>
      state.isolate
        ? state.selected.includes(p.id)
        : !state.hidden?.includes(p.id) &&
          (state.selected.includes(p.id) ||
            (scopeSet.has(p.id) && state.visible.includes(p.system))),
    ).length ?? 0;

  const entry = chosen ? getStudyEntry(chosen.id, chosen.elements) : undefined;
  const selectedTooth = useMemo(() => {
    if (!chosen) return undefined;
    return (
      getDentalToothByConcept(chosen.id) ||
      (chosen.elements.length === 1 ? getDentalToothByMesh(chosen.elements[0]) : undefined)
    );
  }, [chosen]);

  useEffect(() => {
    if (selectedTooth) setHideCornerPip(false);
  }, [selectedTooth?.fdi]);

  const selectToothByFdi = (fdi: string) => {
    if (!atlas) return;
    const tooth = DENTAL_TEETH_DATA[fdi];
    if (!tooth) return;
    const concept =
      atlas.concepts.find((c) => c.id === tooth.conceptId) ||
      atlas.concepts.find((c) => c.elements.includes(tooth.meshId)) || {
        id: tooth.conceptId,
        name: tooth.name,
        elements: [tooth.meshId],
      };
    setChosen(concept);
    setInspectorTab("knowledge");
    setState((s) => ({
      ...s,
      visible: s.visible.includes("dental") ? s.visible : [...s.visible, "dental"],
      selected: concept.elements,
      hidden: s.hidden?.filter((id) => !concept.elements.includes(id)),
      rotate: false,
    }));
  };

  const renderToothBtn = (fdi: string) => {
    const tooth = DENTAL_TEETH_DATA[fdi];
    const isSelected = selectedTooth?.fdi === fdi;
    const matchesCategory = fdiFilter === "all" || tooth?.category === fdiFilter;
    return (
      <button
        key={fdi}
        type="button"
        className={`fdi-tooth-btn ${isSelected ? "selected" : ""} ${!matchesCategory ? "dimmed" : ""}`}
        onClick={() => selectToothByFdi(fdi)}
        title={`${fdi} ${tooth?.name ?? ""}`}
        aria-label={`${fdi} ${tooth?.name ?? ""}`}
        aria-pressed={isSelected}
      >
        <span className="fdi-btn-num">{fdi}</span>
        {tooth && <span className="fdi-btn-sub">{tooth.name.slice(0, 2)}</span>}
      </button>
    );
  };

  return (
    <main className={`workspace ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* =====================================================================
          Left Column (250px): Find Content
         ===================================================================== */}
      <aside className={`sidebar ${drawer ? "open" : ""}`} aria-label="解剖导航与结构筛选">
        <div className="sidebar-brand-header">
          <a className="brand" href="/" aria-label="YuAnatomy 首页">
            <img className="brand-mark brand-icon" src="/branding/icon-256.png" alt="" />
            <div className="brand-titles">
              <span className="brand-name">YuAnatomy</span>
            </div>
          </a>
          {drawer && (
            <div className="sidebar-brand-actions">
              <button
                type="button"
                className="icon-button mobile-only"
                onClick={() => setDrawer(false)}
                aria-label="关闭抽屉"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <nav className="presets" aria-label="学习主题预设">
          {PRESETS.map((p, i) => (
            <button
              key={p.id}
              aria-pressed={!state.canalMode && preset === p.id}
              className={!state.canalMode && preset === p.id ? "active" : ""}
              onClick={() => changePreset(p.id)}
            >
              <span className="preset-number">{i === 0 ? "00" : `0${i}`}</span>
              <span>{p.name}</span>
              <ChevronRight size={14} />
            </button>
          ))}
          <button
            type="button"
            onClick={openCanals}
            aria-pressed={!!state.canalMode}
            className={state.canalMode ? "active" : ""}
          >
            <span className="preset-number">3D</span>
            <span>根管分型</span>
            <ChevronRight size={14} />
          </button>
        </nav>

        {preset !== "dental" && (
          <>
            <label className="search-box">
              <Search size={15} />
              <input
                id="structure-search"
                value={query}
                placeholder="搜索结构、牙位（如 36）..."
                aria-label="搜索解剖结构"
                onChange={(e) => setQuery(e.target.value)}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  title="清除检索"
                  aria-label="清除检索"
                >
                  <X size={14} />
                </button>
              ) : (
                <kbd>/</kbd>
              )}
            </label>

            <div className="list-heading">
              <span>解剖结构</span>
              <span>{results.length} 项</span>
            </div>

            <div className="structure-list" role="listbox" aria-label="结构检索结果">
              {results.slice(0, 120).map((c) => {
                const e = getStudyEntry(c.id, c.elements);
                return (
                  <button
                    key={c.id}
                    role="option"
                    aria-selected={chosen?.id === c.id}
                    className={chosen?.id === c.id ? "selected" : ""}
                    onClick={() => choose(c)}
                  >
                    <span>{e?.displayName ?? c.name}</span>
                    <ChevronRight size={13} />
                  </button>
                );
              })}
              {results.length === 0 && (
                <p className="empty">未找到匹配结构，请更换关键词或切换上方预设。</p>
              )}
              {results.length > 120 && (
                <p className="empty">显示前 120 项，请输入更精准的关键词。</p>
              )}
            </div>
          </>
        )}
      </aside>

      {drawer && (
        <div
          className="drawer-backdrop"
          onClick={() => setDrawer(false)}
          aria-hidden="true"
        />
      )}

      {/* =====================================================================
          Center Column (1fr): Viewer - Model Centered
         ===================================================================== */}
      <section className="viewer" aria-label="三维视窗">
        <div className="canvas-wrap">
          {/* Standalone Top-Left Sidebar Collapse/Expand Button */}
          <button
            type="button"
            className="standalone-sidebar-toggle"
            onClick={() => setSidebarCollapsed((c) => !c)}
            title={sidebarCollapsed ? "展开解剖目录" : "收起解剖目录"}
            aria-label={sidebarCollapsed ? "展开解剖目录" : "收起解剖目录"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {atlas && (
            <AnatomyScene
              atlas={atlas}
              state={{ ...state, scope, preset }}
              onError={setError}
              onSelect={(id) => {
                const tooth = getDentalToothByMesh(id);
                if (tooth) {
                  selectToothByFdi(tooth.fdi);
                  return;
                }
                const concept =
                  atlas.concepts.find((c) => c.elements.length === 1 && c.elements[0] === id) ??
                  atlas.concepts.find((c) => c.elements.includes(id));
                if (concept) choose(concept);
              }}
              onProgress={setProgress}
              onMeasure={setRulerMeasurement}
              onSelectFascialSpace={selectSpace}
            />
          )}


          {progress < 100 && !error && (
            <div className="loading" role="status">
              <span className="eyebrow">正在加载高精度解剖模型</span>
              <strong>{progress}%</strong>
              <progress max="100" value={progress} />
            </div>
          )}

          {error && (
            <div className="loading" role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => location.reload()}>
                重试
              </button>
            </div>
          )}

          {atlas && progress === 100 && visible === 0 && !state.canalMode && (
            <div className="loading">
              <p>当前所有结构均已隐藏。</p>
              <button type="button" onClick={() => changePreset(preset)}>
                恢复当前视图
              </button>
            </div>
          )}

          {/* Top-Right Floating 3D Wireframe Closeup */}
          {selectedTooth &&
            !hideCornerPip &&
            atlas &&
            !state.fascialMode &&
            !state.rulerMode &&
            !state.canalMode && (
              <ToothPointMatrix
                atlas={atlas}
                tooth={selectedTooth}
                onClose={() => setHideCornerPip(true)}
              />
            )}

          {/* Bottom Center 28-Tooth FDI Dock (when preset === "dental") */}
          {preset === "dental" &&
            !state.fascialMode &&
            !state.rulerMode &&
            !state.canalMode && (
              !isFdiOpen ? (
                <button
                  type="button"
                  className="fdi-collapsed-handle"
                  onClick={() => setIsFdiOpen(true)}
                  aria-label="展开 FDI 牙位盘"
                  title="点击展开 28 颗恒牙 FDI 牙位盘"
                >
                  <span className="fdi-handle-bar" />
                </button>
              ) : (
                <div
                  ref={fdiDockRef}
                  className="fdi-bottom-dock open"
                  role="region"
                  aria-label="FDI 恒牙列牙位盘"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="fdi-top-handle"
                    onClick={() => setIsFdiOpen(false)}
                    aria-label="收起牙位盘"
                    title="收起牙位盘"
                  >
                    <span className="fdi-handle-bar-inner" />
                  </button>
                  <div className="fdi-quadrant-chart">
                    <div className="fdi-row upper">
                      <div className="fdi-quadrant-label">右上 (I)</div>
                      <div className="fdi-teeth-group">
                        {["17", "16", "15", "14", "13", "12", "11"].map(renderToothBtn)}
                      </div>
                      <div className="fdi-divider-v" />
                      <div className="fdi-teeth-group">
                        {["21", "22", "23", "24", "25", "26", "27"].map(renderToothBtn)}
                      </div>
                      <div className="fdi-quadrant-label">左上 (II)</div>
                    </div>

                    <div className="fdi-divider-h">
                      <span className="fdi-midline-tag">中线</span>
                    </div>

                    <div className="fdi-row lower">
                      <div className="fdi-quadrant-label">右下 (IV)</div>
                      <div className="fdi-teeth-group">
                        {["47", "46", "45", "44", "43", "42", "41"].map(renderToothBtn)}
                      </div>
                      <div className="fdi-divider-v" />
                      <div className="fdi-teeth-group">
                        {["31", "32", "33", "34", "35", "36", "37"].map(renderToothBtn)}
                      </div>
                      <div className="fdi-quadrant-label">左下 (III)</div>
                    </div>
                  </div>
                </div>
              )
            )}

          {/* Naked Dock on Left Wall */}
          {!state.canalMode && (
            <NakedDock
              state={state}
              setState={setState}
              preset={preset}
              onFullReset={fullReset}
              chosen={chosen}
              onClearChosen={() => setChosen(null)}
              setInspectorTab={setInspectorTab}
            />
          )}

          {/* When in canalMode, show minimal return button */}
          {state.canalMode && (
            <div className="canal-naked-return">
              <button
                type="button"
                className="naked-dock-btn bloom-emerald active"
                onClick={closeCanals}
                title="返回解剖模型"
                aria-label="返回解剖模型"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          )}

          {/* Top-Center Live Clipping Controls (when clipping is enabled) */}
          {state.clipping?.enabled && (
            <div className="top-center-clipping-dock" role="region" aria-label="剖切控制">
              <span className="clipping-dock-label">
                {state.clipping.axis === "z" ? "深度剖切" : state.clipping.axis === "y" ? "水平剖切" : "矢状剖切"}
              </span>
              <div className="clipping-dock-slider-row">
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={state.clipping?.offset ?? 0}
                  onChange={(e) => {
                    const offset = Number(e.target.value);
                    setState((s) => ({ ...s, clipping: { ...s.clipping!, offset } }));
                  }}
                  className="clipping-dock-range"
                  aria-label="剖切截面推移"
                />
                <output className="clipping-dock-val">{state.clipping?.offset ?? 0}%</output>
              </div>
              <button
                type="button"
                className={`clipping-opt-btn ${state.clipping.inverted ? "active" : ""}`}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    clipping: s.clipping ? { ...s.clipping, inverted: !s.clipping.inverted } : undefined,
                  }))
                }
                title="反转切面方向"
              >
                反向
              </button>
              <button
                type="button"
                className="clipping-close-btn"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    clipping: { ...s.clipping!, enabled: false },
                  }))
                }
                title="退出解剖剖切"
                aria-label="关闭剖切"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          Right Column (340px): Inspector - Knowledge & Tool Settings
         ===================================================================== */}
      <aside className="inspector" aria-label="知识详情与工具设置">
        <section className="detail-panel">
          {/* Case 1: 3D Canal Classification View */}
          {state.canalMode ? (
            <CanalClassification
              state={state}
              onChange={updateCanals}
              onClose={closeCanals}
            />
          ) : /* Case 2: Ruler Measurement View */
          state.rulerMode ? (
            <div className="ruler-detail-card">
              <div className="detail-top">
                <button
                  type="button"
                  className="icon-button"
                  aria-label="退出测距"
                  onClick={() => {
                    setState((s) => ({ ...s, rulerMode: false }));
                    setRulerMeasurement(null);
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <h2>{rulerMeasurement?.segmentCount && rulerMeasurement.segmentCount > 1 ? "分段累积测量" : "解剖直线测距"}</h2>

              {!rulerMeasurement?.complete ? (
                <div className="ruler-waiting-box">
                  <div className="ruler-step-hint">
                    {rulerMeasurement
                      ? "已锚定起点，请点击模型表面选取下一测量点"
                      : "在模型可见表面点击选取起点"}
                  </div>
                  <p className="ruler-note">
                    左键连续点击累积测量；鼠标右键在保留既有线条基础上新建测量线对比研究。
                  </p>
                </div>
              ) : (
                <>
                  <div className="ruler-hero-value">
                    <span className="val">{rulerMeasurement.distanceMm.toFixed(1)}</span>
                    <span className="unit">mm</span>
                  </div>
                  <p className="ruler-caption">
                    {rulerMeasurement.segmentCount && rulerMeasurement.segmentCount > 1
                      ? `已累积 ${rulerMeasurement.segmentCount} 段路径测量（右键新建线）`
                      : "空间直线距离（左键继续累加 / 右键新建线）"}
                  </p>

                  <div className="ruler-axes-grid">
                    <div className="axis-item">
                      <span className="axis-name">左右 (ΔX)</span>
                      <span className="axis-val">
                        {rulerMeasurement.deltaMm[0].toFixed(1)} mm
                      </span>
                    </div>
                    <div className="axis-item">
                      <span className="axis-name">垂直 (ΔY)</span>
                      <span className="axis-val">
                        {rulerMeasurement.deltaMm[1].toFixed(1)} mm
                      </span>
                    </div>
                    <div className="axis-item">
                      <span className="axis-name">前后 (ΔZ)</span>
                      <span className="axis-val">
                        {rulerMeasurement.deltaMm[2].toFixed(1)} mm
                      </span>
                    </div>
                  </div>

                  <div className="ruler-landmarks-list">
                    <div className="landmark-row">
                      <span className="point-badge a">A</span>
                      <span className="landmark-text">
                        {rulerMeasurement.partA?.name ?? "解剖表面锚点"}
                      </span>
                    </div>
                    <div className="landmark-row">
                      <span className="point-badge b">B</span>
                      <span className="landmark-text">
                        {rulerMeasurement.partB?.name ?? "解剖表面锚点"}
                      </span>
                    </div>
                  </div>

                  <div className="ruler-actions-row">
                    <button
                      type="button"
                      className="ruler-btn reset"
                      onClick={() => {
                        setRulerMeasurement(null);
                        setState((s) => ({ ...s, rulerReset: (s.rulerReset ?? 0) + 1 }));
                      }}
                    >
                      重新测量
                    </button>
                    <button
                      type="button"
                      className="ruler-btn close"
                      onClick={() => {
                        setState((s) => ({ ...s, rulerMode: false }));
                        setRulerMeasurement(null);
                      }}
                    >
                      退出标尺
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : /* Case 3: Fascial Space Infection View */
          state.fascialMode && activeFascialSpace ? (
            <div className="fascial-detail-card">
              <div className="detail-top">
                <button
                  type="button"
                  className="icon-button"
                  aria-label="关闭间隙详情"
                  onClick={() => setState((s) => ({ ...s, fascialMode: false }))}
                >
                  <X size={16} />
                </button>
              </div>

              <h2>{activeFascialSpace.name}</h2>
              <p className="latin-subtitle">{activeFascialSpace.latinName}</p>

              <details className="schematic-disclosure">
                <summary className="schematic-tag">教学示意模型 ▾</summary>
                <p className="disclosure-text">{activeFascialSpace.modelNote}</p>
              </details>

              <div className="fascial-pathway-section">
                <h4>感染可能扩展路径</h4>
                <div className="fascial-pathway-tabs">
                  {INFECTION_PATHWAYS.map((p) => {
                    const active = (state.fascialPathId || "wisdom-tooth-ramus") === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`fascial-pathway-btn ${active ? "active" : ""}`}
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            fascialPathId: p.id,
                            fascialStageIndex: 0,
                            fascialActiveSpaceId: p.stages[0]?.spaceId,
                          }))
                        }
                      >
                        {p.title.split("（")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Two-Column Clean Boundary List */}
              <div className="fascial-section">
                <h4 className="section-heading">解剖境界（六界）</h4>
                <div className="fascial-boundaries-list">
                  <div className="boundary-pair">
                    <div className="boundary-cell">
                      <span className="b-label">前界</span>
                      <span className="b-val">{activeFascialSpace.boundaries.anterior}</span>
                    </div>
                    <div className="boundary-cell">
                      <span className="b-label">后界</span>
                      <span className="b-val">{activeFascialSpace.boundaries.posterior}</span>
                    </div>
                  </div>
                  <div className="boundary-pair">
                    <div className="boundary-cell">
                      <span className="b-label">内界</span>
                      <span className="b-val">{activeFascialSpace.boundaries.medial}</span>
                    </div>
                    <div className="boundary-cell">
                      <span className="b-label">外界</span>
                      <span className="b-val">{activeFascialSpace.boundaries.lateral}</span>
                    </div>
                  </div>
                  <div className="boundary-pair">
                    <div className="boundary-cell">
                      <span className="b-label">上界</span>
                      <span className="b-val">{activeFascialSpace.boundaries.superior}</span>
                    </div>
                    <div className="boundary-cell">
                      <span className="b-label">下界</span>
                      <span className="b-val">{activeFascialSpace.boundaries.inferior}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="fascial-section">
                <h4 className="section-heading">临床特征</h4>
                <div className="clinical-item">
                  <span className="c-label">张口受限</span>
                  <span className="c-val">{activeFascialSpace.clinical.trismus}</span>
                </div>
                <div className="clinical-item">
                  <span className="c-label">常见来源</span>
                  <span className="c-val">{activeFascialSpace.clinical.source}</span>
                </div>
                <div className="clinical-item">
                  <span className="c-label">典型体征</span>
                  <span className="c-val">{activeFascialSpace.clinical.symptoms}</span>
                </div>
                <div className="clinical-item danger">
                  <span className="c-label">避障危险区</span>
                  <span className="c-val">{activeFascialSpace.clinical.dangerZones}</span>
                </div>
              </div>

              <details className="disclosure-section">
                <summary>▸ 参考出处</summary>
                <div className="disclosure-body">
                  {FASCIAL_SOURCES.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="source-link"
                    >
                      {source.title} ↗
                    </a>
                  ))}
                </div>
              </details>
            </div>
          ) : /* Case 4: Clipping Tool Settings View (when clipping active and user chose clipping tab or no structure selected) */
          state.clipping?.enabled && (!chosen || inspectorTab === "clipping") ? (
            <div className="clipping-detail-card">
              <div className="detail-top">
                <button
                  type="button"
                  className="icon-button"
                  aria-label="关闭剖切"
                  onClick={() =>
                    setState((s) => ({ ...s, clipping: { ...s.clipping!, enabled: false } }))
                  }
                >
                  <X size={16} />
                </button>
              </div>

              <h2>解剖剖切面</h2>

              {chosen && (
                <div className="segmented-control" style={{ marginBottom: "8px" }}>
                  <button
                    type="button"
                    className={`segment-btn ${inspectorTab === "knowledge" ? "active" : ""}`}
                    onClick={() => setInspectorTab("knowledge")}
                  >
                    结构知识
                  </button>
                  <button
                    type="button"
                    className={`segment-btn ${inspectorTab === "clipping" ? "active" : ""}`}
                    onClick={() => setInspectorTab("clipping")}
                  >
                    剖切设置
                  </button>
                </div>
              )}

              <div className="tool-section">
                <h4>剖切轴向</h4>
                <div className="segmented-control">
                  {(preset === "dental" && state.explode > 0.85
                    ? [
                        { id: "z", label: "深度 (Z · 纵/横截面)" },
                        { id: "y", label: "上下剖切 (Y)" },
                        { id: "x", label: "左右剖切 (X)" },
                      ]
                    : [
                        { id: "y", label: "水平面 (Y)" },
                        { id: "x", label: "矢状面 (X)" },
                        { id: "z", label: "冠状面 (Z)" },
                      ]
                  ).map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      className={`segment-btn ${(state.clipping?.axis ?? (preset === "dental" && state.explode > 0.85 ? "z" : "y")) === id ? "active" : ""}`}
                      onClick={() => setState((s) => ({ ...s, clipping: { ...s.clipping!, axis: id as "x" | "y" | "z" } }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tool-section">
                <div className="slider-header">
                  <h4>截面推移</h4>
                  <output className="slider-val">{state.clipping?.offset ?? 0}%</output>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={state.clipping?.offset ?? 0}
                  onChange={(e) => {
                    const offset = Number(e.target.value);
                    setState((s) => ({ ...s, clipping: { ...s.clipping!, offset } }));
                  }}
                  className="clipping-range"
                  aria-label="剖切截面推移"
                />
              </div>


              <button
                type="button"
                className="secondary-action"
                onClick={() =>
                  setState((s) => ({ ...s, clipping: { ...s.clipping!, enabled: false } }))
                }
              >
                退出剖切
              </button>
            </div>
          ) : /* Case 5: Ordinary Structure Knowledge View (when a structure is chosen) */
          chosen ? (
            <>
              <div className="detail-top">
                <button
                  type="button"
                  className="icon-button"
                  aria-label="取消选择"
                  onClick={clear}
                >
                  <X size={16} />
                </button>
              </div>

              <h2>{entry?.displayName ?? chosen.name}</h2>
              {entry?.displayName && <p className="latin-subtitle">{chosen.name}</p>}

              {/* If clipping is simultaneously on, provide a clean switcher to access clipping settings */}
              {state.clipping?.enabled && (
                <div className="segmented-control" style={{ marginBottom: "14px" }}>
                  <button
                    type="button"
                    className={`segment-btn ${inspectorTab === "knowledge" ? "active" : ""}`}
                    onClick={() => setInspectorTab("knowledge")}
                  >
                    结构知识
                  </button>
                  <button
                    type="button"
                    className={`segment-btn ${inspectorTab === "clipping" ? "active" : ""}`}
                    onClick={() => setInspectorTab("clipping")}
                  >
                    剖切设置
                  </button>
                </div>
              )}

              {/* Dedicated spec card for teeth */}
              {selectedTooth ? (
                <div className="dental-detail-card">
                  {preset !== "dental" && (
                    <button
                      type="button"
                      className="primary-inline-btn"
                      onClick={() => jumpToDentalPreset(selectedTooth.fdi)}
                      title="进入 00 FDI 牙位独立系统"
                    >
                      <Sparkles size={14} />
                      <span>进入 00 FDI 牙位系统 ↗</span>
                    </button>
                  )}

                  <div className="dental-notations-bar">
                    <span className="dental-badge fdi">FDI {selectedTooth.fdi}</span>
                    <span className="dental-badge">{selectedTooth.palmer}</span>
                    <span className="dental-badge">#{selectedTooth.universal}</span>
                    <span className="dental-badge">{selectedTooth.toothTypeName}</span>
                  </div>

                  <div className="dental-detail-tabs" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={detailTab === "morphology"}
                      className={detailTab === "morphology" ? "active" : ""}
                      onClick={() => setDetailTab("morphology")}
                    >
                      形态测量
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={detailTab === "pulp"}
                      className={detailTab === "pulp" ? "active" : ""}
                      onClick={() => setDetailTab("pulp")}
                    >
                      髓腔与RCT
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={detailTab === "clinical"}
                      className={detailTab === "clinical" ? "active" : ""}
                      onClick={() => setDetailTab("clinical")}
                    >
                      临床要点
                    </button>
                  </div>

                  {detailTab === "morphology" && (
                    <div className="dental-tab-body">
                      <div className="dental-metrics-grid">
                        <div className="metric-item">
                          <span className="metric-label">冠长</span>
                          <span className="metric-val">
                            {selectedTooth.morphometrics.crownLength} mm
                          </span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">根长</span>
                          <span className="metric-val">
                            {selectedTooth.morphometrics.rootLength} mm
                          </span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">冠宽</span>
                          <span className="metric-val">
                            {selectedTooth.morphometrics.crownWidth} mm
                          </span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">冠厚</span>
                          <span className="metric-val">
                            {selectedTooth.morphometrics.crownThickness} mm
                          </span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">全长</span>
                          <span className="metric-val highlight">
                            {selectedTooth.morphometrics.totalLength} mm
                          </span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">萌出</span>
                          <span className="metric-val">{selectedTooth.eruptionAge}</span>
                        </div>
                      </div>
                      <ul className="dental-feature-list">
                        {selectedTooth.morphologyFeatures.slice(0, 3).map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {detailTab === "pulp" && (
                    <div className="dental-tab-body">
                      <button type="button" className="primary-inline-btn" onClick={openCanals}>
                        查看 Vertucci 八型 3D 模型 ↗
                      </button>

                      <details className="schematic-disclosure">
                        <summary className="schematic-tag">示意模型说明 ▾</summary>
                        <p className="disclosure-text">
                          受牙体外表面几何约束构建的形态示意，未重建患者真实内部根管，不作为工作长度依据。
                        </p>
                      </details>

                      <div className="pulp-info-row">
                        <strong>髓室形态：</strong>
                        <span>{selectedTooth.pulpFeatures.chamberShape}</span>
                      </div>
                      <div className="pulp-info-row">
                        <strong>髓角与根管：</strong>
                        <span>
                          {selectedTooth.pulpFeatures.hornsDescription}；
                          {selectedTooth.canalsDescription}。
                        </span>
                      </div>
                      <div className="pulp-info-row">
                        <strong>开髓洞型：</strong>
                        <span>{selectedTooth.pulpFeatures.accessCavity}</span>
                      </div>
                      <div className="pulp-info-row warning">
                        <strong>穿髓危险区：</strong>
                        <span>{selectedTooth.pulpFeatures.dangerZones}</span>
                      </div>
                    </div>
                  )}

                  {detailTab === "clinical" && (
                    <div className="dental-tab-body">
                      <div className="pulp-info-row">
                        <strong>龋病好发：</strong>
                        <span>{selectedTooth.clinicalPearls.cariesProne}</span>
                      </div>
                      <div className="pulp-info-row">
                        <strong>牙周特征：</strong>
                        <span>{selectedTooth.clinicalPearls.periodontal}</span>
                      </div>
                      <div className="pulp-info-row">
                        <strong>拔牙脱位：</strong>
                        <span>{selectedTooth.clinicalPearls.extraction}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* General Anatomy Structure (Muscles, Bones, Nerves, Vessels) */
                <div className="general-structure-card">
                  <p className="structure-summary">
                    {entry?.summary ??
                      "可单独显示当前结构以便仔细观察，也可隐藏它，查看被遮挡的深层解剖。"}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Case 6: Calm, minimal empty state */
            <div className="selection-empty">
              <span className="empty-selection-icon"><Focus size={28} strokeWidth={1.4} /></span>
              <p className="empty-hint">点击模型查看结构</p>
            </div>
          )}
        </section>
      </aside>

      {/* =====================================================================
          Operation Help Dialog Modal
         ===================================================================== */}
      {helpOpen && (
        <dialog
          ref={helpDialog}
          className="help-modal"
          open
          aria-label="三维交互操作帮助"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHelpOpen(false);
          }}
        >
          <div className="help-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="help-header">
              <h3>三维交互操作帮助</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => setHelpOpen(false)}
                aria-label="关闭帮助"
              >
                <X size={18} />
              </button>
            </div>
            <div className="help-grid">
              <div className="help-item">
                <strong>旋转观察</strong>
                <span>按住鼠标左键并拖动，或单指在触摸屏上滑动，可 360° 自由旋转模型。</span>
              </div>
              <div className="help-item">
                <strong>缩放距离</strong>
                <span>滚动鼠标滚轮，或双指在触摸屏上张合缩放，自由拉近或推远观察视角。</span>
              </div>
              <div className="help-item">
                <strong>拾取结构</strong>
                <span>在模型表面单击任意结构，右侧面板即刻显示中文审定名与解剖考点。</span>
              </div>
              <div className="help-item">
                <strong>平移场景</strong>
                <span>按住鼠标右键拖动（或拆解度高于 80% 时左键拖动）平移观察视窗。</span>
              </div>
              <div className="help-item">
                <strong>快速检索</strong>
                <span>
                  按下键盘 <code>/</code> 键直接聚焦搜索框，支持数字牙位（如 36）与拼音简写。
                </span>
              </div>
              <div className="help-item">
                <strong>快速复位</strong>
                <span>
                  按下 <code>Esc</code> 键或点击工具栏重置按钮，随时恢复标准斜视视角。
                </span>
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* =====================================================================
          About & Licensing Modal
         ===================================================================== */}
      {about && (
        <dialog
          ref={dialog}
          className="about-modal"
          aria-label="关于 YuAnatomy"
          onCancel={() => setAbout(false)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAbout(false);
          }}
        >
          <section className="about-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              autoFocus
              className="icon-button close-about"
              aria-label="关闭窗口"
              onClick={() => setAbout(false)}
            >
              <X size={18} />
            </button>
            <span className="eyebrow">YUANATOMY · 口腔解剖</span>
            <h2>关于与来源</h2>
            <p>
              YuAnatomy 是一款面向口腔医学教学与解剖复习的轻量三维浏览器，基于{" "}
              <a href="https://github.com/ashemag/human-atlas" target="_blank" rel="noreferrer">
                Human Atlas
              </a>{" "}
              （ashemag, MIT 许可）深度重构。
            </p>
            <p>
              基础头颈模型来源于日本生命科学数据库中心 BodyParts3D 4.0（CC BY 4.0），保留全部约 197
              万高保真三角面；新增咀嚼肌群来源于 BodyParts3D 3.0，采用独立 CC BY-SA 2.1 Japan
              许可，与共同骨骼坐标精准配准。
            </p>
            <p>
              已完成全量结构中文审定名对照，恒牙支持 FDI
              两位数牙位标记法检索，重点口腔颌面结构已对照人卫版《口腔解剖生理学》录入专科考点与临床释义。
            </p>
            <div style={{ marginTop: "12px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <a href="/ATTRIBUTION.md" target="_blank" rel="noreferrer">
                完整开源署名 ↗
              </a>
              <a
                href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html"
                target="_blank"
                rel="noreferrer"
              >
                数据许可协议 ↗
              </a>
            </div>
          </section>
        </dialog>
      )}
    </main>
  );
}

