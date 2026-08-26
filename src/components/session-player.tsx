import { useEffect, useMemo, useState } from "react";
import { Pause, Play, SkipForward, Square } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { beep } from "@/lib/audio";
import type { DayProgram } from "@/lib/program";
import { totalSeconds } from "@/lib/program";
import {
  KM_CHIPS,
  gradeCue,
  gradeRun,
  runKmh,
  runPace,
  runVo2,
} from "@/lib/run";
import { useAppStore } from "@/lib/store";
import { cn, formatClock, hktDateKey } from "@/lib/utils";

export function SessionPlayer({ day }: { day: DayProgram }) {
  const navigate = useNavigate();
  const logSession = useAppStore((s) => s.logSession);
  const logRun = useAppStore((s) => s.logRun);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(day.blocks[0]!.seconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const block = day.blocks[index];
  const total = useMemo(() => totalSeconds(day), [day]);
  const elapsed = useMemo(() => {
    let t = 0;
    for (let i = 0; i < index; i++) t += day.blocks[i]!.seconds;
    return t + ((block?.seconds ?? 0) - remaining);
  }, [day, index, remaining, block]);

  useEffect(() => {
    setIndex(0);
    setRemaining(day.blocks[0]!.seconds);
    setRunning(false);
    setDone(false);
  }, [day]);

  useEffect(() => {
    if (!running || done) return;
    const id = window.setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, done]);

  useEffect(() => {
    if (!running || done) return;
    if (remaining > 0) return;
    const next = index + 1;
    if (next >= day.blocks.length) {
      setRunning(false);
      setDone(true);
      beep("end");
      logSession({
        date: hktDateKey(),
        dayId: day.id,
        name: day.name,
        seconds: total,
      });
      return;
    }
    const nxt = day.blocks[next]!;
    beep(nxt.kind === "rest" ? "rest" : "start");
    setIndex(next);
    setRemaining(nxt.seconds);
  }, [remaining, running, done, index, day, logSession, total]);

  if (!block) return null;

  const pct = Math.min(100, Math.round((elapsed / total) * 100));

  function finishEarly() {
    setDone(true);
    setRunning(false);
    beep("end");
    logSession({
      date: hktDateKey(),
      dayId: day.id,
      name: day.name,
      seconds: elapsed,
    });
  }

  if (done && day.id === 9) {
    return (
      <RunFinish
        onSave={(meters) => {
          logRun({ date: hktDateKey(), meters });
          navigate({ to: "/weight" });
        }}
        onSkip={() => navigate({ to: "/" })}
      />
    );
  }

  if (done) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">完成</p>
        <h1 className="font-display text-4xl text-fg">{day.name}</h1>
        <p className="max-w-sm text-pretty text-muted">
          已記錄今日訓練。體重視窗期可喺「體重」頁記晨秤。
        </p>
        <div className="flex gap-2">
          <Button onClick={() => navigate({ to: "/" })}>返回今日</Button>
          <Button variant="secondary" onClick={() => navigate({ to: "/week" })}>
            睇週期
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-muted hover:text-fg">
          離開
        </Link>
        <span className="text-xs text-muted tabular-nums">{pct}%</span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {kindLabel(block.kind)} · {block.gear}
        </p>
        <h1 className="mt-2 font-display text-3xl text-balance text-fg">
          {block.label}
        </h1>
        <p
          className={cn(
            "mt-6 font-display tabular-nums leading-none text-fg",
            block.kind === "rest" ? "text-6xl text-muted" : "text-7xl",
          )}
        >
          {formatClock(remaining)}
        </p>
      </div>

      <p className="text-pretty text-sm leading-relaxed text-muted">
        {block.cue}
      </p>

      <div className="flex justify-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          aria-label={running ? "暫停" : "開始"}
          onClick={() => {
            if (!running) beep("start");
            setRunning((v) => !v);
          }}
        >
          {running ? <Pause className="size-5" /> : <Play className="size-5" />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label="下一段"
          onClick={() => {
            const next = index + 1;
            if (next >= day.blocks.length) {
              finishEarly();
              return;
            }
            setIndex(next);
            setRemaining(day.blocks[next]!.seconds);
            beep(day.blocks[next]!.kind === "rest" ? "rest" : "start");
          }}
        >
          <SkipForward className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="結束"
          onClick={() => {
            setRunning(false);
            navigate({ to: "/" });
          }}
        >
          <Square className="size-5" />
        </Button>
      </div>

      {day.blocks[index + 1] ? (
        <p className="text-center text-xs text-subtle">
          下一段：{day.blocks[index + 1]!.label} ·{" "}
          {formatClock(day.blocks[index + 1]!.seconds)}
        </p>
      ) : null}
    </div>
  );
}

function RunFinish({
  onSave,
  onSkip,
}: {
  onSave: (meters: number) => void;
  onSkip: () => void;
}) {
  const [km, setKm] = useState("");
  const meters = Math.round(Number(km) * 1000);
  const ok = Number.isFinite(meters) && meters >= 800 && meters <= 4000;

  return (
    <div className="flex min-h-[70vh] flex-col justify-center gap-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">9 分鐘完成</p>
      <h1 className="font-display text-4xl text-fg">記入距離</h1>
      <p className="text-sm text-muted">跑步機總里程或 GPS。本週只計一次。</p>
      <input
        inputMode="decimal"
        value={km}
        onChange={(e) => setKm(e.target.value)}
        placeholder="1.85"
        className="h-12 w-full rounded-lg border border-border bg-surface-2 px-3 text-lg text-fg tabular-nums outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex flex-wrap gap-1.5">
        {KM_CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            className="min-h-11 rounded-full border border-border bg-surface-2 px-3 text-sm text-muted"
            onClick={() => setKm(c)}
          >
            {c} km
          </button>
        ))}
      </div>
      {ok ? (
        <p className="text-sm text-muted">
          {meters} m · {runKmh(meters)} km/h · {runPace(meters)} · VO₂{" "}
          {runVo2(meters)} · {gradeRun(meters)}
          <span className="mt-1 block">{gradeCue(gradeRun(meters))}</span>
        </p>
      ) : null}
      <Button className="w-full" disabled={!ok} onClick={() => onSave(meters)}>
        記入體能
      </Button>
      <button type="button" className="text-sm text-muted" onClick={onSkip}>
        稍後補記
      </button>
    </div>
  );
}

function kindLabel(k: string) {
  if (k === "warmup") return "熱身";
  if (k === "work") return "主項";
  if (k === "rest") return "休息";
  if (k === "skill") return "技術";
  return "冷卻";
}
