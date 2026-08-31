import type { DayProgram } from "./program";

export const THURSDAY_DAY: DayProgram = {
  id: 4,
  name: "環繞＋塑形",
  intent: "星期四取消有氧。上半用環繞、Pivot、刺拳代替單車／橢圓機。",
  science:
    "超哥：帶氧會令今日動作效果減半，尤其瘦人。意志被熱身消耗，重訓就唔係最佳狀態。刀刃係技術同塑形。",
  totalMin: 30,
  intensity: "中",
  lcsdFocus: "空地／鏡前 → 單樆",
  blocks: [
    {
      label: "進入 · 彈跳架勢",
      seconds: 90,
      kind: "warmup",
      cue: "腳掌輕彈。唔踩單車、唔跑步機。",
      gear: "空地",
    },
    {
      label: "技術 · 環繞",
      seconds: 150,
      kind: "skill",
      cue: "走弧唔走直線。向弱手外側。",
      gear: "空地／鏡前",
    },
    {
      label: "應用 · Pivot 45",
      seconds: 100,
      kind: "work",
      cue: "前腳為軸，後腳划 45 度。慢轉停穩。",
      gear: "空地",
    },
    {
      label: "刺拳付費",
      seconds: 90,
      kind: "work",
      cue: "移動中出刺，腳不停死。",
      gear: "空地",
    },
    {
      label: "Flow 收工",
      seconds: 60,
      kind: "work",
      cue: "輕走弧。唔加帶氧。",
      gear: "空地",
    },
  ],
};
