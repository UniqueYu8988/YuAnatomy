/**
 * 口腔颌面部筋膜间隙与感染扩散路径数据库
 * 基准教材：全国高等医药院校规划教材《口腔颌面外科学》（人卫第8版）及《口腔解剖生理学》
 */

export interface FascialSpace {
  id: string;
  name: string;
  latinName: string;
  color: string;
  // 3D 几何体积参数（基准坐标与 BodyParts3D 头部骨骼对齐，单位：米）
  center: [number, number, number];
  size: [number, number, number]; // 半径 [rx, ry, rz]
  rotation?: [number, number, number]; // 欧拉角弧度
  boundaries: {
    anterior: string; // 前界
    posterior: string; // 后界
    medial: string; // 内界
    lateral: string; // 外界
    superior: string; // 上界
    inferior: string; // 下界
  };
  clinical: {
    source: string; // 常见感染源
    symptoms: string; // 典型临床特征
    trismus: "轻度" | "中度" | "轻度至中度" | "中度至重度" | "重度（牙关紧闭）" | "无"; // 张口受限程度
    drainage: string; // 切开引流部位与切口设计
    dangerZones: string; // 神经血管避障与扩散危险
  };
}

export interface InfectionStage {
  step: number;
  title: string;
  spaceId?: string;
  sourceDesc: string;
  clinicalSign: string;
  note: string;
}

export interface InfectionPathway {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  primaryTooth: string; // e.g. "38", "36"
  description: string;
  stages: InfectionStage[];
  flowPoints: [number, number, number][]; // 3D 光流轨迹关键点
}

