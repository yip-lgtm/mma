import { createServerFn } from "@tanstack/react-start";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { hostname } from "node:os";
import { fileURLToPath } from "node:url";

export type AnalyzeInput = {
  heightCm: number;
  age: number;
  boxingCeilingKg: number;
  boxingTargetKg: number;
  latest: Record<string, string | number>;
  previous: Record<string, string | number> | null;
  foods: { date: string; meal: string; text: string }[];
  sessions: { date: string; name: string }[];
  runs: {
    date: string;
    meters: number;
    vo2: number;
    kmh: number;
    grade: string;
  }[];
};

export type ReportSideEffect = {
  file: string;
  committed: boolean;
  commitSha?: string;
  pushed: boolean;
  pushError?: string;
  skipped?: string;
};

const MiniMax_BASE_URL = process.env.MiniMax_BASE_URL ?? "https://api.MiniMax.chat/v1";
const MiniMax_MODEL = process.env.MiniMax_MODEL ?? "MiniMax-Text-01";
const MiniMax_API_KEY = process.env.MiniMax_API_KEY;

/**
 * A single OpenAI-compatible chat completion call. Handles auth, the
 * multimodal content block, and the few response shapes the MiniMax endpoint
 * has been observed to return. Returns the raw assistant text or throws with
 * a status-tagged message.
 */
async function chatCompletion(
  messages: Array<{
    role: "system" | "user" | "assistant";
    content:
      | string
      | Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        >;
  }>,
  opts: { maxTokens?: number; temperature?: number; json?: boolean; model?: string } = {},
): Promise<string> {
  if (!MiniMax_API_KEY) {
    throw new Error("NO_API_KEY");
  }
  const res = await fetch(`${MiniMax_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MiniMax_API_KEY}`,
    },
    body: JSON.stringify({
      model: opts.model ?? MiniMax_MODEL,
      max_tokens: opts.maxTokens ?? 1100,
      temperature: opts.temperature ?? 0.4,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      messages,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("EMPTY_RESPONSE");
  return text;
}
const REPORTS_DIR = "reports";
const COMMIT_AUTHOR_NAME = process.env.GIT_AUTHOR_NAME ?? "蝶刺 bot";
const COMMIT_AUTHOR_EMAIL =
  process.env.GIT_AUTHOR_EMAIL ?? "bot@dieci.local";

/**
 * Resolve a project-root path. The dev server is launched from the workspace
 * root, but tests and future previews may not be — resolve against
 * `process.cwd()` first, then against this file's location.
 */
function projectPath(...parts: string[]): string {
  const cwdCandidate = resolve(process.cwd(), ...parts);
  if (existsSync(join(cwdCandidate, "package.json"))) return cwdCandidate;
  // Walk up from this file (src/lib/analyze.ts) until we find a package.json.
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, "package.json"))) return resolve(dir, ...parts);
    dir = dirname(dir);
  }
  return cwdCandidate;
}

function safeExec(cmd: string, args: string[], cwd: string): { ok: true; stdout: string } | { ok: false; stderr: string } {
  try {
    const stdout = execFileSync(cmd, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, stdout: stdout.trim() };
  } catch (err) {
    const e = err as { stderr?: Buffer | string; stdout?: Buffer | string };
    const stderr = (e.stderr ?? e.stdout ?? "").toString().trim();
    return { ok: false, stderr: stderr || String(err) };
  }
}

