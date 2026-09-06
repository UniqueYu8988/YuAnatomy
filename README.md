# YuAnatomy · 口腔头颈三维解剖浏览器

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Data: BodyParts3D](https://img.shields.io/badge/Data-BodyParts3D%204.0%20(CC%20BY%204.0)-sky.svg)](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
[![Three.js](https://img.shields.io/badge/WebGL-Three.js%200.159-orange.svg)](https://threejs.org/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript%205.9-blue.svg)](https://react.dev/)
[![Zero Backend](https://img.shields.io/badge/Architecture-Zero%20Backend%20%7C%20Local%20First-success.svg)](#技术架构与底层设计)

**YuAnatomy** 是一款面向口腔医学本科教学、临床规培与执业医师备考的高精度、轻量级、**零后端依赖**的三维头颈部解剖与牙体专科浏览器。

项目基于开源项目 [Human Atlas](https://github.com/ashemag/human-atlas) 与日本生命科学数据库中心（DBCLS）的权威医学数据集 [BodyParts3D 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) 进行系统级医学重构与口腔专科工程扩展，深度融合全国高等学校五年制本科临床规划教材**人卫版《口腔解剖生理学》**（第8版）、《系统解剖学》与《牙体牙髓病学》的专业规范。

---

## 🌟 核心专科特性与功能亮点

### 1. 00 FDI 牙位独立专科系统（Dental Studio）
- **28 颗恒牙全口四象限交互盘**：直观展示切牙、尖牙、前磨牙、磨牙四大牙类，支持恒牙 **FDI / Palmer / Universal（通用）** 三种国际牙位标记法的无缝对照与实时检索；
- **全牙列解剖测量基准**：集成人卫版教材统计基准表，实时查阅每颗恒牙的标准牙冠长、牙根长、近远中径、唇（颊）舌径与全长数据；
- **临床操作与解剖要点卡片**：
  - **形态特征**：牙尖斜面、发育沟、结节、三角嵴与斜嵴解剖形态；
  - **临床要点**：拔牙脱位阻力分析、下颌孔注射阻滞麻醉定位（下颌小舌/翼下颌皱襞）、邻面接触区规律与上颌窦解剖邻近关系；
  - **教材出处**：完整标注权威医学教材版本与出处考点。

### 2. RCT 牙髓腔透视与根管形态系统
- **半透明牙体动态透视**：支持全口牙体无级半透明化，透视牙釉质与牙本质内部包裹的牙髓腔（Pulp Chamber）与根管系统（Root Canal System）；
- **真实连续解剖锥度**：自研非线性锥度放样管线，根管口处较宽（~0.35-0.45mm），沿牙根平滑收敛，严格止于**根尖狭窄部（Apical Constriction / CDJ，距解剖根尖约 1.2-1.6mm）**，彻底消除穿模与破壁；
- **生理性远中弯曲（Distal Curvature）**：
  - 呈现上颌侧切牙（12/22）典型的根尖向远中与舌侧弯曲；
  - 上颌第一磨牙（16/26）复杂 C/S 形弯曲近颊根管与**琥珀色高亮标注的隐蔽 MB2 根管**；
  - 下颌第一磨牙（36/46）近中双管（MB、ML）与交通峡部（Isthmus）立体分型；
- *注：三维髓腔为受牙体几何约束的形态学教学示意，非单牙 micro-CT 分割模型。*

### 3. 三维动态断层剖切（Clipping Plane）
- 具备实时动态剖切引擎，支持沿三大解剖轴向进行任意断层推移：
  - **水平横断面（Axial / Y 轴）**：观察颅底孔道、上颌窦底与下颌管截面；
  - **矢状面（Sagittal / X 轴）**：观察气道、硬软腭、舌根与面侧深间隙；
  - **冠状额状面（Coronal / Z 轴）**：观察颌面部前后解剖层次；
- 支持剖切面反转（Invert）与剖切截面边缘实时计算。

### 4. 右上角 3D 牙体线框无背景特写（Micro PIP）
- 选中任意牙体后，视窗右上角自动展开无背景的**三维医学天青蓝线框特写视口**；
- 360° 自动巡检自转，支持鼠标滚轮微距缩放与拖拽自由倾斜；
- 采用严格自适应视锥体测距算法，即使对于全口最高的长根尖牙（如 31.4mm 的上颌尖牙），在任意旋转角度下牙冠与根尖均 100% 完整显示、杜绝截断。

### 5. 2D 阵列防重叠防遮挡拆解算法（Explosion Layout）
- 当视窗底部“拆解”滑块推至 100% 时，触发基于二维装箱优化的防重叠排布算法；
- 将头颈部 500+ 部件沿视线正投影平铺为横平竖直、互不遮挡的“解剖标本展板”，便于宏观对比各骨骼与肌肉的孤立轮廓。

### 6. 去噪大视野与全端响应式设计
- **视窗垂直空间极大化**：彻底清除了传统 3D 软件顶部的厚重导航栏与底部冗余提示文字，画布直接延展至屏幕顶端（Y=0）；
- **集约化底部控制坞**：视角切换（斜视/正面/侧面/背面）、单独显示（聚焦独显）、隐藏结构、恢复隐藏计数、髓腔透视、解剖剖切与侧边栏折叠全部集成于底部磨砂毛玻璃工具栏；
- **全平台响应式适配**：对桌面 PC（双侧面板沉浸布局）、平板与移动端触控屏（底部抽屉与轻量胶囊交互）提供无缝自适应体验；
- **全站现代无衬线字体栈**：消除传统衬线体，字字锐利现代。

---

## 🛠 技术架构与底层设计

```text
YuAnatomy/
├── app/                        # 核心前端与 WebGL 逻辑
│   ├── scene.tsx               # Three.js 场景管理、GPU 拾取、着色器注入与剖切
│   ├── yu-anatomy.tsx          # 响应式主界面、状态机管理与底部集约工具坞
│   ├── yu-anatomy.css          # 全局现代无衬线样式体系与响应式布局
│   ├── dental-data.ts          # 口腔 28 颗恒牙 FDI/形态测量/解剖考点数据库
│   ├── pulp-generator.ts       # 非线性锥度根管放样与生理弯曲髓腔生成器
│   ├── tooth-point-matrix.tsx  # 右上角无背景悬浮 3D 牙体线框特写视口
│   ├── study.ts                # 头颈汉化词库（STUDY_CONTENT）、预设视图与拼音别名
│   ├── anatomy.ts              # 解剖系统类别定义（骨骼/肌肉/脉管/神经/口腔等）
│   ├── explosion-layout.ts     # 100% 拆解时的 2D 阵列防重叠装箱排布算法
│   ├── model-download.ts       # 二进制几何块 Gzip 解压流式加载处理
│   └── pointer-tap.ts          # 触控与鼠标指针防误触拾取判定算法
├── public/                     # 静态模型资源包
│   ├── head-neck/              # 裁剪打包后的二进制几何数据
│   │   ├── atlas.json          # 591 个部件与 1181 个解剖概念的索引元数据
│   │   ├── head-neck-hd-*.bin  # Float32 顶点 + Int16 法线 + Uint32 索引原始几何
│   │   └── head-neck-hd-*.bin.gz # Gzip 流式压缩包（全套模型约 25.5MB）
│   └── branding/               # 高清矢量图标与应用徽标
├── scripts/                    # 自动化质量校验与数据工程流水线
│   ├── validate-head-neck.mjs  # 几何拓扑、包围盒、预设与手势自动化校验脚本
│   ├── build-head-neck.py      # 模型裁剪、坐标重平移与二进制分块打包脚本
│   └── fetch-source-obj.py     # 上游原始 OBJ 几何数据抓取与校验
├── docs/                       # 历史验证与覆盖度审计报告
│   ├── model-coverage.json     # 全量解剖部件入选统计记录
│   └── verification.md         # 验收记录与变更审计日志
├── Start-YuAnatomy.cmd         # Windows 本地开箱即用一键拉起脚本
├── package.json
└── vite.config.ts
```

### 1. 极致轻量与零后端管道
- **纯前端静态部署**：无需后端 Node.js 进程、无数据库支持、无需用户鉴权，可静态部署至 Vercel、Cloudflare Pages、GitHub Pages 或离线本地直接双击运行；
- **二进制几何内存紧凑化**：几何数据打包为连续平铺的 `Float32Array`（顶点坐标）+ `Int16Array`（法线）+ `Uint32Array`（面索引），大幅减少 JS 垃圾回收（GC）开销；
- **流式解压分块**：借助现代浏览器原生 `DecompressionStream` API，边下载 gzip 数据边进行内存管线解析，首屏模型交互秒开。

### 2. GPU 拾取与自定义着色器注入
- 采用 Three.js `onBeforeCompile` 在原生 PBR 材质（MeshStandardMaterial）中注入自定义着色器代码：
  - 动态 Uniforms 控制各解剖部件的高亮描边、半透明遮罩与多部件即时隐藏；
  - 避免频繁修改材质或重建网格引起的 GPU 卡顿，保持稳定 60 FPS 渲染。

### 3. 数据规格与保真度
- **网格总数**：591 个完整解剖网格部件；
- **解剖概念**：1,181 条结构层级索引；
- **三角面数**：1,970,872 个高保真三角面；
- **压缩包体**：全套头颈三维几何数据经 gzip 打包后仅 **25.5 MB**。

---

## 🚀 快速开始与本地运行

### 环境准备
- 推荐使用现代浏览器（Chrome、Edge、Safari、Firefox 等支持 WebGL 2.0 的环境）；
- 本地开发需安装 **Node.js 20.0+** 或更高版本。

### 1. Windows 本地一键运行（推荐）
直接双击项目根目录下的 **`Start-YuAnatomy.cmd`** 脚本：
- 首次运行会自动检测环境并安装依赖；
- 静默拉起本地静态服务并自动在默认浏览器中打开应用页面。

### 2. 开发者模式与调试
```bash
# 1. 克隆本仓库
git clone https://github.com/UniqueYu8988/YuAnatomy.git
cd YuAnatomy

# 2. 安装项目依赖
npm ci

# 3. 启动本地开发服务 (默认监听端口 3016)
npm run dev

# 4. 浏览器访问
open http://127.0.0.1:3016
```

---

## 🛡️ 质量门禁与自动化校验

为保证医学解剖坐标的严谨性与 WebGL 渲染的健壮性，项目集成了严格的自动化测试体系：

```bash
# 1. TypeScript 静态严格类型检查
npm run check

# 2. 模型拓扑、边界包围盒、拆解防重叠排布与指针手势自动化数学校验
npm run validate

# 3. Vite 纯静态生产产物打包
npm run build

# 4. 本地静态生产产物预览
npm run preview
```

---

## ⚠️ 医学免责与学术声明

1. **教学与备考辅助定位**：本项目定位为面向口腔医学本科教学、临床规培与执考复习的三维可视化辅助工具，**不可直接用于临床手术导航、种植手术导板设计或医疗诊断决策**；
2. **三维牙髓腔示意说明**：系统内的牙髓腔与根管形态是基于牙体外表面几何轮廓与人卫版教材统计参数算法构建的**形态学教学示意**，非真实标本的单牙 micro-CT 扫描与三维分割重建。不可将其用于确定特定患者的真实根管数目、变异分型、工作长度或根尖孔具体出孔位置；
3. **临床术语基准**：中文审定名与牙位表示基准遵循全国科学技术名词审定委员会公布之《医学名词》及人卫版《口腔解剖生理学》（第8版）。

---

## 📄 开源许可证与溯源署名

- **应用源码**：基于 [MIT License](LICENSE) 授权开源；
- **三维解剖数据溯源**：
  - 解剖模型几何数据源自日本生命科学数据库中心（DBCLS）发布的 [BodyParts3D 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)，采用知识共享署名 4.0 国际许可（[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.zh)）；
  - 交互管线基于 [Human Atlas](https://github.com/ashemag/human-atlas)（ashemag, MIT License）改造；
- **牙体专科数据**：牙位测量均值与临床要点整理自人民卫生出版社规划教材。

---

*YuAnatomy — 让口腔解剖学在指尖三维流转。*
