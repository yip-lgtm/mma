import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui/card";
import { SKILLS } from "@/lib/program";

export const Route = createFileRoute("/skills")({ component: SkillsPage });

function SkillsPage() {
  return (
    <Shell>
      <h1 className="font-display text-3xl">技術庫</h1>
      <p className="mt-2 text-sm text-muted">
        阿里／洛馬琴科外圍型的可自學核心。每次練完體能，揀一項慢鏡 3 分鐘。
      </p>
      <div className="mt-6 space-y-3">
        {SKILLS.map((s) => (
          <Card key={s.id}>
            <h2 className="font-display text-xl">{s.name}</h2>
            <p className="mt-1 text-sm text-muted">{s.origin}</p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-4">
              {s.steps.map((st) => (
                <li key={st} className="text-sm leading-relaxed text-fg">
                  {st}
                </li>
              ))}
            </ol>
            <p className="mt-3 border-t border-border pt-3 text-sm text-muted">
              康文署：{s.lcsd}
            </p>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
