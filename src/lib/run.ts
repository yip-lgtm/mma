import type { DayProgram } from "@/lib/program";
import { hktDateKey, weekdayHkt } from "@/lib/utils";

/** 香港中學體適能 9 分鐘跑：連續跑，計距離。每週一次作有氧基準。 */
export const RUN_TEST: DayProgram = {
  id: 9,
  name: "9 分鐘耐力跑",
  intent:
    "每週任揀一日，跑步機或戶外連續跑 9 分鐘。勻速，最後一分鐘可以加快。唔取代當日 30 分鐘主課。",
  science:
    "9 分鐘跑係香港體適能耐力項。用距離估平地跑步攝氧量（ACSM：VO₂ = 0.2×速度 m/min + 3.5）。外圍型要有氧底，但每週一次已夠監測，唔好每日加長有氧。坡度 1% 模擬戶外，唔扶扶手。",
  totalMin: 10,
  intensity: "中",
  lcsdFocus: "跑步機 1% 坡 · 或公園跑道",
  blocks: [
    {
      label: "調帶",
      seconds: 45,
      kind: "warmup",
      cue: "坡度 1%。行幾步熱膝。準備 9 分鐘唔停。目標勻速，唔好前 3 分鐘衝。",
      gear: "跑步機 6–7 km/h 起步",
    },
    {
      label: "9 分鐘耐力跑",
      seconds: 540,
      kind: "work",
      cue: "連續跑。呼吸鼻吸口呼。步幅細、腳下快。外圍型要能邊移動邊打，呢段就係底盤。最後 60 秒先加速。記住完結距離。",
      gear: "跑步機 10–14 km/h 或戶外",
    },
    {
      label: "停帶記距離",
      seconds: 15,
      kind: "cooldown",
      cue: "慢行。睇跑步機總里程或戶外 GPS。下一頁記入公里數。",
      gear: "原地",
    },
  ],
};

export type RunGrade = "外圍型" | "合格" | "要補" | "太慢";

export function runVo2(meters: number) {
  const mMin = meters / 9;
  return Math.round((0.2 * mMin + 3.5) * 10) / 10;
}

export function runPace(meters: number) {
  if (meters <= 0) return "—";
  const minPerKm = 9 / (meters / 1000);
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

export function runKmh(meters: number) {
  return Math.round((meters / 1000 / 9) * 60 * 10) / 10;
}

/** 31 歲男性業餘外圍拳手：要打得動 3 分鐘回合，9 分鐘應能過 1.8 km。 */
export function gradeRun(meters: number): RunGrade {
  if (meters >= 2100) return "外圍型";
  if (meters >= 1800) return "合格";
  if (meters >= 1500) return "要補";
  return "太慢";
}

export function gradeCue(g: RunGrade) {
  if (g === "外圍型") return "有氧夠支持側移同刺拳節奏。維持，唔加第三次有氧。";
  if (g === "合格") return "底盤可用。下週試快 0.1–0.2 km，唔好一天加到爆。";
  if (g === "要補") return "回合後半會散。日常課已有移動，耐力測保持每週一次即可。";
  return "先求 9 分鐘唔停，速度其次。可改走跑交替至能連續。";
}

export function weekStartKey(dateKey: string) {
  const d = new Date(`${dateKey}T12:00:00+08:00`);
  const wd = weekdayHkt(d);
  const back = wd === 0 ? 6 : wd - 1;
  d.setTime(d.getTime() - back * 86400000);
  return hktDateKey(d);
}

export const KM_CHIPS = ["1.50", "1.70", "1.80", "1.90", "2.00", "2.20"];
