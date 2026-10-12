import type { Mode, TimeControl } from "./types";

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatExpiry(expiresAt: number, now: number): string {
  const left = expiresAt - now;
  if (left <= 0) return "Expired";
  const total = Math.ceil(left / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `Expires in ${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function formatWhen(sentAt: number, now: number): string {
  const delta = Math.max(0, now - sentAt);
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(sentAt);
}

export function timeControlLabel(timeControl: TimeControl): string {
  if (timeControl.kind === "untimed") return "Untimed";
  return `${timeControl.secondsPerPlayer / 60} min each`;
}

export function modeLabel(mode: Mode): string {
  return mode === "rated" ? "Rated" : "Casual";
}

export function discLabel(disc: "dark" | "light"): string {
  return disc === "dark" ? "Dark" : "Light";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}
