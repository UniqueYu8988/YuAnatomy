import { useRef, useState, useEffect } from "react";
import type React from "react";
import {
  RotateCcw,
  Boxes,
  ScanLine,
  Slice,
  Camera,
  Ruler,
  GitBranch,
  LayoutGrid,
  Route,
  Layers,
  Focus,
  EyeOff,
} from "lucide-react";
import type { Concept, SceneState, View } from "./anatomy";
import type { PresetId } from "./study";
import { INFECTION_PATHWAYS } from "./fascial-spaces";

export interface NakedDockProps {
  state: SceneState;
  setState: React.Dispatch<React.SetStateAction<SceneState>>;
  preset: PresetId;
  activeModuleId: string;
  onFullReset: () => void;
  chosen: Concept | null;
  onClearChosen: () => void;
  setInspectorTab: (tab: "knowledge" | "clipping") => void;
  isFdiOpen?: boolean;
  onToggleFdi?: () => void;
  onOpenCanals?: () => void;
  onChangePreset?: (id: PresetId) => void;
}

interface DockItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  bloomColor: "emerald" | "cyan" | "amber" | "crimson" | "violet" | "teal";
  onClick: () => void;
}

const VIEW_CYCLE: { view: View; label: string }[] = [
  { view: "front", label: "正面" },
  { view: "side", label: "侧面" },
  { view: "back", label: "背面" },
];

const VIEW_LABEL_MAP: Record<string, string> = {
  front: "正面",
  side: "侧面",
  back: "背面",
  "three-quarter": "斜视",
};

const CLIPPING_STEPS: { axis: "z" | "x" | "y"; label: string }[] = [
  { axis: "z", label: "冠状面" },
  { axis: "x", label: "矢状面" },
  { axis: "y", label: "水平面" },
];

