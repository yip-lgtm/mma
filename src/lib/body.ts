export type BodyScan = {
  date: string;
  kg: number;
  bmi: number;
  bodyFatPct: number;
  fatKg: number;
  waterPct: number;
  waterKg: number;
  musclePct: number;
  muscleKg: number;
  bonePct: number;
  boneKg: number;
  subFatPct: number;
  subFatKg: number;
  bmr: number;
  visceral: number;
  visceralArea: number;
  proteinPct: number;
  proteinKg: number;
  obesity: number;
  health: string;
  bodyType: string;
  bodyAge: number;
  score: number;
  leanKg: number;
  controlKg: number;
  fatControlKg: number;
  muscleControlKg: number;
};

export type FoodItem = {
  id: string;
  date: string;
  meal: "早" | "午" | "晚" | "加";
  text: string;
};

export const SCAN_FIELDS: {
  key: keyof BodyScan;
  label: string;
  step?: string;
}[] = [
  { key: "kg", label: "體重 kg" },
  { key: "bmi", label: "BMI" },
  { key: "bodyFatPct", label: "體脂率 %" },
  { key: "fatKg", label: "體脂量 kg" },
  { key: "musclePct", label: "肌肉率 %" },
  { key: "muscleKg", label: "肌肉量 kg" },
  { key: "waterPct", label: "水分 %" },
  { key: "waterKg", label: "含水量 kg" },
  { key: "bonePct", label: "骨率 %" },
  { key: "boneKg", label: "骨量 kg" },
  { key: "subFatPct", label: "皮下脂 %" },
  { key: "subFatKg", label: "皮下脂 kg" },
  { key: "bmr", label: "基礎代謝" },
  { key: "visceral", label: "內臟脂肪" },
  { key: "visceralArea", label: "內臟面積 cm²" },
  { key: "proteinPct", label: "蛋白 %" },
  { key: "proteinKg", label: "蛋白量 kg" },
  { key: "obesity", label: "肥胖度" },
  { key: "bodyAge", label: "身體年齡" },
  { key: "score", label: "身體得分" },
  { key: "leanKg", label: "去脂體重 kg" },
  { key: "controlKg", label: "控制體重 kg" },
  { key: "fatControlKg", label: "體脂控制 kg" },
  { key: "muscleControlKg", label: "肌肉控制 kg" },
];

/** 用戶上傳嘅體脂磅讀數（2026-08-26） */
export const SAMPLE_SCAN: BodyScan = {
  date: "2026-08-26",
  kg: 57.67,
  bmi: 20.4,
  bodyFatPct: 12.8,
  fatKg: 7.36,
  waterPct: 64.0,
  waterKg: 36.91,
  musclePct: 47.3,
  muscleKg: 27.26,
  bonePct: 4.5,
  boneKg: 2.62,
  subFatPct: 12.6,
  subFatKg: 7.28,
  bmr: 1459.4,
  visceral: 3,
  visceralArea: 28.3,
  proteinPct: 22.1,
  proteinKg: 12.76,
  obesity: -7.1,
  health: "優秀",
  bodyType: "標準",
  bodyAge: 28,
  score: 91,
  leanKg: 50.31,
  controlKg: 4.42,
  fatControlKg: 1.64,
  muscleControlKg: 0,
};

export const HK_FOOD_CHIPS = [
  "白飯半碗",
  "白切雞",
  "蒸魚",
  "蛋兩隻",
  "豆漿",
  "香蕉",
  "雞胸",
  "豆腐",
  "菜心",
  "麥皮",
];
