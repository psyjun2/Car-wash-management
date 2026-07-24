function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateKey(y: number, m: number, d: number): string {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

export function todayKey(): string {
  const n = new Date();
  return toDateKey(n.getFullYear(), n.getMonth(), n.getDate());
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86400000);
}
