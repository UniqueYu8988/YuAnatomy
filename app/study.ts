import type { Part } from "./anatomy";
import { ANATOMY_DICT } from "./anatomy-dict.ts";
export const PRESETS = [
  { id: "dental", name: "恒牙列与 FDI 牙位" },
  { id: "overview", name: "头颈总览（全系）" },
  { id: "bones", name: "颅骨与颈椎" },
  { id: "oral", name: "口腔结构" },
  { id: "mastication", name: "咀嚼肌" },
  { id: "muscles", name: "肌肉视图" },
  { id: "nerves", name: "神经与血管" },
] as const;
export type PresetId = (typeof PRESETS)[number]["id"];
export function inPreset(p: Part, id: PresetId) {
  if (id === "dental")
    return p.system === "dental" || /mandible|maxilla/i.test(p.name);
  if (id === "bones")
    return ["skeletal", "dental"].includes(p.system) || /lacrimal bone|nasal concha/i.test(p.name);
  if (id === "oral")
    return /tooth|gingiva|mandible|maxilla|palatine|tongue|gloss|geniohyoid|mylohyoid|digastric|masseter|pterygoid|temporalis|buccinator|parotid|sublingual|submandibular|soft palate|palatini|stylohyoid|^lip$|uvula/i.test(
      p.name,
    );
  if (id === "mastication") return p.id.startsWith("BP3-FMA490") || p.system === "dental" || (p.system === "skeletal" && /mandible|maxilla|zygomatic bone|temporal bone|sphenoid|frontal bone|parietal bone/i.test(p.name));
  if (id === "muscles") return p.system === "muscular";
  if (id === "nerves") return ["nervous", "arterial", "venous"].includes(p.system);
  return true;
}
export interface StudyEntry {
  displayName?: string;
  aliases?: string[];
  summary?: string;
  chapter?: string;
  source?: string;
}

