export type BlockKind = "warmup" | "work" | "rest" | "skill" | "cooldown";

export type Block = {
  label: string;
  seconds: number;
  kind: BlockKind;
  cue: string;
  gear: string;
};

export type DayProgram = {
  id: number;
  name: string;
  intent: string;
  science: string;
  totalMin: number;
  intensity: "低" | "中" | "高";
  lcsdFocus: string;
  blocks: Block[];
};

const rest = (s: number, cue = "行兩步、鼻吸口呼，唔好坐低。"): Block => ({
  label: "休息",
  seconds: s,
  kind: "rest",
  cue,
  gear: "原地",
});

export const SCULPT_SUMMARY = [
  { part: "背", move: "引體向上", gear: "單槓／助力機", reps: "5–8 或慢落 5" },
  { part: "胸", move: "伏地／推胸", gear: "墊或推胸機", reps: "8–15" },
  { part: "二頭", move: "啞鈴彎舉", gear: "啞鈴 6–10 kg", reps: "8–12" },
  { part: "腹", move: "單槓提膝", gear: "單槓或墊", reps: "8–12" },
];

/** 每日 12 分鐘塑形：3 輪 × 背胸二頭腹，45 秒做／15 秒轉。 */
function sculptCircuit(mode: "std" | "easy" | "home"): Block[] {
  const pull =
    mode === "home"
      ? "公園單槓；無單槓就桌底划船（背平、拉胸向邊）。"
      : mode === "easy"
        ? "肩胛懸吊 20 秒 + 2–4 下助力或慢落。唔到力竭。"
        : "正手引體。做得到：5–8 下，頂停 1 秒，3 秒慢落。做唔到：跳上慢落 5 下，或助力機 8–10。肩唔聳。";
  const chest =
    mode === "home"
      ? "伏地挺身 8–15。太難就跪姿；太易就腳墊高。"
      : mode === "easy"
        ? "跪姿或標準伏地 6–10，肘約 45 度，唔到底彈。"
        : "伏地或坐姿推胸機。8–15 下，最後 2 下要辛苦但仍控制。胸帶動，頸放鬆。";
  const bi =
    mode === "home"
      ? "水樽或背包彎舉。2 秒上、3 秒落，唔擺身。"
      : mode === "easy"
        ? "輕啞鈴 8–10 下。只求泵感，留一兩個餘力。"
        : "站姿啞鈴彎舉 8–12。肘貼腰。2 秒上 3 秒落。借身就減重量。";
  const abs =
    mode === "home"
      ? "仰臥捲腹或死蟲。腰貼地，呼氣捲骨盆。"
      : mode === "easy"
        ? "死蟲或屈膝平板。腰唔拱。"
        : "單槓提膝 8–12（可彎膝）。唔擺盪。無單槓就捲腹／真空呼氣。";
  const gear = {
    pull: mode === "home" ? "單槓／桌沿" : "單槓／助力引體機",
    chest: mode === "home" ? "墊" : "墊／推胸機",
    bi: mode === "home" ? "水樽／背包" : "啞鈴",
    abs: mode === "home" ? "墊" : "單槓／墊",
  };

  const out: Block[] = [];
  for (let r = 1; r <= 3; r++) {
    const last = r === 3 && mode === "std";
    out.push({
      label: `引體 ${r}/3`,
      seconds: 45,
      kind: "work",
      cue: last ? `${pull} 呢組可靠近力竭，但仍要慢落。` : pull,
      gear: gear.pull,
    });
    out.push(rest(15, "轉胸。"));
    out.push({
      label: `胸 ${r}/3`,
      seconds: 45,
      kind: "work",
      cue: chest,
      gear: gear.chest,
    });
    out.push(rest(15, "轉二頭。"));
    out.push({
      label: `二頭 ${r}/3`,
      seconds: 45,
      kind: "work",
      cue: bi,
      gear: gear.bi,
    });
    out.push(rest(15, "轉腹。"));
    out.push({
      label: `腹 ${r}/3`,
      seconds: 45,
      kind: "work",
      cue: abs,
      gear: gear.abs,
    });
    out.push(rest(15, r < 3 ? "飲水，準備下一輪引體。" : "完成塑形。抖手、放肩。"));
  }
  return out;
}

