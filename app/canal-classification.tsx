import { CANAL_PATTERNS } from "./canal-patterns";
import type { SceneState } from "./anatomy";
import "./canal-classification.css";

export function CanalClassification({
  state,
  onChange,
  onClose,
}: {
  state: SceneState;
  onChange: (patch: Partial<SceneState>) => void;
  onClose: () => void;
}) {
  const pattern = CANAL_PATTERNS[state.canalType ?? 0];
  const section = state.canalSection ?? -1;

  return (
    <section className="canal-panel" aria-label="三维根管分型学习">
      <div className="detail-top">
        <span className="eyebrow">VERTUCCI · 三维分型</span>
        <button className="icon-button" onClick={onClose} aria-label="返回解剖模型">
          ×
        </button>
      </div>

      <h2>根管分型</h2>

      <details className="schematic-disclosure">
        <summary className="schematic-tag">通用教学模型 ▾</summary>
        <p className="disclosure-text">
          通用单根与髓腔为独立三维教学建模，未绑定具体牙位。数字表示根管连通与分叉顺序，非牙根数；末端封闭示意，不作为临床工作长度依据。
        </p>
      </details>

      <nav className="canal-types" aria-label="Vertucci 八型切换">
        {CANAL_PATTERNS.map((p, i) => (
          <button
            key={p.type}
            aria-pressed={i === (state.canalType ?? 0)}
            onClick={() => onChange({ canalType: i, canalSection: -1 })}
          >
            <strong>{p.type} 型</strong>
            <span>{p.stages.join("–")}</span>
          </button>
        ))}
      </nav>

      <div className="canal-summary" aria-live="polite">
        <h3>
          {pattern.type} 型 · {pattern.stages.join("–")}
        </h3>
        <p>{pattern.description}</p>
      </div>

      <div className="canal-setting-group">
        <h4>外壳显示</h4>
        <div className="canal-options">
          {(
            [
              ["transparent", "透明外壳"],
              ["cutaway", "剖开外壳"],
              ["hidden", "仅看髓腔"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              aria-pressed={(state.canalShell ?? "transparent") === value}
              onClick={() => onChange({ canalShell: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {(state.canalShell ?? "transparent") === "transparent" && (
        <label className="canal-opacity">
          <span>外壳不透明度</span>
          <output>{Math.round((state.canalShellOpacity ?? 0.19) * 100)}%</output>
          <input
            type="range"
            min="5"
            max="45"
            value={(state.canalShellOpacity ?? 0.19) * 100}
            aria-label="外壳不透明度"
            onChange={(e) => onChange({ canalShellOpacity: +e.target.value / 100 })}
          />
        </label>
      )}

      <div className="canal-setting-group">
        <h4>横断面观察</h4>
        <div className="canal-options">
          <button aria-pressed={section === -1} onClick={() => onChange({ canalSection: -1 })}>
            完整模型
          </button>
          {pattern.stages.map((count, i) => (
            <button
              key={i}
              aria-pressed={section === i}
              onClick={() =>
                onChange({
                  canalSection: i,
                  clipping: state.clipping ? { ...state.clipping, enabled: false } : undefined,
                })
              }
            >
              第 {i + 1} 段 · {count} 孔
            </button>
          ))}
        </div>
      </div>

      <p className="canal-slice-note" aria-live="polite">
        {section < 0
          ? "选择观察段，剖切上方结构并显示实际模型横断面孔数。"
          : `当前第 ${section + 1} 段：截面呈 ${pattern.stages[section]} 个根管孔。`}
      </p>

      <div className="canal-footer-links">
        <a href="https://pubmed.ncbi.nlm.nih.gov/6595621/" target="_blank" rel="noreferrer">
          Vertucci (1984) 文献来源 ↗
        </a>
      </div>

      <button className="secondary-action" onClick={onClose}>
        返回原解剖模型
      </button>
    </section>
  );
}