function writeReportFile(date: string, text: string): string {
  const root = projectPath(".");
  const dir = join(root, REPORTS_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const path = join(dir, `${date}.md`);
  const header = [
    `# 蝶刺 分析報告 — ${date}`,
    "",
    `> 由 ${MiniMax_MODEL} 生成 · ${new Date().toISOString()} · host=${hostname()}`,
    "",
    "---",
    "",
  ].join("\n");
  writeFileSync(path, header + text.trim() + "\n", "utf8");
  return path;
}

function commitReportFile(file: string, date: string): { ok: true; sha: string } | { ok: false; error: string } {
  const root = projectPath(".");
  // git is optional — a workspace without a repo (e.g. fresh sandbox clone) just
  // gets the file written, no commit. This keeps analyze usable in any env.
  if (!existsSync(join(root, ".git"))) {
    return { ok: false, error: "no git repo" };
  }
  // Ensure an author exists so commit doesn't blow up on fresh clones.
  safeExec("git", ["config", "user.name", COMMIT_AUTHOR_NAME], root);
  safeExec("git", ["config", "user.email", COMMIT_AUTHOR_EMAIL], root);

  const add = safeExec("git", ["add", "--", file], root);
  if (!add.ok) return { ok: false, error: `git add: ${add.stderr}` };

  // Skip if there is nothing to commit (e.g. report unchanged from a prior run).
  const status = safeExec("git", ["status", "--porcelain", "--", file], root);
  if (!status.ok || !status.stdout) {
    // Empty status = no changes; pull existing sha so the caller can see it.
    const log = safeExec("git", ["log", "-1", "--format=%H", "--", file], root);
    return { ok: true, sha: log.ok ? log.stdout : "unchanged" };
  }

  const commit = safeExec(
    "git",
    [
      "commit",
      "-m",
      `chore(report): dieci analyze ${date}`,
      "-m",
      `Generated by ${MiniMax_MODEL} via /weight → 產生今日報告.`,
      "--",
      file,
    ],
    root,
  );
  if (!commit.ok) return { ok: false, error: `git commit: ${commit.stderr}` };

  const sha = safeExec("git", ["log", "-1", "--format=%H", "--", file], root);
  return { ok: true, sha: sha.ok ? sha.stdout : "unknown" };
}

function pushReport(): { pushed: boolean; error?: string } {
  const root = projectPath(".");
  if (!existsSync(join(root, ".git"))) {
    return { pushed: false, error: "no git repo" };
  }
  const push = safeExec("git", ["push"], root);
  if (!push.ok) {
    return { pushed: false, error: push.stderr };
  }
  return { pushed: true };
}

export const analyzeBody = createServerFn({ method: "POST" })
  .validator((input: AnalyzeInput) => input)
  .handler(async ({ data }) => {
    let text: string;
    try {
      text = await chatCompletion(
        [
          {
            role: "system",
            content:
              "你是香港私人教練兼營養顧問。用繁體中文、口語簡潔。服務一名 168cm 男性，業餘自學阿里／洛馬琴科外圍拳擊，每日康文署 30 分鐘（移動 + 引體／胸／二頭／腹塑形），另每週一次 9 分鐘耐力跑作有氧監測（香港體適能協議）。體脂磅家用數據有誤差，唔好當醫療診斷。結構固定五段：1) 而家狀態 2) 同拳擊 55kg 目標的關係 3) 飲食評價同明日三個具體食法 4) 9分鐘跑體能（無數據就叫佢本週任一日去測；有數據就評外圍底盤，唔好叫佢每日加跑） 5) 訓練調整。禁止恐嚇、禁止極端節食、禁止藥物。肌肉量要守。每週有氧最多一次 9 分鐘。",
          },
          {
            role: "user",
            content: JSON.stringify(data),
          },
        ],
        { maxTokens: 1100, temperature: 0.4 },
      );
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "NO_API_KEY") return { ok: false as const, error: "分析功能暫時未能使用" };
      if (msg === "EMPTY_RESPONSE") return { ok: false as const, error: "沒有分析結果" };
      return { ok: false as const, error: `分析失敗（${msg}）` };
    }

    // Side effect: write to reports/{date}.md and (optionally) commit + push.
    // Errors here never fail the analyze — the report is already in hand.
    const today = new Date().toISOString().slice(0, 10);
    let sideEffect: ReportSideEffect | undefined;
    try {
      const file = writeReportFile(today, text);
      const commit = commitReportFile(file, today);
      if (commit.ok) {
        const autoPush = process.env.AUTO_GIT_PUSH === "1";
        let pushed = false;
        let pushError: string | undefined;
        if (autoPush) {
          const r = pushReport();
          pushed = r.pushed;
          pushError = r.error;
        }
        sideEffect = {
          file: file.replace(projectPath("."), "."),
          committed: true,
          commitSha: commit.sha,
          pushed,
          pushError,
          skipped: autoPush ? undefined : "AUTO_GIT_PUSH not set; file committed locally only",
        };
      } else {
        sideEffect = {
          file: file.replace(projectPath("."), "."),
          committed: false,
          pushed: false,
          skipped: commit.error,
        };
      }
    } catch (err) {
      sideEffect = {
        file: "",
        committed: false,
        pushed: false,
        skipped: `side effect failed: ${(err as Error).message}`,
      };
    }

    return { ok: true as const, text, sideEffect };
  });

