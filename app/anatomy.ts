export type SystemId =
  | "dental"
  | "skeletal"
  | "muscular"
  | "arterial"
  | "venous"
  | "nervous"
  | "digestive"
  | "respiratory"
  | "urinary"
  | "reproductive"
  | "lymphatic"
  | "endocrine"
  | "integumentary"
  | "connective"
  | "sensory"
  | "cardiac";
export const SYSTEMS: { id: SystemId; name: string; color: string; description: string }[] = [
  {
    id: "dental",
    name: "牙齿系统",
    color: "#f0e8d7",
    description:
      "独立建模的28颗恒牙外表面结构。牙体内部组织（牙髓腔与根管）详见专科视窗。",
  },
  {
    id: "skeletal",
    name: "骨骼系统",
    color: "#e2d9ba",
    description:
      "包含颅骨、面颅骨、下颌骨及颈椎，构筑头颈部坚固支架，保护颅脑与面部脏器，并为咀嚼肌和颈肌提供附着点。",
  },
  {
    id: "muscular",
    name: "肌肉系统",
    color: "#a85b50",
    description:
      "包含面颈部肌群、舌肌、口底肌及软腭肌，参与下颌运动、言语、吞咽及表情表达。",
  },
  {
    id: "cardiac",
    name: "心血管系统",
    color: "#b96760",
    description:
      "循环系统的动力中枢，头颈部模型中不包含胸腔心脏结构。",
  },
  {
    id: "sensory",
    name: "感觉器官",
    color: "#b0c8ce",
    description:
      "包含眼球及其附属器（眼外肌、泪器）、听小骨等特殊感官解剖结构。",
  },
  {
    id: "arterial",
    name: "动脉系统",
    color: "#c05245",
    description:
      "颈总动脉、颈内动脉、颈外动脉及其主要分支，负责面颌部、颈部与颅脑的充沛血供。",
  },
  {
    id: "venous",
    name: "静脉系统",
    color: "#527c9f",
    description:
      "颈内静脉、面静脉、下颌后静脉及颅内静脉窦回流网络，汇流血液返回心脏。",
  },
  {
    id: "nervous",
    name: "神经系统",
    color: "#d8b565",
    description:
      "脑、脑干、高位脊髓及脑神经根，传导感觉、运动信号并调控各组织器官功能。",
  },
  {
    id: "respiratory",
    name: "呼吸系统",
    color: "#b98991",
    description:
      "鼻软骨、喉软骨（甲状软骨、环状软骨、会厌软骨）及上呼吸道气流通道。",
  },
  {
    id: "digestive",
    name: "消化系统",
    color: "#b8916b",
    description:
      "口腔、牙龈、舌体及大唾液腺（舌下腺、下颌下腺），参与咀嚼、唾液分泌与吞咽。",
  },
  {
    id: "urinary",
    name: "泌尿系统",
    color: "#b47961",
    description:
      "过滤血液并生成尿液（头颈部范围不包含）。",
  },
  {
    id: "lymphatic",
    name: "淋巴系统",
    color: "#879f7c",
    description:
      "头颈部浅深淋巴引流网络与局部免疫防御屏障。",
  },
  {
    id: "endocrine",
    name: "内分泌系统",
    color: "#c5a09a",
    description:
      "甲状腺与甲状旁腺，分泌激素调节机体新陈代谢与钙磷平衡。",
  },
  {
    id: "reproductive",
    name: "生殖系统",
    color: "#bda098",
    description:
      "生殖器官结构（头颈部范围不包含）。",
  },
  {
    id: "integumentary",
    name: "体表标志",
    color: "#ba9b7d",
    description:
      "唇部软组织轮廓及面颈部体表参考解剖标志。",
  },
  {
    id: "connective",
    name: "结缔组织",
    color: "#aec3bb",
    description:
      "韧带（如茎突舌骨韧带）、腱膜与软骨连接，维持结构稳定与力学传导。",
  },
];
export interface Part {
  id: string;
  name: string;
  conceptId: string;
  system: SystemId;
  chunk: number;
  positions: number;
  normals: number;
  indices: number;
  vertexCount: number;
  indexCount: number;
  bounds: [number[], number[]];
}
export interface Concept {
  id: string;
  name: string;
  elements: string[];
}
export interface Atlas {
  version: string;
  sex?: "male";
  source?: string;
  scope?: string;
  parts: Part[];
  concepts: Concept[];
  chunks: { url: string; bytes: number; gzip?: string; gzipBytes?: number }[];
  triangles: number;
}
export type View = "three-quarter" | "front" | "back" | "side";
export interface ClippingState {
  enabled: boolean;
  axis: "x" | "y" | "z";
  offset: number; // -100 to 100
  inverted: boolean;
  solidCap?: boolean;
}
export interface RulerMeasurement {
  complete?: boolean;
  pointA: [number, number, number];
  pointB: [number, number, number];
  distanceMm: number;
  deltaMm: [number, number, number]; // [dx, dy, dz]
  partA?: { id: string; name: string };
  partB?: { id: string; name: string };
}
export interface SceneState {
  preset?: string;
  canalMode?: boolean;
  canalType?: number;
  canalSection?: number;
  canalShell?: "transparent" | "cutaway" | "hidden";
  canalShellOpacity?: number;
  scope?: string[];
  hidden?: string[];
  inspectorOpen?: boolean;
  explode: number;
  visible: SystemId[];
  selected: string[];
  isolate: boolean;
  view: View;
  rotate: boolean;
  reset: number;
  clipping?: ClippingState;
  rctMode?: boolean;
  rulerMode?: boolean;
  rulerReset?: number;
  fascialMode?: boolean;
  fascialPathId?: string;
  fascialActiveSpaceId?: string;
  fascialStageIndex?: number;
}
export const DEFAULT_VISIBLE: SystemId[] = [
  "cardiac",
  "sensory",
  "skeletal",
  "muscular",
  "arterial",
  "venous",
  "nervous",
  "respiratory",
  "digestive",
  "urinary",
  "lymphatic",
  "endocrine",
  "reproductive",
  "connective",
];
export const EXPLANATIONS: Record<string, string> = {
  heart:
    "胸腔内的肌性血泵，推动血液进行体循环与肺循环。",
  liver:
    "人体最大的消化腺，参与营养代谢、胆汁分泌与多种血浆蛋白合成。",
  brain:
    "神经系统的最高中枢，统管感觉、运动、思维、记忆与生命活动调控。",
  stomach:
    "食管与小肠之间的肌性囊袋，负责储存并初步消化食物。",
  spleen:
    "机体重要的淋巴器官，过滤血液并参与免疫应答。",
  pancreas:
    "兼具内分泌与外分泌功能的脏器，分泌消化酶及胰岛素等激素。",
  "urinary bladder":
    "储存尿液的肌性囊状器官。",
  trachea:
    "连接喉与支气管的主呼吸气道，软骨环保持管腔持续通畅。",
  diaphragm:
    "分隔胸腔与腹腔的主要呼吸肌，收缩时增加胸腔容积协助吸气。",
};
export function explanation(name: string, system: SystemId) {
  return (
    EXPLANATIONS[name.toLowerCase()] ?? SYSTEMS.find((s) => s.id === system)?.description ?? ""
  );
}
