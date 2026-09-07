import { useEffect, useRef, useState } from "react";
import { CANAL_PATTERNS, canalLanes, canalPaths } from "./canal-patterns";
import "./canal-classification.css";

export function CanalClassification({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0), [stage, setStage] = useState(0);
  const pattern = CANAL_PATTERNS[index];
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    element.showModal();
    return () => { element.close(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="canal-dialog" aria-labelledby="canal-title"
    onCancel={(e) => { e.preventDefault(); onClose(); }} onKeyDown={(e) => e.stopPropagation()}>
    <header><div><span className="canal-eyebrow">牙体牙髓 · 独立学习</span><h2 id="canal-title">根管分型</h2></div>
      <button autoFocus onClick={onClose} aria-label="关闭根管分型">关闭 ×</button></header>
    <p>Vertucci 八型 · 数字表示从髓室到根尖的根管连通顺序，不表示牙根数量。</p>
    <nav className="canal-types" aria-label="Vertucci 分型">{CANAL_PATTERNS.map((p, i) =>
      <button key={p.type} aria-pressed={i === index} onClick={() => { setIndex(i); setStage(0); }}>
        <strong>{p.type} 型</strong><span>{p.stages.join("–")}</span>
      </button>)}</nav>
    <div className="canal-body">
      <svg viewBox="0 0 300 420" role="img" aria-label={`${pattern.type} 型：${pattern.stages.join("、")}，从髓室到根尖`}>
        <path d="M55 38 Q150 16 245 38 L235 355 Q235 397 150 397 Q65 397 65 355Z" fill="#eee9dc" stroke="#d2cbbb" />
        <text x="150" y="25" textAnchor="middle">髓室侧</text><text x="150" y="417" textAnchor="middle">根尖侧</text>
        <g fill="none" stroke="#c56566" strokeWidth="13" strokeLinecap="round">{canalPaths(pattern.stages).map((d,i) => <path d={d} key={i}/>)}</g>
        <path d={`M45 ${65+stage*290/(pattern.stages.length-1)} H255`} stroke="#236d5e" strokeWidth="2" strokeDasharray="5 4" />
      </svg>
      <section className="canal-detail" aria-live="polite"><h3>{pattern.type} 型 · {pattern.stages.join("–")}</h3>
        <p>{pattern.description}</p><h4>逐段查看</h4>
        <div className="canal-stages">{pattern.stages.map((count,i) => <button key={i} aria-pressed={stage === i} onClick={() => setStage(i)}>第 {i+1} 段 · {count} 条</button>)}</div>
        <svg viewBox="0 0 300 115" role="img" aria-label={`当前示意横断面：${pattern.stages[stage]} 条根管`}>
          <ellipse cx="150" cy="57" rx="105" ry="48" fill="#eee9dc" stroke="#d2cbbb" />
          {canalLanes(pattern.stages[stage]).map((x) => <circle key={x} cx={x} cy="57" r="12" fill="#c56566" />)}
        </svg><p className="canal-note">虚线标示当前观察段。形状和长度仅为连通关系示意，不对应当前牙位，也不覆盖所有根管变异。</p>
      </section>
    </div>
    <footer>依据 <a href="https://pubmed.ncbi.nlm.nih.gov/6595621/" target="_blank" rel="noreferrer">Vertucci（1984）</a>；本软件独立绘制示意图。</footer>
  </dialog>;
}
