import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DAYS, totalSeconds } from "@/lib/program";
import { weekStartKey } from "@/lib/run";
import { useAppStore } from "@/lib/store";
import { cn, formatClock, hktDateKey, weekdayHkt } from "@/lib/utils";

export const Route = createFileRoute("/week")({ component: WeekPage });

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const LABELS = ["一", "二", "三", "四", "五", "六", "日"];

function WeekPage() {
  const wd = weekdayHkt();
  const runs = useAppStore((s) => s.runs);
  const week = weekStartKey(hktDateKey());
  const weekRun = runs.find((r) => weekStartKey(r.date) === week);

  return (
    <Shell>
      <h1 className="font-display text-3xl">七日前移</h1>
      <p className="mt-2 text-sm text-muted">
        每日 30 分鐘：前段外圍移動，後段固定 12 分鐘塑形（引體、胸、二頭、腹 × 3
        輪）。重量中等、控制節奏，守 55 kg 以下。
      </p>
      <Card className="mt-5">
        <p className="text-xs text-muted">每週一次 · 隨意一日</p>
        <h2 className="mt-1 font-display text-xl">9 分鐘耐力跑</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          香港體適能協議。跑步機 1% 坡連續 9 分鐘，記入距離作有氧分析。唔取代當日主課。
        </p>
        {weekRun ? (
          <p className="mt-2 text-sm text-ok">
            本週已測 {(weekRun.meters / 1000).toFixed(2)} km
          </p>
        ) : (
          <Link
            to="/session"
            search={{ run: true }}
            className={cn(buttonVariants(), "mt-3 w-full")}
          >
            今日測 9 分鐘
          </Link>
        )}
      </Card>
      <div className="mt-6 space-y-3">
        {ORDER.map((id, i) => {
          const day = DAYS.find((d) => d.id === id)!;
          const active = wd === id;
          return (
            <Card
              key={id}
              className={active ? "border-accent/40 bg-surface-2" : ""}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs text-muted">
                  星期{LABELS[i]}
                  {active ? " · 今日" : ""}
                </p>
                <p className="text-xs tabular-nums text-subtle">
                  {formatClock(totalSeconds(day))} · {day.intensity}
                </p>
              </div>
              <h2 className="mt-1 font-display text-xl">{day.name}</h2>
              <p className="mt-1 text-sm text-muted">{day.lcsdFocus}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {day.intent}
              </p>
              <ol className="mt-3 space-y-1.5 border-t border-border pt-3">
                {day.blocks
                  .filter((b) => b.kind !== "rest" && !b.label.startsWith("引體") && !b.label.startsWith("胸") && !b.label.startsWith("二頭") && !b.label.startsWith("腹"))
                  .slice(0, 5)
                  .map((b) => (
                    <li key={b.label} className="text-sm text-muted">
                      <span className="text-fg">{b.label}</span>
                      <span className="text-subtle"> · {b.gear}</span>
                    </li>
                  ))}
              </ol>
              <p className="mt-3 text-sm text-fg">
                後半 12 分鐘：引體 · 胸 · 二頭 · 腹，三輪
              </p>
            </Card>
          );
        })}
      </div>
    </Shell>
  );
}
