import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, MapPin, StickyNote, X } from "lucide-react";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CLOSED_ALT,
  dayByWeekday,
  LCSD_NOTES,
  PROFILE_DEFAULT,
  SCULPT_SUMMARY,
  totalSeconds,
} from "@/lib/program";
import { gradeRun, weekStartKey } from "@/lib/run";
import { useAppStore } from "@/lib/store";
import {
  bmi,
  cn,
  formatClock,
  formatKg,
  hktDateKey,
  isLcsdClosed,
  weekdayHkt,
} from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function Home() {
  const [notesOpen, setNotesOpen] = useState(false);
  const closed = isLcsdClosed();
  const wd = weekdayHkt();
  const day = closed ? CLOSED_ALT : dayByWeekday(wd);
  const profile = useAppStore((s) => s.profile);
  const weights = useAppStore((s) => s.weights);
  const scans = useAppStore((s) => s.scans);
  const sessions = useAppStore((s) => s.sessions);
  const runs = useAppStore((s) => s.runs);
  const kg = weights.at(-1)?.kg ?? scans.at(-1)?.kg ?? null;
  const fat = scans.at(-1)?.bodyFatPct;
  const todayKey = hktDateKey();
  const doneToday = sessions.some((x) => x.date === todayKey && x.dayId !== 9);
  const weekRun = runs.find((r) => weekStartKey(r.date) === weekStartKey(todayKey));
  const streak = countStreak(
    sessions.map((s) => s.date),
    todayKey,
  );

  return (
    <Shell>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">
            康文署 · 30 分鐘
          </p>
          <h1 className="mt-1 font-display text-4xl text-fg">蝶刺</h1>
          <p className="mt-1 text-sm text-muted">外圍移動 · 每日塑形</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-subtle">連續</p>
          <p className="font-display text-2xl tabular-nums">{streak}</p>
        </div>
      </header>

      <button
        type="button"
        onClick={() => setNotesOpen(true)}
        className="mb-4 inline-flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-left text-sm transition active:scale-[0.99]"
      >
        <span className="flex items-center gap-2 font-medium">
          <StickyNote className="size-4 text-accent" />
          📋 場地備註
        </span>
        <span className="text-xs text-subtle">{LCSD_NOTES.length} 條 · 點開睇</span>
      </button>

      {closed ? (
        <Card className="mb-4 border-warn/40">
          <p className="text-sm text-warn">今日健身室保養休息</p>
          <p className="mt-1 text-sm text-muted">
            第一／第三個星期二。改做戶外替代流程。
          </p>
        </Card>
      ) : null}

      <Card className="mb-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted">
              星期{WEEKDAYS[wd]} · {day.intensity}強度
            </p>
            <h2 className="mt-1 font-display text-2xl">{day.name}</h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
            <Clock className="size-3.5" />
            {formatClock(totalSeconds(day))}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{day.intent}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-subtle">
          <MapPin className="size-3.5" />
          {day.lcsdFocus}
        </p>
        <div className="mt-5">
          {doneToday ? (
            <p className="text-sm text-ok">今日已完成。可重做或休息。</p>
          ) : null}
          <Link
            to="/session"
            className={cn(buttonVariants({ size: "lg" }), "mt-3 w-full")}
          >
            {doneToday ? "再練一次" : "開始訓練"}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted">每週一次 · 隨意一日</p>
            <h2 className="mt-1 font-display text-xl">9 分鐘耐力跑</h2>
            <p className="mt-2 text-sm text-muted">
              {weekRun
                ? `本週 ${(weekRun.meters / 1000).toFixed(2)} km · ${gradeRun(weekRun.meters)}`
                : "香港體適能跑。測完先有有氧分析。唔取代今日主課。"}
            </p>
          </div>
        </div>
        <Link
          to="/session"
          search={{ run: true }}
          className={cn(buttonVariants({ variant: "secondary" }), "mt-3 w-full")}
        >
          {weekRun ? "再測（覆蓋本週）" : "開始 9 分鐘"}
        </Link>
      </Card>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {SCULPT_SUMMARY.map((s) => (
          <Card key={s.part} className="px-2 py-3 text-center">
            <p className="text-xs text-muted">{s.part}</p>
            <p className="mt-1 text-sm leading-tight text-fg">{s.move}</p>
          </Card>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-muted">晨秤</p>
          <p className="mt-1 font-display text-2xl tabular-nums">
            {kg != null ? `${formatKg(kg)}` : "—"}
            <span className="ml-1 text-sm text-muted">kg</span>
          </p>
          <p className="mt-1 text-xs text-subtle">
            {fat != null ? `體脂 ${fat.toFixed(1)}% · ` : ""}
            上限 {PROFILE_DEFAULT.ceilingKg} · 目標 {formatKg(profile.targetKg)}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted">BMI · {profile.heightCm} cm</p>
          <p className="mt-1 font-display text-2xl tabular-nums">
            {kg != null ? bmi(kg, profile.heightCm).toFixed(1) : "—"}
          </p>
          <p className="mt-1 text-xs text-subtle">外圍型保持輕盈</p>
        </Card>
      </div>

      <Card className="mb-4">
        <h3 className="text-sm font-medium">點解今日咁練</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{day.science}</p>
      </Card>

      <WeekStrip current={wd} />

      <Card className="mt-4">
        <h3 className="text-sm font-medium">場地備註</h3>
        <ul className="mt-2 space-y-2">
          {LCSD_NOTES.map((n) => (
            <li key={n} className="text-sm leading-relaxed text-muted">
              {n}
            </li>
          ))}
        </ul>
      </Card>

      {notesOpen ? <NotesModal onClose={() => setNotesOpen(false)} /> : null}
    </Shell>
  );
}

function NotesModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-3 pb-3 pt-12 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="場地備註"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-bg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
          <h2 className="flex items-center gap-2 font-display text-lg">
            <StickyNote className="size-4 text-accent" />
            場地備註
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted transition hover:bg-surface-2"
            aria-label="關閉"
          >
            <X className="size-4" />
          </button>
        </div>
        <ol className="max-h-[70dvh] space-y-3 overflow-y-auto px-5 py-4 text-sm leading-relaxed">
          {LCSD_NOTES.map((n, i) => (
            <li key={i} className="flex gap-3 text-muted">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs tabular-nums text-fg">
                {i + 1}
              </span>
              <span className="flex-1">{n}</span>
            </li>
          ))}
        </ol>
        <div className="border-t border-border bg-surface px-5 py-3 text-center text-xs text-subtle">
          撳空白處或 ✕ 關閉
        </div>
      </div>
    </div>
  );
}

function WeekStrip({ current }: { current: number }) {
  const names = ["日", "一", "二", "三", "四", "五", "六"];
  const labels = ["恢復", "速度", "旋轉", "單腳", "有氧", "刺拳", "移動"];
  return (
    <div className="grid grid-cols-7 gap-1">
      {names.map((n, i) => (
        <div
          key={n}
          className={`rounded-lg px-1 py-2 text-center ${
            i === current ? "bg-accent text-accent-foreground" : "bg-surface"
          }`}
        >
          <p className="text-xs opacity-70">{n}</p>
          <p className="mt-0.5 text-xs leading-tight">{labels[i]}</p>
        </div>
      ))}
    </div>
  );
}

function countStreak(dates: string[], today: string) {
  const set = new Set(dates);
  let n = 0;
  const cursor = new Date(`${today}T12:00:00+08:00`);
  while (n < 90) {
    const key = cursor.toLocaleDateString("en-CA", {
      timeZone: "Asia/Hong_Kong",
    });
    if (!set.has(key)) break;
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}