export default function NakedDock({
  state,
  setState,
  preset,
  activeModuleId,
  onFullReset,
  chosen,
  onClearChosen,
  setInspectorTab,
  isFdiOpen = false,
  onToggleFdi,
  onOpenCanals,
  onChangePreset,
}: NakedDockProps) {
  const dockRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [cursorY, setCursorY] = useState<number | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);

  // 原位简洁徽标提示状态（点击后在按钮侧方弹出微标，1.3s 后自动淡出）
  const [notification, setNotification] = useState<{ id: string; text: string } | null>(null);
  const notifyTimerRef = useRef<number | null>(null);

  const triggerNotification = (id: string, text: string) => {
    if (notifyTimerRef.current) window.clearTimeout(notifyTimerRef.current);
    setNotification({ id, text });
    notifyTimerRef.current = window.setTimeout(() => {
      setNotification(null);
    }, 1300);
  };

  useEffect(() => {
    return () => {
      if (notifyTimerRef.current) window.clearTimeout(notifyTimerRef.current);
    };
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
    const scale = 1.0 + 0.2 * factor; // scale up to 1.2x

    return {
      transform: `translateX(${tx.toFixed(1)}px) scale(${scale.toFixed(2)})`,
      transition: "transform 0.06s ease-out",
      zIndex: Math.round(10 + factor * 10),
    };
  };

  // =========================================================================
  // 核心功能组 (Core Tools): 最上方为 重置、拆解、透视
  // =========================================================================
  const hasPulp = activeModuleId === "dental" || (preset === "dental" && !state.fascialMode);

  const coreItems: DockItem[] = [
    {
      id: "reset",
      label: "重置全部解剖状态与视角",
      icon: <RotateCcw size={17} />,
      isActive: false,
      bloomColor: "emerald",
      onClick: () => {
        onFullReset();
        triggerNotification("reset", "已重置视角与解剖状态");
      },
    },
    {
      id: "explode",
      label: state.explode > 0 ? "复位解剖位置" : "全解剖拆解",
      icon: <Boxes size={18} />,
      isActive: state.explode > 0,
      bloomColor: "emerald",
      onClick: () => {
        const willExplode = state.explode === 0;
        setState((s) => ({
          ...s,
          explode: willExplode ? 1.0 : 0,
          isolate: false,
          view: preset === "dental" ? "front" : s.view,
        }));
        triggerNotification("explode", willExplode ? "解剖拆解：100%" : "解剖拆解：已复位");
      },
    },
  ];

  if (hasPulp) {
    coreItems.push({
      id: "pulp",
      label: state.rctMode ? "关闭髓腔透视" : "髓腔透视",
      icon: <ScanLine size={18} />,
      isActive: !!state.rctMode,
      bloomColor: "emerald",
      onClick: () => {
        const next = !state.rctMode;
        setState((s) => ({ ...s, rctMode: next }));
        triggerNotification("pulp", next ? "髓腔透视：已开启" : "髓腔透视：已关闭");
      },
    });
  }

  // =========================================================================
  // 下方功能组 (Lower Tools): 解剖(剖切)、视角、测距、以及专有/上下文工具
  // =========================================================================
  const lowerItems: DockItem[] = [
    {
      id: "clipping",
      label: state.clipping?.enabled
        ? `解剖剖切 (当前: ${
            CLIPPING_STEPS.find((s) => s.axis === state.clipping?.axis)?.label ?? "开启"
          }，点击切换)`
        : "解剖剖切",
      icon: <Slice size={18} />,
      isActive: !!state.clipping?.enabled,
      bloomColor: "emerald",
      onClick: () => {
        // 单键自动按顺序循环形态：冠状面(Z) -> 矢状面(X) -> 水平面(Y) -> 关闭
        const currentEnabled = !!state.clipping?.enabled;
        const currentAxis = state.clipping?.axis ?? "z";

        if (!currentEnabled) {
          setState((s) => ({
            ...s,
            clipping: {
              enabled: true,
              axis: "z",
              offset: s.clipping?.offset ?? 0,
              inverted: false,
              solidCap: s.clipping?.solidCap ?? true,
            },
          }));
          setInspectorTab("clipping");
          triggerNotification("clipping", "解剖剖切：冠状面");
        } else if (currentAxis === "z") {
          setState((s) => ({
            ...s,
            clipping: {
              enabled: true,
              axis: "x",
              offset: s.clipping?.offset ?? 0,
              inverted: false,
              solidCap: s.clipping?.solidCap ?? true,
            },
          }));
          setInspectorTab("clipping");
          triggerNotification("clipping", "解剖剖切：矢状面");
        } else if (currentAxis === "x") {
          setState((s) => ({
            ...s,
            clipping: {
              enabled: true,
              axis: "y",
              offset: s.clipping?.offset ?? 0,
              inverted: false,
              solidCap: s.clipping?.solidCap ?? true,
            },
          }));
          setInspectorTab("clipping");
          triggerNotification("clipping", "解剖剖切：水平面");
        } else {
          // 循环结束：关闭剖切
          setState((s) => ({
            ...s,
            clipping: {
              ...(s.clipping ?? { axis: "z", offset: 0, solidCap: true }),
              enabled: false,
              inverted: false,
            },
          }));
          triggerNotification("clipping", "解剖剖切：已关闭");
        }
      },
    },
    {
      id: "view",
      label: `观察视角 (当前: ${VIEW_LABEL_MAP[state.view] || "正面"}，点击循环切换)`,
      icon: <Camera size={18} />,
      isActive: false,
      bloomColor: "emerald",
      onClick: () => {
        // 单键自动按顺序循环形态（已删减斜视）：正面 -> 侧面 -> 背面
        const currentIndex = VIEW_CYCLE.findIndex((v) => v.view === state.view);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % VIEW_CYCLE.length;
        const next = VIEW_CYCLE[nextIndex];
        setState((s) => ({ ...s, view: next.view, reset: s.reset + 1 }));
        triggerNotification("view", `视角：${next.label}`);
      },
    },
    {
      id: "ruler",
      label: state.rulerMode ? "退出测距标尺" : "测距标尺",
      icon: <Ruler size={18} />,
      isActive: !!state.rulerMode,
      bloomColor: "emerald",
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
        triggerNotification("ruler", next ? "测距标尺：已开启" : "测距标尺：已退出");
      },
    },
  ];

  // 教学板块专属组件集成
  if (activeModuleId === "dental" || (preset === "dental" && !state.fascialMode)) {
    lowerItems.push(
      {
        id: "canals",
        label: state.canalMode ? "退出3D根管分型" : "3D 根管分型",
        icon: <GitBranch size={18} />,
        isActive: !!state.canalMode,
        bloomColor: "emerald",
        onClick: () => {
          if (onOpenCanals) onOpenCanals();
          triggerNotification("canals", "3D 根管分型已打开");
        },
      },
      {
        id: "fdi",
        label: isFdiOpen ? "收起牙位盘" : "FDI 牙位盘",
        icon: <LayoutGrid size={18} />,
        isActive: isFdiOpen,
        bloomColor: "emerald",
        onClick: () => {
          if (onToggleFdi) onToggleFdi();
          triggerNotification("fdi", isFdiOpen ? "已收起牙位盘" : "已展开牙位盘");
        },
      },
    );
  } else if (
    activeModuleId === "muscles_spaces" ||
    preset === "oral" ||
    preset === "mastication" ||
    !!state.fascialMode
  ) {
    const isMasticationActive = preset === "mastication" && !state.fascialMode;
    lowerItems.push(
      {
        id: "fascial",
        label: state.fascialMode ? "退出间隙感染" : "8大间隙感染",
        icon: <Route size={18} />,
        isActive: !!state.fascialMode,
        bloomColor: "emerald",
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
          triggerNotification("fascial", next ? "间隙感染：已开启" : "间隙感染：已退出");
        },
      },
      {
        id: "mastication",
        label: isMasticationActive ? "恢复口底视图" : "咀嚼肌视图",
        icon: <Layers size={18} />,
        isActive: isMasticationActive,
        bloomColor: "emerald",
        onClick: () => {
          if (onChangePreset) {
            setState((s) => ({ ...s, fascialMode: false }));
            onChangePreset(isMasticationActive ? "oral" : "mastication");
            triggerNotification(
              "mastication",
              isMasticationActive ? "已恢复口底解剖" : "已切换至咀嚼肌视图",
            );
          }
        },
      },
    );
  }

  // 上下文选中操作（单独显示与隐藏）
  if (chosen && !state.canalMode) {
    lowerItems.push(
      {
        id: "isolate",
        label: state.isolate ? "恢复周围结构" : "单独显示该结构",
        icon: <Focus size={18} />,
        isActive: !!state.isolate,
        bloomColor: "emerald",
        onClick: () => {
          const next = !state.isolate;
          setState((s) => ({ ...s, isolate: next, explode: 0, reset: s.reset + 1 }));
          triggerNotification("isolate", next ? "已单独显示该结构" : "已恢复周围结构");
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
          triggerNotification("hide", "已隐藏当前结构");
        },
      },
    );
  }

  const renderDockButton = (item: DockItem) => {
    const isCurrentActive = item.isActive;
    const waveStyle = getFisheyeStyle(item.id);

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

        {/* 简洁原位状态切换提示徽标 */}
        {notification && notification.id === item.id && (
          <div className="naked-dock-in-situ-badge" role="status" aria-live="polite">
            {notification.text}
          </div>
        )}
      </div>
    );
  };

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
      {/* 上方核心功能组 */}
      {coreItems.map(renderDockButton)}

      {/* 轻微分隔线 */}
      <div className="naked-dock-divider" role="separator" aria-orientation="horizontal" />

      {/* 下方功能与拓展组 */}
      {lowerItems.map(renderDockButton)}
    </div>
  );
}
