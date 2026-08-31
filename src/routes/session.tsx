import { createFileRoute } from "@tanstack/react-router";
import { SessionPlayer } from "@/components/session-player";
import { CLOSED_ALT, dayByWeekday } from "@/lib/program";
import { THURSDAY_DAY } from "@/lib/thursday-day";
import { RUN_TEST } from "@/lib/run";
import { isLcsdClosed, weekdayHkt } from "@/lib/utils";

export const Route = createFileRoute("/session")({
  validateSearch: (s: Record<string, unknown>): { run?: boolean } => ({
    run: s.run === true || s.run === "1" || s.run === "true" ? true : undefined,
  }),
  component: SessionPage,
});

function SessionPage() {
  const { run } = Route.useSearch();
  const wd = weekdayHkt();
  const day = run
    ? RUN_TEST
    : isLcsdClosed()
      ? CLOSED_ALT
      : wd === 4
        ? THURSDAY_DAY
        : dayByWeekday(wd);
  return (
    <div className="min-h-dvh bg-bg px-4 pb-10 pt-6">
      <div className="mx-auto w-full max-w-lg">
        <SessionPlayer day={day} />
      </div>
    </div>
  );
}
