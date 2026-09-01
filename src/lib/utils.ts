import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKg(n: number) {
  return String(Math.round(n * 100) / 100);
}

export function bmi(kg: number, heightCm: number) {
  const m = heightCm / 100;
  return kg / (m * m);
}

export function weekdayHkt(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Hong_Kong",
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[parts] ?? date.getDay();
}

export function hktDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatClock(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/** 農曆年初一（第二天由初一 +1 推出） */
const CNY_DAY1 = [
  "2025-01-29",
  "2026-02-17",
  "2027-02-06",
  "2028-01-26",
  "2029-02-13",
  "2030-02-03",
];

function nextDayKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

const GYM_CLOSED = new Set(
  CNY_DAY1.flatMap((d1) => [d1, nextDayKey(d1)]),
);

/** 健身室 365 開放；只休農曆年初一、初二。 */
export function isLcsdClosed(date = new Date()) {
  return GYM_CLOSED.has(hktDateKey(date));
}

export function mifflinStJeor(opts: {
  kg: number;
  heightCm: number;
  age: number;
  sex: "m" | "f";
}) {
  const base = 10 * opts.kg + 6.25 * opts.heightCm - 5 * opts.age;
  return opts.sex === "m" ? base + 5 : base - 161;
}