export const DAYS: DayProgram[] = [
  {
    id: 1,
    name: "速度＋塑形",
    intent: "四個 3 分鐘回合練步頻，之後每日固定：引體、胸、二頭、腹。",
    science:
      "前段對齊業餘回合。後半 3 輪複合組用中反覆次數塑形，唔堆容量，避免 168 cm／55 kg 級別肥大增重。引體優先背寬。",
    totalMin: 30,
    intensity: "高",
    lcsdFocus: "跑步機 → 單槓／推胸／啞鈴",
    blocks: [
      {
        label: "熱身步行",
        seconds: 180,
        kind: "warmup",
        cue: "坡度 1%。腳掌落地，手臂輕擺。之後要引體，肩先活動開。",
        gear: "跑步機 5.5–6.5 km/h",
      },
      {
        label: "第 1 回合",
        seconds: 180,
        kind: "work",
        cue: "60 秒輕快 → 20 秒加快步頻 → 40 秒中 → 20 秒加快 → 40 秒中。跨步細。",
        gear: "跑步機",
      },
      rest(60),
      {
        label: "第 2 回合",
        seconds: 180,
        kind: "work",
        cue: "環繞想像：唔直線衝。肩下沉，可輕微刺拳擺動。",
        gear: "跑步機",
      },
      rest(60),
      {
        label: "第 3 回合",
        seconds: 180,
        kind: "work",
        cue: "講唔到短句就減 0.5 km/h。技術優先。",
        gear: "跑步機",
      },
      rest(60),
      {
        label: "第 4 回合",
        seconds: 180,
        kind: "work",
        cue: "最後回合仍控步頻。前腳掌、落地靜。",
        gear: "跑步機",
      },
      ...sculptCircuit("std"),
    ],
  },
  {
    id: 2,
    name: "旋轉＋塑形",
    intent: "拉力器傳力，再做引體／胸／二頭／腹。",
    science:
      "Pallof 同木斬練出拳力線。塑形組與旋轉分開：引體用背，唔用腰借力。",
    totalMin: 30,
    intensity: "中",
    lcsdFocus: "拉力器 → 單槓",
    blocks: [
      {
        label: "單車熱身",
        seconds: 120,
        kind: "warmup",
        cue: "輕阻力。肩胛後夾，腕畫圈。",
        gear: "健身單車",
      },
      {
        label: "Pallof 左",
        seconds: 45,
        kind: "work",
        cue: "手柄喺胸口推出，身體唔轉。",
        gear: "拉力器",
      },
      rest(15, "換邊。"),
      {
        label: "Pallof 右",
        seconds: 45,
        kind: "work",
        cue: "肋骨下壓。搖就減重量。",
        gear: "拉力器",
      },
      rest(20),
      {
        label: "Pallof 左 2",
        seconds: 45,
        kind: "work",
        cue: "推出停 1 秒。",
        gear: "拉力器",
      },
      rest(15),
      {
        label: "Pallof 右 2",
        seconds: 45,
        kind: "work",
        cue: "呼氣推出。",
        gear: "拉力器",
      },
      rest(25),
      {
        label: "木斬 右打",
        seconds: 45,
        kind: "work",
        cue: "高拉向對側髖。先後腳再髖再手。",
        gear: "拉力器高位",
      },
      rest(15),
      {
        label: "木斬 左打",
        seconds: 45,
        kind: "work",
        cue: "控制回程。",
        gear: "拉力器高位",
      },
      rest(20),
      {
        label: "木斬 右 2",
        seconds: 45,
        kind: "work",
        cue: "腰唔塌。",
        gear: "拉力器",
      },
      rest(15),
      {
        label: "木斬 左 2",
        seconds: 45,
        kind: "work",
        cue: "頭微隨動作。",
        gear: "拉力器",
      },
      rest(25),
      {
        label: "刺拳拉 前手",
        seconds: 40,
        kind: "work",
        cue: "極輕。打出即收。",
        gear: "拉力器",
      },
      rest(15),
      {
        label: "刺拳拉 另一邊",
        seconds: 40,
        kind: "work",
        cue: "回收快過打出。",
        gear: "拉力器",
      },
      rest(20),
      {
        label: "面拉",
        seconds: 45,
        kind: "work",
        cue: "拉向面、外旋。護肩。",
        gear: "繩索",
      },
      rest(15),
      {
        label: "面拉 2",
        seconds: 45,
        kind: "work",
        cue: "慢 2 秒。",
        gear: "繩索",
      },
      rest(20),
      {
        label: "Pallof 左 3",
        seconds: 40,
        kind: "work",
        cue: "最後一組，重量維持。",
        gear: "拉力器",
      },
      rest(15),
      {
        label: "Pallof 右 3",
        seconds: 40,
        kind: "work",
        cue: "穩。",
        gear: "拉力器",
      },
      {
        label: "轉場去單槓",
        seconds: 115,
        kind: "warmup",
        cue: "步行到單槓，轉肩、掛一掛活動肩胛。",
        gear: "場內步行",
      },
      ...sculptCircuit("std"),
    ],
  },
  {
    id: 3,
    name: "單腳＋塑形",
    intent: "側移底盤之後，上肢塑形四件套。",
    science:
      "下肢用單腳維持移動質量；上肢用引體同推，塑造背寬同胸線，二頭中等容量即可。",
    totalMin: 30,
    intensity: "中",
    lcsdFocus: "啞鈴 → 單槓",
    blocks: [
      {
        label: "熱身行",
        seconds: 120,
        kind: "warmup",
        cue: "慢走，提膝、轉踝。",
        gear: "跑步機",
      },
      {
        label: "分腿蹲 左前",
        seconds: 45,
        kind: "work",
        cue: "6–8 下。膝跟腳尖同向。",
        gear: "啞鈴",
      },
      rest(15, "換腳。"),
      {
        label: "分腿蹲 右前",
        seconds: 45,
        kind: "work",
        cue: "後膝向地，唔撞墊。",
        gear: "啞鈴",
      },
      rest(25),
      {
        label: "分腿蹲 左 2",
        seconds: 45,
        kind: "work",
        cue: "質量大於重量。",
        gear: "啞鈴",
      },
      rest(15),
      {
        label: "分腿蹲 右 2",
        seconds: 45,
        kind: "work",
        cue: "呼氣向上。",
        gear: "啞鈴",
      },
      rest(25),
      {
        label: "單腳 RDL 左",
        seconds: 45,
        kind: "work",
        cue: "鉸髖，背平。",
        gear: "啞鈴",
      },
      rest(15),
      {
        label: "單腳 RDL 右",
        seconds: 45,
        kind: "work",
        cue: "髖向後，唔彎腰。",
        gear: "啞鈴",
      },
      rest(25),
      {
        label: "單腳 RDL 左 2",
        seconds: 45,
        kind: "work",
        cue: "可扶牆。",
        gear: "啞鈴",
      },
      rest(15),
      {
        label: "單腳 RDL 右 2",
        seconds: 45,
        kind: "work",
        cue: "感受後鏈。",
        gear: "啞鈴",
      },
      rest(20),
      {
        label: "側弓步",
        seconds: 50,
        kind: "work",
        cue: "橫移，模擬環繞。",
        gear: "徒手",
      },
      rest(20),
      {
        label: "提踵",
        seconds: 40,
        kind: "work",
        cue: "頂停 1 秒。",
        gear: "徒手",
      },
      rest(20),
      {
        label: "側弓步 2",
        seconds: 50,
        kind: "work",
        cue: "再一組橫移。",
        gear: "徒手",
      },
      rest(20),
      {
        label: "提踵 2",
        seconds: 40,
        kind: "work",
        cue: "慢落。",
        gear: "徒手",
      },
      {
        label: "農夫持鈴",
        seconds: 40,
        kind: "work",
        cue: "啞鈴兩手，站直。肩下沉。",
        gear: "啞鈴",
      },
      {
        label: "轉場去單槓",
        seconds: 165,
        kind: "warmup",
        cue: "步行到單槓。抖腿。",
        gear: "場內步行",
      },
      ...sculptCircuit("std"),
    ],
  },
  {
    id: 4,
    name: "有氧＋塑形",
    intent: "Zone 2 堆恢復，下機即做引體四件套。",
    science:
      "有氧後肌糖原略低，塑形組用中反覆仍可刺激，但重量要比速度日輕一點，避免代償。",
    totalMin: 30,
    intensity: "中",
    lcsdFocus: "單車／橢圓機 → 單槓",
    blocks: [
      {
        label: "進入區",
        seconds: 120,
        kind: "warmup",
        cue: "輕阻力，可以輕鬆講話。",
        gear: "單車／橢圓機",
      },
      {
        label: "Zone 2 上段",
        seconds: 480,
        kind: "work",
        cue: "鼻吸為主。心率大約 115–140。唔衝。",
        gear: "單車／橢圓機",
      },
      {
        label: "Zone 2 下段",
        seconds: 480,
        kind: "work",
        cue: "保持相同阻力。下機前活動肩，準備引體。",
        gear: "單車／橢圓機",
      },
      ...sculptCircuit("std"),
    ],
  },
  {
    id: 5,
    name: "刺拳＋塑形",
    intent: "空拳節奏後，用真重量塑胸背臂，同刺拳分開。",
    science:
      "刺拳用神經速度，塑形用張力。兩者唔好用同一重量。引體先於彎舉，背先於臂。",
    totalMin: 30,
    intensity: "中",
    lcsdFocus: "空地 → 單槓／啞鈴",
    blocks: [
      {
        label: "熱身",
        seconds: 120,
        kind: "warmup",
        cue: "碎步、轉腕、轉肩。",
        gear: "跑步機／空地",
      },
      {
        label: "空拳 1",
        seconds: 120,
        kind: "skill",
        cue: "刺拳即收。場地擠就細動作。",
        gear: "空地",
      },
      rest(30),
      {
        label: "空拳 2",
        seconds: 120,
        kind: "skill",
        cue: "1–2 再側步。",
        gear: "空地",
      },
      rest(30),
      {
        label: "空拳 3",
        seconds: 120,
        kind: "skill",
        cue: "最多 1 kg。超過會變劈。",
        gear: "1–2 kg 啞鈴",
      },
      rest(30),
      {
        label: "空拳 4",
        seconds: 120,
        kind: "skill",
        cue: "側閃一次再刺。乾淨即可。",
        gear: "空地",
      },
      rest(20),
      {
        label: "面拉",
        seconds: 40,
        kind: "work",
        cue: "護肩，輕。",
        gear: "拉力器",
      },
      rest(20),
      {
        label: "肩外旋 左",
        seconds: 35,
        kind: "work",
        cue: "肘貼腰。",
        gear: "拉力器低位",
      },
      rest(15),
      {
        label: "肩外旋 右",
        seconds: 35,
        kind: "work",
        cue: "唔借身。",
        gear: "拉力器",
      },
      rest(20),
      {
        label: "空拳 5",
        seconds: 120,
        kind: "skill",
        cue: "只求乾淨刺拳。之後轉單槓。",
        gear: "空地",
      },
      {
        label: "轉場去單槓",
        seconds: 85,
        kind: "warmup",
        cue: "活動肩，準備引體。",
        gear: "場內步行",
      },
      ...sculptCircuit("std"),
    ],
  },
  {
    id: 6,
    name: "移動＋塑形",
    intent: "步頻波之後四件套。腹已在塑形，呢度少做平板。",
    science: "側向步頻服務環繞打。塑形 round 把腹放在引體提膝，效率高。",
    totalMin: 30,
    intensity: "中",
    lcsdFocus: "跑步機 → 單槓",
    blocks: [
      {
        label: "熱身",
        seconds: 150,
        kind: "warmup",
        cue: "6 km/h 走，穿插 5 秒加快。",
        gear: "跑步機",
      },
      {
        label: "步頻 1",
        seconds: 40,
        kind: "work",
        cue: "加快步頻，跨步細。",
        gear: "跑步機",
      },
      rest(20),
      {
        label: "步頻 2",
        seconds: 40,
        kind: "work",
        cue: "肩放鬆。",
        gear: "跑步機",
      },
      rest(20),
      {
        label: "步頻 3",
        seconds: 40,
        kind: "work",
        cue: "落地輕。",
        gear: "跑步機",
      },
      rest(20),
      {
        label: "步頻 4",
        seconds: 40,
        kind: "work",
        cue: "仍控制。",
        gear: "跑步機",
      },
      rest(20),
      {
        label: "步頻 5",
        seconds: 40,
        kind: "work",
        cue: "最後一波。",
        gear: "跑步機",
      },
      rest(30),
      {
        label: "鳥狗",
        seconds: 50,
        kind: "skill",
        cue: "對側伸，髖唔轉。",
        gear: "墊",
      },
      rest(20),
      {
        label: "髖外展 左",
        seconds: 40,
        kind: "work",
        cue: "中臀，腳尖微內。",
        gear: "墊／外展機",
      },
      rest(15),
      {
        label: "髖外展 右",
        seconds: 40,
        kind: "work",
        cue: "同樣。",
        gear: "墊",
      },
      rest(15),
      {
        label: "髖外展 左 2",
        seconds: 40,
        kind: "work",
        cue: "控制。",
        gear: "墊",
      },
      rest(15),
      {
        label: "髖外展 右 2",
        seconds: 40,
        kind: "work",
        cue: "下單槓前抖腿。",
        gear: "墊",
      },
      rest(20),
      {
        label: "步頻 6",
        seconds: 40,
        kind: "work",
        cue: "補一波步頻。",
        gear: "跑步機",
      },
      rest(20),
      {
        label: "側平板 左",
        seconds: 25,
        kind: "work",
        cue: "髖上推成直線。",
        gear: "墊",
      },
      rest(15),
      {
        label: "側平板 右",
        seconds: 25,
        kind: "work",
        cue: "唔塌。",
        gear: "墊",
      },
      rest(20),
      {
        label: "鳥狗 2",
        seconds: 50,
        kind: "skill",
        cue: "慢。",
        gear: "墊",
      },
      {
        label: "轉場去單槓",
        seconds: 130,
        kind: "warmup",
        cue: "步行到單槓。",
        gear: "場內步行",
      },
      ...sculptCircuit("std"),
    ],
  },
  {
    id: 0,
    name: "恢復＋輕塑形",
    intent: "斜行同活動度，塑形改輕：肩胛懸吊、跪姿伏地、輕彎舉。",
    science:
      "每日刺激胸背臂腹有助塑形，週日留餘力讓肌腱跟上，避免引體肩峰過勞。",
    totalMin: 30,
    intensity: "低",
    lcsdFocus: "跑步機 + 單槓輕量",
    blocks: [
      {
        label: "斜行",
        seconds: 720,
        kind: "work",
        cue: "坡度 4–6%，輕鬆對話速度。",
        gear: "跑步機",
      },
      {
        label: "踝活動",
        seconds: 90,
        kind: "skill",
        cue: "膝向牆，腳跟不離地。",
        gear: "牆",
      },
      {
        label: "胸椎轉",
        seconds: 90,
        kind: "skill",
        cue: "側躺開合。",
        gear: "墊",
      },
      {
        label: "髖 90/90",
        seconds: 90,
        kind: "skill",
        cue: "兩邊均勻。",
        gear: "墊",
      },
      {
        label: "肩鐘擺",
        seconds: 90,
        kind: "skill",
        cue: "為引體放鬆關節囊。",
        gear: "徒手",
      },
      ...sculptCircuit("easy"),
    ],
  },
];

