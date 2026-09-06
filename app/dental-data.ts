/**
 * YuAnatomy 牙体专科数据库 (Dental Studio Database)
 * 基于人卫版《口腔解剖生理学》（第8版，何三纲/于海洋主编）第二章牙体解剖与第九节牙髓腔解剖
 * 覆盖全部 28 颗恒牙的解剖测量、外形标志、髓腔形态、Vertucci根管分型及临床操作要点
 */

export type ToothCategory = "incisor" | "canine" | "premolar" | "molar";
export type QuadrantId = 1 | 2 | 3 | 4;

export interface DentalPin {
  id: string;
  name: string;
  category: "cusp" | "ridge" | "fossa" | "cervical" | "root" | "pulp" | "canal";
  description: string;
  // Normalized coordinate in [-1, 1] relative to centered bounding box
  position: [number, number, number];
}

export interface DentalToothData {
  fdi: string;              // "11" ~ "47"
  meshId: string;           // "FJ1254" ~ "FJ1281"
  conceptId: string;        // "FMA55681" etc.
  name: string;             // "右上颌中切牙"
  englishName: string;      // "Upper right central incisor"
  quadrant: QuadrantId;     // 1: 右上, 2: 左上, 3: 左下, 4: 右下
  quadrantName: string;     // "右上颌（第I象限）"
  category: ToothCategory;  // "incisor"
  toothTypeName: string;    // "中切牙"
  palmer: string;           // "1┘"
  universal: number;        // 1 ~ 32
  eruptionAge: string;      // "7~8 岁"
  
  // 解剖测量参考均值（人卫第8版统计表）
  morphometrics: {
    crownLength: number;    // 牙冠长 (mm)
    rootLength: number;     // 牙根长 (mm)
    crownWidth: number;     // 牙冠宽（近远中径 mm）
    crownThickness: number; // 牙冠厚（唇舌径 mm）
    totalLength: number;    // 牙全长 (mm)
  };
  
  cuspsCount: number;       // 牙尖数
  rootsCount: number;       // 牙根数
  canalsDescription: string;// "单根单管型 (100%)"
  vertucciType: string;     // "Vertucci I型为主"
  
  // 《口腔解剖生理学》第8版核心形态特征
  morphologyFeatures: string[];
  
  // 髓腔解剖与开髓要点
  pulpFeatures: {
    chamberShape: string;   // 髓室形态
    hornsCount: number;     // 髓角数目
    hornsDescription: string; // 髓角特征
    canalOrifices: string;  // 根管口位置与形态
    accessCavity: string;   // 开髓洞型设计
    dangerZones: string;    // 易侧穿/意外穿髓危险区
  };
  
  // 临床实操与病理考点
  clinicalPearls: {
    cariesProne: string;    // 龋病好发部位
    periodontal: string;    // 牙周附着与骨吸收特征
    extraction: string;     // 拔牙阻力与脱位手法
  };
  
  // 3D 标志图钉
  pins: DentalPin[];
}

