#!/usr/bin/env node
// Tiny mock LLM endpoint for testing the analyze + report + vision flow.
// Detects whether the user message contains an image_url and dispatches to a
// different canned response so end-to-end smoke tests of the upload UI are
// realistic without burning real API credits.
//
// Run: node scripts/mock-llm.mjs
// Then: OPENAI_BASE_URL=http://localhost:9999/v1 npm run dev
import { createServer } from "node:http";

const PORT = Number.parseInt(process.env.PORT ?? "9999", 10);
const TAG = process.env.MOCK_TAG ?? "mock";

const MOCK_BODY_SCAN = {
  kg: 57.67,
  bmi: 20.4,
  bodyFatPct: 12.8,
  fatKg: 7.36,
  musclePct: 47.3,
  muscleKg: 27.26,
  waterPct: 64.0,
  waterKg: 36.91,
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
  bodyAge: 28,
  score: 91,
  leanKg: 50.31,
  controlKg: 4.42,
  fatControlKg: 1.64,
  muscleControlKg: 0,
  health: "優秀",
  bodyType: "標準",
};

const MOCK_RUN = {
  meters: 1980,
  durationSec: 540,
};

const MOCK_FOOD = {
  早: "麥皮加豆漿、雞蛋一隻",
  午: "白切雞、白飯半碗、灼菜心",
  晚: "蒸魚、糙米、豆腐",
  加: "香蕉一根、原味乳酪",
};

function pickContent(payload) {
  const user = (payload.messages ?? []).find((m) => m.role === "user");
  if (!user) return { kind: "text" };
  if (Array.isArray(user.content)) {
    const hasImage = user.content.some(
      (part) => part && part.type === "image_url" && part.image_url?.url,
    );
    if (hasImage) {
      const textPart = user.content.find((p) => p?.type === "text");
      const text = textPart?.text ?? "";
      const mealMatch = text.match(/「(.+?)」/);
      return { kind: "image", meal: mealMatch?.[1], text };
    }
    const textPart = user.content.find((p) => p?.type === "text");
    return { kind: "text", text: textPart?.text ?? "" };
  }
  return { kind: "text", text: user.content ?? "" };
}

function buildReply(payload) {
  const intent = pickContent(payload);
  const jsonMode = payload.response_format?.type === "json_object";
  const userText = intent.kind === "image" ? intent.text ?? "" : "";

  if (intent.kind === "image" && jsonMode) {
    if (/跑步|run|跑距|耐力/i.test(userText)) {
      return JSON.stringify(MOCK_RUN);
    }
    return JSON.stringify(MOCK_BODY_SCAN);
  }
  if (intent.kind === "image") {
    const meal = MOCK_FOOD[intent.meal] ?? MOCK_FOOD.午;
    return meal;
  }
  if (jsonMode) return JSON.stringify({ reflection: TAG });

  // Plain text analyze: echo a fake report with the right structure.
  return `## 測試報告 (${TAG})\n\n模型: ${payload.model ?? "gpt-4o-mini"}\n時間: ${new Date().toISOString()}\n\n1) 而家狀態：${TAG}\n2) 同拳擊 55kg 目標的關係：${TAG}\n3) 飲食評價同明日三個具體食法：${TAG}\n4) 9分鐘跑體能：${TAG}\n5) 訓練調整：${TAG}`;
}

const server = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/v1/chat/completions") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      let payload = {};
      try {
        payload = body ? JSON.parse(body) : {};
      } catch {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("bad json");
        return;
      }
      const intent = pickContent(payload);
      const user = (payload.messages ?? []).find((m) => m.role === "user");
      const parts = Array.isArray(user?.content) ? user.content.map(p => p?.type ?? "?") : ["text"];
      const jsonMode = payload.response_format?.type === "json_object";
      let kind = intent.kind;
      if (intent.kind === "image" && jsonMode) {
        kind = /跑步|run|跑距|耐力/i.test(intent.text ?? "") ? "image-run" : "image-body";
      }
      console.log(
        `[mock] model=${payload.model ?? "?"} kind=${kind} parts=[${parts.join(",")}] meal=${intent.meal ?? "-"} bytes=${body.length}`,
      );
      const content = buildReply(payload);
      const reply = {
        id: "mock-1",
        object: "chat.completion",
        model: payload.model ?? "gpt-4o-mini",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 100, completion_tokens: 80, total_tokens: 180 },
      };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(reply));
    });
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("not found");
});

server.listen(PORT, () => {
  console.log(`[mock-llm] listening on http://localhost:${PORT}/v1/chat/completions`);
});