export const CLOSED_ALT: DayProgram = {
  id: 8,
  name: "保養日徒手塑形",
  intent: "無器械日：步行 + 引體替代／伏地／彎舉／腹。",
  science: "習慣不斷。徒手張力一樣可以塑形，只要動作慢、接近力竭。",
  totalMin: 30,
  intensity: "低",
  lcsdFocus: "公園單槓或家居",
  blocks: [
    {
      label: "外出步行",
      seconds: 720,
      kind: "work",
      cue: "輕鬆走。有公園單槓就順路熱身肩。",
      gear: "室外／走廊",
    },
    {
      label: "踝＋髖",
      seconds: 180,
      kind: "skill",
      cue: "靠牆踝、90/90。",
      gear: "墊／毛巾",
    },
    {
      label: "呼吸",
      seconds: 180,
      kind: "cooldown",
      cue: "鼻吸 4、口呼 6。之後塑形。",
      gear: "任意",
    },
    ...sculptCircuit("home"),
  ],
};

export function dayByWeekday(weekday: number) {
  return DAYS.find((d) => d.id === weekday) ?? DAYS[0];
}

export function totalSeconds(day: DayProgram) {
  return day.blocks.reduce((a, b) => a + b.seconds, 0);
}

export const PROFILE_DEFAULT = {
  heightCm: 168,
  targetKg: 54.5,
  ceilingKg: 55,
  floorKg: 52,
  age: 31,
  sex: "m" as const,
};

