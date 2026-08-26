import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  HK_FOOD_CHIPS,
  SAMPLE_SCAN,
  SCAN_FIELDS,
  type BodyScan,
  type FoodItem,
} from "@/lib/body";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FOOD_NOTES, PROFILE_DEFAULT } from "@/lib/program";
import {
  KM_CHIPS,
  gradeCue,
  gradeRun,
  runKmh,
  runPace,
  runVo2,
  weekStartKey,
} from "@/lib/run";
import { useAppStore } from "@/lib/store";
import { formatKg, hktDateKey } from "@/lib/utils";
import type { ReportSideEffect } from "@/lib/analyze";
import { compressImageFile } from "@/lib/image";

export const Route = createFileRoute("/weight")({ component: WeightPage });

const MEALS: FoodItem["meal"][] = ["早", "午", "晚", "加"];
const NUM_KEYS = SCAN_FIELDS.map((f) => f.key);

function WeightPage() {
  const profile = useAppStore((s) => s.profile);
  const scans = useAppStore((s) => s.scans);
  const foods = useAppStore((s) => s.foods);
  const sessions = useAppStore((s) => s.sessions);
  const runs = useAppStore((s) => s.runs);
  const reports = useAppStore((s) => s.reports);
  const logScan = useAppStore((s) => s.logScan);
  const logRun = useAppStore((s) => s.logRun);
  const addFood = useAppStore((s) => s.addFood);
  const removeFood = useAppStore((s) => s.removeFood);
  const saveReport = useAppStore((s) => s.saveReport);

  const today = hktDateKey();
  const latest = scans.at(-1);
  const prev = scans.length > 1 ? scans.at(-2) : undefined;

  const [form, setForm] = useState<BodyScan>(
    latest ? { ...latest, date: today } : { ...SAMPLE_SCAN, date: today },
  );
  const [foodText, setFoodText] = useState("");
  const [meal, setMeal] = useState<FoodItem["meal"]>("午");
  const [runKm, setRunKm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastFx, setLastFx] = useState<ReportSideEffect | null>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanErr, setScanErr] = useState<string | null>(null);
  const [foodBusy, setFoodBusy] = useState(false);
  const [foodErr, setFoodErr] = useState<string | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [runBusy, setRunBusy] = useState(false);
  const [runErr, setRunErr] = useState<string | null>(null);
  const [runPreview, setRunPreview] = useState<string | null>(null);
  const scanInputRef = useRef<HTMLInputElement | null>(null);
  const foodInputRef = useRef<HTMLInputElement | null>(null);
  const runInputRef = useRef<HTMLInputElement | null>(null);

  const todayFoods = foods.filter((f) => f.date === today);
  const chart = useMemo(
    () =>
      scans.slice(-28).map((s) => ({
        date: s.date.slice(5),
        kg: s.kg,
        fat: s.bodyFatPct,
      })),
    [scans],
  );

  // When `VITE_LLM_PROXY_URL` is set (or in any non-dev build), the server
  // functions in `@/lib/analyze` aren't reachable. The browser-side mirror
  // in `@/lib/analyze-browser` POSTs directly to a Cloudflare Worker
  // proxy that holds the MiniMax API key. Vite tree-shakes the unused
  // branch when `VITE_LLM_PROXY_URL` is unset, so a plain `npm run dev`
  // keeps using the server functions with no extra config.
  const useBrowserLlm = Boolean(import.meta.env.VITE_LLM_PROXY_URL);
  const isProd = import.meta.env.PROD;

  async function runReport() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    const last = scans.at(-1);
    if (!last) {
      setErr("先記入體脂磅。");
      setBusy(false);
      return;
    }
    if (isProd && !useBrowserLlm) {
      setErr("靜態部署冇 LLM 後台。請設定 VITE_LLM_PROXY_URL（Cloudflare Worker）後重新 build，或用本機 npm run dev。");
      setBusy(false);
      return;
    }
    let result;
    if (useBrowserLlm) {
      const { analyzeBodyBrowser } = await import("@/lib/analyze-browser");
      result = await analyzeBodyBrowser({
        heightCm: profile.heightCm,
        age: profile.age,
        boxingCeilingKg: PROFILE_DEFAULT.ceilingKg,
        boxingTargetKg: profile.targetKg,
        latest: last as unknown as Record<string, string | number>,
        previous: prev ? (prev as unknown as Record<string, string | number>) : null,
        foods: foods.slice(-40).map((f) => ({ date: f.date, meal: f.meal, text: f.text })),
        sessions: sessions.slice(-14).map((s) => ({ date: s.date, name: s.name })),
        runs: runs.slice(-8).map((r) => ({
          date: r.date,
          meters: r.meters,
          vo2: runVo2(r.meters),
          kmh: runKmh(r.meters),
          grade: gradeRun(r.meters),
        })),
      }).catch(() => ({
        ok: false as const,
        error: "Proxy 連線失敗，請檢查 VITE_LLM_PROXY_URL 同 Cloudflare Worker 部署狀態。",
      }));
    } else {
      const { analyzeBody } = await import("@/lib/analyze");
      result = await analyzeBody({
        data: {
          heightCm: profile.heightCm,
          age: profile.age,
          boxingCeilingKg: PROFILE_DEFAULT.ceilingKg,
          boxingTargetKg: profile.targetKg,
          latest: last as unknown as Record<string, string | number>,
          previous: prev
            ? (prev as unknown as Record<string, string | number>)
            : null,
          foods: foods.slice(-40).map((f) => ({
            date: f.date,
            meal: f.meal,
            text: f.text,
          })),
          sessions: sessions.slice(-14).map((s) => ({
            date: s.date,
            name: s.name,
          })),
          runs: runs.slice(-8).map((r) => ({
            date: r.date,
            meters: r.meters,
            vo2: runVo2(r.meters),
            kmh: runKmh(r.meters),
            grade: gradeRun(r.meters),
          })),
        },
      }).catch(() => ({
        ok: false as const,
        error: "靜態站冇伺服器，分析報告只喺本機 / 預覽可用。體能評級已即時顯示。",
      }));
    }
    setBusy(false);
    if (!result.ok) {
      setErr(result.error);
      return;
    }
    saveReport({ date: today, text: result.text, at: Date.now() });
    setLastFx(result.sideEffect ?? null);
  }

  async function onScanImage(file: File) {
    if (scanBusy) return;
    setScanBusy(true);
    setScanErr(null);
    try {
      const img = await compressImageFile(file);
      setScanPreview(`data:${img.mimeType};base64,${img.base64}`);
      let result;
      if (useBrowserLlm) {
        const { extractBodyScanFromImageBrowser } = await import("@/lib/analyze-browser");
        result = await extractBodyScanFromImageBrowser({
          imageBase64: img.base64,
          mimeType: img.mimeType,
        }).catch(() => ({
          ok: false as const,
          error: "Proxy 連線失敗，請檢查 VITE_LLM_PROXY_URL 同 Cloudflare Worker 部署狀態。",
        }));
      } else {
        const { extractBodyScanFromImage } = await import("@/lib/analyze");
        result = await extractBodyScanFromImage({
          data: { imageBase64: img.base64, mimeType: img.mimeType },
        }).catch(() => ({
          ok: false as const,
          error: "上傳失敗，請檢查網絡或稍後再試。",
        }));
      }
      if (!result.ok) {
        setScanErr(result.error);
        return;
      }
      // Merge extracted fields into the form. Existing values win if the LLM
      // didn't return something for a key.
      setForm((f) => {
        const next = { ...f };
        for (const [k, v] of Object.entries(result.fields)) {
          if (typeof v === "number" || typeof v === "string") {
            (next as Record<string, unknown>)[k] = v;
          }
        }
        return next;
      });
    } catch (err) {
      setScanErr((err as Error).message ?? "上傳失敗");
    } finally {
      setScanBusy(false);
    }
  }

  async function onFoodImage(file: File) {
    if (foodBusy) return;
    setFoodBusy(true);
    setFoodErr(null);
    try {
      const img = await compressImageFile(file);
      let result;
      if (useBrowserLlm) {
        const { identifyFoodFromImageBrowser } = await import("@/lib/analyze-browser");
        result = await identifyFoodFromImageBrowser({
          imageBase64: img.base64,
          mimeType: img.mimeType,
          meal,
        }).catch(() => ({
          ok: false as const,
          error: "Proxy 連線失敗，請檢查 VITE_LLM_PROXY_URL 同 Cloudflare Worker 部署狀態。",
        }));
      } else {
        const { identifyFoodFromImage } = await import("@/lib/analyze");
        result = await identifyFoodFromImage({
          data: { imageBase64: img.base64, mimeType: img.mimeType, meal },
        }).catch(() => ({
          ok: false as const,
          error: "辨識失敗，請檢查網絡或稍後再試。",
        }));
      }
      if (!result.ok) {
        setFoodErr(result.error);
        return;
      }
      setFoodText(result.text);
    } catch (err) {
      setFoodErr((err as Error).message ?? "上傳失敗");
    } finally {
      setFoodBusy(false);
    }
  }

  async function onRunImage(file: File) {
    if (runBusy) return;
    setRunBusy(true);
    setRunErr(null);
    try {
      const img = await compressImageFile(file);
      setRunPreview(`data:${img.mimeType};base64,${img.base64}`);
      let result;
      if (useBrowserLlm) {
        const { extractRunFromImageBrowser } = await import("@/lib/analyze-browser");
        result = await extractRunFromImageBrowser({
          imageBase64: img.base64,
          mimeType: img.mimeType,
        }).catch(() => ({
          ok: false as const,
          error: "Proxy 連線失敗，請檢查 VITE_LLM_PROXY_URL 同 Cloudflare Worker 部署狀態。",
        }));
      } else {
        const { extractRunFromImage } = await import("@/lib/analyze");
        result = await extractRunFromImage({
          data: { imageBase64: img.base64, mimeType: img.mimeType },
        }).catch(() => ({
          ok: false as const,
          error: "辨識失敗，請檢查網絡或稍後再試。",
        }));
      }
      if (!result.ok) {
        setRunErr(result.error);
        return;
      }
      // meters → km with 2 decimals, matching the existing input style
      setRunKm((result.meters / 1000).toFixed(2));
    } catch (err) {
      setRunErr((err as Error).message ?? "上傳失敗");
    } finally {
      setRunBusy(false);
    }
  }

  return (
    <Shell>
      <h1 className="font-display text-3xl">體重 · 飲食</h1>
      <p className="mt-2 text-sm text-muted">
        {profile.heightCm} cm · 拳擊上限 {PROFILE_DEFAULT.ceilingKg} kg · 目標{" "}
        {formatKg(profile.targetKg)} kg
      </p>

      {latest ? (
        <Card className="mt-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="體重" value={formatKg(latest.kg)} unit="kg" />
            <Stat label="體脂" value={latest.bodyFatPct.toFixed(1)} unit="%" />
            <Stat label="肌肉" value={formatKg(latest.muscleKg)} unit="kg" />
            <Stat label="BMR" value={String(Math.round(latest.bmr))} />
          </div>
          <p className="mt-3 text-sm text-muted">
            BMI {latest.bmi} · 內臟脂肪 {latest.visceral} · 得分 {latest.score} ·{" "}
            {latest.bodyType}
            {latest.kg > PROFILE_DEFAULT.ceilingKg ? (
              <span className="mt-1 block text-warn">
                高過拳擊 55 kg 上限{" "}
                {formatKg(latest.kg - PROFILE_DEFAULT.ceilingKg)} kg。體脂{" "}
                {latest.bodyFatPct}% 已偏低，減慢、保肌肉。
              </span>
            ) : null}
          </p>
        </Card>
      ) : null}

      {chart.length >= 2 ? (
        <Card className="mt-4 h-52 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <CartesianGrid stroke="#2c2d26" vertical={false} />
              <XAxis dataKey="date" stroke="#6f6d64" fontSize={11} />
              <YAxis
                yAxisId="kg"
                domain={["dataMin - 0.8", "dataMax + 0.8"]}
                stroke="#6f6d64"
                fontSize={11}
                width={36}
              />
              <YAxis
                yAxisId="fat"
                orientation="right"
                domain={["dataMin - 1", "dataMax + 1"]}
                stroke="#8a937c"
                fontSize={11}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1b17",
                  border: "1px solid #2c2d26",
                  borderRadius: 8,
                  color: "#e8e4d8",
                }}
              />
              <Line
                yAxisId="kg"
                type="monotone"
                dataKey="kg"
                stroke="#c5c2b6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="fat"
                type="monotone"
                dataKey="fat"
                stroke="#8a937c"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      ) : null}

      <EnduranceCard
        runs={runs}
        runKm={runKm}
        setRunKm={setRunKm}
        onRecognize={onRunImage}
        runBusy={runBusy}
        runErr={runErr}
        runPreview={runPreview}
        runInputRef={runInputRef}
        onLog={(meters) => {
          logRun({ date: today, meters });
          setRunKm("");
        }}
      />

      <Card className="mt-4">
        <h2 className="font-display text-xl">記入體脂磅</h2>
        <p className="mt-1 text-sm text-muted">
          對住磅上數字填，或者直接 upload 截圖叫 MiniMax 自動抽。已預載你張圖（57.67 kg）。改完撳保存。
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            ref={scanInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onScanImage(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={scanBusy}
            onClick={() => scanInputRef.current?.click()}
          >
            {scanBusy ? "辨識中…" : "📷 上傳截圖自動填"}
          </Button>
          {scanPreview ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img
              src={scanPreview}
              alt="body scan preview"
              className="h-12 w-12 rounded-md object-cover ring-1 ring-border"
            />
          ) : null}
        </div>
        {scanErr ? <p className="mt-2 text-sm text-warn">{scanErr}</p> : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {NUM_KEYS.map((key) => (
            <label key={key} className="text-xs text-subtle">
              {SCAN_FIELDS.find((f) => f.key === key)?.label}
              <input
                inputMode="decimal"
                className="mt-1 h-10 w-full rounded-md border border-border bg-surface-2 px-2 text-sm text-fg tabular-nums outline-none focus:ring-2 focus:ring-ring"
                value={String(form[key] ?? "")}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setForm((f) => ({
                    ...f,
                    [key]: Number.isFinite(n) ? n : f[key],
                  }));
                }}
              />
            </label>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs text-subtle">
            健康等級
            <input
              className="mt-1 h-10 w-full rounded-md border border-border bg-surface-2 px-2 text-sm text-fg outline-none focus:ring-2 focus:ring-ring"
              value={form.health}
              onChange={(e) => setForm((f) => ({ ...f, health: e.target.value }))}
            />
          </label>
          <label className="text-xs text-subtle">
            身體類型
            <input
              className="mt-1 h-10 w-full rounded-md border border-border bg-surface-2 px-2 text-sm text-fg outline-none focus:ring-2 focus:ring-ring"
              value={form.bodyType}
              onChange={(e) =>
                setForm((f) => ({ ...f, bodyType: e.target.value }))
              }
            />
          </label>
        </div>
        <Button
          className="mt-4 w-full"
          onClick={() => logScan({ ...form, date: today })}
        >
          保存今日磅數
        </Button>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-xl">今日已吃</h2>
        <div className="mt-3 flex gap-1">
          {MEALS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMeal(m)}
              className={`h-10 min-w-11 rounded-md px-3 text-sm ${
                meal === m
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-2 text-muted"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={foodText}
            onChange={(e) => setFoodText(e.target.value)}
            placeholder="例如：白切雞、白飯半碗"
            className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 text-fg outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            ref={foodInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFoodImage(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={foodBusy}
            onClick={() => foodInputRef.current?.click()}
            aria-label="拍食物自動辨識"
            title="拍食物自動辨識"
          >
            {foodBusy ? "…" : "📷"}
          </Button>
          <Button
            onClick={() => {
              const t = foodText.trim();
              if (!t) return;
              addFood({
                id: `${Date.now()}`,
                date: today,
                meal,
                text: t,
              });
              setFoodText("");
            }}
          >
            加入
          </Button>
        </div>
        {foodErr ? <p className="mt-2 text-sm text-warn">{foodErr}</p> : null}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {HK_FOOD_CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted"
              onClick={() =>
                addFood({
                  id: `${Date.now()}-${c}`,
                  date: today,
                  meal,
                  text: c,
                })
              }
            >
              {c}
            </button>
          ))}
        </div>
        <ul className="mt-4 space-y-2">
          {todayFoods.length === 0 ? (
            <li className="text-sm text-subtle">未記。食完即加，報告先準。</li>
          ) : (
            todayFoods.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span>
                  <span className="text-subtle">{f.meal}</span>
                  <span className="ml-2 text-fg">{f.text}</span>
                </span>
                <button
                  type="button"
                  className="text-xs text-muted"
                  onClick={() => removeFood(f.id)}
                >
                  刪
                </button>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-xl">分析報告</h2>
        <p className="mt-1 text-sm text-muted">
          用你嘅磅數、飲食、9 分鐘跑同訓練紀錄，出一份當日建議。按掣先會呼叫。
        </p>
        <Button
          className="mt-3 w-full"
          disabled={busy}
          onClick={() => void runReport()}
        >
          {busy ? "分析中…" : "產生今日報告"}
        </Button>
        {err ? <p className="mt-2 text-sm text-warn">{err}</p> : null}
        {reports[0] ? (
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-fg">
            {reports[0].text}
          </div>
        ) : null}
        {lastFx ? (
          <p className="mt-3 text-xs text-subtle">
            {lastFx.file ? (
              <>
                已寫入 <code className="text-fg">{lastFx.file}</code>
                {lastFx.committed && lastFx.commitSha ? (
                  <>
                    {" "}· commit <code className="text-fg">{lastFx.commitSha.slice(0, 7)}</code>
                  </>
                ) : null}
                {lastFx.pushed ? " · pushed ✓" : null}
                {!lastFx.pushed && lastFx.pushError ? ` · push 失敗：${lastFx.pushError}` : null}
                {lastFx.skipped ? ` · ${lastFx.skipped}` : null}
              </>
            ) : (
              <>{lastFx.skipped ?? "檔案未寫入"}</>
            )}
          </p>
        ) : null}
      </Card>

      <div className="mt-4 space-y-3">
        {FOOD_NOTES.map((n) => (
          <Card key={n.title}>
            <h3 className="text-sm font-medium">{n.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{n.body}</p>
          </Card>
        ))}
      </div>
    </Shell>
  );
}

function EnduranceCard({
  runs,
  runKm,
  setRunKm,
  onLog,
  onRecognize,
  runBusy,
  runErr,
  runPreview,
  runInputRef,
}: {
  runs: { date: string; meters: number }[];
  runKm: string;
  setRunKm: (v: string) => void;
  onLog: (meters: number) => void;
  onRecognize: (file: File) => void;
  runBusy: boolean;
  runErr: string | null;
  runPreview: string | null;
  runInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const latest = runs.at(-1);
  const prev = runs.length > 1 ? runs.at(-2) : undefined;
  const week = weekStartKey(hktDateKey());
  const weekDone = runs.some((r) => weekStartKey(r.date) === week);
  const meters = Math.round(Number(runKm) * 1000);
  const ok = Number.isFinite(meters) && meters >= 800 && meters <= 4000;
  const chart = runs.slice(-12).map((r) => ({
    date: r.date.slice(5),
    km: Math.round((r.meters / 1000) * 100) / 100,
  }));

  return (
    <Card className="mt-4">
      <h2 className="font-display text-xl">9 分鐘體能</h2>
      <p className="mt-1 text-sm text-muted">
        每週任一日一次。VO₂ 用 ACSM 平地跑公式，作外圍底盤監測，唔係體檢。
      </p>
      {latest ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="最近"
            value={(latest.meters / 1000).toFixed(2)}
            unit="km"
          />
          <Stat label="配速" value={runPace(latest.meters)} />
          <Stat label="VO₂" value={String(runVo2(latest.meters))} />
          <Stat label="評級" value={gradeRun(latest.meters)} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-subtle">未測。計時或喺下面補記距離。</p>
      )}
      {latest ? (
        <p className="mt-2 text-sm text-muted">{gradeCue(gradeRun(latest.meters))}</p>
      ) : null}
      {latest && prev ? (
        <p className="mt-1 text-sm text-muted">
          同上週差 {((latest.meters - prev.meters) / 1000).toFixed(2)} km
        </p>
      ) : null}
      {chart.length >= 2 ? (
        <div className="mt-3 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <CartesianGrid stroke="#2c2d26" vertical={false} />
              <XAxis dataKey="date" stroke="#6f6d64" fontSize={11} />
              <YAxis
                domain={["dataMin - 0.15", "dataMax + 0.15"]}
                stroke="#6f6d64"
                fontSize={11}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1b17",
                  border: "1px solid #2c2d26",
                  borderRadius: 8,
                  color: "#e8e4d8",
                }}
              />
              <Line
                type="monotone"
                dataKey="km"
                stroke="#8a937c"
                strokeWidth={2}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
      <p className="mt-3 text-xs text-subtle">
        {weekDone ? "本週已有紀錄，再記入會覆蓋。" : "補記本週距離（km）"}
      </p>
      <div className="mt-2 flex gap-2">
        <input
          inputMode="decimal"
          value={runKm}
          onChange={(e) => setRunKm(e.target.value)}
          placeholder="1.85"
          className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 text-fg tabular-nums outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          ref={runInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onRecognize(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={runBusy}
          onClick={() => runInputRef.current?.click()}
          aria-label="上傳跑步截圖自動填距離"
          title="上傳跑步截圖自動填距離"
        >
          {runBusy ? "…" : "📷"}
        </Button>
        <Button disabled={!ok} onClick={() => onLog(meters)}>
          記入
        </Button>
      </div>
      {runErr || runPreview ? (
        <div className="mt-2 flex items-center gap-2">
          {runPreview ? (
            <img
              src={runPreview}
              alt="run screenshot preview"
              className="h-10 w-10 rounded-md object-cover ring-1 ring-border"
            />
          ) : null}
          {runErr ? <p className="text-sm text-warn">{runErr}</p> : null}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {KM_CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            className="min-h-11 rounded-full border border-border bg-surface-2 px-3 text-sm text-muted"
            onClick={() => setRunKm(c)}
          >
            {c}
          </button>
        ))}
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-xl tabular-nums">
        {value}
        {unit ? <span className="ml-0.5 text-sm text-muted">{unit}</span> : null}
      </p>
    </div>
  );
}
