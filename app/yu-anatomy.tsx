import { useEffect, useMemo, useState, useRef } from "react";
import {
  Search,
  X,
  RotateCcw,
  Focus,
  EyeOff,
  Layers3,
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  Scissors,
  PanelLeftClose,
  PanelLeftOpen,
  Ruler,
  Activity,
  Layers,
} from "lucide-react";
import AnatomyScene from "./scene";
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
  INFECTION_PATHWAYS,
  type FascialSpace,
  type InfectionPathway,
} from "./fascial-spaces";

const JAW_BONE_IDS = ["FJ3269", "FJ3289", "FJ3375"]; // Left maxilla, Mandible, Right maxilla

const initial: SceneState = {
  explode: 0,
  visible: SYSTEMS.filter((s) => s.id !== "integumentary").map((s) => s.id),
  selected: [],
  isolate: false,
  view: "three-quarter",
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
};

export default function YuAnatomy() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [atlas, setAtlas] = useState<Atlas | null>(null),
    [state, setState] = useState({
      ...initial,
      hidden: JAW_BONE_IDS,
    }),
    [preset, setPreset] = useState<PresetId>("dental");
  const [showJawBones, setShowJawBones] = useState(false),
    [fdiDockMinimized, setFdiDockMinimized] = useState(false),
    [hideCornerPip, setHideCornerPip] = useState(false),
    [fdiFilter, setFdiFilter] = useState<"all" | ToothCategory>("all"),
    [detailTab, setDetailTab] = useState<"morphology" | "pulp" | "clinical">("morphology"),
    [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState(""),
    [chosen, setChosen] = useState<Concept | null>(null),
    [progress, setProgress] = useState(0),
    [error, setError] = useState(""),
    [drawer, setDrawer] = useState(false),
    [about, setAbout] = useState(false);
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
    fetch("/head-neck/atlas.json", { signal: c.signal })
      .then((r) => {
        if (!r.ok) throw Error("模型目录加载失败，请刷新后重试。");
        return r.json();
      })
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
        if (drawer) {
          setDrawer(false);
          return;
        }
        setAbout(false);
        setDrawer(false);
        setChosen(null);
        setState((s) => ({ ...s, selected: [], isolate: false }));
      }
      if (
        !about &&
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
  }, [about, drawer]);
  useEffect(() => {
    if (about) dialog.current?.showModal();
  }, [about]);
  const parts = useMemo(() => new Map((atlas?.parts ?? []).map((p) => [p.id, p])), [atlas]);
  const scope = useMemo(
    () => (atlas?.parts ?? []).filter((p) => inPreset(p, preset)).map((p) => p.id),
    [atlas, preset],
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
    setState((s) => ({
      ...s,
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
      hidden: id === "dental" && !showJawBones ? JAW_BONE_IDS : [],
      reset: s.reset + 1,
      rctMode: s.rctMode,
      clipping: s.clipping,
    }));
  };
  const toggleJawBones = () => {
    setShowJawBones((prev) => {
      const next = !prev;
      setState((s) => {
        const currentHidden = s.hidden ?? [];
        return {
          ...s,
          hidden: next
            ? currentHidden.filter((id) => !JAW_BONE_IDS.includes(id))
            : Array.from(new Set([...currentHidden, ...JAW_BONE_IDS])),
        };
      });
      return next;
    });
  };
  const jumpToDentalPreset = (fdi?: string) => {
    setPreset("dental");
    setFdiDockMinimized(false);
    setState((s) => ({
      ...initial,
      hidden: showJawBones ? [] : JAW_BONE_IDS,
      reset: s.reset + 1,
      isolate: false,
    }));
    if (fdi) {
      selectToothByFdi(fdi);
    }
  };
  const reset = () => {
    changePreset(preset);
    setDrawer(false);
  };
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
        title={tooth ? `FDI ${fdi} · ${tooth.name} (${tooth.toothTypeName})` : fdi}
        onClick={() => selectToothByFdi(fdi)}
      >
        <span className="fdi-btn-num">{fdi}</span>
        {tooth && <span className="fdi-btn-sub">{tooth.name.slice(0, 2)}</span>}
      </button>
    );
  };

  return (
    <main className={`workspace ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${drawer ? "open" : ""}`} aria-label="浏览导航">
        <div className="sidebar-brand-header">
          <a className="brand" href="/" aria-label="YuAnatomy 首页">
            <img className="brand-mark brand-icon" src="/branding/icon-256.png" alt="" />
            <div className="brand-titles">
              <span className="brand-name">YuAnatomy</span>
              <small className="brand-sub">口腔与头颈解剖</small>
            </div>
          </a>
          <div className="sidebar-brand-actions">
            <button
              type="button"
              className="icon-button"
              onClick={() => setAbout(true)}
              title="关于与来源"
              aria-label="关于与来源"
            >
              <Info size={17} />
            </button>
            <button
              type="button"
              className="icon-button desktop-only"
              onClick={() => setSidebarCollapsed(true)}
              title="收起左侧导航"
              aria-label="收起左侧导航"
            >
              <PanelLeftClose size={17} />
            </button>
            <button
              type="button"
              className="icon-button mobile-only"
              onClick={() => setDrawer(false)}
              aria-label="关闭导航"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="presets" aria-label="预设视图">
          {PRESETS.map((p, i) => (
            <button
              key={p.id}
              aria-pressed={preset === p.id}
              className={preset === p.id ? "active" : ""}
              onClick={() => changePreset(p.id)}
            >
              <span className="preset-number">{i === 0 ? "00" : `0${i}`}</span>
              <span>{p.name}</span>
              <ChevronRight size={15} />
            </button>
          ))}
        </nav>

        <label className="search-box">
          <Search size={17} />
          <input
            id="structure-search"
            placeholder="输入中文名称、牙位(如36)或拼音…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="搜索结构"
          />
          <kbd>/</kbd>
        </label>

        <div className="list-heading">
          <span>结构列表</span>
          <span>{results.length}</span>
        </div>
        <div className="structure-list">
          {results.slice(0, 120).map((c) => (
            <button
              key={c.id}
              className={chosen?.id === c.id ? "selected" : ""}
              onClick={() => choose(c)}
            >
              <span>{getStudyEntry(c.id, c.elements)?.displayName ?? c.name}</span>
              <ChevronRight size={13} />
            </button>
          ))}
          {!results.length && (
            <p className="empty">
              {atlas ? "未找到匹配结果，请尝试其他中文名称、牙位或切换视图。" : "正在加载目录…"}
            </p>
          )}
          {results.length > 120 && (
            <p className="empty">已显示 {results.length} 项中的前 120 项，可通过搜索缩小范围。</p>
          )}
        </div>
        <div className="sidebar-footer">
          <span className="live-dot" />
          BodyParts3D · 区域版
        </div>
      </aside>
      {drawer && (
        <button
          className="drawer-backdrop"
          onClick={() => setDrawer(false)}
          aria-label="收起导航"
        />
      )}
      <section className="viewer" aria-label="模型视窗">
        <div className="canvas-wrap">
          {atlas && (
            <AnatomyScene
              atlas={atlas}
              state={{ ...state, scope }}
              onSelect={(id) => {
                const p = parts.get(id);
                if (p)
                  choose({
                    id:
                      atlas.concepts.find(
                        (c) =>
                          c.id === p.conceptId && c.elements.length === 1 && c.elements[0] === id,
                      )?.id ?? p.id,
                    name: p.name,
                    elements: [id],
                  });
              }}
              onProgress={setProgress}
              onError={setError}
              onMeasure={setRulerMeasurement}
              onSelectFascialSpace={(spaceId) =>
                setState((s) => ({ ...s, fascialActiveSpaceId: spaceId }))
              }
            />
          )}
          {chosen && (
            <button
              className="mobile-only selection-chip"
              onClick={() =>
                document
                  .querySelector(".detail-panel")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              {entry?.displayName ?? chosen.name}
              <ChevronRight size={14} />
            </button>
          )}
          <div className="orientation">
            上 / 颅侧 (Superior)<span>↑</span>
            <small>成年男性解剖参考</small>
          </div>
          {progress < 100 && !error && (
            <div className="loading" role="status">
              <span className="eyebrow">正在加载模型</span>
              <strong>{progress}%</strong>
              <progress value={progress} max={100} />
            </div>
          )}
          {error && (
            <div className="loading" role="alert">
              <p>{error}</p>
              <button onClick={() => location.reload()}>重试</button>
            </div>
          )}
          {atlas && progress === 100 && visible === 0 && (
            <div className="loading">
              <p>所有结构均已隐藏。</p>
              <button onClick={() => changePreset(preset)}>恢复当前视图</button>
            </div>
          )}

          {/* Top-Right Floating 3D Wireframe Closeup (Background-less) */}
          {selectedTooth && !hideCornerPip && atlas && (
            <ToothPointMatrix
              atlas={atlas}
              tooth={selectedTooth}
              onClose={() => setHideCornerPip(true)}
            />
          )}

          {/* Jump Banner in Viewer when selecting a tooth in other presets */}
          {preset !== "dental" && selectedTooth && (
            <div className="viewer-tooth-jump-banner">
              <div className="jump-banner-info">
                <span className="jump-banner-sparkle">✦</span>
                <span>已选牙齿：<strong>{selectedTooth.name} (FDI {selectedTooth.fdi})</strong></span>
              </div>
              <button
                type="button"
                className="jump-banner-action"
                onClick={() => jumpToDentalPreset(selectedTooth.fdi)}
                title="切换到独立 00 牙位系统并展开全口牙位盘"
              >
                <span>进入 00 FDI 牙位系统</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* 3D Interactive Ruler Floating HUD */}
          {state.rulerMode && (
            <div className="ruler-hud-bar" role="region" aria-label="三维测距标尺控制面板">
              <div className="ruler-hud-left">
                <Ruler size={16} className="ruler-icon" />
                <span className="ruler-hud-title">3D 交互测距标尺</span>
              </div>
              <div className="ruler-hud-center">
                {!rulerMeasurement || rulerMeasurement.distanceMm === 0 ? (
                  <span className="ruler-hint">
                    {rulerMeasurement ? "已锚定起点 A，请在模型表面点击选取终点 B" : "请在模型任意解剖结构表面点击选取起点 A"}
                  </span>
                ) : (
                  <div className="ruler-summary">
                    <strong className="ruler-dist">{rulerMeasurement.distanceMm.toFixed(1)} mm</strong>
                    <span className="ruler-deltas">
                      ΔX: {rulerMeasurement.deltaMm[0].toFixed(1)} mm · ΔY: {rulerMeasurement.deltaMm[1].toFixed(1)} mm · ΔZ: {rulerMeasurement.deltaMm[2].toFixed(1)} mm
                    </span>
                    {rulerMeasurement.partA && rulerMeasurement.partB && (
                      <span className="ruler-parts">
                        ({rulerMeasurement.partA.name} ↔ {rulerMeasurement.partB.name})
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="ruler-hud-right">
                {rulerMeasurement && (
                  <button
                    type="button"
                    className="ruler-btn reset"
                    onClick={() => setRulerMeasurement(null)}
                  >
                    重新测量
                  </button>
                )}
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
            </div>
          )}

          {/* Fascial Space Infection Controller Bar */}
          {state.fascialMode && (
            <div className="fascial-controller-bar" role="region" aria-label="颌面间隙感染路径控制器">
              <div className="fascial-bar-row top">
                <div className="fascial-title-group">
                  <Activity size={16} className="fascial-icon" />
                  <span className="fascial-label">间隙感染扩散链：</span>
                </div>
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
                <button
                  type="button"
                  className="fascial-close-btn"
                  onClick={() => setState((s) => ({ ...s, fascialMode: false }))}
                  title="退出间隙感染模式"
                  aria-label="退出间隙感染模式"
                >
                  <X size={16} />
                </button>
              </div>

              {currentPathway && (
                <div className="fascial-bar-row bottom">
                  <button
                    type="button"
                    className="fascial-nav-btn"
                    disabled={(state.fascialStageIndex ?? 0) <= 0}
                    onClick={() =>
                      setState((s) => {
                        const prev = Math.max(0, (s.fascialStageIndex ?? 0) - 1);
                        return {
                          ...s,
                          fascialStageIndex: prev,
                          fascialActiveSpaceId: currentPathway.stages[prev]?.spaceId,
                        };
                      })
                    }
                  >
                    <ChevronLeft size={14} />
                    <span>上一步</span>
                  </button>

                  <div className="fascial-stage-pill">
                    <span className="stage-num">阶段 {(state.fascialStageIndex ?? 0) + 1} / {currentPathway.stages.length}</span>
                    <strong className="stage-title">{currentStage?.title}</strong>
                    <span className="stage-desc">{currentStage?.sourceDesc}</span>
                  </div>

                  <button
                    type="button"
                    className="fascial-nav-btn"
                    disabled={(state.fascialStageIndex ?? 0) >= currentPathway.stages.length - 1}
                    onClick={() =>
                      setState((s) => {
                        const next = Math.min(currentPathway.stages.length - 1, (s.fascialStageIndex ?? 0) + 1);
                        return {
                          ...s,
                          fascialStageIndex: next,
                          fascialActiveSpaceId: currentPathway.stages[next]?.spaceId,
                        };
                      })
                    }
                  >
                    <span>下一步</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Dedicated Bottom Center 28-Tooth FDI Dock when preset === "dental" */}
          {preset === "dental" && (
            <div
              className={`fdi-bottom-dock ${fdiDockMinimized ? "minimized" : ""}`}
              role="region"
              aria-label="FDI 恒牙列牙位盘"
            >
              {fdiDockMinimized ? (
                <button
                  type="button"
                  className="fdi-dock-pill-btn"
                  onClick={() => setFdiDockMinimized(false)}
                  title="展开 FDI 牙位盘"
                >
                  <span className="pill-dot" />
                  <span className="pill-title">00 FDI 牙位盘</span>
                  {selectedTooth ? (
                    <span className="pill-selected">已选: {selectedTooth.fdi} {selectedTooth.name}</span>
                  ) : (
                    <span className="pill-selected">28 颗恒牙</span>
                  )}
                  <ChevronUp size={14} />
                </button>
              ) : (
                <>
                  <div className="fdi-dock-header">
                    <div className="fdi-dock-title-group">
                      <span className="fdi-dock-badge">00 FDI 牙位盘</span>
                      <span className="fdi-dock-subtitle">28 颗恒牙定位</span>
                    </div>

                    <div className="fdi-filter-row">
                      {(
                        [
                          ["all", "全口 (28)"],
                          ["incisor", "切/尖牙"],
                          ["premolar", "前磨牙"],
                          ["molar", "磨牙"],
                        ] as const
                      ).map(([cat, label]) => (
                        <button
                          key={cat}
                          type="button"
                          className={`fdi-filter-chip ${fdiFilter === cat ? "active" : ""}`}
                          onClick={() => setFdiFilter(cat)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="fdi-dock-actions">
                      <button
                        type="button"
                        className="fdi-dock-btn"
                        onClick={() => {
                          const dentalParts =
                            atlas?.parts.filter((p) => p.system === "dental").map((p) => p.id) ?? [];
                          setState((s) => ({
                            ...s,
                            visible: s.visible.includes("dental") ? s.visible : [...s.visible, "dental"],
                            selected: dentalParts,
                            isolate: false,
                          }));
                        }}
                        title="高亮全部 28 颗恒牙"
                      >
                        全牙列
                      </button>

                      <button
                        type="button"
                        className={`fdi-dock-btn ${showJawBones ? "active" : ""}`}
                        onClick={toggleJawBones}
                        title="切换显示/隐藏上颌骨与下颌骨背景基底"
                      >
                        {showJawBones ? "颌骨: 显示" : "颌骨: 隐藏"}
                      </button>

                      <button
                        type="button"
                        className="fdi-dock-minimize-btn"
                        onClick={() => setFdiDockMinimized(true)}
                        title="收起牙位盘为紧凑药丸"
                        aria-label="收起牙位盘"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                  </div>

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
                      <span className="fdi-midline-tag">中线 (Midline)</span>
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
                </>
              )}
            </div>
          )}
        </div>

        {state.clipping?.enabled && (
          <div className="clipping-bar" aria-label="动态解剖剖切">
            <div className="clipping-axis-group">
              <span className="clipping-tag">剖切轴向</span>
              {(["y", "x", "z"] as const).map((axis) => (
                <button
                  key={axis}
                  type="button"
                  className={`clipping-axis-btn ${state.clipping?.axis === axis ? "active" : ""}`}
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      clipping: { ...s.clipping!, axis },
                    }))
                  }
                >
                  {axis === "y" ? "水平横断面 (Y)" : axis === "x" ? "矢状面 (X)" : "冠状额状面 (Z)"}
                </button>
              ))}
            </div>
            <div className="clipping-slider-group">
              <span className="clipping-tag">截面推移</span>
              <input
                type="range"
                min="-100"
                max="100"
                value={state.clipping.offset}
                onChange={(e) => {
                  const offset = Number(e.target.value);
                  setState((s) => ({
                    ...s,
                    clipping: { ...s.clipping!, offset },
                  }));
                }}
                className="clipping-range"
                aria-label="剖切截面推移"
              />
              <output className="clipping-offset-val">{state.clipping.offset}%</output>
            </div>
            <button
              type="button"
              className={`icon-button ${state.clipping.inverted ? "active" : ""}`}
              title="反转剖切方向"
              aria-label="反转剖切方向"
              onClick={() =>
                setState((s) => ({
                  ...s,
                  clipping: { ...s.clipping!, inverted: !s.clipping?.inverted },
                }))
              }
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              className={`icon-button solid-cap-toggle ${state.clipping.solidCap !== false ? "active" : ""}`}
              title={state.clipping.solidCap !== false ? "实体截面已开启 (Stencil 封口)" : "截面镂空 (点击开启实体截面)"}
              aria-label="切换实体截面"
              onClick={() =>
                setState((s) => ({
                  ...s,
                  clipping: { ...s.clipping!, solidCap: s.clipping?.solidCap === false },
                }))
              }
            >
              <Layers size={16} />
            </button>
          </div>
        )}

        <div className="viewer-toolbar">
          <div className="camera-buttons" aria-label="观察视角">
            <button
              type="button"
              className="icon-button desktop-only"
              onClick={() => setSidebarCollapsed((c) => !c)}
              title={sidebarCollapsed ? "展开左侧目录" : "收起左侧目录 (全屏沉浸)"}
              aria-label={sidebarCollapsed ? "展开左侧目录" : "收起左侧目录 (全屏沉浸)"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
            <button
              type="button"
              className="icon-button mobile-only"
              onClick={() => setDrawer(true)}
              title="浏览解剖目录"
              aria-label="浏览解剖目录"
            >
              <Search size={17} />
            </button>
            {(["three-quarter", "front", "side", "back"] as View[]).map((v, i) => (
              <button
                key={v}
                title={["斜视角", "正面视角", "侧面视角", "背面视角"][i]}
                aria-label={["斜视角", "正面视角", "侧面视角", "背面视角"][i]}
                aria-pressed={state.view === v}
                disabled={state.explode > 0.8 && v !== "front"}
                onClick={() => setState((s) => ({ ...s, view: v, reset: s.reset + 1 }))}
              >
                {["斜视", "正面", "侧面", "背面"][i]}
              </button>
            ))}
            <button className="icon-button" title="重置视图" aria-label="重置视图" onClick={reset}>
              <RotateCcw size={17} />
            </button>
          </div>

          <div className="tool-buttons" aria-label="解剖操作与工具">
            {chosen && (
              <>
                <button
                  type="button"
                  className={`toolbar-tool-btn isolate-btn ${state.isolate ? "active" : ""}`}
                  aria-pressed={state.isolate}
                  onClick={() =>
                    setState((s) => ({ ...s, isolate: !s.isolate, explode: 0, reset: s.reset + 1 }))
                  }
                  title={state.isolate ? "恢复显示周围结构" : "单独显示该结构 (聚焦独显)"}
                >
                  <Focus size={15} />
                  <span>{state.isolate ? "显示周围" : "单独显示"}</span>
                </button>

                <button
                  type="button"
                  className="toolbar-tool-btn"
                  onClick={() => {
                    setState((s) => ({
                      ...s,
                      hidden: [...new Set([...(s.hidden ?? []), ...chosen.elements])],
                      selected: [],
                      isolate: false,
                    }));
                    setChosen(null);
                  }}
                  title="隐藏当前结构"
                >
                  <EyeOff size={15} />
                  <span>隐藏结构</span>
                </button>
              </>
            )}

            {!!state.hidden?.length && (
              <button
                type="button"
                className="toolbar-tool-btn restore-btn"
                onClick={() => setState((s) => ({ ...s, hidden: [] }))}
                title="恢复所有已隐藏结构"
              >
                <RotateCcw size={14} />
                <span>恢复隐藏 ({state.hidden.length})</span>
              </button>
            )}

            <button
              type="button"
              className={`toolbar-tool-btn ${state.rulerMode ? "active" : ""}`}
              title="三维空间交互测距标尺：在模型表面点选两点测量解剖毫米距离"
              aria-pressed={state.rulerMode}
              onClick={() =>
                setState((s) => ({
                  ...s,
                  rulerMode: !s.rulerMode,
                  fascialMode: false,
                }))
              }
            >
              <Ruler size={15} />
              <span>测距标尺</span>
            </button>

            <button
              type="button"
              className={`toolbar-tool-btn ${state.fascialMode ? "active" : ""}`}
              title="口腔颌面部筋膜间隙与经典感染扩散路径"
              aria-pressed={state.fascialMode}
              onClick={() =>
                setState((s) => ({
                  ...s,
                  fascialMode: !s.fascialMode,
                  rulerMode: false,
                  fascialPathId: s.fascialPathId || "wisdom-tooth-ramus",
                  fascialStageIndex: 0,
                  fascialActiveSpaceId: INFECTION_PATHWAYS[0].stages[0]?.spaceId,
                }))
              }
            >
              <Activity size={15} />
              <span>间隙感染</span>
            </button>

            <button
              type="button"
              className={`toolbar-tool-btn ${state.rctMode ? "active" : ""}`}
              title="显示依据牙体外形生成的髓腔示意；非真实扫描根管"
              aria-pressed={state.rctMode}
              onClick={() => setState((s) => ({ ...s, rctMode: !s.rctMode }))}
            >
              <Sparkles size={15} />
              <span>髓腔示意</span>
            </button>
            <button
              type="button"
              className={`toolbar-tool-btn ${state.clipping?.enabled ? "active" : ""}`}
              title="解剖结构三维动态剖切面"
              aria-pressed={state.clipping?.enabled}
              onClick={() =>
                setState((s) => ({
                  ...s,
                  clipping: {
                    enabled: !s.clipping?.enabled,
                    axis: s.clipping?.axis ?? "y",
                    offset: s.clipping?.offset ?? 0,
                    inverted: s.clipping?.inverted ?? false,
                    solidCap: s.clipping?.solidCap ?? true,
                  },
                }))
              }
            >
              <Scissors size={15} />
              <span>解剖剖切</span>
            </button>
          </div>

          <label className="explode">
            <span>
              拆解 <output>{Math.round(state.explode * 100)}%</output>
            </span>
            <input
              aria-label="拆解程度"
              type="range"
              min="0"
              max="100"
              value={state.explode * 100}
              onChange={(e) => {
                const explode = Number(e.target.value) / 100;
                setState((s) => ({
                  ...s,
                  explode,
                  isolate: false,
                  view: explode > 0.8 ? "front" : s.view,
                }));
              }}
            />
          </label>
        </div>
        {state.rctMode && (
          <p className="pulp-model-note" role="note">
            形态示意 · 根据牙体外形生成，非扫描髓腔；不表达真实根管数量、变异及根尖孔。
          </p>
        )}
      </section>
      <aside className="inspector" aria-label="结构详情">
        <section className="detail-panel" aria-label="结构详情">
          {state.fascialMode && activeFascialSpace ? (
            <div className="fascial-detail-card">
              <div className="detail-top">
                <span className="eyebrow">颌面筋膜间隙 · 专科考点</span>
                <button
                  className="icon-button"
                  aria-label="关闭间隙详情"
                  onClick={() => setState((s) => ({ ...s, fascialActiveSpaceId: undefined }))}
                >
                  <X size={17} />
                </button>
              </div>
              <h2>{activeFascialSpace.name}</h2>
              <p className="latin-subtitle">{activeFascialSpace.latinName}</p>
              <div className="fascial-badge-row">
                <span className="fascial-tag trismus">张口受限：{activeFascialSpace.clinical.trismus}</span>
                {currentPathway && (
                  <span className="fascial-tag pathway">扩散链：{currentPathway.title.split("（")[0]}</span>
                )}
              </div>

              <div className="fascial-section">
                <h4 className="fascial-section-title">解剖境界（六界）</h4>
                <div className="fascial-boundaries-grid">
                  <div className="boundary-item">
                    <span className="boundary-label">前界</span>
                    <span className="boundary-val">{activeFascialSpace.boundaries.anterior}</span>
                  </div>
                  <div className="boundary-item">
                    <span className="boundary-label">后界</span>
                    <span className="boundary-val">{activeFascialSpace.boundaries.posterior}</span>
                  </div>
                  <div className="boundary-item">
                    <span className="boundary-label">内界</span>
                    <span className="boundary-val">{activeFascialSpace.boundaries.medial}</span>
                  </div>
                  <div className="boundary-item">
                    <span className="boundary-label">外界</span>
                    <span className="boundary-val">{activeFascialSpace.boundaries.lateral}</span>
                  </div>
                  <div className="boundary-item">
                    <span className="boundary-label">上界</span>
                    <span className="boundary-val">{activeFascialSpace.boundaries.superior}</span>
                  </div>
                  <div className="boundary-item">
                    <span className="boundary-label">下界</span>
                    <span className="boundary-val">{activeFascialSpace.boundaries.inferior}</span>
                  </div>
                </div>
              </div>

              <div className="fascial-section">
                <h4 className="fascial-section-title">临床特征与感染源</h4>
                <div className="fascial-info-item">
                  <strong>常见来源：</strong>
                  <span>{activeFascialSpace.clinical.source}</span>
                </div>
                <div className="fascial-info-item">
                  <strong>典型体征：</strong>
                  <span>{activeFascialSpace.clinical.symptoms}</span>
                </div>
              </div>

              <div className="fascial-section highlight">
                <h4 className="fascial-section-title">脓肿切开引流路径</h4>
                <p className="fascial-drainage-text">{activeFascialSpace.clinical.drainage}</p>
                <div className="fascial-danger-alert">
                  <strong>避障危险区：</strong>
                  <span>{activeFascialSpace.clinical.dangerZones}</span>
                </div>
              </div>
            </div>
          ) : state.rulerMode && rulerMeasurement && rulerMeasurement.distanceMm > 0 ? (
            <div className="ruler-detail-card">
              <div className="detail-top">
                <span className="eyebrow">三维解剖测量结果</span>
                <button
                  className="icon-button"
                  aria-label="清除测距"
                  onClick={() => setRulerMeasurement(null)}
                >
                  <X size={17} />
                </button>
              </div>
              <div className="ruler-hero-value">
                <span className="val">{rulerMeasurement.distanceMm.toFixed(1)}</span>
                <span className="unit">mm</span>
              </div>
              <p className="muted" style={{ marginBottom: "1rem" }}>
                两点间真实三维欧氏空间直线距离
              </p>

              <div className="ruler-axes-grid">
                <div className="axis-item">
                  <span className="axis-name">左右跨度 (ΔX)</span>
                  <span className="axis-val">{rulerMeasurement.deltaMm[0].toFixed(1)} mm</span>
                </div>
                <div className="axis-item">
                  <span className="axis-name">垂直高度 (ΔY)</span>
                  <span className="axis-val">{rulerMeasurement.deltaMm[1].toFixed(1)} mm</span>
                </div>
                <div className="axis-item">
                  <span className="axis-name">前后深度 (ΔZ)</span>
                  <span className="axis-val">{rulerMeasurement.deltaMm[2].toFixed(1)} mm</span>
                </div>
              </div>

              <div className="ruler-landmarks-list">
                <div className="landmark-row">
                  <span className="point-badge a">点 A</span>
                  <span className="landmark-text">
                    {rulerMeasurement.partA?.name ?? "解剖表面锚点"}
                  </span>
                </div>
                <div className="landmark-row">
                  <span className="point-badge b">点 B</span>
                  <span className="landmark-text">
                    {rulerMeasurement.partB?.name ?? "解剖表面锚点"}
                  </span>
                </div>
              </div>

              <div className="ruler-actions-row">
                <button
                  type="button"
                  className="ruler-btn reset"
                  onClick={() => setRulerMeasurement(null)}
                >
                  清除重测
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
            </div>
          ) : chosen ? (
            <>
              <div className="detail-top">
                <span className="eyebrow">当前选中</span>
                <button className="icon-button" aria-label="取消选择" onClick={clear}>
                  <X size={17} />
                </button>
              </div>
              <h2>{entry?.displayName ?? chosen.name}</h2>
              {entry?.displayName && (
                <p className="muted" style={{ fontSize: "0.85rem", marginTop: "-0.2rem", marginBottom: "0.4rem" }}>
                  {chosen.name}
                </p>
              )}
              <div className="detail-meta">
                <span>{chosen.id}</span>
                <span>{chosen.elements.length} 个部件</span>
                {entry?.chapter && <span>{entry.chapter}</span>}
              </div>
              {selectedTooth ? (
                <div className="dental-detail-card">
                  {preset !== "dental" && (
                    <button
                      type="button"
                      className="fdi-mode-jump-btn"
                      onClick={() => jumpToDentalPreset(selectedTooth.fdi)}
                      title="进入 00 FDI 牙位独立系统并打开 28 颗牙位盘"
                    >
                      <Sparkles size={14} />
                      <span>进入 00 FDI 牙位独立系统</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                  <div className="dental-notations-bar">
                    <span className="dental-badge fdi">FDI {selectedTooth.fdi}</span>
                    <span className="dental-badge palmer">{selectedTooth.palmer}</span>
                    <span className="dental-badge universal">#{selectedTooth.universal}</span>
                    <span className="dental-badge group">{selectedTooth.toothTypeName}</span>
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
                          <span className="metric-val">{selectedTooth.morphometrics.crownLength} mm</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">根长</span>
                          <span className="metric-val">{selectedTooth.morphometrics.rootLength} mm</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">冠宽</span>
                          <span className="metric-val">{selectedTooth.morphometrics.crownWidth} mm</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">冠厚</span>
                          <span className="metric-val">{selectedTooth.morphometrics.crownThickness} mm</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">全长</span>
                          <span className="metric-val highlight">{selectedTooth.morphometrics.totalLength} mm</span>
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
                      <p className="pulp-model-note">文字描述与三维示意分开阅读：本模型未重建实际内部解剖，不用于判断根管分型或操作长度。</p>
                      <div className="pulp-info-row">
                        <strong>髓室形态：</strong>
                        <span>{selectedTooth.pulpFeatures.chamberShape}</span>
                      </div>
                      <div className="pulp-info-row">
                        <strong>髓角与根管：</strong>
                        <span>{selectedTooth.pulpFeatures.hornsDescription}；{selectedTooth.canalsDescription}。</span>
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
                <>
                  <p className="muted" style={{ whiteSpace: "pre-line" }}>
                    {entry?.summary ?? "可单独显示当前结构以便仔细观察，也可隐藏它，查看被遮挡的结构。"}
                  </p>
                  {entry?.source && <p className="muted">出处：{entry.source}</p>}
                </>
              )}
            </>
          ) : (
            <div className="selection-empty">
              <Focus size={27} />
              <h2>选择一个结构</h2>
              <p>点击模型上的结构，或从左侧列表中选择，即可查看详情。</p>
            </div>
          )}
        </section>
        <div className="scope-note">
          <span className="eyebrow">浏览说明</span>
          <p>支持中文审定名、牙位代号（如36）与英文名称检索；各部位模型覆盖程度不同。</p>
          <button className="text-button" onClick={() => setAbout(true)}>
            来源与范围 <ArrowUpRight size={13} />
          </button>
        </div>
      </aside>
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
              autoFocus
              className="icon-button close-about"
              aria-label="关闭关于窗口"
              onClick={() => setAbout(false)}
            >
              <X size={20} />
            </button>
            <span className="eyebrow">YUANATOMY · 0.1</span>
            <h2>从观察开始。</h2>
            <p>
              YuAnatomy 是一款面向口腔医学学习的区域模型浏览工具，基于{" "}
              <a href="https://github.com/ashemag/human-atlas" target="_blank" rel="noreferrer">
                Human Atlas
              </a>{" "}
              改造，原作者为 ashemag，代码采用 MIT 许可。
            </p>
            <p>
              BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0
              International.
            </p>
            <p>
              包含 {atlas?.parts.length} 个高精度三维几何网格、{atlas?.concepts.length} 个解剖学概念。保留头颈部器官结构的完整拓扑，部分颈部肌群与血管向下自然延伸以呈现起止全貌；排除了全身躯干骨与胸腹脏器。本软件专为口腔医学教学与解剖复习设计。
            </p>
            <p>
              几何数据保留 BodyParts3D 发布的全部原始三角面（197万余三角面，无额外减面）。已完成全量结构中文审定名与全拼/简拼检索汉化，恒牙支持 FDI 两位数牙位标记法检索，重点口腔颌面结构已对照人卫版《口腔解剖生理学》（第8版，何三纲/于海洋主编）录入专科考点与临床释义。
            </p>
            <a href="/ATTRIBUTION.md" target="_blank" rel="noreferrer">
              完整署名与改编说明 ↗
            </a>
            <a
              href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html"
              target="_blank"
              rel="noreferrer"
            >
              数据许可 ↗
            </a>
          </section>
        </dialog>
      )}
    </main>
  );
}