export const SKILLS = [
  {
    id: "stance",
    name: "外圍架勢",
    origin: "阿里早期／洛馬琴科共同點：可隨時移動，唔鎖死。",
    steps: [
      "前腳指向對手，後腳外開約 45 度，前後距離約一步。",
      "膝微屈，重心在兩腳掌之間，可隨時推地。",
      "雙手唔使死擋面：前手可較低準備刺拳，但下頜仍微收。",
      "後手靠近下頜。肩放鬆。",
    ],
    lcsd: "鏡前或牆角空地，每組 60 秒只練站同碎步。",
  },
  {
    id: "jab",
    name: "刺拳",
    origin: "阿里的測距、斷節奏、開路工具。",
    steps: [
      "前腳輕踩同時打出，拳峰對目標。",
      "打直但不鎖死肘。肩跟出去一點。",
      "立刻沿原路回收，快過打出。",
      "後手留在面。打完可以立刻側步，唔企喺原位。",
    ],
    lcsd: "空拳或 1 kg 啞鈴。健身房請細動作、唔出聲。",
  },
  {
    id: "pivot",
    name: "Pivot 轉角",
    origin: "洛馬琴科招牌：離開對手發力線。",
    steps: [
      "對手出拳或前壓時，前腳為軸。",
      "後腳向外側划弧，身體轉 45–90 度。",
      "轉完立刻有一手可以打（通常係刺拳或後手）。",
      "視線保持對手，唔低頭。",
    ],
    lcsd: "原地畫圈練習。確認四周無人。",
  },
  {
    id: "shuffle",
    name: "簡化滑步",
    origin: "Ali shuffle 的實用版：擾亂節奏，唔係表演。",
    steps: [
      "雙腳碎步交換，幅度細。",
      "上身平穩，頭唔上下晃。",
      "隨時可停再刺拳。",
      "只在有空間、對手節奏亂時用，唔連續跳。",
    ],
    lcsd: "可在跑步機放慢速時用腳掌輕彈模擬，或空地 20 秒一組。",
  },
  {
    id: "head",
    name: "頭同距離",
    origin: "阿里早期靠後仰同晃，令對手打空。",
    steps: [
      "距離先對：對手打直拳剛好差一點。",
      "後仰來自髖同後腳，唔只係頸。",
      "側閃時肩同頭一起讓開。",
      "讓完一定有回擊或離開，唔停喺危險距離。",
    ],
    lcsd: "對鏡慢鏡練習。唔好大力後仰到失衡。",
  },
  {
    id: "ring",
    name: "環繞節奏",
    origin: "外圍型核心：自己能打到、對手打唔到的幾何。",
    steps: [
      "多數時間向對手弱手外側移動（對正架通常向其左邊）。",
      "直線後退最易被追；優先側移同轉角。",
      "用刺拳付費：移動時保持對手要應付前手。",
      "每 3–5 秒改變節奏，快兩步再慢。",
    ],
    lcsd: "跑步機間歇就係這條的體能版；技術在空地用想像對手走弧。",
  },
];

