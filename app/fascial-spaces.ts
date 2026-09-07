/** Mesh-constrained educational spaces. See docs/fascial-ruler.md for sources and limits. */
export interface FascialSpace {
 id: string; name: string; latinName: string; color: string;
 center: [number,number,number]; size: [number,number,number]; rotation?: [number,number,number];
 boundaryParts: string[]; modelNote: string;
 boundaries: { anterior:string; posterior:string; medial:string; lateral:string; superior:string; inferior:string };
 clinical: { source:string; symptoms:string; trismus:string; drainage:string; dangerZones:string };
}
export interface InfectionStage { step:number; title:string; spaceId?:string; sourceDesc:string; clinicalSign:string; note:string }
export interface InfectionPathway { id:string; title:string; subtitle:string; category:string; primaryTooth:string; description:string; stages:InfectionStage[]; flowPoints:[number,number,number][] }
export const FASCIAL_SOURCES = [
 {title:'牙源性口颌面间隙感染 · NCBI',url:'https://www.ncbi.nlm.nih.gov/books/NBK589648/'},
 {title:'咀嚼间隙感染扩展的 CT / MR 研究',url:'https://pubmed.ncbi.nlm.nih.gov/18418606/'},
 {title:'牙源性深面部感染扩展的 CT 研究',url:'https://pubmed.ncbi.nlm.nih.gov/9432169/'}
];
export const FASCIAL_SPACES: FascialSpace[] = [
  {
    "id": "pterygomandibular_left",
    "name": "左翼下颌间隙",
    "latinName": "Spatium pterygomandibulare sinister",
    "color": "#ef4444",
    "center": [
      0.033,
      0.246,
      0.024
    ],
    "size": [
      0.009,
      0.022,
      0.011
    ],
    "rotation": [
      0.1,
      -0.15,
      0.05
    ],
    "boundaries": {
      "anterior": "翼下颌韧带、颊肌",
      "posterior": "腮腺鞘深叶及下颌后窝",
      "medial": "翼内肌外侧面及其筋膜",
      "lateral": "下颌支内侧面（下颌孔附近）",
      "superior": "翼外肌下缘",
      "inferior": "翼内肌在下颌支内侧下缘附着处"
    },
    "clinical": {
      "source": "下颌后牙区牙源性感染可累及；并非每例冠周炎的首发间隙。",
      "symptoms": "可能出现张口受限、下颌支内侧压痛及磨牙后区不适。",
      "trismus": "可有，程度因受累范围而异",
      "drainage": "本页仅说明间隙邻接关系。引流入路取决于影像所示范围及邻近神经血管，不在本模型上规划切口。",
      "dangerZones": "邻近下牙槽神经血管及舌神经；感染可能累及其他咀嚼间隙或咽旁区域。"
    },
    "boundaryParts": [
      "FJ3289",
      "BP3-FMA49013",
      "BP3-FMA49023"
    ],
    "modelNote": "区域由当前下颌支与相邻咀嚼肌之间的可用间隔生成，未重建筋膜；显示的是可辨认的局部间隔，不是完整脓腔。"
  },
  {
    "id": "masseteric_left",
    "name": "左咬肌间隙",
    "latinName": "Spatium massetericum sinister",
    "color": "#f97316",
    "center": [
      0.048,
      0.245,
      0.022
    ],
    "size": [
      0.008,
      0.024,
      0.013
    ],
    "rotation": [
      0.08,
      -0.1,
      0.05
    ],
    "boundaries": {
      "anterior": "咬肌前缘",
      "posterior": "下颌支后缘及腮腺前缘",
      "medial": "下颌支外侧骨壁",
      "lateral": "咬肌深面及其肌筋膜",
      "superior": "颧弓下缘",
      "inferior": "咬肌在下颌下缘附着处"
    },
    "clinical": {
      "source": "下颌后牙区感染可沿邻近软组织或相邻咀嚼间隙扩展。",
      "symptoms": "可有下颌角或咬肌区肿胀、压痛和张口受限，深部病变波动感可能不明显。",
      "trismus": "可有，程度因受累范围而异",
      "drainage": "本页仅说明间隙邻接关系。引流入路取决于影像所示范围及邻近神经血管，不在本模型上规划切口。",
      "dangerZones": "深部病变可伴张口受限，外表波动感可能不明显；需结合影像判断。"
    },
    "boundaryParts": [
      "FJ3289",
      "BP3-FMA49002",
      "BP3-FMA49005"
    ],
    "modelNote": "区域由当前下颌支与相邻咀嚼肌之间的可用间隔生成，未重建筋膜；显示的是可辨认的局部间隔，不是完整脓腔。"
  },
  {
    "id": "infratemporal_left",
    "name": "左颞下间隙",
    "latinName": "Spatium infratemporale sinister",
    "color": "#eab308",
    "center": [
      0.038,
      0.278,
      0.016
    ],
    "size": [
      0.011,
      0.018,
      0.012
    ],
    "rotation": [
      0.15,
      0,
      0
    ],
    "boundaries": {
      "anterior": "上颌骨体后壁（上颌结节）",
      "posterior": "茎突及茎突诸肌、颈鞘前壁",
      "medial": "蝶骨翼突外侧板、咽上缩肌",
      "lateral": "下颌支上部（喙突及髁突）、颧弓、颞肌深面",
      "superior": "蝶骨大翼颞下面及颞下嵴（通向颅中窝卵圆孔/棘孔）",
      "inferior": "与下方咀嚼间隙相接，非封闭底壁"
    },
    "clinical": {
      "source": "上颌后牙或邻近咀嚼间隙感染可能累及。",
      "symptoms": "可有深部面痛、张口受限和全身感染表现，外观肿胀程度不一。",
      "trismus": "可有，程度因受累范围而异",
      "drainage": "本页仅说明间隙邻接关系。引流入路取决于影像所示范围及邻近神经血管，不在本模型上规划切口。",
      "dangerZones": "邻近翼静脉丛、上颌动脉及下颌神经分支。此处不是一条独立的空管。"
    },
    "boundaryParts": [
      "BP3-FMA49023",
      "BP3-FMA49025",
      "BP3-FMA49008",
      "FJ3289"
    ],
    "modelNote": "已按现有骨骼和肌肉避让生成；缺失筋膜、皮肤或部分软组织的边界仍为范围示意。"
  },
  {
    "id": "submandibular_left",
    "name": "左下颌下间隙",
    "latinName": "Spatium submandibulare sinister",
    "color": "#10b981",
    "center": [
      0.026,
      0.222,
      0.031
    ],
    "size": [
      0.012,
      0.014,
      0.014
    ],
    "rotation": [
      -0.1,
      0.1,
      0
    ],
    "boundaries": {
      "anterior": "二腹肌前腹",
      "posterior": "二腹肌后腹及茎突舌骨肌",
      "medial": "下颌舌骨肌、舌骨舌肌区域",
      "lateral": "下颌骨体及其内侧软组织",
      "superior": "下颌舌骨肌下面",
      "inferior": "颈部皮肤、浅筋膜与颈深筋膜浅层"
    },
    "clinical": {
      "source": "牙源性感染穿出舌侧皮质的位置低于下颌舌骨肌附着时可进入。",
      "symptoms": "可有下颌下肿胀、压痛；口底共同受累时可能影响吞咽与呼吸。",
      "trismus": "可有，程度因受累范围而异",
      "drainage": "本页仅说明间隙邻接关系。引流入路取决于影像所示范围及邻近神经血管，不在本模型上规划切口。",
      "dangerZones": "与舌下间隙可绕下颌舌骨肌后缘交通；口底弥漫受累时需关注气道。"
    },
    "boundaryParts": [
      "FJ1562",
      "FJ3289",
      "FJ1559"
    ],
    "modelNote": "已按现有骨骼和肌肉避让生成；缺失筋膜、皮肤或部分软组织的边界仍为范围示意。"
  },
  {
    "id": "sublingual",
    "name": "左舌下间隙",
    "latinName": "Left sublingual space",
    "color": "#06b6d4",
    "center": [
      0,
      0.224,
      0.046
    ],
    "size": [
      0.016,
      0.009,
      0.014
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "boundaries": {
      "anterior": "下颌骨体内侧面（下颌舌骨线上方颏棘区）",
      "posterior": "舌根部及舌骨",
      "medial": "颏舌肌及颏舌骨肌",
      "lateral": "下颌骨体内侧面（下颌舌骨线以上骨面）",
      "superior": "口底黏膜与舌下襞",
      "inferior": "下颌舌骨肌上面"
    },
    "clinical": {
      "source": "牙源性感染穿出舌侧皮质的位置高于下颌舌骨肌附着时可进入。",
      "symptoms": "可有口底肿胀、舌体抬高及吞咽不适。",
      "trismus": "可有，程度因受累范围而异",
      "drainage": "本页仅说明间隙邻接关系。引流入路取决于影像所示范围及邻近神经血管，不在本模型上规划切口。",
      "dangerZones": "含腺体、导管及神经血管；与对侧及下颌下区域可相互交通。"
    },
    "boundaryParts": [
      "FJ1562",
      "FJ2738",
      "FJ2739",
      "FJ3289"
    ],
    "modelNote": "已按现有骨骼和肌肉避让生成；缺失筋膜、皮肤或部分软组织的边界仍为范围示意。"
  },
  {
    "id": "parapharyngeal_left",
    "name": "左咽旁间隙",
    "latinName": "Spatium parapharyngeum sinister",
    "color": "#8b5cf6",
    "center": [
      0.021,
      0.252,
      0.012
    ],
    "size": [
      0.009,
      0.024,
      0.01
    ],
    "rotation": [
      0.05,
      0,
      0
    ],
    "boundaries": {
      "anterior": "翼下颌韧带、下颌支及翼内肌后缘",
      "posterior": "茎突及相关筋膜区域；与颈动脉间隙邻接",
      "medial": "咽壁及其筋膜",
      "lateral": "翼内肌与腮腺深部区域",
      "superior": "颅底（蝶骨大翼与颞骨岩部底面）",
      "inferior": "舌骨附近，邻接深颈间隙"
    },
    "clinical": {
      "source": "邻近口咽、牙源性或深面部感染可能扩展至此。",
      "symptoms": "可有咽侧壁隆起、吞咽困难；严重受累可能影响气道。",
      "trismus": "可有，程度因受累范围而异",
      "drainage": "本页仅说明间隙邻接关系。引流入路取决于影像所示范围及邻近神经血管，不在本模型上规划切口。",
      "dangerZones": "咽旁区域与颈动脉、咽后等深颈间隙邻接；不等同于一条直接通向纵隔的空腔。"
    },
    "boundaryParts": [
      "BP3-FMA49013",
      "FJ2739"
    ],
    "modelNote": "已按现有骨骼和肌肉避让生成；缺失筋膜、皮肤或部分软组织的边界仍为范围示意。"
  },
  {
    "id": "infraorbital_left",
    "name": "左眶下间隙",
    "latinName": "Spatium infraorbitale sinister",
    "color": "#ec4899",
    "center": [
      0.022,
      0.283,
      0.062
    ],
    "size": [
      0.011,
      0.012,
      0.01
    ],
    "rotation": [
      -0.15,
      0.1,
      0
    ],
    "boundaries": {
      "anterior": "提上唇肌、提口角肌、面部表情肌及皮肤",
      "posterior": "上颌骨尖牙窝骨面（含眶下孔）",
      "medial": "鼻旁结构与提上唇鼻翼肌",
      "lateral": "颧肌前缘及颧骨前壁",
      "superior": "眼眶下缘骨嵴",
      "inferior": "上颌牙槽突骨膜及前庭沟黏膜反折线"
    },
    "clinical": {
      "source": "上颌尖牙等牙源性感染可累及，取决于穿出位置与肌肉附着。",
      "symptoms": "可有眶下或鼻唇沟区肿胀、鼻唇沟变浅及下眼睑水肿。",
      "trismus": "可有，程度因受累范围而异",
      "drainage": "本页仅说明间隙邻接关系。引流入路取决于影像所示范围及邻近神经血管，不在本模型上规划切口。",
      "dangerZones": "面部静脉与眼静脉存在交通，感染可能引发海绵窦血栓；不能简化为面静脉全部无瓣。"
    },
    "boundaryParts": [
      "FJ3269"
    ],
    "modelNote": "已按现有骨骼和肌肉避让生成；缺失筋膜、皮肤或部分软组织的边界仍为范围示意。"
  },
  {
    "id": "buccal_left",
    "name": "左颊间隙",
    "latinName": "Spatium buccale sinister",
    "color": "#14b8a6",
    "center": [
      0.043,
      0.24,
      0.048
    ],
    "size": [
      0.012,
      0.016,
      0.014
    ],
    "rotation": [
      0,
      0.1,
      0
    ],
    "boundaries": {
      "anterior": "口角及面部表情肌",
      "posterior": "咬肌前缘及翼下颌韧带",
      "medial": "颊肌及其筋膜",
      "lateral": "面颊部皮下脂肪组织及皮肤",
      "superior": "颧骨下缘及颧弓",
      "inferior": "下颌骨下缘"
    },
    "clinical": {
      "source": "后牙颊侧感染是否进入与颊肌附着位置有关。",
      "symptoms": "可有颊部肿胀、压痛及黏膜改变。",
      "trismus": "可有，程度因受累范围而异",
      "drainage": "本页仅说明间隙邻接关系。引流入路取决于影像所示范围及邻近神经血管，不在本模型上规划切口。",
      "dangerZones": "邻近腮腺导管、面神经颊支及面血管。面部皮肤和颊肌模型不完整，外界仅为示意。"
    },
    "boundaryParts": [
      "BP3-FMA49002",
      "FJ3289",
      "FJ3269"
    ],
    "modelNote": "已按现有骨骼和肌肉避让生成；缺失筋膜、皮肤或部分软组织的边界仍为范围示意。"
  }
];
export const INFECTION_PATHWAYS: InfectionPathway[] = [
  {
    "id": "wisdom-tooth-ramus",
    "title": "后牙区 → 翼下颌 → 咽旁",
    "primaryTooth": "38",
    "description": "下颌后牙感染可累及内侧咀嚼间隙，并可能扩展至邻近咽旁区域。当前牙列没有38，不虚构智齿病灶。",
    "stages": [
      {
        "step": 1,
        "title": "翼下颌间隙",
        "spaceId": "pterygomandibular_left",
        "sourceDesc": "观察下颌支内侧与翼内肌之间的局部间隔。",
        "clinicalSign": "结合感染源、体征及增强影像判断范围。",
        "note": "可发生的邻接扩展，不代表必然次序或患病概率。"
      },
      {
        "step": 2,
        "title": "可能累及咽旁区域",
        "spaceId": "parapharyngeal_left",
        "sourceDesc": "邻近区域扩展；不是穿过咽上缩肌的固定管道。",
        "clinicalSign": "结合感染源、体征及增强影像判断范围。",
        "note": "可发生的邻接扩展，不代表必然次序或患病概率。"
      }
    ],
    "subtitle": "可选择的扩展关系",
    "category": "区域解剖学习",
    "flowPoints": []
  },
  {
    "id": "lateral-masticator",
    "title": "后牙区 → 咬肌 / 颞下",
    "primaryTooth": "37",
    "description": "外侧与上部咀嚼间隙可相互受累，具体范围因病例而异。",
    "stages": [
      {
        "step": 1,
        "title": "咬肌深面间隔",
        "spaceId": "masseteric_left",
        "sourceDesc": "观察下颌支外侧与咬肌深面。",
        "clinicalSign": "结合感染源、体征及增强影像判断范围。",
        "note": "可发生的邻接扩展，不代表必然次序或患病概率。"
      },
      {
        "step": 2,
        "title": "上部咀嚼区域",
        "spaceId": "infratemporal_left",
        "sourceDesc": "观察翼外肌、颞肌与下颌支上部邻接关系。",
        "clinicalSign": "结合感染源、体征及增强影像判断范围。",
        "note": "可发生的邻接扩展，不代表必然次序或患病概率。"
      }
    ],
    "subtitle": "可选择的扩展关系",
    "category": "区域解剖学习",
    "flowPoints": []
  },
  {
    "id": "ludwig-angina",
    "title": "口底：舌下 ↔ 下颌下",
    "primaryTooth": "36",
    "description": "穿出位置相对下颌舌骨肌附着的高低影响最初受累区域；两者可绕肌后缘交通。Ludwig咽峡炎涉及双侧口底多间隙，本页只显示左侧局部关系。",
    "stages": [
      {
        "step": 1,
        "title": "下颌舌骨肌下方",
        "spaceId": "submandibular_left",
        "sourceDesc": "下颌下间隙；观察下颌舌骨肌与下颌骨。",
        "clinicalSign": "结合感染源、体征及增强影像判断范围。",
        "note": "可发生的邻接扩展，不代表必然次序或患病概率。"
      },
      {
        "step": 2,
        "title": "下颌舌骨肌上方",
        "spaceId": "sublingual",
        "sourceDesc": "舌下间隙；与下方的交通绕肌后缘，不穿过肌腹。",
        "clinicalSign": "结合感染源、体征及增强影像判断范围。",
        "note": "可发生的邻接扩展，不代表必然次序或患病概率。"
      }
    ],
    "subtitle": "可选择的扩展关系",
    "category": "区域解剖学习",
    "flowPoints": []
  },
  {
    "id": "danger-triangle",
    "title": "上颌尖牙区 → 眶下",
    "primaryTooth": "23",
    "description": "静脉交通可能带来颅内并发症；本模型未重建相关完整血管通路，因此不绘制虚构的颅内扩散管。",
    "stages": [
      {
        "step": 1,
        "title": "眶下区域",
        "spaceId": "infraorbital_left",
        "sourceDesc": "上颌骨前方软组织范围；肌肉及皮肤边界覆盖不完整。",
        "clinicalSign": "结合感染源、体征及增强影像判断范围。",
        "note": "可发生的邻接扩展，不代表必然次序或患病概率。"
      }
    ],
    "subtitle": "可选择的扩展关系",
    "category": "区域解剖学习",
    "flowPoints": []
  },
  {
    "id": "buccal-route",
    "title": "后牙颊侧 → 颊间隙",
    "primaryTooth": "26",
    "description": "穿出骨皮质的位置与颊肌附着关系影响感染是否进入颊间隙。",
    "stages": [
      {
        "step": 1,
        "title": "颊间隙",
        "spaceId": "buccal_left",
        "sourceDesc": "咬肌前方的颊部区域；外界为教学范围示意。",
        "clinicalSign": "结合感染源、体征及增强影像判断范围。",
        "note": "可发生的邻接扩展，不代表必然次序或患病概率。"
      }
    ],
    "subtitle": "可选择的扩展关系",
    "category": "区域解剖学习",
    "flowPoints": []
  }
];