// ---------------------------------------------------------------------------
// Vision: extract body composition numbers from a body-fat scale screenshot.
// ---------------------------------------------------------------------------

const SCAN_FIELD_KEYS = [
  "kg",
  "bmi",
  "bodyFatPct",
  "fatKg",
  "musclePct",
  "muscleKg",
  "waterPct",
  "waterKg",
  "bonePct",
  "boneKg",
  "subFatPct",
  "subFatKg",
  "bmr",
  "visceral",
  "visceralArea",
  "proteinPct",
  "proteinKg",
  "obesity",
  "bodyAge",
  "score",
  "leanKg",
  "controlKg",
  "fatControlKg",
  "muscleControlKg",
] as const;

export const extractBodyScanFromImage = createServerFn({ method: "POST" })
  .validator((input: { imageBase64: string; mimeType: string }) => input)
  .handler(async ({ data }) => {
    let text: string;
    try {
      text = await chatCompletion(
        [
          {
            role: "system",
            content:
              "你係香港體脂磅 App 截圖 OCR 助手。讀取圖中所有數字，輸出 JSON object，key 必須用以下名稱（蛇底線或駝峰皆可但要一致），value 係 number。讀唔到就唔好寫。" +
              "kg, bmi, bodyFatPct, fatKg, musclePct, muscleKg, waterPct, waterKg, bonePct, boneKg, subFatPct, subFatKg," +
              "bmr, visceral, visceralArea, proteinPct, proteinKg, obesity, bodyAge, score," +
              "leanKg, controlKg, fatControlKg, muscleControlKg." +
              "另外加兩個 string key：health（例如「優秀／良好／標準」）、bodyType（例如「標準／偏瘦」）。" +
              "只回 JSON，唔好加註解。",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "請讀取呢張體脂磅截圖，輸出 JSON。" },
              {
                type: "image_url",
                image_url: {
                  url: `data:${data.mimeType};base64,${data.imageBase64}`,
                },
              },
            ],
          },
        ],
        { maxTokens: 800, temperature: 0.1, json: true },
      );
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "NO_API_KEY") return { ok: false as const, error: "辨識功能暫時未能使用" };
      if (msg === "EMPTY_RESPONSE") return { ok: false as const, error: "沒有辨識結果" };
      return { ok: false as const, error: `辨識失敗（${msg}）` };
    }

    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(text);
    } catch {
      return { ok: false as const, error: "回傳格式錯誤" };
    }

    // Sanitise: keep only known numeric keys with finite values; pass through
    // health/bodyType if they came back as strings.
    const fields: Record<string, number | string> = {};
    for (const key of SCAN_FIELD_KEYS) {
      const v = raw[key] ?? raw[camelToSnake(key)] ?? raw[snakeToCamel(key)];
      if (typeof v === "number" && Number.isFinite(v)) {
        fields[key] = round2(v);
      }
    }
    for (const key of ["health", "bodyType"] as const) {
      const v = raw[key];
      if (typeof v === "string" && v.trim()) fields[key] = v.trim();
    }

    if (Object.keys(fields).length === 0) {
      return { ok: false as const, error: "未能在圖中辨識到任何體脂數據" };
    }

    return { ok: true as const, fields, rawText: text };
  });

// ---------------------------------------------------------------------------
// Vision: identify a food item from a photo and write it HK-chip style.
// ---------------------------------------------------------------------------

