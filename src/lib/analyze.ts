import { createServerFn } from "@tanstack/react-start";

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

export const analyzeBody = createServerFn({ method: "POST" })
  .validator((input: AnalyzeInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "分析功能暫時未能使用" };
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 1100,
        temperature: 0.4,
        messages: [
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
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: `分析失敗（${res.status}）` };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const, error: "沒有分析結果" };
    return { ok: true as const, text };
  });
