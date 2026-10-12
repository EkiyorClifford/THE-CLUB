import { settle } from "@/domain/matches";
import type { ClubState } from "@/domain/types";

import { createSeed } from "./seed";

const STORAGE_KEY = "the-club-prototype-v1";

type Listener = () => void;

const listeners = new Set<Listener>();
let club: ClubState | null = null;
let now = 0;
let timer: number | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  if (!club || typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(club));
}

function readStoredClub(): ClubState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as ClubState;
    if (candidate.youId !== "inez" || !Array.isArray(candidate.matches) || !Array.isArray(candidate.challenges)) {
      return null;
    }
    if (!Array.isArray(candidate.blocks)) return { ...candidate, blocks: [] };
    return candidate;
  } catch {
    return null;
  }
}

export function subscribeClub(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getClub(): ClubState | null {
  return club;
}

export function getClubNow(): number {
  return now;
}

export function getServerClub(): ClubState | null {
  return null;
}

export function getServerNow(): number {
  return 0;
}

export function currentClub(): ClubState {
  if (!club) throw new Error("The club is not open yet.");
  return club;
}

export function commitClub(next: ClubState) {
  club = next;
  persist();
  emit();
}

/** Loads the sample or the saved session once, then keeps clocks honest. */
export function openClub() {
  if (club) return;
  const stamp = Date.now();
  now = stamp;
  club = readStoredClub() ?? createSeed(stamp);
  persist();
  if (timer === null && typeof window !== "undefined") {
    timer = window.setInterval(() => {
      now = Date.now();
      if (club) {
        const settled = settle(club, now);
        if (settled !== club) {
          club = settled;
          persist();
        }
      }
      emit();
    }, 1000);
  }
  emit();
}

export function restoreClub() {
  sessionStorage.removeItem(STORAGE_KEY);
  const stamp = Date.now();
  now = stamp;
  club = createSeed(stamp);
  persist();
  emit();
}
