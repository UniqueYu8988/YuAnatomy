import type { PresetId } from "./study";

export interface ModuleQuickAction {
  id: string;
  label: string;
  action:
    | "toggle_pulp"
    | "open_canals"
    | "toggle_fdi"
    | "reset_view"
    | "explode"
    | "toggle_fascial"
    | "focus_mastication"
    | "focus_oral";
  active?: boolean;
}

export interface TeachingStructure {
  id: string;
  name: string;
  tag?: string;
  type: "tooth" | "concept" | "fascial";
  param: string; // fdi number for tooth, conceptId for concept, spaceId for fascial
}

export interface TeachingModule {
  id: string;
  code: string;
  name: string;
  preset: PresetId;
  defaultScene?: {
    fascialMode?: boolean;
    canalMode?: boolean;
    rctMode?: boolean;
  };
  quickActions?: ModuleQuickAction[];
  structures: TeachingStructure[];
}

export const TEACHING_MODULES: TeachingModule[] = [
  {
    id: "dental",
    code: "01",
    name: "牙体与髓腔",
    preset: "dental",
    defaultScene: {
      fascialMode: false,
      canalMode: false,
    },
    quickActions: [
      { id: "pulp", label: "髓腔透视", action: "toggle_pulp" },
      { id: "canals", label: "3D 根管分型", action: "open_canals" },
      { id: "fdi", label: "FDI 牙位盘", action: "toggle_fdi" },
    ],
    structures: [
      { id: "t36", name: "左下第一恒磨牙 (36)", tag: "六龄齿", type: "tooth", param: "36" },
      { id: "t46", name: "右下第一恒磨牙 (46)", tag: "六龄齿", type: "tooth", param: "46" },
      { id: "t16", name: "右上第一恒磨牙 (16)", tag: "三根型", type: "tooth", param: "16" },
      { id: "t26", name: "左上第一恒磨牙 (26)", tag: "三根型", type: "tooth", param: "26" },
      { id: "t11", name: "右上中切牙 (11)", tag: "美学区", type: "tooth", param: "11" },
      { id: "t21", name: "左上中切牙 (21)", tag: "美学区", type: "tooth", param: "21" },
      { id: "t13", name: "右上尖牙 (13)", tag: "尖牙支柱", type: "tooth", param: "13" },
      { id: "t23", name: "左上尖牙 (23)", tag: "尖牙支柱", type: "tooth", param: "23" },
      { id: "t14", name: "右上第一前磨牙 (14)", tag: "双根管高发", type: "tooth", param: "14" },
      { id: "t24", name: "左上第一前磨牙 (24)", tag: "双根管高发", type: "tooth", param: "24" },
      { id: "t37", name: "左下第二恒磨牙 (37)", tag: "C形根管", type: "tooth", param: "37" },
      { id: "t47", name: "右下第二恒磨牙 (47)", tag: "C形根管", type: "tooth", param: "47" },
      { id: "t31", name: "左下中切牙 (31)", tag: "前牙区", type: "tooth", param: "31" },
      { id: "t41", name: "右下中切牙 (41)", tag: "前牙区", type: "tooth", param: "41" },
    ],
  },
  {
    // 合并原 2（咀嚼肌群）、3（颌面间隙）、5（口咽软组织）为统一的口颌肌群与筋膜间隙
    id: "muscles_spaces",
    code: "02",
    name: "肌群与筋膜间隙",
    preset: "oral",
    defaultScene: {
      fascialMode: false,
      canalMode: false,
    },
    quickActions: [
      { id: "spaces_toggle", label: "8大间隙感染", action: "toggle_fascial" },
      { id: "mastication_focus", label: "咀嚼肌视图", action: "focus_mastication" },
      { id: "oral_focus", label: "口底与腺体", action: "focus_oral" },
    ],
    structures: [
      // 咀嚼肌系统
      { id: "m_masseter_sup_l", name: "左咬肌浅部", tag: "提颌/前伸", type: "concept", param: "BP3-FMA49002" },
      { id: "m_masseter_deep_l", name: "左咬肌深部", tag: "提颌/后退", type: "concept", param: "BP3-FMA49005" },
      { id: "m_temp_ant_l", name: "左颞肌前束", tag: "上提下颌", type: "concept", param: "BP3-FMA49008" },
      { id: "m_temp_post_l", name: "左颞肌后束", tag: "后退下颌", type: "concept", param: "BP3-FMA49012" },
      { id: "m_pteryg_med_l", name: "左翼内肌", tag: "翼下颌吊带", type: "concept", param: "BP3-FMA49014" },
      { id: "m_pteryg_lat_sup_l", name: "左翼外肌上头", tag: "附着关节盘", type: "concept", param: "BP3-FMA49016" },
      { id: "m_pteryg_lat_inf_l", name: "左翼外肌下头", tag: "张口/前伸/侧向", type: "concept", param: "BP3-FMA49018" },

      // 颌面间隙系统
      { id: "f_ptm", name: "左翼下颌间隙", tag: "麻醉靶点/咽旁相通", type: "fascial", param: "pterygomandibular_left" },
      { id: "f_mas", name: "左咬肌间隙", tag: "下颌角区红肿", type: "fascial", param: "masseteric_left" },
      { id: "f_itp", name: "左颞下间隙", tag: "深部通向颅内", type: "fascial", param: "infratemporal_left" },
      { id: "f_tem", name: "左颞间隙深部", tag: "颞肌骨膜之间", type: "fascial", param: "temporal_deep_left" },
      { id: "f_sbm", name: "左下颌下间隙", tag: "下颌下腺区", type: "fascial", param: "submandibular_left" },
      { id: "f_sbl", name: "左舌下间隙", tag: "口底抬高/窒息风险", type: "fascial", param: "sublingual_left" },
      { id: "f_buc", name: "左颊间隙", tag: "颊肌咬肌前缘", type: "fascial", param: "buccal_left" },
      { id: "f_ior", name: "左眶下间隙", tag: "尖牙根尖扩散", type: "fascial", param: "infraorbital_left" },

      // 口底咽喉与腺体软组织
      { id: "o_tongue", name: "舌与舌肌", tag: "颏舌肌/舌内肌", type: "concept", param: "FMA54640" },
      { id: "o_submand_l", name: "左下颌下腺", tag: "Wharton导管", type: "concept", param: "FMA59803" },
      { id: "o_subling_l", name: "左舌下腺", tag: "舌下区/口底", type: "concept", param: "FMA59805" },
      { id: "o_digastric_l", name: "左二腹肌", tag: "降颌肌/舌骨上", type: "concept", param: "FMA46293" },
      { id: "o_mylohyoid_l", name: "左下颌舌骨肌", tag: "口底肌肉吊床", type: "concept", param: "FMA46322" },
      { id: "o_tensor_palatini", name: "左腭帆张肌", tag: "咽鼓管/软腭", type: "concept", param: "FMA46728" },
      { id: "o_pharyng_sup_l", name: "左咽上缩肌", tag: "翼下颌韧带相连", type: "concept", param: "FMA46632" },
    ],
  },
  {
    id: "bones",
    code: "03",
    name: "颅颌骨骼",
    preset: "bones",
    defaultScene: {
      fascialMode: false,
      canalMode: false,
    },
    structures: [
      { id: "b_mandible", name: "下颌骨", tag: "下颌孔/颏孔/髁突/喙突", type: "concept", param: "FMA52748" },
      { id: "b_maxilla_l", name: "左上颌骨", tag: "眶下孔/尖牙窝/硬腭", type: "concept", param: "FMA53650" },
      { id: "b_maxilla_r", name: "右上颌骨", tag: "上颌窦/颧突", type: "concept", param: "FMA53649" },
      { id: "b_zygomatic_l", name: "左颧骨", tag: "颧弓/咬肌起点", type: "concept", param: "FMA52893" },
      { id: "b_temporal_l", name: "左颞骨", tag: "关节结节/关节窝", type: "concept", param: "FMA52739" },
      { id: "b_sphenoid", name: "蝶骨", tag: "翼突内外侧板/卵圆孔", type: "concept", param: "FMA52736" },
      { id: "b_hyoid", name: "舌骨", tag: "舌骨肌群附着", type: "concept", param: "FMA52749" },
    ],
  },
  {
    id: "nerves",
    code: "04",
    name: "神经与血管",
    preset: "nerves",
    defaultScene: {
      fascialMode: false,
      canalMode: false,
    },
    structures: [
      { id: "n_carotid_com_l", name: "左颈总动脉", tag: "头颈主干供血", type: "concept", param: "FMA4058" },
      { id: "n_carotid_com_r", name: "右颈总动脉", tag: "头颈主干供血", type: "concept", param: "FMA4057" },
      { id: "n_carotid_int_l", name: "左颈内动脉", tag: "颅内供血", type: "concept", param: "FMA4062" },
      { id: "n_ophthalmic_l", name: "左眼神经", tag: "三叉神经 V1 支", type: "concept", param: "FMA52623" },
      { id: "n_optic_l", name: "左视神经", tag: "第 II 对脑神经", type: "concept", param: "FMA50878" },
    ],
  },
  {
    id: "overview",
    code: "05",
    name: "全系总览",
    preset: "overview",
    defaultScene: {
      fascialMode: false,
      canalMode: false,
    },
    structures: [
      { id: "ov_teeth", name: "恒牙列 (28 牙)", tag: "全牙列咬合", type: "tooth", param: "36" },
      { id: "ov_mandible", name: "下颌骨", tag: "运动骨性支架", type: "concept", param: "FMA52748" },
      { id: "ov_maxilla", name: "上颌骨", tag: "面中部支架", type: "concept", param: "FMA53650" },
      { id: "ov_tongue", name: "舌与口底", tag: "消化与言语", type: "concept", param: "FMA54640" },
    ],
  },
];
