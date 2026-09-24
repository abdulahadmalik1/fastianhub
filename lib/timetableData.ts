// FAST NUCES Islamabad – Timetable Types and Utilities

export interface ClassEntry {
  id: string;
  day: string;
  slot: string;          // canonical "HH:MM-HH:MM" 24h
  startMins: number;
  endMins: number;
  startLabel: string;    // e.g. "8:30 AM"
  endLabel: string;      // e.g. "9:50 AM"
  room: string;
  course: string;
  section: string;       // e.g. "CS-A"
  program: string;       // e.g. "BS CS"
  type: "lecture" | "lab" | "tutorial";
  batch?: string;        // e.g. "2026", "2025"
  color?: string;        // Hex background color from official sheet
  textColor?: string;    // Hex text color
  bold?: boolean;
}

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export type Day = typeof DAYS[number];

// Canonical classroom lecture slots (24h)
export const TIME_SLOTS = [
  "08:30-09:50",
  "10:00-11:20",
  "11:30-12:50",
  "13:00-14:20",
  "14:30-15:50",
  "15:55-17:15",
  "17:20-18:40",
  "18:45-20:05",
] as const;

// Canonical lab slots (3-hour blocks)
export const LAB_SLOTS = [
  "08:30-11:15",
  "11:30-14:15",
  "14:30-17:15",
  "17:20-20:05",
] as const;

export function toMins(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fmtTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}
