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

/** LCSD fitness rooms typically close 1st & 3rd Tuesday of the month. */
export function isLcsdClosed(date = new Date()) {
  const weekday = weekdayHkt(date);
  if (weekday !== 2) return false;
  const day = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Hong_Kong",
      day: "numeric",
    }).format(date),
  );
  const y = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric",
    }).format(date),
  );
  const mo = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Hong_Kong",
      month: "numeric",
    }).format(date),
  );
  const first = new Date(Date.UTC(y, mo - 1, 1));
  const firstWeekday = first.getUTCDay();
  const firstTue = ((2 - firstWeekday + 7) % 7) + 1;
  const thirdTue = firstTue + 14;
  return day === firstTue || day === thirdTue;
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
