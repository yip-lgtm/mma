import { createFileRoute } from "@tanstack/react-router";
import { SessionPlayer } from "@/components/session-player";
import { CLOSED_ALT, dayByWeekday } from "@/lib/program";
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
  const day = run
    ? RUN_TEST
    : isLcsdClosed()
      ? CLOSED_ALT
      : dayByWeekday(weekdayHkt());
  return (
    <div className="min-h-dvh bg-bg px-4 pb-10 pt-6">
      <div className="mx-auto w-full max-w-lg">
        <SessionPlayer day={day} />
      </div>
    </div>
  );
}