export const DENTAL_TEETH_DATA: Record<string, DentalToothData> = {
  // ==================== 右上颌（第一象限，11~17） ====================
  "11": {
    fdi: "11",
    meshId: "FJ1279",
    conceptId: "FMA55681",
    name: "右上颌中切牙",
    englishName: "Upper Right Central Incisor",
    quadrant: 1,
    quadrantName: "右上颌（第I象限）",
    category: "incisor",
    toothTypeName: "中切牙",
    palmer: "1┘",
    universal: 8,
    eruptionAge: "7~8 岁",
    morphometrics: { crownLength: 10.5, rootLength: 13.0, crownWidth: 8.5, crownThickness: 7.0, totalLength: 23.5 },
    cuspsCount: 0,
    rootsCount: 1,
    canalsDescription: "单根单管型（100%）",
    vertucciType: "Vertucci I型（100%）",
    morphologyFeatures: [
      "唇面宽铲形，切嵴平直，近中切角接近直角，远中切角圆钝。",
      "舌面中央凹陷形成明显的舌窝，颈部有隆起圆滑的舌隆突，边缘有近远中边缘嵴环绕。",
      "切缘由唇向舌侧倾斜（切嵴位于牙体长轴唇侧）。",
      "牙根为粗壮圆锥形单根，根尖向远中微偏，颈横截面呈圆三角形。"
    ],
    pulpFeatures: {
      chamberShape: "髓室与根管无明显界限，冠部唇舌向宽，根管呈长圆锥形。",
      hornsCount: 3,
      hornsDescription: "髓室顶靠近切嵴，有3个髓角（近中、中央、远中髓角），年轻恒牙近远中髓角明显突起。",
      canalOrifices: "单根管口，位于髓室底正中，粗大易于探查。",
      accessCavity: "舌面窝中央略近切嵴处，呈倒圆三角形开髓洞型，底朝切端，尖朝牙颈部。",
      dangerZones: "向唇侧倾斜过度易致唇侧颈部侧穿；老年人髓腔变小易发生根管钙化堵塞。"
    },
    clinicalPearls: {
      cariesProne: "舌窝、邻面接触区下方（易发生邻面浅隐匿龋）。",
      periodontal: "唇侧骨壁极薄，易发生牙龈退缩与唇侧骨开窗。",
      extraction: "首先施加唇舌向摇动力量，配合沿牙长轴的顺逆时针轻微旋转力脱位。"
    },
    pins: [
      { id: "incisal_edge", name: "切嵴", category: "ridge", description: "切割食物的主要功能刃，位于牙长轴唇侧。", position: [0, 0.95, 0.15] },
      { id: "mesial_angle", name: "近中切角", category: "ridge", description: "近乎90度直角，为左右侧辨识关键特征。", position: [-0.42, 0.93, 0.1] },
      { id: "distal_angle", name: "远中切角", category: "ridge", description: "圆钝钝角，弧度大于近中切角。", position: [0.42, 0.9, 0.1] },
      { id: "lingual_fossa", name: "舌窝", category: "fossa", description: "舌侧平滑凹陷，开髓洞型主要制备区。", position: [0, 0.5, -0.2] },
      { id: "cingulum", name: "舌隆突", category: "ridge", description: "舌面颈1/3的圆滑半球形突起。", position: [0, 0.2, -0.25] },
      { id: "apex", name: "根尖孔", category: "canal", description: "粗大单根尖孔，略向远中弯曲。", position: [0.08, -0.98, -0.05] },
    ],
  },

  "12": {
    fdi: "12",
    meshId: "FJ1280",
    conceptId: "FMA55680",
    name: "右上颌侧切牙",
    englishName: "Upper Right Lateral Incisor",
    quadrant: 1,
    quadrantName: "右上颌（第I象限）",
    category: "incisor",
    toothTypeName: "侧切牙",
    palmer: "2┘",
    universal: 7,
    eruptionAge: "8~9 岁",
    morphometrics: { crownLength: 9.0, rootLength: 13.0, crownWidth: 6.5, crownThickness: 6.0, totalLength: 22.0 },
    cuspsCount: 0,
    rootsCount: 1,
    canalsDescription: "单根单管型（99%）",
    vertucciType: "Vertucci I型为主",
    morphologyFeatures: [
      "牙冠窄长圆厚，近远中切角均比中切牙圆钝，远中切角圆钝尤甚。",
      "舌面窝窄而深，舌隆突显著，常伴有畸形舌侧窝及畸形舌侧尖。",
      "变异率高：常见锥形牙（Peg lateral）、先天性牙胚缺失或畸形舌侧沟（沟裂直达根尖）。",
      "单根细长，根尖明显向远中弯曲，横截面呈卵圆形。"
    ],
    pulpFeatures: {
      chamberShape: "唇舌向较宽，切嵴至根尖呈渐进圆锥形缩窄。",
      hornsCount: 2,
      hornsDescription: "多为2个髓角（近中髓角与远中髓角），近中髓角略高。",
      canalOrifices: "细小卵圆形单根管口。",
      accessCavity: "舌面窝中央开髓，呈卵圆形或小圆三角形。",
      dangerZones: "根尖1/3常向远中和腭侧弯曲，器械预备时易发生台阶或根尖偏移；畸形舌侧沟极易导致顽固性牙周-牙髓联合病变。"
    },
    clinicalPearls: {
      cariesProne: "畸形舌侧窝（发育性深窝点隙，极易发生隐匿性牙髓炎）。",
      periodontal: "伴畸形舌侧沟者菌斑易沿沟深入形成深窄牙周袋。",
      extraction: "以唇舌向摇动为主，因根尖向远中弯曲，切忌盲目大角度扭转以防根尖折断。"
    },
    pins: [
      { id: "incisal_edge", name: "切嵴", category: "ridge", description: "切缘向远中倾斜下斜。", position: [0, 0.94, 0.12] },
      { id: "lingual_pit", name: "畸形舌侧窝好发区", category: "fossa", description: "深陷点隙，龋病及穿髓高发解剖薄弱点。", position: [0, 0.45, -0.22] },
      { id: "curved_apex", name: "远中弯曲根尖", category: "root", description: "根尖向远中弯曲显著，拔牙及扩根需特别注意。", position: [0.15, -0.97, -0.08] },
    ],
  },

  "13": {
    fdi: "13",
    meshId: "FJ1281",
    conceptId: "FMA55798",
    name: "右上颌尖牙",
    englishName: "Upper Right Canine",
    quadrant: 1,
    quadrantName: "右上颌（第I象限）",
    category: "canine",
    toothTypeName: "尖牙",
    palmer: "3┘",
    universal: 6,
    eruptionAge: "11~12 岁",
    morphometrics: { crownLength: 10.0, rootLength: 17.0, crownWidth: 7.5, crownThickness: 8.0, totalLength: 27.0 },
    cuspsCount: 1,
    rootsCount: 1,
    canalsDescription: "单根单管型（100%）",
    vertucciType: "Vertucci I型（100%）",
    morphologyFeatures: [
      "位于口角转折处，牙冠呈坚厚五边形，有一个粗壮锐利的牙尖（尖顶偏近中）。",
      "唇轴嵴极为显著，将唇面分为近中、远中两个斜面，远中斜面大于近中斜面。",
      "牙根为全口牙中最粗大长直者，根尖向远中略弯；在唇侧颌骨表面形成显著的犬齿隆突。",
      "对维持口角丰满度及侧向咬合导向（尖牙保护（牙合））具有不可替代的生理价值。"
    ],
    pulpFeatures: {
      chamberShape: "全口中最大、最长的单根管髓腔，唇舌径远大于近远中径。",
      hornsCount: 1,
      hornsDescription: "单尖锐髓角，显著突向牙尖，位置高靠近顶端。",
      canalOrifices: "粗大卵圆形单根管口，唇舌向直径宽大。",
      accessCavity: "舌面窝中央开髓，呈唇舌向延长的长卵圆形洞型。",
      dangerZones: "髓腔唇舌径极大，若根管预备仅做圆形扩孔，唇舌侧极易残留感染死角。"
    },
    clinicalPearls: {
      cariesProne: "唇面颈部易发生楔状缺损；邻面接触区。",
      periodontal: "牙周支持骨质极为坚固，是全口牙列中脱落最晚、牙周预后最好的牙位（理想桥体基牙）。",
      extraction: "先向唇舌向作大幅度缓慢摇动，解除骨壁锁结后，施以小幅度扭转力拔除。"
    },
    pins: [
      { id: "cusp_tip", name: "牙尖顶", category: "cusp", description: "穿透撕裂食物主要受力点，偏向近中。", position: [-0.08, 0.98, 0.15] },
      { id: "labial_ridge", name: "唇轴嵴", category: "ridge", description: "贯穿唇面中央的粗大纵向骨性隆起。", position: [0, 0.5, 0.35] },
      { id: "long_root", name: "全口最长牙根", category: "root", description: "平均根长达17mm，支撑强悍咬合力。", position: [0.08, -0.98, -0.05] },
    ],
  },

  "14": {
    fdi: "14",
    meshId: "FJ1277",
    conceptId: "FMA55689",
    name: "右上颌第一前磨牙",
    englishName: "Upper Right First Premolar",
    quadrant: 1,
    quadrantName: "右上颌（第I象限）",
    category: "premolar",
    toothTypeName: "第一前磨牙",
    palmer: "4┘",
    universal: 5,
    eruptionAge: "10~11 岁",
    morphometrics: { crownLength: 8.5, rootLength: 14.0, crownWidth: 7.0, crownThickness: 9.0, totalLength: 22.5 },
    cuspsCount: 2,
    rootsCount: 2,
    canalsDescription: "双根双管型（约 80%），单根双管型（约 18%），单管型罕见（<2%）",
    vertucciType: "Vertucci IV型（2-2型为主）",
    morphologyFeatures: [
      "（牙合）面呈卵圆形，颊舌径明显大于近远中径；有颊、舌两个牙尖，颊尖高大锐利，舌尖圆钝偏近中。",
      "特征性解剖标志：中央沟跨过近中边缘嵴延伸至近中面，形成独特的近中沟（Mesial groove）。",
      "近中邻面颈部有特征性的近中凹陷（Mesial concavity），正畸减数拔牙及刮治需特别警惕。",
      "约80%在根中部以下分为颊根和舌根两个牙根，根尖多向远中弯曲。"
    ],
    pulpFeatures: {
      chamberShape: "髓室呈颊舌向窄长的立扁形，颊舌径约为主近远中径的2倍。",
      hornsCount: 2,
      hornsDescription: "颊侧髓角高大尖锐，舌侧髓角较低圆钝。",
      canalOrifices: "2个根管口（颊侧根管口与舌侧根管口），位于咬合面中央颊舌向两端。",
      accessCavity: "咬合面中央偏颊侧开髓，呈颊舌向长卵圆形（切忌做成近远中向！）。",
      dangerZones: "近中颈部凹陷骨壁薄，开髓或器械预备极易在此发生侧穿；颊侧髓角位置极高，制备邻（牙合）洞易意外露髓。"
    },
    clinicalPearls: {
      cariesProne: "咬合面中央沟、近中边缘嵴近中沟及邻面接触点下方。",
      periodontal: "近中颈部凹陷易积聚牙石，刮治器较难贴合根面。",
      extraction: "双根尖多细弱，拔牙时严禁任何旋转扭力！必须以轻柔颊舌向反复摇动使骨槽扩张后脱位。"
    },
    pins: [
      { id: "buccal_cusp", name: "颊尖", category: "cusp", description: "高大尖锐，主导咬合穿透切割。", position: [0, 0.95, 0.35] },
      { id: "lingual_cusp", name: "舌尖", category: "cusp", description: "短小圆钝，偏向近中。", position: [-0.08, 0.85, -0.32] },
      { id: "mesial_groove", name: "近中沟（标志性结构）", category: "ridge", description: "自咬合面跨越近中边缘嵴至邻面的发育沟。", position: [-0.35, 0.85, 0.05] },
      { id: "buccal_canal_orifice", name: "颊根尖孔", category: "canal", description: "颊侧独立根尖孔。", position: [-0.05, -0.97, 0.22] },
      { id: "palatal_canal_orifice", name: "腭根尖孔", category: "canal", description: "舌侧独立根尖孔。", position: [0.05, -0.96, -0.2] },
    ],
  },

  "15": {
    fdi: "15",
    meshId: "FJ1278",
    conceptId: "FMA55688",
    name: "右上颌第二前磨牙",
    englishName: "Upper Right Second Premolar",
    quadrant: 1,
    quadrantName: "右上颌（第I象限）",
    category: "premolar",
    toothTypeName: "第二前磨牙",
    palmer: "5┘",
    universal: 4,
    eruptionAge: "10~12 岁",
    morphometrics: { crownLength: 8.5, rootLength: 14.0, crownWidth: 7.0, crownThickness: 9.0, totalLength: 22.5 },
    cuspsCount: 2,
    rootsCount: 1,
    canalsDescription: "单根单管型（约 55%），单根双管型（约 45%）",
    vertucciType: "Vertucci I型或 II型",
    morphologyFeatures: [
      "外形与第一前磨牙相似，但牙冠更对称圆润；颊尖与舌尖大小和高度几乎相等。",
      "咬合面裂沟短且浅，副沟较多，无明显的跨越近中边缘嵴的近中沟。",
      "绝大多数为粗大单根，扁圆锥形，近远中面有纵形发育沟浅凹，根尖向远中略弯。"
    ],
    pulpFeatures: {
      chamberShape: "髓室颊舌径大，髓底较第一前磨牙圆低。",
      hornsCount: 2,
      hornsDescription: "颊、舌两个髓角高度接近，均较第一前磨牙髓角平缓。",
      canalOrifices: "单根管口或呈裂隙状的双根管口。",
      accessCavity: "咬合面中央长卵圆形洞型。",
      dangerZones: "根尖1/3偶有分支弯曲分叉，探查易受阻。"
    },
    clinicalPearls: {
      cariesProne: "咬合面点隙裂沟与邻面接触点。",
      periodontal: "单根拔牙较第一前磨牙安全，但偶有根尖极度弯曲折断风险。",
      extraction: "颊舌向摇动为主，松动后可施加轻微顺逆摇转脱位。"
    },
    pins: [
      { id: "buccal_cusp", name: "颊尖", category: "cusp", description: "与舌尖近乎等高。", position: [0, 0.93, 0.32] },
      { id: "lingual_cusp", name: "舌尖", category: "cusp", description: "较第一前磨牙发达圆大。", position: [0, 0.9, -0.3] },
      { id: "apex", name: "根尖", category: "root", description: "扁长单根，根尖向远中略弯。", position: [0.08, -0.97, 0] },
    ],
  },

  "16": {
    fdi: "16",
    meshId: "FJ1276",
    conceptId: "FMA55698",
    name: "右上颌第一磨牙",
    englishName: "Upper Right First Molar (Six-year Molar)",
    quadrant: 1,
    quadrantName: "右上颌（第I象限）",
    category: "molar",
    toothTypeName: "第一磨牙",
    palmer: "6┘",
    universal: 3,
    eruptionAge: "6 岁（六龄牙）",
    morphometrics: { crownLength: 7.5, rootLength: 13.0, crownWidth: 10.0, crownThickness: 11.0, totalLength: 20.5 },
    cuspsCount: 4,
    rootsCount: 3,
    canalsDescription: "三根三管或四管（MB近中颊根内 MB2 检出率高达 56%~60%！）",
    vertucciType: "近颊根多见 Vertucci II型或 IV型",
    morphologyFeatures: [
      "上颌牙列中体积最大、功能最强之恒磨牙；牙冠咬合面呈特征性斜方形。",
      "有4个主要牙尖：近颊尖（MB）、远颊尖（DB）、近舌尖（ML，全冠最大）、远舌尖（DL）。",
      "特征性斜嵴（Oblique ridge）：近中舌尖与远中颊尖三角嵴斜行相连，是上颌第一磨牙的解剖标志！",
      "约60%个体在近中舌尖的舌侧出现第5牙尖——卡氏尖（Carabelli cusp）。",
      "分三根：近中颊根（MB）、远中颊根（DB）和粗壮长直的腭根（P），三根呈三脚架式分开，固位力极强。"
    ],
    pulpFeatures: {
      chamberShape: "髓室底呈立方形或略带斜方形，近颊角锐，远颊角钝。",
      hornsCount: 4,
      hornsDescription: "4个髓角，以近中舌髓角最大，近中颊髓角最高（极易意外穿髓！）。",
      canalOrifices: "3~4个根管口：腭管口（P，最大最圆）、远颊管口（DB）、近颊管口（MB1），以及其舌侧暗线延伸处隐匿的 MB2 管口！",
      accessCavity: "咬合面偏向近中及颊侧，呈斜梯形或圆三角形洞型，避开斜嵴。",
      dangerZones: "近中颊髓角位置极高，龋损稍深即露髓；MB2 根管细小弯曲，临床漏治率高，是上颌磨牙根管治疗失败的主要根源！"
    },
    clinicalPearls: {
      cariesProne: "咬合面中央窝、远中舌沟、颊面发育沟及卡氏尖凹陷点隙（儿童龋病最高发牙位）。",
      periodontal: "根分叉病变高发，尤其根柱短者，三根分叉区探查需使用 Nabers 探针。",
      extraction: "因三根分散展开，拔牙阻力巨大；切忌扭转！拔牙钳深夹颊侧与腭侧，以强大的颊腭向交替摇动扩张牙槽窝。"
    },
    pins: [
      { id: "ml_cusp", name: "近中舌尖（最大牙尖）", category: "cusp", description: "全冠最大最主要的承力磨细牙尖。", position: [-0.22, 0.9, -0.35] },
      { id: "mb_cusp", name: "近中颊尖（最高髓角）", category: "cusp", description: "近颊髓角极高，极易意外穿髓。", position: [-0.25, 0.94, 0.32] },
      { id: "oblique_ridge", name: "斜嵴（标志性解剖）", category: "ridge", description: "近舌尖与远颊尖相连的斜行强固釉质嵴。", position: [0.05, 0.88, 0] },
      { id: "carabelli", name: "卡氏尖（Carabelli cusp）", category: "cusp", description: "近舌尖舌侧常出现的第5副牙尖。", position: [-0.28, 0.75, -0.45] },
      { id: "palatal_root", name: "粗壮腭根", category: "root", description: "最粗、最长、最直的主支撑牙根。", position: [0, -0.98, -0.38] },
      { id: "mb_root", name: "近中颊根（MB1/MB2）", category: "canal", description: "扁平弯曲，MB2 根管高发隐匿区。", position: [-0.3, -0.95, 0.28] },
      { id: "db_root", name: "远中颊根", category: "root", description: "较小较圆，向远中弯曲。", position: [0.3, -0.93, 0.25] },
    ],
  },

  "17": {
    fdi: "17",
    meshId: "FJ1275",
    conceptId: "FMA55697",
    name: "右上颌第二磨牙",
    englishName: "Upper Right Second Molar",
    quadrant: 1,
    quadrantName: "右上颌（第I象限）",
    category: "molar",
    toothTypeName: "第二磨牙",
    palmer: "7┘",
    universal: 2,
    eruptionAge: "12~13 岁",
    morphometrics: { crownLength: 7.0, rootLength: 12.0, crownWidth: 9.0, crownThickness: 11.0, totalLength: 19.0 },
    cuspsCount: 4,
    rootsCount: 3,
    canalsDescription: "三根三管型为主，三根常相互聚拢或融合",
    vertucciType: "三根单管型为主",
    morphologyFeatures: [
      "形态与第一磨牙相似但稍小，咬合面斜方形更扁更明显。",
      "远中舌尖明显退化缩小，部分个体远中舌尖完全缺如，呈三尖型（心形咬合面）。",
      "三根多向后方聚拢倾斜，甚至发生部分根融合（颊根融合或腭根与远颊根融合）。"
    ],
    pulpFeatures: {
      chamberShape: "髓室底呈近颊、远颊、腭管三根管口聚拢三角形，彼此距离很近。",
      hornsCount: 4,
      hornsDescription: "髓角较第一磨牙低，近颊髓角相对突出。",
      canalOrifices: "3个根管口，近颊、远颊管口间距短，探查需更偏远中倾斜度。",
      accessCavity: "咬合面近颊向三角洞型。",
      dangerZones: "牙位深在、张口受限视野受阻；三根融合时根管系统变异大（C形根管罕见但可见）。"
    },
    clinicalPearls: {
      cariesProne: "咬合面裂沟及颊沟点隙。",
      periodontal: "牙根聚拢使根分叉间隙狭窄，清洁困难。",
      extraction: "因牙根向后聚拢，脱位阻力小于第一磨牙，向颊腭向摇动后向颊侧脱位。"
    },
    pins: [
      { id: "convergent_roots", name: "聚拢的三根", category: "root", description: "三根相对聚拢，向远中倾斜角度显著。", position: [0.15, -0.96, 0] },
    ],
  },

  // ==================== 左上颌（第二象限，21~27） ====================
  "21": {
    fdi: "21",
    meshId: "FJ1265",
    conceptId: "FMA55682",
    name: "左上颌中切牙",
    englishName: "Upper Left Central Incisor",
    quadrant: 2,
    quadrantName: "左上颌（第II象限）",
    category: "incisor",
    toothTypeName: "中切牙",
    palmer: "└1",
    universal: 9,
    eruptionAge: "7~8 岁",
    morphometrics: { crownLength: 10.5, rootLength: 13.0, crownWidth: 8.5, crownThickness: 7.0, totalLength: 23.5 },
    cuspsCount: 0,
    rootsCount: 1,
    canalsDescription: "单根单管型（100%）",
    vertucciType: "Vertucci I型（100%）",
    morphologyFeatures: [
      "与右上颌中切牙对称镜像；牙冠宽厚铲形，切嵴水平直立。",
      "近中切角尖锐近直角，远中切角略圆钝。",
      "舌窝深陷平整，由近中边缘嵴、远中边缘嵴与颈部舌隆突包绕。"
    ],
    pulpFeatures: {
      chamberShape: "髓腔宽大呈漏斗圆锥状，切端扁宽、根端圆锥形。",
      hornsCount: 3,
      hornsDescription: "近中、远中髓角在年轻恒牙中尖锐突向切角。",
      canalOrifices: "粗大单管口。",
      accessCavity: "舌面窝中1/3与切1/3交界区，呈倒圆三角形洞型。",
      dangerZones: "髓室顶距切缘近，切嵴磨耗或外伤冠折极易露髓。"
    },
    clinicalPearls: {
      cariesProne: "邻面接触区隐匿龋、舌窝点隙。",
      periodontal: "前牙美学区，种植与修复对唇侧骨壁厚度要求极高。",
      extraction: "向唇腭向缓慢摇动使骨壁扩张，再稍加旋转脱位。"
    },
    pins: [
      { id: "incisal_edge", name: "切嵴", category: "ridge", description: "切导核心结构。", position: [0, 0.95, 0.15] },
      { id: "lingual_fossa", name: "舌面窝", category: "fossa", description: "舌侧平滑凹面，开髓主要操作区。", position: [0, 0.5, -0.2] },
      { id: "apex", name: "根尖孔", category: "canal", description: "单根粗大根尖孔。", position: [-0.08, -0.98, -0.05] },
    ],
  },

  "22": {
    fdi: "22",
    meshId: "FJ1266",
    conceptId: "FMA55683",
    name: "左上颌侧切牙",
    englishName: "Upper Left Lateral Incisor",
    quadrant: 2,
    quadrantName: "左上颌（第II象限）",
    category: "incisor",
    toothTypeName: "侧切牙",
    palmer: "└2",
    universal: 10,
    eruptionAge: "8~9 岁",
    morphometrics: { crownLength: 9.0, rootLength: 13.0, crownWidth: 6.5, crownThickness: 6.0, totalLength: 22.0 },
    cuspsCount: 0,
    rootsCount: 1,
    canalsDescription: "单根单管型（99%）",
    vertucciType: "Vertucci I型",
    morphologyFeatures: [
      "外形比中切牙窄小圆厚，近远中切角圆钝显著，远中切角呈宽弧形。",
      "舌面深窝及畸形舌侧尖变异高发牙位。",
      "细长单根，根尖明显向远中弯曲。"
    ],
    pulpFeatures: {
      chamberShape: "唇舌径宽于近远中径，髓室顶呈圆弧形。",
      hornsCount: 2,
      hornsDescription: "2个微小髓角。",
      canalOrifices: "单根管口，根管细且根尖向远中弯曲度大。",
      accessCavity: "舌面窝中央开髓，呈卵圆形孔洞。",
      dangerZones: "根尖向远中和腭侧弯曲极常见，镍钛器械极易形成台阶偏移。"
    },
    clinicalPearls: {
      cariesProne: "畸形舌侧窝隐匿龋及牙髓坏死。",
      periodontal: "伴畸形舌侧沟者深牙周袋反复化脓。",
      extraction: "严禁暴力旋转扭力，以防根尖弯曲段折断。"
    },
    pins: [
      { id: "curved_apex", name: "远中弯曲根尖", category: "root", description: "根尖显著远中弯曲特征。", position: [-0.15, -0.97, -0.08] },
    ],
  },

  "23": {
    fdi: "23",
    meshId: "FJ1267",
    conceptId: "FMA55799",
    name: "左上颌尖牙",
    englishName: "Upper Left Canine",
    quadrant: 2,
    quadrantName: "左上颌（第II象限）",
    category: "canine",
    toothTypeName: "尖牙",
    palmer: "└3",
    universal: 11,
    eruptionAge: "11~12 岁",
    morphometrics: { crownLength: 10.0, rootLength: 17.0, crownWidth: 7.5, crownThickness: 8.0, totalLength: 27.0 },
    cuspsCount: 1,
    rootsCount: 1,
    canalsDescription: "单根单管型（100%）",
    vertucciType: "Vertucci I型（100%）",
    morphologyFeatures: [
      "强厚五边形牙冠，高突坚固牙尖偏近中，唇轴嵴高突。",
      "全口牙中牙根最粗、最长（平均17mm），支撑力极其强悍。",
      "牙弓角部关键支柱，支撑上唇角部面容丰满。"
    ],
    pulpFeatures: {
      chamberShape: "全口最大的单根管髓腔，唇舌径极大。",
      hornsCount: 1,
      hornsDescription: "高耸尖锐的单一髓角，直伸向牙尖顶端内部。",
      canalOrifices: "粗大卵圆形单根管口。",
      accessCavity: "舌隆突上方长卵圆形开髓洞型。",
      dangerZones: "唇舌向管腔极度扁宽，根管预备需侧向扩展彻底清理唇舌侧死角。"
    },
    clinicalPearls: {
      cariesProne: "颈部楔状缺损及邻面龋。",
      periodontal: "牙周膜面积全口最大，固位佳。",
      extraction: "先向唇侧及腭侧大幅缓慢摇动松动骨槽，再略加扭转脱位。"
    },
    pins: [
      { id: "cusp_tip", name: "牙尖顶", category: "cusp", description: "单尖偏近中，撕裂食物主要支点。", position: [0.08, 0.98, 0.15] },
      { id: "root_apex", name: "极长根尖", category: "root", description: "深插入上颌犬齿窝骨质内。", position: [-0.08, -0.98, -0.05] },
    ],
  },

  "24": {
    fdi: "24",
    meshId: "FJ1262",
    conceptId: "FMA55690",
    name: "左上颌第一前磨牙",
    englishName: "Upper Left First Premolar",
    quadrant: 2,
    quadrantName: "左上颌（第II象限）",
    category: "premolar",
    toothTypeName: "第一前磨牙",
    palmer: "└4",
    universal: 12,
    eruptionAge: "10~11 岁",
    morphometrics: { crownLength: 8.5, rootLength: 14.0, crownWidth: 7.0, crownThickness: 9.0, totalLength: 22.5 },
    cuspsCount: 2,
    rootsCount: 2,
    canalsDescription: "双根双管型（约 80%），单根双管型（约 18%）",
    vertucciType: "Vertucci IV型（2-2型）",
    morphologyFeatures: [
      "颊尖高长，舌尖短小偏近中；咬合面近中边缘嵴有标志性的近中沟跨越。",
      "近中邻面颈部有特征性近中凹陷；约80%为颊舌双根分叉。"
    ],
    pulpFeatures: {
      chamberShape: "髓室呈颊舌向扁长立方形。",
      hornsCount: 2,
      hornsDescription: "颊侧髓角高锐，舌侧髓角较短。",
      canalOrifices: "颊根管口与舌根管口各一，位于咬合面中央颊舌两极。",
      accessCavity: "咬合面中央颊舌向长卵圆形开髓洞型。",
      dangerZones: "近中颈部凹陷极薄弱，开髓磨除过多极易近中侧穿！"
    },
    clinicalPearls: {
      cariesProne: "近中沟点隙、邻面接触区。",
      periodontal: "双根分叉区及近中凹陷易形成难治性牙周袋。",
      extraction: "双根尖极纤细，严禁旋转！必须向颊腭向摇动扩张脱位。"
    },
    pins: [
      { id: "mesial_groove", name: "标志性近中沟", category: "ridge", description: "跨越边缘嵴标志沟。", position: [0.35, 0.85, 0.05] },
    ],
  },

  "25": {
    fdi: "25",
    meshId: "FJ1264",
    conceptId: "FMA55691",
    name: "左上颌第二前磨牙",
    englishName: "Upper Left Second Premolar",
    quadrant: 2,
    quadrantName: "左上颌（第II象限）",
    category: "premolar",
    toothTypeName: "第二前磨牙",
    palmer: "└5",
    universal: 13,
    eruptionAge: "10~12 岁",
    morphometrics: { crownLength: 8.5, rootLength: 14.0, crownWidth: 7.0, crownThickness: 9.0, totalLength: 22.5 },
    cuspsCount: 2,
    rootsCount: 1,
    canalsDescription: "单根单管型（约 55%），单根双管型（约 45%）",
    vertucciType: "Vertucci I型或 II型",
    morphologyFeatures: [
      "牙冠外形圆润对称，颊尖与舌尖高度大小接近，无明显近中跨嵴沟。",
      "扁圆锥形粗大单根，根尖向远中略弯。"
    ],
    pulpFeatures: {
      chamberShape: "髓室底平，髓腔呈颊舌向扁长卵圆形。",
      hornsCount: 2,
      hornsDescription: "两髓角近乎等高。",
      canalOrifices: "中央单管口或裂缝双管口。",
      accessCavity: "咬合面长卵圆形洞型。",
      dangerZones: "根尖1/3分叉变异探查。"
    },
    clinicalPearls: {
      cariesProne: "咬合面中央沟、邻面接触区。",
      periodontal: "单根脱位较安全。",
      extraction: "颊舌向摇动扩张后摇转脱位。"
    },
    pins: [
      { id: "apex", name: "扁长单根", category: "root", description: "根尖微弯单根。", position: [-0.08, -0.97, 0] },
    ],
  },

  "26": {
    fdi: "26",
    meshId: "FJ1261",
    conceptId: "FMA55699",
    name: "左上颌第一磨牙",
    englishName: "Upper Left First Molar (Six-year Molar)",
    quadrant: 2,
    quadrantName: "左上颌（第II象限）",
    category: "molar",
    toothTypeName: "第一磨牙",
    palmer: "└6",
    universal: 14,
    eruptionAge: "6 岁（六龄牙）",
    morphometrics: { crownLength: 7.5, rootLength: 13.0, crownWidth: 10.0, crownThickness: 11.0, totalLength: 20.5 },
    cuspsCount: 4,
    rootsCount: 3,
    canalsDescription: "三根三管或四管（MB近颊根 MB2 检出率高达 56%~60%！）",
    vertucciType: "近颊根多见 Vertucci II型或 IV型",
    morphologyFeatures: [
      "咬合面斜方形，近中舌尖与远中颊尖连成粗大斜嵴。",
      "常有卡氏尖，近中舌尖全冠最大，三根分叉散开（近颊根、远颊根、腭根）。"
    ],
    pulpFeatures: {
      chamberShape: "髓室底呈斜方形，近颊角最锐角突出。",
      hornsCount: 4,
      hornsDescription: "近颊髓角极高，易受近颊点隙浅龋累及穿髓。",
      canalOrifices: "腭根管（P）、远颊管（DB）、近颊管（MB1）及近中颊侧第二根管（MB2，临床高发漏治区！）。",
      accessCavity: "偏向咬合面近中及颊侧斜梯形洞型，避开斜嵴。",
      dangerZones: "MB2 根管探查遗漏；髓室底暗线下方穿孔。"
    },
    clinicalPearls: {
      cariesProne: "咬合面裂沟、远舌沟、颊面点隙。",
      periodontal: "三根分叉区牙周骨吸收。",
      extraction: "三根固位极其坚固，严禁旋转，颊腭交替强力摇动。"
    },
    pins: [
      { id: "oblique_ridge", name: "标志性斜嵴", category: "ridge", description: "近舌尖至远颊尖斜形釉质嵴。", position: [-0.05, 0.88, 0] },
      { id: "palatal_root", name: "主腭根", category: "root", description: "粗大独立支持根。", position: [0, -0.98, -0.38] },
    ],
  },

  "27": {
    fdi: "27",
    meshId: "FJ1263",
    conceptId: "FMA55700",
    name: "左上颌第二磨牙",
    englishName: "Upper Left Second Molar",
    quadrant: 2,
    quadrantName: "左上颌（第II象限）",
    category: "molar",
    toothTypeName: "第二磨牙",
    palmer: "└7",
    universal: 15,
    eruptionAge: "12~13 岁",
    morphometrics: { crownLength: 7.0, rootLength: 12.0, crownWidth: 9.0, crownThickness: 11.0, totalLength: 19.0 },
    cuspsCount: 4,
    rootsCount: 3,
    canalsDescription: "三根三管为主，三根后聚倾斜",
    vertucciType: "三根单管型为主",
    morphologyFeatures: [
      "比第一磨牙小，斜方形更为压扁，远中舌尖明显缩小或消失呈三尖心形。",
      "三根向后聚拢，甚至发生根融合。"
    ],
    pulpFeatures: {
      chamberShape: "髓底根管口聚拢呈紧凑三角形。",
      hornsCount: 4,
      hornsDescription: "髓角高度较平缓。",
      canalOrifices: "3个根管口间距窄小。",
      accessCavity: "咬合面近颊向三角形开髓洞型。",
      dangerZones: "张口受限视野差，后聚根管预备器械易折断。"
    },
    clinicalPearls: {
      cariesProne: "咬合面裂沟与颊沟点隙。",
      periodontal: "根间隙小易发根分叉区骨吸收。",
      extraction: "颊腭向摇动后向颊侧脱位。"
    },
    pins: [
      { id: "convergent_roots", name: "后倾聚拢根", category: "root", description: "三根向后聚拢。", position: [-0.15, -0.96, 0] },
    ],
  },

  // ==================== 左下颌（第三象限，31~37） ====================
  "31": {
    fdi: "31",
    meshId: "FJ1258",
    conceptId: "FMA57143",
    name: "左下颌中切牙",
    englishName: "Lower Left Central Incisor",
    quadrant: 3,
    quadrantName: "左下颌（第III象限）",
    category: "incisor",
    toothTypeName: "中切牙",
    palmer: "┌1",
    universal: 24,
    eruptionAge: "6~7 岁",
    morphometrics: { crownLength: 9.5, rootLength: 12.5, crownWidth: 5.0, crownThickness: 6.0, totalLength: 21.0 },
    cuspsCount: 0,
    rootsCount: 1,
    canalsDescription: "单根单管（约 70%），唇舌双根管（约 30%！）",
    vertucciType: "Vertucci I型（70%）或 III/IV型（30%）",
    morphologyFeatures: [
      "全口恒牙中体积最小、宽度最窄、形态最对称的牙齿。",
      "近中与远中切角几乎完全对称直角，切缘水平平直。",
      "细长扁平单根，近远中面有纵形浅凹，根尖向远中微倾。"
    ],
    pulpFeatures: {
      chamberShape: "髓腔极其狭窄，唇舌向极其扁平。",
      hornsCount: 2,
      hornsDescription: "髓角低平接近切缘。",
      canalOrifices: "单管口或呈极扁唇舌向双管口（易漏诊舌侧第二根管！）。",
      accessCavity: "舌面窝中1/3正中，呈窄长卵圆形（必须充分扩展舌侧以暴露舌侧根管）。",
      dangerZones: "牙体近远中径极窄（仅5mm），近远中方向极易侧穿！"
    },
    clinicalPearls: {
      cariesProne: "舌侧颈部唾液腺开口处牙结石堆积最高发牙位（牙周病高发区）。",
      periodontal: "牙槽骨唇舌壁菲薄，易出现骨开窗与退缩。",
      extraction: "以极小幅度唇舌向轻微摇动，严禁任何粗暴旋转！垂直向上脱位。"
    },
    pins: [
      { id: "incisal_edge", name: "平直切嵴", category: "ridge", description: "对称平直切缘。", position: [0, -0.95, 0.1] },
      { id: "apex", name: "扁长根尖", category: "root", description: "唇舌向扁、近远中窄长根尖。", position: [-0.05, 0.98, 0] },
    ],
  },

  "32": {
    fdi: "32",
    meshId: "FJ1259",
    conceptId: "FMA57141",
    name: "左下颌侧切牙",
    englishName: "Lower Left Lateral Incisor",
    quadrant: 3,
    quadrantName: "左下颌（第III象限）",
    category: "incisor",
    toothTypeName: "侧切牙",
    palmer: "┌2",
    universal: 23,
    eruptionAge: "7~8 岁",
    morphometrics: { crownLength: 9.5, rootLength: 14.0, crownWidth: 5.5, crownThickness: 6.5, totalLength: 22.0 },
    cuspsCount: 0,
    rootsCount: 1,
    canalsDescription: "单根单管（约 75%），唇舌双根管（约 25%）",
    vertucciType: "Vertucci I型或 III型",
    morphologyFeatures: [
      "比下颌中切牙稍大稍宽，不对称性较明显。",
      "切缘向远中舌侧扭转倾斜，远中切角明显圆钝，近中切角接近直角。",
      "细长扁根，远中发育沟凹陷更深。"
    ],
    pulpFeatures: {
      chamberShape: "唇舌径大于近远中径，扁窄裂隙形。",
      hornsCount: 2,
      hornsDescription: "两髓角微小。",
      canalOrifices: "长裂隙单管口或唇舌双根管口。",
      accessCavity: "舌面窝窄卵圆形开髓洞型。",
      dangerZones: "近远中方向极薄，开髓方向偏斜易发生侧穿。"
    },
    clinicalPearls: {
      cariesProne: "邻面接触点下方隐蔽龋。",
      periodontal: "舌侧牙结石堆积重度区。",
      extraction: "轻柔唇舌向交替摇动脱位。"
    },
    pins: [
      { id: "incisal_distal_slope", name: "远中倾斜切缘", category: "ridge", description: "切缘向远中舌侧明显扭转倾斜。", position: [0.15, -0.93, 0.05] },
    ],
  },

  "33": {
    fdi: "33",
    meshId: "FJ1260",
    conceptId: "FMA55687",
    name: "左下颌尖牙",
    englishName: "Lower Left Canine",
    quadrant: 3,
    quadrantName: "左下颌（第III象限）",
    category: "canine",
    toothTypeName: "尖牙",
    palmer: "┌3",
    universal: 22,
    eruptionAge: "9~10 岁",
    morphometrics: { crownLength: 11.0, rootLength: 15.5, crownWidth: 7.0, crownThickness: 7.5, totalLength: 26.0 },
    cuspsCount: 1,
    rootsCount: 1,
    canalsDescription: "单根单管型为主（约 90%），唇舌向双根管（约 10%）",
    vertucciType: "Vertucci I型为主，偶见 IV型",
    morphologyFeatures: [
      "牙冠长而窄，较上颌尖牙更为细长；牙尖锐利但略显钝实，近中斜段短而平。",
      "唇轴嵴不如上颌尖牙突出，牙根长粗直立，常压扁呈唇舌向粗大单根。"
    ],
    pulpFeatures: {
      chamberShape: "髓腔长大，唇舌径极大，近远中径窄小。",
      hornsCount: 1,
      hornsDescription: "单一髓角突向牙尖内部。",
      canalOrifices: "长椭圆形单根管口（偶尔分唇舌两根管口）。",
      accessCavity: "舌面窝长卵圆形洞型。",
      dangerZones: "唇舌双根管变异（漏治舌侧根管！）。"
    },
    clinicalPearls: {
      cariesProne: "颈部磨损与邻面龋。",
      periodontal: "牙周支持力极为坚固，拔牙脱落晚。",
      extraction: "缓慢有力唇舌向反复摇动，松动后顺逆轻微旋转脱位。"
    },
    pins: [
      { id: "cusp_tip", name: "尖牙顶", category: "cusp", description: "粗大牙尖，咬合导向关键牙位。", position: [-0.08, -0.98, 0.12] },
    ],
  },

  "34": {
    fdi: "34",
    meshId: "FJ1255",
    conceptId: "FMA55693",
    name: "左下颌第一前磨牙",
    englishName: "Lower Left First Premolar",
    quadrant: 3,
    quadrantName: "左下颌（第III象限）",
    category: "premolar",
    toothTypeName: "第一前磨牙",
    palmer: "┌4",
    universal: 21,
    eruptionAge: "10~12 岁",
    morphometrics: { crownLength: 8.5, rootLength: 14.0, crownWidth: 7.0, crownThickness: 7.5, totalLength: 21.5 },
    cuspsCount: 2,
    rootsCount: 1,
    canalsDescription: "单根单管（约 75%），中下段分叉双根管（约 25%）",
    vertucciType: "Vertucci I型（75%）或 V型（1-2型，25%）",
    morphologyFeatures: [
      "全冠显著向舌侧极度倾斜（牙冠长轴与牙根长轴形成约 15° 的钝角！）。",
      "颊尖巨大高耸，舌尖退化矮小（仅占颊尖1/3高），呈显著的'单尖'倾向。",
      "特征性横嵴（Transverse ridge）：粗大横嵴横贯咬合面连接颊尖与舌尖，将咬合面分隔为近中、远中两个小窝。"
    ],
    pulpFeatures: {
      chamberShape: "髓室随牙冠显著向舌侧倾斜！",
      hornsCount: 2,
      hornsDescription: "颊侧髓角极其高耸直达颊尖！舌侧髓角极低甚至不明显。",
      canalOrifices: "单根管口，但根管常在根中下段分叉为颊舌双分支！",
      accessCavity: "开髓孔必须偏向颊尖三角嵴处，钻针方向平行于牙根长轴（向颊侧倾斜约15°），切忌垂直于咬合面钻入，否则必导致舌侧颈部穿孔！",
      dangerZones: "牙冠舌倾导致开髓极易向舌侧侧穿；根中1/3盲区分叉双管极易断针或漏治！"
    },
    clinicalPearls: {
      cariesProne: "咬合面近中窝、远中窝点隙裂沟。",
      periodontal: "舌侧倾斜易堆积牙结石。",
      extraction: "向颊侧稍加摇动，松动后以小幅度旋转配合脱位。"
    },
    pins: [
      { id: "high_buccal_cusp", name: "高耸颊尖", category: "cusp", description: "高尖向舌侧大幅倾斜。", position: [0, -0.95, 0.32] },
      { id: "rudimentary_lingual_cusp", name: "退化舌尖", category: "cusp", description: "矮小圆钝，仅及颊尖1/3高。", position: [0, -0.75, -0.28] },
      { id: "transverse_ridge", name: "横嵴", category: "ridge", description: "连接颊舌尖的核心釉质骨架。", position: [0, -0.85, 0] },
    ],
  },

  "35": {
    fdi: "35",
    meshId: "FJ1257",
    conceptId: "FMA55692",
    name: "左下颌第二前磨牙",
    englishName: "Lower Left Second Premolar",
    quadrant: 3,
    quadrantName: "左下颌（第III象限）",
    category: "premolar",
    toothTypeName: "第二前磨牙",
    palmer: "┌5",
    universal: 20,
    eruptionAge: "11~12 岁",
    morphometrics: { crownLength: 8.0, rootLength: 14.5, crownWidth: 7.0, crownThickness: 8.0, totalLength: 22.0 },
    cuspsCount: 3,
    rootsCount: 1,
    canalsDescription: "单根单管型为主（约 85%），双根管型（约 15%）",
    vertucciType: "Vertucci I型为主",
    morphologyFeatures: [
      "牙冠方圆，舌侧倾斜度较第一前磨牙小；多为三尖型（颊尖、近舌尖、远舌尖），咬合面呈'Y'字形裂沟。",
      "单根粗壮，根尖向远中略弯。"
    ],
    pulpFeatures: {
      chamberShape: "髓室底圆凹，立方形。",
      hornsCount: 3,
      hornsDescription: "颊髓角最高，近舌髓角次之，远舌髓角最小。",
      canalOrifices: "单根管口，卵圆形中央分布。",
      accessCavity: "咬合面中央卵圆形开髓洞型。",
      dangerZones: "根尖1/3向远中偏曲。"
    },
    clinicalPearls: {
      cariesProne: "咬合面'Y'形中央点隙裂沟。",
      periodontal: "邻面牙结石与骨吸收。",
      extraction: "颊舌向摇动扩张后旋转脱位。"
    },
    pins: [
      { id: "buccal_cusp", name: "主颊尖", category: "cusp", description: "最高主咬合尖。", position: [0, -0.93, 0.3] },
      { id: "ml_cusp", name: "近中舌尖", category: "cusp", description: "舌侧发达牙尖。", position: [-0.2, -0.85, -0.28] },
    ],
  },

  "36": {
    fdi: "36",
    meshId: "FJ1254",
    conceptId: "FMA55704",
    name: "左下颌第一磨牙",
    englishName: "Lower Left First Molar (Six-year Molar)",
    quadrant: 3,
    quadrantName: "左下颌（第III象限）",
    category: "molar",
    toothTypeName: "第一磨牙",
    palmer: "┌6",
    universal: 19,
    eruptionAge: "6 岁（六龄齿）",
    morphometrics: { crownLength: 7.5, rootLength: 14.0, crownWidth: 11.0, crownThickness: 10.5, totalLength: 21.0 },
    cuspsCount: 5,
    rootsCount: 2,
    canalsDescription: "双根三管（近颊MB、近舌ML、远中D，约 65%），双根四管（MB、ML、远颊DB、远舌DL，约 30%），偶见远中舌侧第三根（Radix entomolaris DL根，约 10%）",
    vertucciType: "近中根多为 Vertucci IV型（2-2型），远中根多为 I型或 II型",
    morphologyFeatures: [
      "全口牙中近远中径最大之恒牙；咬合面长方形，常有 5 个牙尖：近颊尖（MB）、远颊尖（DB）、远中尖（D，最小位于颊远中角）、近舌尖（ML）、远舌尖（DL）。",
      "咬合面发育沟呈特征性十字点隙（'点隙裂沟呈十形或王形'）。",
      "常为近中根与远中根两个强壮扁根，近中根较扁且弯，远中根稍圆直，根尖均弯向远中。"
    ],
    pulpFeatures: {
      chamberShape: "髓室呈近远中向稍长的立方形，底距釉牙骨质界（CEJ）约 1.5~2mm。",
      hornsCount: 5,
      hornsDescription: "5个髓角，以近中颊髓角和近中舌髓角最高、最锐利！",
      canalOrifices: "3~4个根管口：近颊管口（MB）、近舌管口（ML，二者之间常有峡部 isthmus 吻合！）、远中管口（D 或分 DB 与 DL）。",
      accessCavity: "咬合面偏向近中梯形或倒圆角长方形洞型，偏向近中及颊侧（近中边长于远中边）。",
      dangerZones: "近中根弯曲且管间峡部易残留坏死牙髓；远中舌侧额外根（DL根）常细长极度向舌侧弯曲，漏诊率极高！近中髓角位置高极易露髓。"
    },
    clinicalPearls: {
      cariesProne: "咬合面点隙裂沟、颊沟点隙（龋病、牙髓炎及根尖周炎全口最高发牙位！）。",
      periodontal: "双根分叉病变（Furcation involvement）高发牙位。",
      extraction: "两扁根近远中展开且根尖向后弯曲，拔牙阻力巨大；严禁旋转！必须向颊侧、舌侧做坚实有力的缓慢交替摇动。"
    },
    pins: [
      { id: "mb_cusp", name: "近中颊尖", category: "cusp", description: "承力咬合尖，近颊髓角极高。", position: [-0.3, -0.92, 0.32] },
      { id: "db_cusp", name: "远中颊尖", category: "cusp", description: "颊侧第二大牙尖。", position: [0.15, -0.9, 0.3] },
      { id: "distal_cusp", name: "远中尖（第5牙尖）", category: "cusp", description: "全冠最小牙尖，位于远中颊角。", position: [0.38, -0.85, 0.15] },
      { id: "ml_cusp", name: "近中舌尖", category: "cusp", description: "高耸舌侧剪切尖。", position: [-0.25, -0.94, -0.32] },
      { id: "dl_cusp", name: "远中舌尖", category: "cusp", description: "舌侧第二尖。", position: [0.18, -0.92, -0.3] },
      { id: "mesial_root", name: "扁平近中根（MB/ML）", category: "canal", description: "极扁双根管，峡部高发区。", position: [-0.28, 0.95, 0] },
      { id: "distal_root", name: "远中根（D / 变异DL根）", category: "root", description: "可分出独立远舌额外根（Radix）。", position: [0.28, 0.93, 0] },
    ],
  },

  "37": {
    fdi: "37",
    meshId: "FJ1256",
    conceptId: "FMA55703",
    name: "左下颌第二磨牙",
    englishName: "Lower Left Second Molar",
    quadrant: 3,
    quadrantName: "左下颌（第III象限）",
    category: "molar",
    toothTypeName: "第二磨牙",
    palmer: "┌7",
    universal: 18,
    eruptionAge: "12~13 岁",
    morphometrics: { crownLength: 7.0, rootLength: 13.0, crownWidth: 10.0, crownThickness: 9.5, totalLength: 20.0 },
    cuspsCount: 4,
    rootsCount: 2,
    canalsDescription: "双根三管或 C形根管（C-shaped canal，中国人群检出率高达 30%~40%！）",
    vertucciType: "C形根管（Melton 分型 I/II/III型）高发",
    morphologyFeatures: [
      "形态与第一磨牙相似但稍小；多数无远中尖，呈标准的四尖型（MB, DB, ML, DL），咬合面发育沟呈标准的完美十字形（'+'形中央裂）。",
      "双根靠拢或在舌侧发生根融合形成马蹄形的 C形根（中国汉族人群高发变异！）。"
    ],
    pulpFeatures: {
      chamberShape: "髓室多呈 C形或长方形；若为 C形根管，髓室底暗线呈弧形连续环绕。",
      hornsCount: 4,
      hornsDescription: "4个髓角，高低较接近。",
      canalOrifices: "C形连续带状弧形根管口（扇形/带状）或正常的近颊、近舌、远中管口。",
      accessCavity: "咬合面近颊向卵圆长方形开髓孔。",
      dangerZones: "C形根管舌侧骨壁极薄（常不足 0.5mm！），过度机械预备极易发生舌侧条带状穿孔（Strip perforation）！"
    },
    clinicalPearls: {
      cariesProne: "咬合面十字裂沟点隙。",
      periodontal: "C形根舌侧纵沟易藏污纳垢诱发深牙周袋。",
      extraction: "双根向后聚拢，脱位阻力较第一磨牙小，向颊侧脱位为主。"
    },
    pins: [
      { id: "cross_groove", name: "标志性十字裂沟", category: "ridge", description: "完美的十字形点隙裂沟发育线。", position: [0, -0.9, 0] },
      { id: "c_shaped_root", name: "C形融合根好发区", category: "canal", description: "中国汉族人群 C形根管发生率高达30%以上。", position: [0, 0.95, -0.15] },
    ],
  },

  // ==================== 右下颌（第四象限，41~47） ====================
  "41": {
    fdi: "41",
    meshId: "FJ1272",
    conceptId: "FMA57142",
    name: "右下颌中切牙",
    englishName: "Lower Right Central Incisor",
    quadrant: 4,
    quadrantName: "右下颌（第IV象限）",
    category: "incisor",
    toothTypeName: "中切牙",
    palmer: "1┐",
    universal: 25,
    eruptionAge: "6~7 岁",
    morphometrics: { crownLength: 9.5, rootLength: 12.5, crownWidth: 5.0, crownThickness: 6.0, totalLength: 21.0 },
    cuspsCount: 0,
    rootsCount: 1,
    canalsDescription: "单根单管（约 70%），唇舌双根管（约 30%）",
    vertucciType: "Vertucci I型为主",
    morphologyFeatures: [
      "全口体积最小、对称度最高牙齿；近远中切角直角对称，切缘平直。",
      "扁细单根，唇舌径远大于近远中径。"
    ],
    pulpFeatures: {
      chamberShape: "狭窄扁裂隙状。",
      hornsCount: 2,
      hornsDescription: "两髓角微突。",
      canalOrifices: "单管口或唇舌双管口。",
      accessCavity: "舌面窝窄长卵圆形洞型。",
      dangerZones: "近远中方向极薄，严防侧穿。"
    },
    clinicalPearls: {
      cariesProne: "舌侧牙结石重灾区。",
      periodontal: "牙周骨板薄易退缩。",
      extraction: "极小心轻摇垂直脱位。"
    },
    pins: [
      { id: "incisal_edge", name: "切嵴", category: "ridge", description: "平直切嵴。", position: [0, -0.95, 0.1] },
    ],
  },

  "42": {
    fdi: "42",
    meshId: "FJ1273",
    conceptId: "FMA57140",
    name: "右下颌侧切牙",
    englishName: "Lower Right Lateral Incisor",
    quadrant: 4,
    quadrantName: "右下颌（第IV象限）",
    category: "incisor",
    toothTypeName: "侧切牙",
    palmer: "2┐",
    universal: 26,
    eruptionAge: "7~8 岁",
    morphometrics: { crownLength: 9.5, rootLength: 14.0, crownWidth: 5.5, crownThickness: 6.5, totalLength: 22.0 },
    cuspsCount: 0,
    rootsCount: 1,
    canalsDescription: "单根单管（约 75%），唇舌双根管（约 25%）",
    vertucciType: "Vertucci I型为主",
    morphologyFeatures: [
      "较中切牙稍大，切缘向远中舌侧偏斜，远中切角圆钝。"
    ],
    pulpFeatures: {
      chamberShape: "扁平裂缝状髓腔。",
      hornsCount: 2,
      hornsDescription: "微小髓角。",
      canalOrifices: "狭窄单管口或双根管口。",
      accessCavity: "舌面窄卵圆开髓孔。",
      dangerZones: "近远中方向过度扩展穿孔。"
    },
    clinicalPearls: {
      cariesProne: "邻面接触区。",
      periodontal: "舌侧牙结石堆积。",
      extraction: "唇舌微摇脱位。"
    },
    pins: [
      { id: "apex", name: "根尖", category: "root", description: "细长扁根尖。", position: [0.05, 0.98, 0] },
    ],
  },

  "43": {
    fdi: "43",
    meshId: "FJ1274",
    conceptId: "FMA55686",
    name: "右下颌尖牙",
    englishName: "Lower Right Canine",
    quadrant: 4,
    quadrantName: "右下颌（第IV象限）",
    category: "canine",
    toothTypeName: "尖牙",
    palmer: "3┐",
    universal: 27,
    eruptionAge: "9~10 岁",
    morphometrics: { crownLength: 11.0, rootLength: 15.5, crownWidth: 7.0, crownThickness: 7.5, totalLength: 26.0 },
    cuspsCount: 1,
    rootsCount: 1,
    canalsDescription: "单根单管为主（约 90%），唇舌双根管（约 10%）",
    vertucciType: "Vertucci I型",
    morphologyFeatures: [
      "长而窄的尖牙，牙冠较平直，近中斜缘短。",
      "粗长扁单根，支撑力极强。"
    ],
    pulpFeatures: {
      chamberShape: "长管状髓腔。",
      hornsCount: 1,
      hornsDescription: "高耸髓角突向尖端。",
      canalOrifices: "唇舌向长大单管口。",
      accessCavity: "舌面长椭圆开髓洞型。",
      dangerZones: "唇舌侧死角清理残留。"
    },
    clinicalPearls: {
      cariesProne: "颈部磨耗与邻面。",
      periodontal: "全口稳固牙位之一。",
      extraction: "唇舌向大幅摇动后微旋脱位。"
    },
    pins: [
      { id: "cusp_tip", name: "牙尖顶", category: "cusp", description: "长窄牙尖。", position: [0.08, -0.98, 0.12] },
    ],
  },

  "44": {
    fdi: "44",
    meshId: "FJ1269",
    conceptId: "FMA55694",
    name: "右下颌第一前磨牙",
    englishName: "Lower Right First Premolar",
    quadrant: 4,
    quadrantName: "右下颌（第IV象限）",
    category: "premolar",
    toothTypeName: "第一前磨牙",
    palmer: "4┐",
    universal: 28,
    eruptionAge: "10~12 岁",
    morphometrics: { crownLength: 8.5, rootLength: 14.0, crownWidth: 7.0, crownThickness: 7.5, totalLength: 21.5 },
    cuspsCount: 2,
    rootsCount: 1,
    canalsDescription: "单根单管（约 75%），根管下段分叉（约 25%）",
    vertucciType: "Vertucci I型或 V型",
    morphologyFeatures: [
      "牙冠向舌侧显著倾斜15°；颊尖高耸，舌尖退化矮小，有特征性中央横嵴。"
    ],
    pulpFeatures: {
      chamberShape: "随牙冠向舌侧倾斜！",
      hornsCount: 2,
      hornsDescription: "颊髓角极其高耸！舌髓角低微。",
      canalOrifices: "单管口，常在根下段盲区分叉。",
      accessCavity: "钻针向颊侧倾斜15°（平行牙根长轴），偏颊侧开髓！",
      dangerZones: "舌侧颈部侧穿；根中下段分叉漏治与断针。"
    },
    clinicalPearls: {
      cariesProne: "横嵴两侧的近中窝与远中窝。",
      periodontal: "舌侧牙结石堆积。",
      extraction: "向颊侧缓慢摇动脱位。"
    },
    pins: [
      { id: "high_buccal_cusp", name: "高耸颊尖", category: "cusp", description: "向舌侧严重倾斜的高锐颊尖。", position: [0, -0.95, 0.32] },
    ],
  },

  "45": {
    fdi: "45",
    meshId: "FJ1271",
    conceptId: "FMA55695",
    name: "右下颌第二前磨牙",
    englishName: "Lower Right Second Premolar",
    quadrant: 4,
    quadrantName: "右下颌（第IV象限）",
    category: "premolar",
    toothTypeName: "第二前磨牙",
    palmer: "5┐",
    universal: 29,
    eruptionAge: "11~12 岁",
    morphometrics: { crownLength: 8.0, rootLength: 14.5, crownWidth: 7.0, crownThickness: 8.0, totalLength: 22.0 },
    cuspsCount: 3,
    rootsCount: 1,
    canalsDescription: "单根单管型为主（约 85%）",
    vertucciType: "Vertucci I型为主",
    morphologyFeatures: [
      "牙冠方圆微舌倾，多为三尖型（颊尖、近舌尖、远舌尖），咬合面呈'Y'形裂沟。",
      "粗壮单根。"
    ],
    pulpFeatures: {
      chamberShape: "立方形髓室底。",
      hornsCount: 3,
      hornsDescription: "三髓角以颊髓角最高。",
      canalOrifices: "中央单管口。",
      accessCavity: "咬合面中央椭圆洞型。",
      dangerZones: "根尖轻微弯曲。"
    },
    clinicalPearls: {
      cariesProne: "咬合面'Y'形裂沟。",
      periodontal: "邻面牙结石。",
      extraction: "颊舌摇动后旋转脱位。"
    },
    pins: [
      { id: "buccal_cusp", name: "颊尖", category: "cusp", description: "主咬合颊尖。", position: [0, -0.93, 0.3] },
    ],
  },

  "46": {
    fdi: "46",
    meshId: "FJ1268",
    conceptId: "FMA55705",
    name: "右下颌第一磨牙",
    englishName: "Lower Right First Molar (Six-year Molar)",
    quadrant: 4,
    quadrantName: "右下颌（第IV象限）",
    category: "molar",
    toothTypeName: "第一磨牙",
    palmer: "6┐",
    universal: 30,
    eruptionAge: "6 岁（六龄齿）",
    morphometrics: { crownLength: 7.5, rootLength: 14.0, crownWidth: 11.0, crownThickness: 10.5, totalLength: 21.0 },
    cuspsCount: 5,
    rootsCount: 2,
    canalsDescription: "双根三管（约 65%）或双根四管（约 30%），偶见远中舌侧第三根（DL根，约 10%）",
    vertucciType: "近中根 Vertucci IV型（2-2型），远中根 I型/II型",
    morphologyFeatures: [
      "近远中径全口最大；5个牙尖（MB, DB, D, ML, DL），十字发育沟。",
      "强壮扁双根（近中根极扁向远中弯曲，远中根稍直圆）。"
    ],
    pulpFeatures: {
      chamberShape: "立方形扁长髓室。",
      hornsCount: 5,
      hornsDescription: "近颊髓角极高，易露髓！",
      canalOrifices: "近颊（MB）、近舌（ML，有峡部相连）、远中（D 或 DB/DL）。",
      accessCavity: "咬合面偏近中梯形开髓洞型。",
      dangerZones: "近中峡部感染清理残留；远舌额外根（DL根）漏治；近中髓角过高意外穿髓。"
    },
    clinicalPearls: {
      cariesProne: "咬合面裂沟、颊沟点隙（龋齿最高发牙位）。",
      periodontal: "根分叉病变极高发。",
      extraction: "两扁根展开向后弯，严禁旋转！强力颊舌交替摇动脱位。"
    },
    pins: [
      { id: "mb_cusp", name: "近中颊尖", category: "cusp", description: "近颊尖咬合受力中心，髓角高。", position: [0.3, -0.92, 0.32] },
      { id: "distal_cusp", name: "远中第5尖", category: "cusp", description: "全冠最小牙尖。", position: [-0.38, -0.85, 0.15] },
      { id: "mesial_root", name: "扁双根管近中根", category: "canal", description: "MB/ML 双管高发峡部吻合。", position: [0.28, 0.95, 0] },
    ],
  },

  "47": {
    fdi: "47",
    meshId: "FJ1270",
    conceptId: "FMA55706",
    name: "右下颌第二磨牙",
    englishName: "Lower Right Second Molar",
    quadrant: 4,
    quadrantName: "右下颌（第IV象限）",
    category: "molar",
    toothTypeName: "第二磨牙",
    palmer: "7┐",
    universal: 31,
    eruptionAge: "12~13 岁",
    morphometrics: { crownLength: 7.0, rootLength: 13.0, crownWidth: 10.0, crownThickness: 9.5, totalLength: 20.0 },
    cuspsCount: 4,
    rootsCount: 2,
    canalsDescription: "双根三管型或 C形根管（C-shaped canal，中国人群检出率 30%~40%！）",
    vertucciType: "C形根管高发变异",
    morphologyFeatures: [
      "四尖型（MB, DB, ML, DL），标准十字裂沟；双根靠拢或在舌侧融合为C形根。"
    ],
    pulpFeatures: {
      chamberShape: "髓室多呈 C形或长方形。",
      hornsCount: 4,
      hornsDescription: "4髓角较平缓。",
      canalOrifices: "带状弧形 C形根管口或正常三分立管口。",
      accessCavity: "咬合面偏近颊长方形洞型。",
      dangerZones: "C形根管舌侧骨壁极薄，条带状侧穿高危！"
    },
    clinicalPearls: {
      cariesProne: "咬合面十字裂沟点隙。",
      periodontal: "C形根舌侧纵沟菌斑滞留。",
      extraction: "颊舌向摇动后向颊侧脱位。"
    },
    pins: [
      { id: "cross_groove", name: "标准十字裂沟", category: "ridge", description: "四尖相交的十字形裂沟。", position: [0, -0.9, 0] },
      { id: "c_shaped_root", name: "C形根管高发区", category: "canal", description: "中国汉族人群特色高发根管解剖变异。", position: [0, 0.95, -0.15] },
    ],
  },
};

/**
 * 辅助查询牙体专科数据
 */
export function getDentalTooth(fdi: string): DentalToothData | undefined {
  return DENTAL_TEETH_DATA[fdi];
}

export function getDentalToothByMesh(meshId: string): DentalToothData | undefined {
  return Object.values(DENTAL_TEETH_DATA).find((t) => t.meshId === meshId);
}

export function getDentalToothByConcept(conceptId: string): DentalToothData | undefined {
  return Object.values(DENTAL_TEETH_DATA).find((t) => t.conceptId === conceptId);
}

/**
 * 获取指定象限的牙齿列表（按中心到远中排序：1~7）
 */
export function getTeethByQuadrant(quadrant: QuadrantId): DentalToothData[] {
  return Object.values(DENTAL_TEETH_DATA)
    .filter((t) => t.quadrant === quadrant)
    .sort((a, b) => a.fdi.localeCompare(b.fdi));
}
