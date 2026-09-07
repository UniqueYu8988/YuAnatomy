import { CANAL_PATTERNS } from "./canal-patterns";
import type { SceneState } from "./anatomy";
import "./canal-classification.css";
export function CanalClassification({state,onChange,onClose}:{state:SceneState;onChange:(patch:Partial<SceneState>)=>void;onClose:()=>void}){
 const pattern=CANAL_PATTERNS[state.canalType??0];const section=state.canalSection??-1;
 return <section className="canal-panel" aria-label="三维根管分型学习">
  <div className="detail-top"><span className="eyebrow">VERTUCCI · 三维学习</span><button className="icon-button" onClick={onClose} aria-label="返回解剖模型">×</button></div>
  <h2>根管分型</h2><p className="canal-intro">在主视窗拖动旋转、滚轮或双指缩放，观察根管的前后走向。</p>
  <nav className="canal-types" aria-label="Vertucci 分型">{CANAL_PATTERNS.map((p,i)=><button key={p.type} aria-pressed={i===(state.canalType??0)} onClick={()=>onChange({canalType:i,canalSection:-1})}><strong>{p.type} 型</strong><span>{p.stages.join('–')}</span></button>)}</nav>
  <div className="canal-summary" aria-live="polite"><h3>{pattern.type} 型 · {pattern.stages.join('–')}</h3><p>{pattern.description}</p></div>
  <h4>外壳显示</h4><div className="canal-options">{([['transparent','透明外壳'],['cutaway','剖开外壳'],['hidden','仅看髓腔']] as const).map(([value,label])=><button key={value} aria-pressed={(state.canalShell??'transparent')===value} onClick={()=>onChange({canalShell:value})}>{label}</button>)}</div>
  {(state.canalShell??'transparent')==='transparent'&&<label className="canal-opacity">外壳不透明度 <output>{Math.round((state.canalShellOpacity??.19)*100)}%</output><input type="range" min="5" max="45" value={(state.canalShellOpacity??.19)*100} aria-label="根管模型外壳不透明度" onChange={e=>onChange({canalShellOpacity:+e.target.value/100})}/></label>}
  <h4>横断面观察</h4><div className="canal-options"><button aria-pressed={section===-1} onClick={()=>onChange({canalSection:-1})}>完整模型</button>{pattern.stages.map((count,i)=><button key={i} aria-pressed={section===i} onClick={()=>onChange({canalSection:i,clipping:state.clipping?{...state.clipping,enabled:false}:undefined})}>第 {i+1} 段 · {count} 条</button>)}</div>
  <p className="canal-slice-note" aria-live="polite">{section<0?'从髓室侧向根尖侧排列。选择观察段，将切去其上方结构并显示实际模型截面。':`当前观察第 ${section+1} 段：截面包含 ${pattern.stages[section]} 个根管轮廓。可旋转到上方观察。`}</p>
  <p className="canal-note">通用单根外形与髓腔为教学建模，不对应当前牙位。数字表示根管连通顺序，不表示牙根数；末端为封闭示意，不能判断根尖孔或工作长度。</p>
  <a href="https://pubmed.ncbi.nlm.nih.gov/6595621/" target="_blank" rel="noreferrer">Vertucci（1984）· 来源 ↗</a>
  <button className="secondary-action" onClick={onClose}>返回原先的解剖视图</button>
 </section>;
}