// 口腔专科与头颈核心解剖知识库（以人卫版《口腔解剖生理学》及全国高等医药教材为基准）
export const STUDY_CONTENT: Record<string, StudyEntry> = {

  "FMA49001": {
    "displayName": "右侧咬肌浅部",
    "aliases": [
      "咬肌",
      "咀嚼肌",
      "右咬肌浅部"
    ],
    "summary": "颧弓至下颌支及下颌角外侧，主要上提下颌；浅部也参与前伸。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "BP3-FMA49001": {
    "displayName": "右侧咬肌浅部",
    "aliases": [
      "咬肌",
      "咀嚼肌",
      "右咬肌浅部"
    ],
    "summary": "颧弓至下颌支及下颌角外侧，主要上提下颌；浅部也参与前伸。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "FMA49002": {
    "displayName": "左侧咬肌浅部",
    "aliases": [
      "咬肌",
      "咀嚼肌",
      "左咬肌浅部"
    ],
    "summary": "颧弓至下颌支及下颌角外侧，主要上提下颌；浅部也参与前伸。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "BP3-FMA49002": {
    "displayName": "左侧咬肌浅部",
    "aliases": [
      "咬肌",
      "咀嚼肌",
      "左咬肌浅部"
    ],
    "summary": "颧弓至下颌支及下颌角外侧，主要上提下颌；浅部也参与前伸。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "FMA49004": {
    "displayName": "右侧咬肌深部",
    "aliases": [
      "咬肌",
      "咀嚼肌",
      "右咬肌深部"
    ],
    "summary": "颧弓至下颌支及下颌角外侧，主要上提下颌；浅部也参与前伸。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "BP3-FMA49004": {
    "displayName": "右侧咬肌深部",
    "aliases": [
      "咬肌",
      "咀嚼肌",
      "右咬肌深部"
    ],
    "summary": "颧弓至下颌支及下颌角外侧，主要上提下颌；浅部也参与前伸。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "FMA49005": {
    "displayName": "左侧咬肌深部",
    "aliases": [
      "咬肌",
      "咀嚼肌",
      "左咬肌深部"
    ],
    "summary": "颧弓至下颌支及下颌角外侧，主要上提下颌；浅部也参与前伸。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "BP3-FMA49005": {
    "displayName": "左侧咬肌深部",
    "aliases": [
      "咬肌",
      "咀嚼肌",
      "左咬肌深部"
    ],
    "summary": "颧弓至下颌支及下颌角外侧，主要上提下颌；浅部也参与前伸。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "FMA49007": {
    "displayName": "右侧颞肌",
    "aliases": [
      "颞肌",
      "咀嚼肌",
      "右颞肌"
    ],
    "summary": "起于颞窝及颞深筋膜，止于下颌骨冠突和下颌支前缘。上提下颌，后部纤维参与后退。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "BP3-FMA49007": {
    "displayName": "右侧颞肌",
    "aliases": [
      "颞肌",
      "咀嚼肌",
      "右颞肌"
    ],
    "summary": "起于颞窝及颞深筋膜，止于下颌骨冠突和下颌支前缘。上提下颌，后部纤维参与后退。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "FMA49008": {
    "displayName": "左侧颞肌",
    "aliases": [
      "颞肌",
      "咀嚼肌",
      "左颞肌"
    ],
    "summary": "起于颞窝及颞深筋膜，止于下颌骨冠突和下颌支前缘。上提下颌，后部纤维参与后退。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "BP3-FMA49008": {
    "displayName": "左侧颞肌",
    "aliases": [
      "颞肌",
      "咀嚼肌",
      "左颞肌"
    ],
    "summary": "起于颞窝及颞深筋膜，止于下颌骨冠突和下颌支前缘。上提下颌，后部纤维参与后退。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "FMA49012": {
    "displayName": "右侧翼内肌",
    "aliases": [
      "翼内肌",
      "咀嚼肌",
      "右翼内肌"
    ],
    "summary": "主要由翼突区至下颌支及下颌角内侧。参与上提、前伸与侧向研磨运动。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "BP3-FMA49012": {
    "displayName": "右侧翼内肌",
    "aliases": [
      "翼内肌",
      "咀嚼肌",
      "右翼内肌"
    ],
    "summary": "主要由翼突区至下颌支及下颌角内侧。参与上提、前伸与侧向研磨运动。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "FMA49013": {
    "displayName": "左侧翼内肌",
    "aliases": [
      "翼内肌",
      "咀嚼肌",
      "左翼内肌"
    ],
    "summary": "主要由翼突区至下颌支及下颌角内侧。参与上提、前伸与侧向研磨运动。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "BP3-FMA49013": {
    "displayName": "左侧翼内肌",
    "aliases": [
      "翼内肌",
      "咀嚼肌",
      "左翼内肌"
    ],
    "summary": "主要由翼突区至下颌支及下颌角内侧。参与上提、前伸与侧向研磨运动。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "FMA49022": {
    "displayName": "右侧翼外肌下头",
    "aliases": [
      "翼外肌",
      "咀嚼肌",
      "右翼外肌下头"
    ],
    "summary": "位于颞下窝，联系蝶骨与下颌髁突、关节盘及关节囊区域。参与前伸、张口及侧向运动，上下头作用随运动阶段而异。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "BP3-FMA49022": {
    "displayName": "右侧翼外肌下头",
    "aliases": [
      "翼外肌",
      "咀嚼肌",
      "右翼外肌下头"
    ],
    "summary": "位于颞下窝，联系蝶骨与下颌髁突、关节盘及关节囊区域。参与前伸、张口及侧向运动，上下头作用随运动阶段而异。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "FMA49023": {
    "displayName": "左侧翼外肌下头",
    "aliases": [
      "翼外肌",
      "咀嚼肌",
      "左翼外肌下头"
    ],
    "summary": "位于颞下窝，联系蝶骨与下颌髁突、关节盘及关节囊区域。参与前伸、张口及侧向运动，上下头作用随运动阶段而异。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "BP3-FMA49023": {
    "displayName": "左侧翼外肌下头",
    "aliases": [
      "翼外肌",
      "咀嚼肌",
      "左翼外肌下头"
    ],
    "summary": "位于颞下窝，联系蝶骨与下颌髁突、关节盘及关节囊区域。参与前伸、张口及侧向运动，上下头作用随运动阶段而异。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "FMA49024": {
    "displayName": "右侧翼外肌上头",
    "aliases": [
      "翼外肌",
      "咀嚼肌",
      "右翼外肌上头"
    ],
    "summary": "位于颞下窝，联系蝶骨与下颌髁突、关节盘及关节囊区域。参与前伸、张口及侧向运动，上下头作用随运动阶段而异。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "BP3-FMA49024": {
    "displayName": "右侧翼外肌上头",
    "aliases": [
      "翼外肌",
      "咀嚼肌",
      "右翼外肌上头"
    ],
    "summary": "位于颞下窝，联系蝶骨与下颌髁突、关节盘及关节囊区域。参与前伸、张口及侧向运动，上下头作用随运动阶段而异。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "FMA49025": {
    "displayName": "左侧翼外肌上头",
    "aliases": [
      "翼外肌",
      "咀嚼肌",
      "左翼外肌上头"
    ],
    "summary": "位于颞下窝，联系蝶骨与下颌髁突、关节盘及关节囊区域。参与前伸、张口及侧向运动，上下头作用随运动阶段而异。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  },
  "BP3-FMA49025": {
    "displayName": "左侧翼外肌上头",
    "aliases": [
      "翼外肌",
      "咀嚼肌",
      "左翼外肌上头"
    ],
    "summary": "位于颞下窝，联系蝶骨与下颌髁突、关节盘及关节囊区域。参与前伸、张口及侧向运动，上下头作用随运动阶段而异。 四组咀嚼肌均受三叉神经下颌支的运动分支支配。",
    "chapter": "咀嚼肌",
    "source": "StatPearls: Anatomy, Head and Neck, Mastication Muscles（NCBI Bookshelf NBK541027）；BodyParts3D 3.0 几何，跨版本配准示意。"
  }
,
  // ==================== 恒牙牙列（28颗恒牙，FDI 两位数标记法） ====================
  // --- 右上颌（第一象限，11~17） ---
  FMA55681: {
    displayName: "右上颌中切牙",
    aliases: ["11", "右上中切牙", "上颌中切牙", "门牙", "yszqy", "shzqy", "my", "upper right central incisor"],
    summary: "位于上颌正中切牙区。牙冠为切牙中最大，唇面微突，舌面中央凹陷呈窝状，切嵴平直。常为单根，粗壮且圆锥形。是前牙美学与发音切导的核心牙位。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55680: {
    displayName: "右上颌侧切牙",
    aliases: ["12", "右上侧切牙", "上颌侧切牙", "yscqy", "shcqy", "upper right lateral incisor"],
    summary: "形态与中切牙相似但较小且圆钝，切角圆钝。舌窝较深，舌隆突明显，常伴畸形舌侧窝及畸形舌侧尖。变异率高（如锥形侧切牙或先天缺失）。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55798: {
    displayName: "右上颌尖牙",
    aliases: ["13", "右上尖牙", "上颌尖牙", "虎牙", "犬齿", "ysjy", "shjy", "hy", "upper right canine"],
    summary: "位于口角转折处。牙冠呈厚实五边形，唇面中央有显著唇轴嵴，牙尖锐利；牙根为全口牙中最长粗者，在唇侧骨面形成犬齿隆突，对维持面容丰满度至关重要。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55689: {
    displayName: "右上颌第一前磨牙",
    aliases: ["14", "右上第一前磨牙", "上颌第一前磨牙", "双尖牙", "ysdyqmy", "shdyqmy", "sjy", "upper right first premolar"],
    summary: "（牙合）面呈卵圆形，有颊舌两个牙尖，颊尖大于舌尖。中央沟穿过近中边缘嵴形成近中沟（典型标志）。约80%为双根（颊根与舌根），近中面常有发育沟凹陷。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55688: {
    displayName: "右上颌第二前磨牙",
    aliases: ["15", "右上第二前磨牙", "上颌第二前磨牙", "双尖牙", "ysdeqmy", "shdeqmy", "upper right second premolar"],
    summary: "形态与第一前磨牙相似，但颊尖与舌尖大小相近，近中边缘嵴无沟跨越。多为单根，根尖扁平，偶有根尖弯曲分叉。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55698: {
    displayName: "右上颌第一磨牙",
    aliases: ["16", "右上第一磨牙", "上颌第一磨牙", "六龄牙", "六龄齿", "ysdymya", "shdymya", "lly", "upper right first molar"],
    summary: "上颌牙列中体积最大者（约6岁萌出）。（牙合）面呈斜方形，通常有4个牙尖（近颊、远颊、近舌、远舌尖），近中舌尖最大且与远中颊尖连成斜嵴；舌侧常出现第5牙尖（卡氏尖，Carabelli cusp）。多为三根（近颊、远颊、舌根），舌根最粗长。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55697: {
    displayName: "右上颌第二磨牙",
    aliases: ["17", "右上第二磨牙", "上颌第二磨牙", "ysdemya", "shdemya", "upper right second molar"],
    summary: "形态与第一磨牙相似但稍小，斜方形更为明显，远中舌尖明显退化缩小或缺如（呈三尖型）。三根相对聚拢，偶有融合根。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },

  // --- 左上颌（第二象限，21~27） ---
  FMA55682: {
    displayName: "左上颌中切牙",
    aliases: ["21", "左上中切牙", "上颌中切牙", "门牙", "zszqy", "shzqy", "my", "upper left central incisor"],
    summary: "位于上颌左侧正中。牙冠呈宽铲形，切角近中锐利远中略圆，切嵴水平，舌窝清晰。单根粗大直立。支撑上唇及切断食物的核心牙位。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55683: {
    displayName: "左上颌侧切牙",
    aliases: ["22", "左上侧切牙", "上颌侧切牙", "zscqy", "shcqy", "upper left lateral incisor"],
    summary: "位于左上尖牙与中切牙之间。牙冠较中切牙窄小圆厚，舌侧窝较深，舌隆突显著。常有切角圆钝及舌面发育沟变异。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55799: {
    displayName: "左上颌尖牙",
    aliases: ["23", "左上尖牙", "上颌尖牙", "虎牙", "犬齿", "zsjy", "shjy", "hy", "upper left canine"],
    summary: "位于左上颌牙弓转角。唇轴嵴高突，穿透撕裂食物主要牙位。单根圆锥形极其粗壮，根尖向远中略弯，牙周骨壁厚实形成犬齿隆突。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55690: {
    displayName: "左上颌第一前磨牙",
    aliases: ["24", "左上第一前磨牙", "上颌第一前磨牙", "双尖牙", "zsdyqmy", "shdyqmy", "sjy", "upper left first premolar"],
    summary: "（牙合）面呈六角卵圆形，两尖型（颊尖高长，舌尖短小偏近中）。中央沟跨过近中边缘嵴形成近中沟。80%为颊舌双根，正畸拔牙减数常用牙位。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55691: {
    displayName: "左上颌第二前磨牙",
    aliases: ["25", "左上第二前磨牙", "上颌第二前磨牙", "双尖牙", "zsdeqmy", "shdeqmy", "upper left second premolar"],
    summary: "（牙合）面两牙尖近乎等高，咬合面裂沟短而浅，无明显近中沟跨嵴。多为单根，牙根横断面呈扁圆形。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55699: {
    displayName: "左上颌第一磨牙",
    aliases: ["26", "左上第一磨牙", "上颌第一磨牙", "六龄牙", "六龄齿", "zsdymya", "shdymya", "lly", "upper left first molar"],
    summary: "全口重要咀嚼功能牙位（6岁萌出）。近中舌尖与远中颊尖相连成斜嵴，近中舌尖舌侧常有卡氏尖。具近颊、远颊、舌侧三个独立牙根，是正常（牙合）建立的关键标志（安氏一类咬合基准）。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55700: {
    displayName: "左上颌第二磨牙",
    aliases: ["27", "左上第二磨牙", "上颌第二磨牙", "zsdemya", "shdemya", "upper left second molar"],
    summary: "体积小于第一磨牙，牙冠近远中向径缩小，远中舌尖明显退化缩小，牙面沟纹复杂。三根聚拢，根分叉角较小。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },

  // --- 左下颌（第三象限，31~37） ---
  FMA57143: {
    displayName: "左下颌中切牙",
    aliases: ["31", "左下中切牙", "下颌中切牙", "下中切牙", "zxzqy", "xhzqy", "lower left central incisor"],
    summary: "全口恒牙中体积最小、宽度最窄且对称性最高者。切缘平直，近远中切角几近直角。单根扁平，两侧有浅发育沟。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA57141: {
    displayName: "左下颌侧切牙",
    aliases: ["32", "左下侧切牙", "下颌侧切牙", "下侧切牙", "zxcqy", "xhcqy", "lower left lateral incisor"],
    summary: "形态与下颌中切牙相似，但体积稍大，远中切角稍圆钝，切缘向远中舌侧倾斜扭转。单根扁长，根尖向远中微弯。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55687: {
    displayName: "左下颌尖牙",
    aliases: ["33", "左下尖牙", "下颌尖牙", "下尖牙", "犬齿", "zxjy", "xhjy", "lower left canine"],
    summary: "牙冠较窄长，唇轴嵴不如上颌尖牙明显，近中缘与根近中缘几成一直线。单根扁粗，是下颌前牙区强固的支柱牙位。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55693: {
    displayName: "左下颌第一前磨牙",
    aliases: ["34", "左下第一前磨牙", "下颌第一前磨牙", "双尖牙", "zxdyqmy", "xhdyqmy", "lower left first premolar"],
    summary: "牙冠向舌侧强烈倾斜，颊尖长大锋利而舌尖极矮小微弱（形似舌隆突）；（牙合）面横嵴显著分隔近远中两点隙。多为单根，正畸减数常用牙。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55692: {
    displayName: "左下颌第二前磨牙",
    aliases: ["35", "左下第二前磨牙", "下颌第二前磨牙", "双尖牙", "zxdeqmy", "xhdeqmy", "lower left second premolar"],
    summary: "形态更接近磨牙，常有两尖型（颊、舌尖）或三尖型（颊尖、近中舌尖、远中舌尖）。（牙合）面裂沟有Y形、U形或H形分布。多为单根粗壮。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55704: {
    displayName: "左下颌第一磨牙",
    aliases: ["36", "左下第一磨牙", "下颌第一磨牙", "六龄牙", "六龄齿", "zxdymya", "xhdymya", "lly", "lower left first molar"],
    summary: "最早萌出的恒磨牙（约6岁）。（牙合）面多为5个牙尖（近颊尖、远颊尖、远中尖、近舌尖、远舌尖），主要发育沟呈点隙十字形放射。常为双根（近中根扁阔呈板状、远中根较圆），近中根常有双根管。龋病及根管治疗极高发牙位。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55703: {
    displayName: "左下颌第二磨牙",
    aliases: ["37", "左下第二磨牙", "下颌第二磨牙", "zxdemya", "xhdemya", "lower left second molar"],
    summary: "（牙合）面常为标准四尖型（近颊、远颊、近舌、远舌尖），裂沟呈标准十字形（“田”字形沟裂）。常为近远中双根，根分叉角度较小，偶有C形根管（C-shaped canal）变异，临床根管治疗难点。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },

  // --- 右下颌（第四象限，41~47） ---
  FMA57142: {
    displayName: "右下颌中切牙",
    aliases: ["41", "右下中切牙", "下颌中切牙", "下中切牙", "yxzqy", "xhzqy", "lower right central incisor"],
    summary: "右下正中切牙，全口最小恒牙。近远中高度对称，唇面平坦，舌窝浅，单根扁平。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA57140: {
    displayName: "右下颌侧切牙",
    aliases: ["42", "右下侧切牙", "下颌侧切牙", "下侧切牙", "yxcqy", "xhcqy", "lower right lateral incisor"],
    summary: "右下侧切牙，略大于中切牙，远中切角稍圆，切缘略向舌侧倾斜。单根扁平，根尖向远中微偏。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55686: {
    displayName: "右下颌尖牙",
    aliases: ["43", "右下尖牙", "下颌尖牙", "下尖牙", "犬齿", "yxjy", "xhjy", "lower right canine"],
    summary: "牙冠较上颌尖牙狭长，唇轴嵴略突，牙尖偏向近中。牙根长而粗壮，横截面呈卵圆形，牢固稳健。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55694: {
    displayName: "右下颌第一前磨牙",
    aliases: ["44", "右下第一前磨牙", "下颌第一前磨牙", "双尖牙", "yxdyqmy", "xhdyqmy", "lower right first premolar"],
    summary: "牙冠明显向舌侧倾斜，颊尖高大锐利，舌尖极微弱，横嵴显著隔开近远中点隙。多为单根。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55695: {
    displayName: "右下颌第二前磨牙",
    aliases: ["45", "右下第二前磨牙", "下颌第二前磨牙", "双尖牙", "yxdeqmy", "xhdeqmy", "lower right second premolar"],
    summary: "两尖或三尖型，牙面平坦，舌尖发育良好无过度内倾。单根较长，根尖圆钝。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55705: {
    displayName: "右下颌第一磨牙",
    aliases: ["46", "右下第一磨牙", "下颌第一磨牙", "六龄牙", "六龄齿", "yxdymya", "xhdymya", "lly", "lower right first molar"],
    summary: "右下颌主力咀嚼功能磨牙（6岁萌出）。5尖型（近颊、远颊、远中尖及两舌尖）。近远中双根，近中根扁宽，常含MB与ML双根管。临床龋坏高发牙位。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA55706: {
    displayName: "右下颌第二磨牙",
    aliases: ["47", "右下第二磨牙", "下颌第二磨牙", "yxdemya", "xhdemya", "lower right second molar"],
    summary: "四尖型，咬合面十字形裂沟清晰，两颊尖与两舌尖对称分布。双根相对聚拢，临床常见C形根管（C-shaped canal），根管清理成形需警惕舌侧侧穿。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },

  FMA12516: {
    displayName: "恒牙列（全部恒牙）",
    aliases: ["牙齿", "全部恒牙", "牙列", "牙", "yc", "teeth", "tooth", "dentition"],
    summary: "人类恒牙列共28~32颗（本模型包含28颗，不含第三磨牙）。按形态功能分为切牙（切割）、尖牙（撕裂）、前磨牙（协助捣碎）和磨牙（磨细食物）。牙列排列呈弓形（牙弓）。",
    chapter: "牙体解剖学",
    source: "《口腔解剖生理学》（人卫版）",
  },

  // ==================== 颌面骨骼与颅骨 ====================
  FMA52748: {
    displayName: "下颌骨",
    aliases: ["xhg", "下颌", "下巴", "下颌骨体", "下颌支", "mandible", "mandibula"],
    summary: "颌面部唯一能活动的骨骼，呈马蹄铁形。分为下颌体与下颌支。\n重要解剖标志：\n1. 颏孔（Mental foramen）：位于下颌第1/2前磨牙根尖下方，有颏神经血管穿出；\n2. 下颌孔（Mandibular foramen）：位于下颌支内侧面中央，为下牙槽神经血管入口，口内下牙槽神经阻滞麻醉进针重要靶点；\n3. 下颌小舌、下颌隆突（高位麻醉靶点）；\n4. 髁突（Condyle）：参与构成颞下颌关节（TMJ）；\n5. 喙突（Coronoid process）：颞肌附着处。",
    chapter: "口腔颌面骨骼",
    source: "《口腔解剖生理学》（人卫版）第8版",
  },
  FMA9711: {
    displayName: "上颌骨（双侧）",
    aliases: ["shg", "上颌", "maxilla", "upper jaw"],
    summary: "面中部主要骨骼，左右成对，参与构成眼眶底、鼻腔侧壁与底部、硬腭及颞下窝。由一体四突构成：上颌体（内含上颌窦）、额突、颧突、腭突与牙槽突。牙槽突承载上颌牙列。",
    chapter: "口腔颌面骨骼",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA53649: {
    displayName: "右上颌骨",
    aliases: ["ysxg", "右上颌", "上颌骨", "right maxilla"],
    summary: "右侧上颌骨。一体四突结构，牙槽突承载右上恒牙列（11~17）。眶下孔位于眶下缘中点下方约0.5~0.8cm处，尖牙窝上方，为眶下神经阻滞靶点。",
    chapter: "口腔颌面骨骼",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA53650: {
    displayName: "左上颌骨",
    aliases: ["zsxg", "左上颌", "上颌骨", "left maxilla"],
    summary: "左侧上颌骨。内含左侧上颌窦，牙槽突承载左上恒牙列（21~27），腭突与对侧相连构成硬腭前2/3。",
    chapter: "口腔颌面骨骼",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA53655: {
    displayName: "右腭骨",
    aliases: ["ypg", "腭骨", "right palatine bone"],
    summary: "呈“L”形，位于上颌骨后方与蝶骨翼突之间。水平板构成硬腭后1/3，垂直板构成鼻腔外侧壁后部，其大腭孔有腭前神经穿出。",
    chapter: "口腔颌面骨骼",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA53656: {
    displayName: "左腭骨",
    aliases: ["zpg", "腭骨", "left palatine bone"],
    summary: "左侧L形腭骨。参与构成硬腭骨性支架与鼻腔外侧壁后部。",
    chapter: "口腔颌面骨骼",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA52749: {
    displayName: "舌骨",
    aliases: ["sg", "舌骨体", "hyoid", "hyoid bone"],
    summary: "位于下颌骨下后方、喉上方的“U”形骨，不与任何其他骨形成关节，借韧带和肌群悬吊。由舌骨体、大角和小角组成。舌骨上肌群与舌骨下肌群的重要附着枢纽，在吞咽与下颌开闭口运动中起中继杠杆作用。",
    chapter: "口腔颌面骨骼",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA52734: {
    displayName: "额骨",
    aliases: ["eg", "前额骨", "frontal bone"],
    summary: "构成颅前部及眶上缘的不规则扁骨。额鳞形成前额骨架，眶部形成眼眶顶壁。",
    chapter: "颅骨解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA52735: {
    displayName: "枕骨",
    aliases: ["zg", "后脑勺", "occipital bone"],
    summary: "位于颅后下部，中央有枕骨大孔，脑干向下穿出延续为脊髓。两侧有枕髁与寰椎（C1）形成寰枕关节。",
    chapter: "颅骨解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA52736: {
    displayName: "蝶骨",
    aliases: ["dg", "蝴蝶骨", "sphenoid bone"],
    summary: "形似飞蝶，横跨颅底中央。由蝶骨体、大翼、小翼及翼突组成。体部有蝶窦；翼突内外侧板为咀嚼肌（翼内肌、翼外肌）的起点；大翼根部有圆孔（三叉神经上颌支V2通道）与卵圆孔（三叉神经下颌支V3通道）。",
    chapter: "颅骨解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA52740: {
    displayName: "筛骨",
    aliases: ["sg", "ethmoid bone"],
    summary: "位于额骨下方、两眶之间，质地轻脆多孔。参与构成鼻中隔与鼻腔外侧壁（上鼻甲、中鼻甲）。筛板上有筛孔供嗅神经纤维通过。",
    chapter: "颅骨解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA52739: {
    displayName: "左颞骨",
    aliases: ["zng", "颞骨", "left temporal bone"],
    summary: "参与构成颅底与颅侧壁。分为鳞部、鼓部和岩部（乳突部）。其关节窝与关节结节与下颌骨髁突共同构成颞下颌关节（TMJ）。内含中耳听小骨与内耳迷路。",
    chapter: "颅骨解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA52738: {
    displayName: "右颞骨",
    aliases: ["yng", "颞骨", "right temporal bone"],
    summary: "右侧颞骨。含外耳道、茎突、乳突与下颌窝（关节窝），为咀嚼系统骨性支架的重要组成部分。",
    chapter: "颅骨解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA52789: {
    displayName: "左顶骨",
    aliases: ["zdg", "顶骨", "left parietal bone"],
    summary: "构成颅顶中后部的四边形扁骨。",
    chapter: "颅骨解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA52788: {
    displayName: "右顶骨",
    aliases: ["ydg", "顶骨", "right parietal bone"],
    summary: "构成颅顶中后部的四边形扁骨。",
    chapter: "颅骨解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA52893: {
    displayName: "左颧骨",
    aliases: ["zqg", "颧骨", "left zygomatic bone"],
    summary: "位于眶外下方，构成面部颊部外侧骨性隆起。向后与颞骨颧突接合形成颧弓（咬肌起点骨性标志）。",
    chapter: "口腔颌面骨骼",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA52892: {
    displayName: "右颧骨",
    aliases: ["yqg", "颧骨", "right zygomatic bone"],
    summary: "右侧颧骨。与颞骨共同构成颧弓，是面中部横向宽度及面形轮廓的核心骨骼。",
    chapter: "口腔颌面骨骼",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA53648: {
    displayName: "左鼻骨",
    aliases: ["zbg", "鼻骨", "left nasal bone"],
    summary: "构成骨性鼻梁左半部的小长条扁骨。",
    chapter: "颅骨解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA53647: {
    displayName: "右鼻骨",
    aliases: ["ybg", "鼻骨", "right nasal bone"],
    summary: "构成骨性鼻梁右半部的小长条扁骨。",
    chapter: "颅骨解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA9710: {
    displayName: "犁骨",
    aliases: ["lg", "vomer"],
    summary: "位于鼻腔下部中线上的立式薄骨板，与筛骨垂直板共同构成骨性鼻中隔。",
    chapter: "颅骨解剖",
    source: "《系统解剖学》（人卫版）",
  },

  // ==================== 颈椎 ====================
  FMA12519: {
    displayName: "寰椎（第1颈椎 / C1）",
    aliases: ["hz", "c1", "atlas", "第1颈椎", "第一颈椎"],
    summary: "呈环形，无椎体、棘突和关节突，由前弓、后弓和两个侧块构成。侧块上方有肾形关节面与枕髁形成寰枕关节（点头运动枢纽）。",
    chapter: "脊柱解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA12520: {
    displayName: "枢椎（第2颈椎 / C2）",
    aliases: ["sz", "c2", "axis", "第2颈椎", "第二颈椎"],
    summary: "特征性标志为椎体向上隆起突出的齿突（Dens）。齿突与寰椎前弓后面的齿突凹相关节，构成寰枢正中关节（头部旋转运动的核心旋转轴）。",
    chapter: "脊柱解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA12521: {
    displayName: "第3颈椎（C3）",
    aliases: ["c3", "第三颈椎", "third cervical vertebra"],
    summary: "典型颈椎结构，椎体小、椎孔大，横突有横突孔（椎动脉通道），棘突短而分叉。",
    chapter: "脊柱解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA12522: {
    displayName: "第4颈椎（C4）",
    aliases: ["c4", "第四颈椎", "fourth cervical vertebra"],
    summary: "典型颈椎。甲状软骨上缘大致平齐C4平面，颈总动脉分叉处常位于C4椎体高度。",
    chapter: "脊柱解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA12523: {
    displayName: "第5颈椎（C5）",
    aliases: ["c5", "第五颈椎", "fifth cervical vertebra"],
    summary: "典型颈椎结构，横突孔供椎动脉与椎静脉穿过。",
    chapter: "脊柱解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA12524: {
    displayName: "第6颈椎（C6）",
    aliases: ["c6", "第六颈椎", "sixth cervical vertebra"],
    summary: "横突前结节较大，称为颈动脉结节（Chassaignac结节），颈总动脉位于其前方，临床止血时可将颈总动脉向后压向此结节。",
    chapter: "脊柱解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA12525: {
    displayName: "隆椎（第7颈椎 / C7）",
    aliases: ["c7", "第七颈椎", "隆椎", "seventh cervical vertebra"],
    summary: "棘突特长，末端不分叉，在体表极易触及，为体表定位椎骨序数的重要骨性标志。",
    chapter: "脊柱解剖",
    source: "《系统解剖学》（人卫版）",
  },

  // ==================== 唾液腺与口腔软组织 ====================
  FMA59802: {
    displayName: "右下颌下腺",
    aliases: ["yxhxx", "右颌下腺", "下颌下腺", "right submandibular gland"],
    summary: "大唾液腺之一，呈扁椭圆形，位于下颌下三角内。混合性腺体以浆液性为主。分泌管（下颌下腺导管 / Wharton导管）自腺体深部发出，行向前内，开口于口底舌下肉阜。",
    chapter: "口腔涎腺",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA59803: {
    displayName: "左下颌下腺",
    aliases: ["zxhxx", "左颌下腺", "下颌下腺", "left submandibular gland"],
    summary: "左侧下颌下腺。导管向口底走行并与舌神经交叉，是下颌下腺切除术中需严加保护的重要神经结构。",
    chapter: "口腔涎腺",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA59804: {
    displayName: "右舌下腺",
    aliases: ["ysxx", "舌下腺", "right sublingual gland"],
    summary: "三对大唾液腺中最小者，呈扁扁杏仁状，位于口底舌下襞深面的舌下间隙内。混合性腺体以粘液性为主。小导管多数（8~20条）开口于舌下襞，大导管与下颌下腺导管汇合或共同开口于舌下肉阜。",
    chapter: "口腔涎腺",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA59805: {
    displayName: "左舌下腺",
    aliases: ["zsxx", "舌下腺", "left sublingual gland"],
    summary: "左侧舌下腺。位于口底黏膜深面，容易发生舌下腺囊肿（蛤蟆肿 / Ranula）。",
    chapter: "口腔涎腺",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA54640: {
    displayName: "舌",
    aliases: ["she", "舌体", "舌头", "舌肌", "tongue"],
    summary: "由横纹肌构成的肌性器官，表面覆盖口腔黏膜。分为舌尖、舌体（前2/3）与舌根（后1/3），界沟（Sulcus terminalis）为分界线。舌背黏膜有丝状乳头、菌状乳头、轮廓乳头和叶状乳头（除丝状乳头外均含味蕾）。参与吸吮、咀嚼、吞咽、发音及感受味觉。",
    chapter: "口腔软组织",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA59763: {
    displayName: "上颌牙龈",
    aliases: ["sxyy", "牙龈", "上牙龈", "gingiva", "gum"],
    summary: "覆盖于上颌牙槽突表面及牙颈部的口腔黏膜。分为游离龈、附着龈和龈乳头。质地致密韧实，粉红色，表面有点彩（Stippling），是牙周健康评估的重要标志。",
    chapter: "牙周组织",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA59764: {
    displayName: "下颌牙龈",
    aliases: ["xxyy", "牙龈", "下牙龈", "gingiva", "gum"],
    summary: "覆盖于下颌牙槽骨突上的咀嚼黏膜。坚韧且紧密附着于骨膜，前牙区唇侧附着龈较宽，后牙区颊侧移行于前庭沟黏膜。",
    chapter: "牙周组织",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA59816: {
    displayName: "唇（口唇）",
    aliases: ["chun", "嘴唇", "口唇", "唇部", "lip"],
    summary: "构成口腔前壁。由皮肤、浅筋膜、口轮匝肌（表情肌）、黏膜下层及黏膜五层组成。红唇部（人中裂、唇红缘）血管丰富，感觉敏锐，是面部美学与吸吮闭合的关键软组织。",
    chapter: "口腔前庭",
    source: "《口腔解剖生理学》（人卫版）",
  },

  // ==================== 舌肌与口底肌群 ====================
  FMA46698: {
    displayName: "右颏舌肌",
    aliases: ["yksj", "颏舌肌", "genioglossus", "right genioglossus"],
    summary: "最重要的舌外肌，呈扇形。起自下颌骨颏棘，肌纤维向后上放射状止于舌中线两侧。双侧同时收缩拉舌向前下方（伸舌）；单侧收缩使舌尖伸向对侧。受舌下神经（CN XII）支配。",
    chapter: "口腔肌群",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA46702: {
    displayName: "左颏舌肌",
    aliases: ["zksj", "颏舌肌", "genioglossus", "left genioglossus"],
    summary: "左侧颏舌肌。当一侧舌下神经损伤麻痹时，伸舌偏向患侧（健侧颏舌肌单侧推向患侧）。",
    chapter: "口腔肌群",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA46703: {
    displayName: "右舌骨舌肌",
    aliases: ["ysgsj", "舌骨舌肌", "hyoglossus", "right hyoglossus"],
    summary: "起自舌骨大角和舌骨体，肌纤维向上止于舌侧部。收缩时牵拉舌体向后下方缩回。受舌下神经支配。其深面有舌动脉走行，浅面有舌神经、下颌下腺导管和舌下神经横过。",
    chapter: "口腔肌群",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA46704: {
    displayName: "左舌骨舌肌",
    aliases: ["zsgsj", "舌骨舌肌", "hyoglossus", "left hyoglossus"],
    summary: "左侧舌骨舌肌。为下颌下区及舌深部手术的重要解剖标志肌。",
    chapter: "口腔肌群",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA46292: {
    displayName: "右二腹肌",
    aliases: ["yefj", "二腹肌", "digastric", "right digastric"],
    summary: "舌骨上肌群之一，有两个肌腹和一个中间腱。前腹起自下颌骨二腹肌窝，由三叉神经下颌支（下颌舌骨肌神经）支配；后腹起自颞骨乳突切迹，由面神经分支支配。中间腱借纤维环固定于舌骨。收缩时协助下颌骨下降（开口）或上提舌骨。",
    chapter: "颈部与口底肌肉",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA46293: {
    displayName: "左二腹肌",
    aliases: ["zefj", "二腹肌", "digastric", "left digastric"],
    summary: "左侧二腹肌。其前腹、后腹与下颌骨下缘共同围成下颌下三角（其内含下颌下腺、面动静脉等）。",
    chapter: "颈部与口底肌肉",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA46321: {
    displayName: "右下颌舌骨肌",
    aliases: ["yxhsgj", "下颌舌骨肌", "mylohyoid", "right mylohyoid"],
    summary: "呈扁薄板状。起自下颌骨内侧的下颌舌骨线（内斜线），左右纤维向中线汇合成下颌舌骨肌缝，后部止于舌骨体。双侧共同构筑口底的肌性隔膜（口底肌隔），承托舌与口底脏器。受下颌舌骨肌神经支配。",
    chapter: "口底解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA46322: {
    displayName: "左下颌舌骨肌",
    aliases: ["zxhsgj", "下颌舌骨肌", "mylohyoid", "left mylohyoid"],
    summary: "左侧下颌舌骨肌。此肌将口底下部间隙分隔为上方的舌下间隙与下方的下颌下间隙，口底蜂窝织炎蔓延的重要解剖分界。",
    chapter: "口底解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA46326: {
    displayName: "右颏舌骨肌",
    aliases: ["ykshgj", "颏舌骨肌", "geniohyoid", "right geniohyoid"],
    summary: "位于下颌舌骨肌深面中线两侧。起自下颌骨颏棘下部，止于舌骨体前面。收缩牵引舌骨向前上方，受第1颈神经纤维支配。",
    chapter: "口底解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA46327: {
    displayName: "左颏舌骨肌",
    aliases: ["zkshgj", "颏舌骨肌", "geniohyoid", "left geniohyoid"],
    summary: "左侧颏舌骨肌。收缩时固定舌骨或下拉下颌骨协助张口。",
    chapter: "口底解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA45826: {
    displayName: "右茎突舌骨肌",
    aliases: ["yjtshj", "茎突舌骨肌", "stylohyoid", "right stylohyoid"],
    summary: "起自颞骨茎突，斜向内下方止于舌骨体与大角交界处，肌腹常被二腹肌中间腱贯穿。受面神经支配。收缩时牵引舌骨向后上方。",
    chapter: "颈部解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA45827: {
    displayName: "左茎突舌骨肌",
    aliases: ["zjtshj", "茎突舌骨肌", "stylohyoid", "left stylohyoid"],
    summary: "左侧茎突舌骨肌。参与构成茎突诸肌之一。",
    chapter: "颈部解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },

  // ==================== 软腭与咽部肌肉 ====================
  FMA46728: {
    displayName: "右腭帆提肌",
    aliases: ["yeftj", "腭帆提肌", "levator veli palatini"],
    summary: "起自颞骨岩部下面与咽鼓管软骨部，斜向下前内止于软腭腱膜。受迷走神经咽丛支配。收缩上提软腭向咽后壁贴拢，封闭鼻咽腔（腭咽闭合），防止食物返流如鼻腔。",
    chapter: "软腭解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA46729: {
    displayName: "左腭帆提肌",
    aliases: ["zeftj", "腭帆提肌", "levator veli palatini"],
    summary: "左侧腭帆提肌。腭裂手术修复中关键需复位此肌以重建腭咽闭合功能。",
    chapter: "软腭解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA46731: {
    displayName: "右腭帆张肌",
    aliases: ["yefzj", "腭帆张肌", "tensor veli palatini"],
    summary: "起自蝶骨翼突内侧板根部及咽鼓管软骨，垂直向下绕过翼突钩（Hamulus）直角转折向内止于腭腱膜。受三叉神经下颌支支配。收缩绷紧软腭并开放咽鼓管口平衡中耳气压。",
    chapter: "软腭解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA46732: {
    displayName: "左腭帆张肌",
    aliases: ["zefzj", "腭帆张肌", "tensor veli palatini"],
    summary: "左侧腭帆张肌。绕翼突钩为转折支点，是软腭肌肉中唯一由三叉神经支配的肌肉。",
    chapter: "软腭解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA46733: {
    displayName: "腭垂肌（悬雍垂肌）",
    aliases: ["ecj", "悬雍垂肌", "腭垂", "uvular muscle"],
    summary: "成对细小肌束，位于悬雍垂黏膜深面。起自腭骨鼻棘和腭腱膜，止于腭垂黏膜。收缩缩短并上提腭垂。",
    chapter: "软腭解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA72309: {
    displayName: "右茎突舌骨韧带",
    aliases: ["yjtshrd", "茎突舌骨韧带", "right stylohyoid ligament"],
    summary: "自颞骨茎突尖端连接至舌骨小角的纤维结缔组织束。若此韧带异常骨化，可引发茎突过长综合征（Eagle syndrome），导致咽部异物感及转头疼痛。",
    chapter: "颈部解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA72311: {
    displayName: "左茎突舌骨韧带",
    aliases: ["zjtshrd", "茎突舌骨韧带", "left stylohyoid ligament"],
    summary: "左侧茎突舌骨韧带。",
    chapter: "颈部解剖",
    source: "《口腔解剖生理学》（人卫版）",
  },

  // ==================== 喉软骨与主要血管 ====================
  FMA55099: {
    displayName: "甲状软骨",
    aliases: ["jzrg", "喉结", "thyroid cartilage"],
    summary: "喉部最大的软骨，由左右两块方形软骨板在前中线接合而成，前上端向前突出形成喉结（成年男性尤为显著）。上角借甲状舌骨膜与舌骨大角相连，下角与环状软骨形成环甲关节。",
    chapter: "喉部解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA9615: {
    displayName: "环状软骨",
    aliases: ["hzrg", "cricoid cartilage"],
    summary: "喉部唯一呈完整环形的软骨，形似指环。前部低窄为环状软骨弓，后部高宽为环状软骨板。对维持呼吸道持续开放极为重要。平齐第6颈椎高度，是呼吸道与消化道在颈部的分界标志。",
    chapter: "喉部解剖",
    source: "《系统解剖学》（人卫版）",
  },
  FMA4058: {
    displayName: "左颈总动脉",
    aliases: ["zjzdm", "颈总动脉", "left common carotid artery"],
    summary: "发自主动脉弓。沿食管、气管及喉的外侧上行，平齐甲状软骨上缘（C4高度）分为颈内动脉和颈外动脉。分叉处管腔扩大为颈动脉窦（压力感受器），后方有颈动脉小球（化学感受器）。",
    chapter: "头颈部血管",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA3941: {
    displayName: "右颈总动脉",
    aliases: ["yjzdm", "颈总动脉", "right common carotid artery"],
    summary: "发自头臂干。在颈部走行于颈动脉鞘内，其外侧为颈内静脉，后方深面为迷走神经。",
    chapter: "头颈部血管",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA4062: {
    displayName: "左颈内动脉",
    aliases: ["zjndm", "颈内动脉", "left internal carotid artery"],
    summary: "自颈总动脉发出后在颈部无分支，经颞骨颈动脉管入颅，滋养大脑半球前2/3及视器。",
    chapter: "头颈部血管",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA3949: {
    displayName: "右颈内动脉",
    aliases: ["yjndm", "颈内动脉", "right internal carotid artery"],
    summary: "右侧颈内动脉。垂直向上入颅，在咽旁间隙后间隙内走行。",
    chapter: "头颈部血管",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA4762: {
    displayName: "左颈内静脉",
    aliases: ["zjnjm", "颈内静脉", "left internal jugular vein"],
    summary: "颅骨乙状窦的直接延续，出颈静脉孔后下行于颈动脉鞘内，收集颅内、面部及颈深部静脉血。",
    chapter: "头颈部血管",
    source: "《口腔解剖生理学》（人卫版）",
  },
  FMA4754: {
    displayName: "右颈内静脉",
    aliases: ["yjnjm", "颈内静脉", "right internal jugular vein"],
    summary: "右侧颈内静脉。颈深淋巴结群常紧密贴附于其鞘表面，口腔颌面恶性肿瘤颈淋巴清扫术的重要解剖轴线。",
    chapter: "头颈部血管",
    source: "《口腔解剖生理学》（人卫版）",
  },
};

/**
 * 稳健查询指定结构的学习与汉化内容
 * 优先匹配 STUDY_CONTENT（人卫版《口腔解剖生理学》专科精编条目）
 * 若未命中或需补充，自动合并全量 ANATOMY_DICT 医学标准词典
 */
export function getStudyEntry(id: string, elements?: string[]): StudyEntry | undefined {
  let curated = STUDY_CONTENT[id];
  if (!curated && elements) {
    for (const el of elements) {
      if (STUDY_CONTENT[el]) {
        curated = STUDY_CONTENT[el];
        break;
      }
    }
  }

  let dict = ANATOMY_DICT[id];
  if (!dict && elements) {
    for (const el of elements) {
      if (ANATOMY_DICT[el]) {
        dict = ANATOMY_DICT[el];
        break;
      }
    }
  }

  if (curated && dict) {
    return {
      ...dict,
      ...curated,
      displayName: curated.displayName ?? dict.displayName,
      chapter: curated.chapter ?? dict.chapter,
      source: curated.source ?? dict.source,
      summary: curated.summary ?? dict.summary,
      aliases: Array.from(new Set([...(curated.aliases ?? []), ...(dict.aliases ?? [])])),
    };
  }
  return curated ?? dict;
}