// 8 大口腔颌面经典筋膜间隙
export const FASCIAL_SPACES: FascialSpace[] = [
  {
    id: "pterygomandibular_left",
    name: "左翼下颌间隙",
    latinName: "Spatium pterygomandibulare sinister",
    color: "#ef4444", // 警戒红
    center: [0.033, 0.246, 0.024],
    size: [0.009, 0.022, 0.011],
    rotation: [0.1, -0.15, 0.05],
    boundaries: {
      anterior: "翼下颌韧带、颊肌",
      posterior: "腮腺鞘深叶及下颌后窝",
      medial: "翼内肌外侧面及其筋膜",
      lateral: "下颌支内侧骨壁（含下颌孔及下颌神经沟）",
      superior: "翼外肌下缘",
      inferior: "翼内肌在下颌支内侧下缘附着处",
    },
    clinical: {
      source: "下颌智齿冠周炎、下牙槽神经阻滞麻醉消毒不严格（医源性）",
      symptoms: "极度牙关紧闭（翼内肌受累受痉挛）、翼下颌皱襞黏膜水肿充血、下颌支内侧深压痛",
      trismus: "重度（牙关紧闭）",
      drainage: "口内切口：下颌磨牙后区翼下颌皱襞外侧纵切；口外切口：下颌下缘下方1.5cm弧形切口钝性分离入间隙",
      dangerZones: "下牙槽血管神经束自此进入下颌孔；极易向后内扩散至咽旁间隙，向上扩散至颞下间隙",
    },
  },
  {
    id: "masseteric_left",
    name: "左咬肌间隙",
    latinName: "Spatium massetericum sinister",
    color: "#f97316", // 橙红
    center: [0.048, 0.245, 0.022],
    size: [0.008, 0.024, 0.013],
    rotation: [0.08, -0.1, 0.05],
    boundaries: {
      anterior: "咬肌前缘",
      posterior: "下颌支后缘及腮腺前缘",
      medial: "下颌支外侧骨壁",
      lateral: "咬肌深面及其肌筋膜",
      superior: "颧弓下缘",
      inferior: "咬肌在下颌下缘附着处",
    },
    clinical: {
      source: "下颌第3磨牙冠周炎穿破升支外侧骨皮质、翼下颌间隙越过下颌切迹穿入",
      symptoms: "下颌角区坚硬如石的板状肿胀、张口重度受限、深部波动感不明显（因咬肌腱膜坚厚）",
      trismus: "重度（牙关紧闭）",
      drainage: "下颌下缘下方1.5~2cm顺皮纹切口（长约3~5cm），避开面神经下颌缘支与面动静脉",
      dangerZones: "面神经下颌缘支、面动静脉位于下颌骨下缘表面，切开时需严格在骨面骨膜下钝性剥离",
    },
  },
  {
    id: "infratemporal_left",
    name: "左颞下间隙",
    latinName: "Spatium infratemporale sinister",
    color: "#eab308", // 金黄
    center: [0.038, 0.278, 0.016],
    size: [0.011, 0.018, 0.012],
    rotation: [0.15, 0, 0],
    boundaries: {
      anterior: "上颌骨体后壁（上颌结节）",
      posterior: "茎突及茎突诸肌、颈鞘前壁",
      medial: "蝶骨翼突外侧板、咽上缩肌",
      lateral: "下颌支上部（喙突及髁突）、颧弓、颞肌深面",
      superior: "蝶骨大翼颞下面及颞下嵴（通向颅中窝卵圆孔/棘孔）",
      inferior: "翼外肌下缘（直接连通翼下颌间隙）",
    },
    clinical: {
      source: "上颌磨牙根尖周炎、上牙槽后神经阻滞麻醉感染、翼下颌间隙向上蔓延",
      symptoms: "位置深在、颌面外观肿胀可不明显，但全身高热中毒症状重、张口严重受限、颧弓下方深部压痛",
      trismus: "重度（牙关紧闭）",
      drainage: "上颌结节前庭沟切口，或颞部沿颞肌纤维纵形切口深达颞下窝",
      dangerZones: "内含翼静脉丛、上颌动脉及其分支、下颌神经出卵圆孔干，感染可逆行沿卵圆孔波及颅内",
    },
  },
  {
    id: "submandibular_left",
    name: "左下颌下间隙",
    latinName: "Spatium submandibulare sinister",
    color: "#10b981", // 翠绿
    center: [0.026, 0.222, 0.031],
    size: [0.012, 0.014, 0.014],
    rotation: [-0.1, 0.1, 0],
    boundaries: {
      anterior: "二腹肌前腹",
      posterior: "二腹肌后腹及茎突舌骨肌",
      medial: "下颌舌骨肌及舌骨舌肌外侧面",
      lateral: "下颌骨体内侧面（下颌舌骨线以下）及颈深筋膜浅层",
      superior: "下颌舌骨线与下颌骨下缘",
      inferior: "舌骨大角水平",
    },
    clinical: {
      source: "下颌第一、第二、第三磨牙根尖脓肿穿破舌侧骨板（下颌舌骨肌附着线下方）、下颌下腺炎",
      symptoms: "下颌下三角区肿胀、丰满隆起、皮肤充血紧绷，压痛明显，可伴中度吞咽疼痛与张口受限",
      trismus: "中度",
      drainage: "下颌骨下缘下方1.5~2cm平行下颌下缘做弧形切口，切开颈阔肌，在腺体被膜与骨膜间进入",
      dangerZones: "面动静脉跨越下颌骨下缘，面神经下颌缘支位于颈深筋膜浅层深面，严禁盲目深刺",
    },
  },
  {
    id: "sublingual",
    name: "舌下间隙",
    latinName: "Spatium sublinguale",
    color: "#06b6d4", // 青碧
    center: [0.0, 0.224, 0.046],
    size: [0.016, 0.009, 0.014],
    rotation: [0, 0, 0],
    boundaries: {
      anterior: "下颌骨体内侧面（下颌舌骨线上方颏棘区）",
      posterior: "舌根部及舌骨",
      medial: "颏舌肌及颏舌骨肌",
      lateral: "下颌骨体内侧面（下颌舌骨线以上骨面）",
      superior: "口底黏膜与舌下襞",
      inferior: "下颌舌骨肌上面",
    },
    clinical: {
      source: "下颌前牙或双尖牙根尖脓肿穿破舌侧骨板（下颌舌骨线上方）、舌下腺及导管结石感染",
      symptoms: "口底黏膜高度水肿抬高呈“重舌”外观，舌体被抬高并推向健侧，语言不清、吞咽剧痛、流涎",
      trismus: "轻度",
      drainage: "口内在舌下皱襞外侧与下颌骨舌侧龈缘之间做与牙弓平行的弧形切口，避开颌下腺导管与舌神经",
      dangerZones: "下颌下腺导管、舌神经及舌深动静脉位于其内，操作应紧贴舌骨舌肌钝性探查",
    },
  },
  {
    id: "parapharyngeal_left",
    name: "左咽旁间隙",
    latinName: "Spatium parapharyngeum sinister",
    color: "#8b5cf6", // 蓝紫
    center: [0.021, 0.252, 0.012],
    size: [0.009, 0.024, 0.01],
    rotation: [0.05, 0, 0],
    boundaries: {
      anterior: "翼下颌韧带、下颌支及翼内肌后缘",
      posterior: "椎前筋膜（直达颅底枕骨大孔前缘）",
      medial: "咽上缩肌、扁桃体窝",
      lateral: "腮腺鞘深叶、翼内肌内侧面、下颌角内侧",
      superior: "颅底（蝶骨大翼与颞骨岩部底面）",
      inferior: "舌骨大角水平，向下直接通向颈动脉鞘及纵隔",
    },
    clinical: {
      source: "翼下颌间隙向后内扩散、扁桃体周脓肿、咽峡炎",
      symptoms: "咽侧壁红肿隆起推向咽腔中央，吞咽极度困难，软腭下垂，声音嘶哑，呼吸窘迫急症",
      trismus: "中度至重度",
      drainage: "经颈外切口：下颌下缘角下方做斜行切口，沿茎突诸肌内侧钝性分离进入咽旁后间隙",
      dangerZones: "极其危险！后间隙紧邻颈内动静脉、第Ⅸ~Ⅻ对脑神经（舌咽、迷走、副、舌下神经），易并发颈内静脉化脓性血栓与下行性坏死性纵隔炎",
    },
  },
  {
    id: "infraorbital_left",
    name: "左眶下间隙",
    latinName: "Spatium infraorbitale sinister",
    color: "#ec4899", // 玫粉
    center: [0.022, 0.283, 0.062],
    size: [0.011, 0.012, 0.01],
    rotation: [-0.15, 0.1, 0],
    boundaries: {
      anterior: "提上唇肌、提口角肌、面部表情肌及皮肤",
      posterior: "上颌骨尖牙窝骨面（含眶下孔）",
      medial: "鼻旁结构与提上唇鼻翼肌",
      lateral: "颧肌前缘及颧骨前壁",
      superior: "眼眶下缘骨嵴",
      inferior: "上颌牙槽突骨膜及前庭沟黏膜反折线",
    },
    clinical: {
      source: "上颌前磨牙（如24）及尖牙（23）根尖周化脓性炎症穿破唇侧尖牙窝骨壁",
      symptoms: "眶下区剧烈红肿隆起、鼻唇沟变平消失、上下眼睑水肿导致睑裂变窄甚至闭合、眶下孔剧烈压痛",
      trismus: "无",
      drainage: "口内上颌尖牙及前磨牙唇侧黏膜反折线切口，平行牙槽嵴横行切开直达尖牙窝骨面",
      dangerZones: "面静脉经内眦静脉与眼上静脉吻合通入颅内海绵窦，由于面静脉缺乏静脉瓣，挤压或感染扩散易引起致命性海绵窦化脓性血栓性静脉炎（面部危险三角）",
    },
  },
  {
    id: "buccal_left",
    name: "左颊间隙",
    latinName: "Spatium buccale sinister",
    color: "#14b8a6", // 青绿
    center: [0.043, 0.24, 0.048],
    size: [0.012, 0.016, 0.014],
    rotation: [0, 0.1, 0],
    boundaries: {
      anterior: "口角及面部表情肌",
      posterior: "咬肌前缘及翼下颌韧带",
      medial: "颊肌及其筋膜",
      lateral: "面颊部皮下脂肪组织及皮肤",
      superior: "颧骨下缘及颧弓",
      inferior: "下颌骨下缘",
    },
    clinical: {
      source: "上下颌磨牙根尖脓肿穿破颊肌附着线外侧、颊部淋巴结炎",
      symptoms: "颊部肿胀明显，皮肤红肿发亮，质地由硬变软产生波动感，颊黏膜受牙齿咬痕压迫",
      trismus: "轻度至中度",
      drainage: "口内切口：在颊黏膜肿胀最高点避开腮腺导管口切开；口外切口：在面颊皮纹或下颌下缘切开",
      dangerZones: "腮腺导管穿颊肌开口于正对上颌第二磨牙颊黏膜处，面神经颊支及面动静脉穿行于间隙表面",
    },
  },
];

