/**
 * Browser-side LLM helpers. Used when the app is deployed as a static SPA
 * (e.g. GitHub Pages) and `VITE_LLM_PROXY_URL` is set. The proxy is expected
 * to be a thin bearer-auth shim in front of OpenAI (see
 * `workers/openai-proxy/`).
 *
 * In dev (`npm run dev`) the server functions in `./analyze` are used
 * instead, which can talk to OpenAI directly with the env-supplied key.
 */

const PROXY_URL = import.meta.env.VITE_LLM_PROXY_URL ?? "";

export function hasLlmProxy(): boolean {
  return Boolean(PROXY_URL);
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
};

type ChatOpts = { maxTokens?: number; temperature?: number; json?: boolean; model?: string };

/** Same response shape as the server `chatCompletion`, just via the proxy. */
export async function chatCompletionBrowser(
  messages: ChatMessage[],
  opts: ChatOpts = {},
): Promise<string> {
  if (!PROXY_URL) throw new Error("NO_PROXY");
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Mirror the server-side `chatCompletion` body shape: the proxy/OpenAI
    // expect `response_format: {type:"json_object"}` to opt into JSON mode,
    // not a flat `json: true`.
    body: JSON.stringify({
      messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      model: opts.model,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }
  const body = (await res.json()) as { text?: string; choices?: { message?: { content?: string } }[] };
  const text = body.text ?? body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("EMPTY_RESPONSE");
  return text;
}

// ---------------------------------------------------------------------------
// Re-implementations of the three server functions, but routed through the
// proxy. They return the same shape as their server-side counterparts so the
// UI can call them interchangeably.
// ---------------------------------------------------------------------------

export type BrowserAnalyzeInput = {
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

export const analyzeBodyBrowser = async (data: BrowserAnalyzeInput) => {
  try {
    const text = await chatCompletionBrowser(
      [
        {
          role: "system",
          content:
            "你是香港私人教練兼營養顧問。用繁體中文、口語簡潔。服務一名 168cm 男性，業餘自學阿里／洛馬琴科外圍拳擊，每日康文署 30 分鐘（移動 + 引體／胸／二頭／腹塑形），另每週一次 9 分鐘耐力跑作有氧監測（香港體適能協議）。體脂磅家用數據有誤差，唔好當醫療診斷。結構固定五段：1) 而家狀態 2) 同拳擊 55kg 目標的關係 3) 飲食評價同明日三個具體食法 4) 9分鐘跑體能（無數據就叫佢本週任一日去測；有數據就評外圍底盤，唔好叫佢每日加跑） 5) 訓練調整。禁止恐嚇、禁止極端節食、禁止藥物。肌肉量要守。每週有氧最多一次 9 分鐘。",
        },
        { role: "user", content: JSON.stringify(data) },
      ],
      { maxTokens: 1100, temperature: 0.4 },
    );
    // No git side-effect in browser mode — the SPA has no fs access.
    return { ok: true as const, text, sideEffect: undefined };
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "NO_PROXY") return { ok: false as const, error: "未設定 VITE_LLM_PROXY_URL，請部署 Cloudflare Worker（見 README）" };
    if (msg === "EMPTY_RESPONSE") return { ok: false as const, error: "沒有分析結果" };
    return { ok: false as const, error: `分析失敗（${msg}）` };
  }
};

const SCAN_FIELD_KEYS = [
  "kg", "bmi", "bodyFatPct", "fatKg", "musclePct", "muscleKg",
  "waterPct", "waterKg", "bonePct", "boneKg", "subFatPct", "subFatKg",
  "bmr", "visceral", "visceralArea", "proteinPct", "proteinKg",
  "obesity", "bodyAge", "score", "leanKg", "controlKg",
  "fatControlKg", "muscleControlKg",
] as const;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}
function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export const extractBodyScanFromImageBrowser = async (data: {
  imageBase64: string;
  mimeType: string;
}) => {
  try {
    const text = await chatCompletionBrowser(
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
            { type: "image_url", image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` } },
          ],
        },
      ],
      { maxTokens: 800, temperature: 0.1, json: true },
    );

    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(text);
    } catch {
      return { ok: false as const, error: "回傳格式錯誤" };
    }

    const fields: Record<string, number | string> = {};
    for (const key of SCAN_FIELD_KEYS) {
      const v = raw[key] ?? raw[camelToSnake(key)] ?? raw[snakeToCamel(key)];
      if (typeof v === "number" && Number.isFinite(v)) fields[key] = round2(v);
    }
    for (const key of ["health", "bodyType"] as const) {
      const v = raw[key];
      if (typeof v === "string" && v.trim()) fields[key] = v.trim();
    }
    if (Object.keys(fields).length === 0) {
      return { ok: false as const, error: "未能在圖中辨識到任何體脂數據" };
    }
    return { ok: true as const, fields };
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "NO_PROXY") return { ok: false as const, error: "未設定 VITE_LLM_PROXY_URL" };
    if (msg === "EMPTY_RESPONSE") return { ok: false as const, error: "沒有辨識結果" };
    return { ok: false as const, error: `辨識失敗（${msg}）` };
  }
};

export const identifyFoodFromImageBrowser = async (data: {
  imageBase64: string;
  mimeType: string;
  meal?: string;
}) => {
  try {
    const text = await chatCompletionBrowser(
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
            { type: "text", text: data.meal ? `呢個係「${data.meal}」餐。` : "請辨識食物。" },
            { type: "image_url", image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` } },
          ],
        },
      ],
      { maxTokens: 200, temperature: 0.2 },
    );
    const cleaned = text
      .replace(/^[\s\-•·]+/, "")
      .replace(/^["「『']+|["」』']+$/g, "")
      .replace(/[。.!?！？]+$/, "")
      .trim();
    if (!cleaned) return { ok: false as const, error: "沒有辨識結果" };
    return { ok: true as const, text: cleaned };
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "NO_PROXY") return { ok: false as const, error: "未設定 VITE_LLM_PROXY_URL" };
    if (msg === "EMPTY_RESPONSE") return { ok: false as const, error: "沒有辨識結果" };
    return { ok: false as const, error: `辨識失敗（${msg}）` };
  }
};

export const extractRunFromImageBrowser = async (data: {
  imageBase64: string;
  mimeType: string;
}) => {
  try {
    const text = await chatCompletionBrowser(
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
            { type: "image_url", image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` } },
          ],
        },
      ],
      { maxTokens: 200, temperature: 0.1, json: true },
    );

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
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "NO_PROXY") return { ok: false as const, error: "未設定 VITE_LLM_PROXY_URL" };
    if (msg === "EMPTY_RESPONSE") return { ok: false as const, error: "沒有辨識結果" };
    return { ok: false as const, error: `辨識失敗（${msg}）` };
  }
};
