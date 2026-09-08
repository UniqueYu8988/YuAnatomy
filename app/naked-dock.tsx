import React, { useRef, useState, useEffect } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Compass,
  Layers,
  Ruler,
  Scissors,
  Sparkles,
  Activity,
  Focus,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import type { Concept, SceneState, View } from "./anatomy";
import type { PresetId } from "./study";
import { INFECTION_PATHWAYS } from "./fascial-spaces";

export interface NakedDockProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  state: SceneState;
  setState: React.Dispatch<React.SetStateAction<SceneState>>;
  preset: PresetId;
  onFullReset: () => void;
  chosen: Concept | null;
  onClearChosen: () => void;
  setInspectorTab: (tab: "knowledge" | "clipping") => void;
  setFdiDockMinimized?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface DockItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  bloomColor: "emerald" | "cyan" | "amber" | "crimson" | "violet" | "teal";
  onClick: () => void;
  hasFlyout?: boolean;
}

export default function NakedDock({
  sidebarCollapsed,
  onToggleSidebar,
  state,
  setState,
  preset,
  onFullReset,
  chosen,
  onClearChosen,
  setInspectorTab,
  setFdiDockMinimized,
}: NakedDockProps) {
  const dockRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [cursorY, setCursorY] = useState<number | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [inSitu, setInSitu] = useState<{ id: string; text: string } | null>(null);
  const inSituTimer = useRef<number | null>(null);
  const [activeFlyout, setActiveFlyout] = useState<"view" | "explode" | null>(null);

  // In-situ inline feedback trigger (auto-dismisses after 1600ms)
  const triggerFeedback = (id: string, text: string) => {
    if (inSituTimer.current) window.clearTimeout(inSituTimer.current);
    setInSitu({ id, text });
    inSituTimer.current = window.setTimeout(() => {
      setInSitu(null);
    }, 1600);
  };

  useEffect(() => {
    return () => {
      if (inSituTimer.current) window.clearTimeout(inSituTimer.current);
    };
  }, []);

  // Close flyouts on outside click or Escape
  useEffect(() => {
    const handleDown = (e: PointerEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setActiveFlyout(null);
      }
    };
    window.addEventListener("pointerdown", handleDown);
    return () => window.removeEventListener("pointerdown", handleDown);
  }, []);

  // Compute Fisheye Proximity Wave transform for a given item
  const getFisheyeStyle = (id: string) => {
    const isPressed = pressedId === id;
    if (isPressed) {
      return {
        transform: "translateX(8px) scale(0.92)",
        transition: "transform 0.08s cubic-bezier(0.16, 1, 0.3, 1)",
      };
    }

    if (cursorY === null) {
      return {
        transform: "translateX(0px) scale(1.0)",
        transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
      };
    }

    const btnEl = btnRefs.current.get(id);
    if (!btnEl) {
      return {
        transform: "translateX(0px) scale(1.0)",
        transition: "transform 0.2s ease-out",
      };
    }

    const rect = btnEl.getBoundingClientRect();
    const btnCenterY = rect.top + rect.height / 2;
    const dist = Math.abs(cursorY - btnCenterY);
    const radius = 85;

    if (dist >= radius) {
      return {
        transform: "translateX(0px) scale(1.0)",
        transition: "transform 0.15s ease-out",
      };
    }

    // Cosine proximity weighting: factor in [0, 1]
    const factor = Math.cos((dist / radius) * (Math.PI / 2));
    const tx = 10 * factor; // bulge towards content (+X)
    const scale = 1.0 + 0.20 * factor; // scale up to 1.2x

    return {
      transform: `translateX(${tx.toFixed(1)}px) scale(${scale.toFixed(2)})`,
      transition: "transform 0.06s ease-out",
      zIndex: Math.round(10 + factor * 10),
    };
  };

  // Build items list
  const items: DockItem[] = [
    {
      id: "sidebar",
      label: sidebarCollapsed ? "展开解剖目录" : "收起解剖目录",
      icon: sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />,
      isActive: false,
      bloomColor: "emerald",
      onClick: () => {
        onToggleSidebar();
        triggerFeedback("sidebar", sidebarCollapsed ? "已展开目录" : "已收起目录");
      },
    },
    {
      id: "reset",
      label: "重置全部解剖状态与视角",
      icon: <RotateCcw size={17} />,
      isActive: false,
      bloomColor: "emerald",
      onClick: () => {
        onFullReset();
        triggerFeedback("reset", "已恢复默认全解剖状态");
      },
    },
    {
      id: "view",
      label: "观察视角切换",
      icon: <Compass size={18} />,
      isActive: activeFlyout === "view",
      bloomColor: "emerald",
      hasFlyout: true,
      onClick: () => {
        setActiveFlyout((f) => (f === "view" ? null : "view"));
      },
    },
    {
      id: "explode",
      label: `拆解度 (${Math.round(state.explode * 100)}%)`,
      icon: <Layers size={18} />,
      isActive: state.explode > 0 || activeFlyout === "explode",
      bloomColor: "emerald",
      hasFlyout: true,
      onClick: () => {
        setActiveFlyout((f) => (f === "explode" ? null : "explode"));
      },
    },
    {
      id: "ruler",
      label: state.rulerMode ? "退出测距标尺" : "测距标尺",
      icon: <Ruler size={18} />,
      isActive: !!state.rulerMode,
      bloomColor: "cyan",
      onClick: () => {
        const next = !state.rulerMode;
        setState((s) => ({
          ...s,
          rulerMode: next,
          rulerReset: (s.rulerReset ?? 0) + 1,
          explode: 0,
          rotate: false,
          fascialMode: false,
          clipping: s.clipping ? { ...s.clipping, solidCap: false } : s.clipping,
        }));
        triggerFeedback("ruler", next ? "测距标尺已就绪" : "已退出测距");
      },
    },
    {
      id: "clipping",
      label: state.clipping?.enabled ? "退出解剖剖切" : "解剖剖切",
      icon: <Scissors size={18} />,
      isActive: !!state.clipping?.enabled,
      bloomColor: "amber",
      onClick: () => {
        const willEnable = !state.clipping?.enabled;
        const isUnfolded = preset === "dental" && state.explode > 0.85;
        setState((s) => ({
          ...s,
          clipping: {
            enabled: willEnable,
            axis: willEnable ? (isUnfolded ? "z" : (s.clipping?.axis ?? "y")) : (s.clipping?.axis ?? "y"),
            offset: s.clipping?.offset ?? 0,
            inverted: s.clipping?.inverted ?? false,
            solidCap: s.clipping?.solidCap ?? true,
          },
        }));
        if (willEnable) setInspectorTab("clipping");
        triggerFeedback("clipping", willEnable ? "解剖剖切已开启" : "已退出剖切");
      },
    },
    {
      id: "pulp",
      label: state.rctMode ? "关闭髓腔透视" : "髓腔透视",
      icon: <Sparkles size={18} />,
      isActive: !!state.rctMode,
      bloomColor: "crimson",
      onClick: () => {
        const next = !state.rctMode;
        setState((s) => ({ ...s, rctMode: next }));
        triggerFeedback("pulp", next ? "髓腔透视已开启" : "已关闭髓腔透视");
      },
    },
    {
      id: "fascial",
      label: state.fascialMode ? "退出间隙感染" : "间隙感染",
      icon: <Activity size={18} />,
      isActive: !!state.fascialMode,
      bloomColor: "violet",
      onClick: () => {
        const next = !state.fascialMode;
        setState((s) => ({
          ...s,
          fascialMode: next,
          explode: 0,
          rotate: false,
          rctMode: false,
          rulerMode: false,
          clipping: s.clipping ? { ...s.clipping, enabled: false } : s.clipping,
          fascialPathId: s.fascialPathId || "wisdom-tooth-ramus",
          fascialStageIndex: 0,
          fascialActiveSpaceId:
            (INFECTION_PATHWAYS.find((p) => p.id === s.fascialPathId) ?? INFECTION_PATHWAYS[0])
              .stages[0]?.spaceId,
        }));
        triggerFeedback("fascial", next ? "间隙感染已就绪" : "已退出间隙感染");
      },
    },
  ];

  // Contextual Selection actions (Isolate & Hide)
  if (chosen && !state.canalMode) {
    items.push(
      {
        id: "isolate",
        label: state.isolate ? "恢复周围结构" : "单独显示该结构",
        icon: <Focus size={18} />,
        isActive: !!state.isolate,
        bloomColor: "teal",
        onClick: () => {
          const next = !state.isolate;
          setState((s) => ({ ...s, isolate: next, explode: 0, reset: s.reset + 1 }));
          triggerFeedback("isolate", next ? "已聚焦单独显示" : "已恢复周围结构");
        },
      },
      {
        id: "hide",
        label: "隐藏当前结构",
        icon: <EyeOff size={18} />,
        isActive: false,
        bloomColor: "emerald",
        onClick: () => {
          setState((s) => ({
            ...s,
            hidden: [...new Set([...(s.hidden ?? []), ...chosen.elements])],
            selected: [],
            isolate: false,
          }));
          onClearChosen();
          triggerFeedback("hide", "结构已隐藏");
        },
      },
    );
  }

  return (
    <div
      ref={dockRef}
      className="naked-dock"
      role="toolbar"
      aria-label="极简悬浮功能栏"
      onPointerMove={(e) => setCursorY(e.clientY)}
      onPointerLeave={() => {
        setCursorY(null);
        setPressedId(null);
      }}
    >
      {items.map((item) => {
        const isCurrentActive = item.isActive;
        const waveStyle = getFisheyeStyle(item.id);
        const hasFeedback = inSitu?.id === item.id;

        return (
          <div key={item.id} className="naked-dock-item-wrapper">
            <button
              ref={(el) => {
                if (el) btnRefs.current.set(item.id, el);
                else btnRefs.current.delete(item.id);
              }}
              type="button"
              className={`naked-dock-btn ${isCurrentActive ? `active bloom-${item.bloomColor}` : "dormant"}`}
              style={waveStyle}
              title={item.label}
              aria-label={item.label}
              aria-pressed={isCurrentActive}
              onPointerDown={() => setPressedId(item.id)}
              onPointerUp={() => setPressedId(null)}
              onClick={item.onClick}
            >
              {item.icon}
            </button>

            {/* In-situ Inline Feedback Capsule */}
            {hasFeedback && (
              <div className="in-situ-badge" role="status" aria-live="polite">
                <Check size={12} className="in-situ-icon" />
                <span>{inSitu.text}</span>
              </div>
            )}

            {/* View Switcher Flyout */}
            {item.id === "view" && activeFlyout === "view" && (
              <div className="naked-dock-flyout view-flyout" role="menu">
                <div className="flyout-title">视角</div>
                {(["front", "side", "three-quarter", "back"] as View[]).map((v, i) => {
                  const label = ["正面", "侧面", "斜视", "背面"][i];
                  const active = state.view === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      className={`flyout-option-btn ${active ? "active" : ""}`}
                      onClick={() => {
                        setState((s) => ({ ...s, view: v, reset: s.reset + 1 }));
                        triggerFeedback("view", `已切换至「${label}」`);
                        setActiveFlyout(null);
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Explode Slider Flyout */}
            {item.id === "explode" && activeFlyout === "explode" && (
              <div className="naked-dock-flyout explode-flyout">
                <div className="flyout-header">
                  <span className="flyout-title">解剖拆解</span>
                  <output className="flyout-val">{Math.round(state.explode * 100)}%</output>
                  <button
                    type="button"
                    className="flyout-close-btn"
                    onClick={() => setActiveFlyout(null)}
                    aria-label="关闭"
                  >
                    <X size={13} />
                  </button>
                </div>
                <div className="flyout-slider-row">
                  <input
                    aria-label="拆解程度"
                    disabled={state.rulerMode || state.fascialMode || state.canalMode}
                    type="range"
                    min="0"
                    max="100"
                    value={state.explode * 100}
                    onChange={(e) => {
                      const explode = Number(e.target.value) / 100;
                      if (explode > 0 && setFdiDockMinimized) setFdiDockMinimized(true);
                      setState((s) => ({
                        ...s,
                        explode,
                        isolate: false,
                        view: preset === "dental" ? "front" : s.view,
                      }));
                    }}
                  />
                </div>
                <div className="flyout-quick-steps">
                  {[0, 0.5, 1.0].map((step) => (
                    <button
                      key={step}
                      type="button"
                      className={`step-btn ${Math.abs(state.explode - step) < 0.05 ? "active" : ""}`}
                      onClick={() => {
                        if (step > 0 && setFdiDockMinimized) setFdiDockMinimized(true);
                        setState((s) => ({
                          ...s,
                          explode: step,
                          isolate: false,
                          view: preset === "dental" ? "front" : s.view,
                        }));
                      }}
                    >
                      {step === 0 ? "复位" : step === 0.5 ? "50%" : "全拆解"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