export const FOOD_NOTES = [
  {
    title: "蛋白質錨",
    body: "每日約 100–110 g（約 1.9 g/kg）。引體同胸推需要蛋白修復：蛋、雞胸、魚、豆腐、乳清或豆漿。",
  },
  {
    title: "塑形唔等於增重",
    body: "每日 3 輪引體／胸／二頭／腹已夠線條。唔加第四輪、唔刻意過剩熱量。目標 53.0–54.8 kg；低過 52 kg 要加餐。",
  },
  {
    title: "訓練前後",
    body: "練前 1–2 小時有碳：白飯、麥片、香蕉。練後蛋白 + 碳。康文署沒有餐，可帶香蕉同乳清或豆漿。",
  },
  {
    title: "香港外食",
    body: "茶餐廳揀蒸魚／白切雞／蛋，飯半碗。少甜飲。水分每日 ≥ 2 L。酒精影響恢復同體重。",
  },
];

export const LCSD_NOTES = [
  "多數健身室需 SmartPLAY 預約，準時到。",
  "每月第一及第三個星期二通常封閉保養——App 會改徒手塑形（公園單槓或伏地／桌底划船）。",
  "每日後半固定：引體 → 胸 → 二頭 → 腹，三輪。單槓排隊就先做推胸同彎舉，回頭補引體。",
  "引體做唔到：助力機，或跳上慢落 5 下。唔好猛擺。",
  "每週任一日加一次 9 分鐘耐力跑（跑步機 1% 坡，唔扶手）。只測有氧，唔取代當日主課。",
  "請勿佔用器械做長空拳；刺拳用角落細幅度。手機只開計時。",
];
