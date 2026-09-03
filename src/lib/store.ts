import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SAMPLE_SCAN, type BodyScan, type FoodItem } from "@/lib/body";
import { PROFILE_DEFAULT } from "@/lib/program";
import { weekStartKey } from "@/lib/run";

export type WeightEntry = { date: string; kg: number };
export type SessionEntry = {
  date: string;
  dayId: number;
  name: string;
  seconds: number;
};
export type RunTest = { date: string; meters: number };
export type ReportEntry = { date: string; text: string; at: number };

export type Profile = {
  heightCm: number;
  targetKg: number;
  age: number;
  sex: "m" | "f";
  ceilingKg: number;
  floorKg: number;
};

type State = {
  profile: Profile;
  weights: WeightEntry[];
  scans: BodyScan[];
  foods: FoodItem[];
  sessions: SessionEntry[];
  runs: RunTest[];
  reports: ReportEntry[];
  remarks: Record<string, string>;
  lastKg: number | null;
  setProfile: (p: Partial<Profile>) => void;
  logWeight: (date: string, kg: number) => void;
  logScan: (scan: BodyScan) => void;
  addFood: (item: FoodItem) => void;
  removeFood: (id: string) => void;
  logSession: (entry: SessionEntry) => void;
  logRun: (entry: RunTest) => void;
  saveReport: (entry: ReportEntry) => void;
  saveRemark: (date: string, text: string) => void;
};

function persistMerge(persisted: unknown, current: State): State {
  const p = (persisted ?? {}) as Partial<State>;
  return {
    ...current,
    ...p,
    runs: p.runs ?? [],
    foods: p.foods ?? [],
    sessions: p.sessions ?? [],
    scans: p.scans ?? current.scans,
    weights: p.weights ?? current.weights,
    reports: p.reports ?? [],
    remarks: p.remarks ?? {},
  };
}

export const useAppStore = create<State>()(
  persist(
    (set) => ({
      profile: { ...PROFILE_DEFAULT },
      weights: [{ date: SAMPLE_SCAN.date, kg: SAMPLE_SCAN.kg }],
      scans: [SAMPLE_SCAN],
      foods: [],
      sessions: [],
      runs: [],
      reports: [],
      remarks: {},
      lastKg: SAMPLE_SCAN.kg,
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      logWeight: (date, kg) =>
        set((s) => {
          const rest = s.weights.filter((w) => w.date !== date);
          const weights = [...rest, { date, kg }].sort((a, b) => a.date.localeCompare(b.date));
          return { weights, lastKg: kg };
        }),
      logScan: (scan) =>
        set((s) => {
          const scans = [...s.scans.filter((x) => x.date !== scan.date), scan].sort((a, b) =>
            a.date.localeCompare(b.date),
          );
          const rest = s.weights.filter((w) => w.date !== scan.date);
          const weights = [...rest, { date: scan.date, kg: scan.kg }].sort((a, b) =>
            a.date.localeCompare(b.date),
          );
          return { scans: scans.slice(-60), weights, lastKg: scan.kg };
        }),
      addFood: (item) => set((s) => ({ foods: [...s.foods, item].slice(-400) })),
      removeFood: (id) => set((s) => ({ foods: s.foods.filter((f) => f.id !== id) })),
      logSession: (entry) =>
        set((s) => {
          const rest = s.sessions.filter((x) => !(x.date === entry.date && x.dayId === entry.dayId));
          return { sessions: [...rest, entry].slice(-90) };
        }),
      logRun: (entry) =>
        set((s) => {
          const week = weekStartKey(entry.date);
          const rest = s.runs.filter((r) => weekStartKey(r.date) !== week);
          return {
            runs: [...rest, entry].sort((a, b) => a.date.localeCompare(b.date)).slice(-52),
          };
        }),
      saveReport: (entry) =>
        set((s) => ({
          reports: [entry, ...s.reports.filter((r) => r.date !== entry.date)].slice(0, 12),
        })),
      saveRemark: (date, text) =>
        set((s) => ({ remarks: { ...s.remarks, [date]: text } })),
    }),
    { name: "dieci-train-v2", merge: persistMerge },
  ),
);