// 3 大经典颌面临床感染扩散路径
export const INFECTION_PATHWAYS: InfectionPathway[] = [
  {
    id: "wisdom-tooth-ramus",
    title: "智齿冠周炎下颌升支扩散链",
    subtitle: "下颌阻生智齿冠周炎引起间隙感染的最经典多发路线",
    category: "牙源性磨牙感染",
    primaryTooth: "38",
    description:
      "下颌第3磨牙（智齿）阻生时，盲袋内细菌滋生化脓。脓液穿透升支内侧骨板首先进入翼下颌间隙，随后由于各筋膜间隙相通，顺肌肉缝隙广泛波及咬肌、颞下及咽旁间隙，极易造成严重牙关紧闭与深部脓肿。",
    stages: [
      {
        step: 1,
        title: "原发感染灶：38 智齿盲袋",
        sourceDesc: "下颌第3磨牙近中或垂直阻生，盲袋红肿溢脓",
        clinicalSign: "磨牙后区剧烈胀痛、咽下疼痛，张口度逐渐受限。",
        note: "人卫教材统计：临床80%以上的颌面多间隙感染起源于下颌阻生智齿盲袋或下颌磨牙根尖炎。",
      },
      {
        step: 2,
        title: "首发站：翼下颌间隙感染",
        spaceId: "pterygomandibular_left",
        sourceDesc: "脓液穿过下颌支内侧骨皮质或沿下牙槽神经沟蔓延",
        clinicalSign: "特征性极度牙关紧闭（翼内肌痉挛）、下颌角内侧深压痛、下颌后窝丰满。",
        note: "切忌因张口困难而延误诊断；早期需及时沿翼下颌皱襞外侧切开引流减压。",
      },
      {
        step: 3,
        title: "外侧扩散：咬肌间隙感染",
        spaceId: "masseteric_left",
        sourceDesc: "脓液沿下颌切迹跨越下颌支骨壁，向外穿透进入咬肌深面",
        clinicalSign: "下颌角与咬肌区坚硬肿胀，皮肤温度升高，牙关紧闭加剧。",
        note: "咬肌筋膜致密坚固，深部化脓时往往摸不到波动感，不可因触诊无波动而否定化脓，应行穿刺确诊。",
      },
      {
        step: 4,
        title: "上行与内侧扩散：颞下与咽旁间隙",
        spaceId: "infratemporal_left",
        sourceDesc: "脓液沿翼外肌上行入颞下间隙；或向内穿破咽上缩肌入咽旁间隙",
        clinicalSign: "高热毒血症、咽侧壁肿胀偏斜、呼吸及吞咽困难，出现生命体征恶化危险。",
        note: "咽旁间隙直通颅底与下纵隔，属于危急重症，需立即行颈外下颌下切口彻底引流。",
      },
    ],
    flowPoints: [
      [0.024, 0.228, 0.038], // 38 牙位
      [0.028, 0.236, 0.032], // 升支前缘
      [0.033, 0.246, 0.024], // 翼下颌间隙
      [0.043, 0.252, 0.023], // 跨越下颌切迹
      [0.048, 0.245, 0.022], // 咬肌间隙
      [0.038, 0.265, 0.018], // 向上沿翼外肌
      [0.038, 0.278, 0.016], // 颞下间隙
      [0.026, 0.256, 0.014], // 向后内入咽旁间隙
    ],
  },
  {
    id: "ludwig-angina",
    title: "口底多间隙蜂窝织炎 (Ludwig's 咽峡炎)",
    subtitle: "下颌磨牙根尖脓肿突破下颌舌骨肌线引起口底窒息性急症",
    category: "口底蜂窝织炎",
    primaryTooth: "36",
    description:
      "下颌磨牙根尖脓肿突破较薄弱的舌侧骨板。若在下颌舌骨肌附着线下方穿出则进入下颌下间隙，在上方则进入舌下间隙。脓液沿下颌舌骨肌后缘游离缘在两间隙间自由穿流，并跨越中线迅速蔓延至双侧口底，压迫气道引发窒息。",
    stages: [
      {
        step: 1,
        title: "原发病灶：36/37 根尖周脓肿",
        sourceDesc: "下颌第一/第二恒磨牙严重根尖周化脓性炎症",
        clinicalSign: "患牙伸长感、咬合剧痛，随后舌侧黏膜反折线隆起充血。",
        note: "下颌磨牙根尖常偏向舌侧骨壁，且骨壁极薄，极易穿破舌侧骨膜进入深层组织。",
      },
      {
        step: 2,
        title: "分流与波及：下颌下与舌下间隙",
        spaceId: "submandibular_left",
        sourceDesc: "脓液沿下颌舌骨肌附着线下方穿出进入下颌下三角区",
        clinicalSign: "下颌下区肿胀压痛，伴随舌下间隙受波及引起舌体被推向健侧及上方。",
        note: "解剖关键：下颌舌骨肌后缘是下颌下间隙与舌下间隙连通的天然通道！",
      },
      {
        step: 3,
        title: "弥漫扩散：全口底广泛蜂窝织炎（Ludwig 咽峡炎）",
        spaceId: "sublingual",
        sourceDesc: "感染越过中线迅速波及对侧下颌下与舌下间隙，累及颏下间隙",
        clinicalSign: "全口底木板样僵硬肿胀，舌体极度抬高抵住硬腭，患者端坐呼吸、不能吞咽说话，窒息风险极高！",
        note: "口腔颌面外科第一急症！必须立即做倒“T”形或领圈状倒U形宽大切开广泛减压，必要时预防性气管切开保命。",
      },
    ],
    flowPoints: [
      [0.021, 0.222, 0.046], // 36 根尖
      [0.023, 0.218, 0.041], // 穿透舌侧骨皮质
      [0.026, 0.222, 0.031], // 下颌下间隙
      [0.016, 0.224, 0.036], // 绕过下颌舌骨肌后缘
      [0.005, 0.225, 0.045], // 舌下间隙
      [-0.012, 0.222, 0.035], // 蔓延至右侧下颌下
    ],
  },
  {
    id: "danger-triangle",
    title: "上颌前牙眶下间隙与面部危险三角",
    subtitle: "尖牙根尖感染波及眶下间隙及面静脉无瓣膜逆行扩散",
    category: "面部危险三角逆行感染",
    primaryTooth: "23",
    description:
      "上颌尖牙与前磨牙牙根长且唇侧骨皮质薄，根尖脓肿极易突破尖牙窝骨面进入眶下间隙。由于面部面静脉与内眦静脉缺乏静脉瓣，感染可顺静脉血流逆行经眼上静脉冲入颅内海绵窦，导致凶险的海绵窦血栓性静脉炎。",
    stages: [
      {
        step: 1,
        title: "原发病灶：23 尖牙窝根尖感染",
        sourceDesc: "上颌尖牙根尖长达尖牙窝，化脓性炎症突破骨壁",
        clinicalSign: "前牙根尖区红肿饱满，唇前庭黏膜反折线肿胀变浅并有触痛。",
        note: "尖牙根长（通常可达 17~21mm），根尖位置较高，直接对准眶下孔下方。",
      },
      {
        step: 2,
        title: "间隙蓄脓：眶下间隙脓肿",
        spaceId: "infraorbital_left",
        sourceDesc: "脓液积聚在提上唇肌深面与尖牙窝骨面之间",
        clinicalSign: "眶下区皮肤高度红肿充血，鼻唇沟消失，下眼睑水肿导致闭眼受限，眶下孔深压痛。",
        note: "不可在口外随意挤压！应在上颌唇侧黏膜前庭沟做横行切口直达骨面引流。",
      },
      {
        step: 3,
        title: "颅内逆行风险：海绵窦化脓性血栓性静脉炎",
        sourceDesc: "面静脉 -> 内眦静脉 -> 眼上静脉 -> 颅内海绵窦",
        clinicalSign: "头痛高热恶心、眼球突出固定、球结膜高度充血水肿、瞳孔散大反射消失。",
        note: "“危险三角区”（鼻根至双侧口角）：无静脉瓣，任何挤压或严重感染均有逆行致残致死危险。",
      },
    ],
    flowPoints: [
      [0.017, 0.245, 0.063], // 23 根尖
      [0.019, 0.262, 0.063], // 突破尖牙窝
      [0.022, 0.283, 0.062], // 眶下间隙
      [0.02, 0.302, 0.055], // 内眦静脉方向
      [0.016, 0.32, 0.042], // 经眼上静脉入颅底海绵窦
    ],
  },
];