export const identifyFoodFromImage = createServerFn({ method: "POST" })
  .validator((input: { imageBase64: string; mimeType: string; meal?: string }) => input)
  .handler(async ({ data }) => {
    let text: string;
    try {
      text = await chatCompletion(
        [
          {
            role: "system",
            content:
              "你係香港飲食記錄助手。睇完食物相之後，寫一句繁體中文簡短描述，用逗號分隔主要食物同份量。" +
              "風格要同呢啲例子一致：「白切雞、白飯半碗」「蒸魚、菜心、豆腐「麥皮加豆漿」「雞胸兩件、糙米」" +
              "（留意：繁體、用「碗／件／隻」等港式量詞、唔好加句號、唔好寫卡路里同營養分析、每樣不超過 6 個字）" +
              "淨係寫一句，唔使前言。",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: data.meal ? `呢個係「${data.meal}」餐。` : "請辨識食物。",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${data.mimeType};base64,${data.imageBase64}`,
                },
              },
            ],
          },
        ],
        { maxTokens: 200, temperature: 0.2 },
      );
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "NO_API_KEY") return { ok: false as const, error: "辨識功能暫時未能使用" };
      if (msg === "EMPTY_RESPONSE") return { ok: false as const, error: "沒有辨識結果" };
      return { ok: false as const, error: `辨識失敗（${msg}）` };
    }

    // Strip a leading bullet, quotes, or trailing period the LLM may have added.
    const cleaned = text
      .replace(/^[\s\-•·]+/, "")
      .replace(/^["「『']+|["」』']+$/g, "")
      .replace(/[。.!?！？]+$/, "")
      .trim();
    if (!cleaned) return { ok: false as const, error: "沒有辨識結果" };

    return { ok: true as const, text: cleaned };
  });

// ---------------------------------------------------------------------------
// Vision: extract a 9-minute run distance from a treadmill / fitness-app shot.
// ---------------------------------------------------------------------------

export const extractRunFromImage = createServerFn({ method: "POST" })
  .validator((input: { imageBase64: string; mimeType: string }) => input)
  .handler(async ({ data }) => {
    let text: string;
    try {
      text = await chatCompletion(
        [
          {
            role: "system",
            content:
              "你係香港 9 分鐘耐力跑截圖辨識助手。圖中可能係跑步機顯示、Apple Fitness、Garmin Connect、Strava、Coros、華米或其他運動 App 截圖。" +
              "要讀出『連續跑 9 分鐘』嗰組嘅總距離。輸出 JSON object，key 只有兩個：meters（number, integer, 500–5000 之間）、durationSec（number, integer, 通常 540 即 9 分鐘）。" +
              "如果圖入面有時間唔係 9 分鐘（例如做咗 8 或 10 分鐘），照讀取實際時間同距離。讀唔清楚就唔好寫。淨係回 JSON object，唔好加註解。",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "請讀取呢張跑步截圖，輸出 JSON。" },
              {
                type: "image_url",
                image_url: {
                  url: `data:${data.mimeType};base64,${data.imageBase64}`,
                },
              },
            ],
          },
        ],
        { maxTokens: 200, temperature: 0.1, json: true },
      );
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "NO_API_KEY") return { ok: false as const, error: "辨識功能暫時未能使用" };
      if (msg === "EMPTY_RESPONSE") return { ok: false as const, error: "沒有辨識結果" };
      return { ok: false as const, error: `辨識失敗（${msg}）` };
    }

    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(text);
    } catch {
      return { ok: false as const, error: "回傳格式錯誤" };
    }

    const meters = Number(raw.meters ?? raw.distanceMeters);
    if (!Number.isFinite(meters) || meters < 500 || meters > 5000) {
      return { ok: false as const, error: "未能辨識出合理距離（500–5000m）" };
    }
    const durationSec = Number(raw.durationSec ?? raw.duration_seconds ?? 540);
    return {
      ok: true as const,
      meters: Math.round(meters),
      durationSec: Number.isFinite(durationSec) ? Math.round(durationSec) : 540,
    };
  });

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
