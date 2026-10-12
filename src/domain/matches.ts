import { applyMove, closeGame, initialState, opposite, score, type Disc, type Square } from "@/games/reversi/engine";

import { areFriends, markExpiredChallenges, memberById } from "./challenges";
import type { ClubState, DomainResult, Match, Mode, TimeControl } from "./types";

function fail(state: ClubState, reason: string): DomainResult {
  return { ok: false, state, reason };
}

function replaceMatch(state: ClubState, match: Match): ClubState {
  return {
    ...state,
    matches: state.matches.map((item) => (item.id === match.id ? match : item)),
  };
}

export function seatId(match: Match, disc: Disc): string {
  return disc === "dark" ? match.darkId : match.lightId;
}

export function discFor(match: Match, memberId: string): Disc | null {
  if (match.darkId === memberId) return "dark";
  if (match.lightId === memberId) return "light";
  return null;
}

export function timeLeft(match: Match, disc: Disc, now: number): number | null {
  if (!match.clocks || match.timeControl.kind !== "sudden-death") return null;
  const stored = match.clocks[disc];
  if (match.status !== "active" || match.state.toMove !== disc) return stored;
  return stored - (now - match.clockUpdatedAt);
}

function freshClocks(timeControl: TimeControl): { dark: number; light: number } | null {
  if (timeControl.kind !== "sudden-death") return null;
  const ms = timeControl.secondsPerPlayer * 1000;
  return { dark: ms, light: ms };
}

function syncResult(match: Match): Match {
  if (match.state.status !== "complete" || !match.state.winner || !match.state.endReason) {
    return match;
  }
  if (match.state.endReason === "resignation" || match.state.endReason === "timeout") {
    return {
      ...match,
      status: "complete",
      result: { winner: match.state.winner, reason: match.state.endReason },
    };
  }
  return {
    ...match,
    status: "complete",
    result: { winner: match.state.winner, reason: "score" },
  };
}

function withElapsedClock(match: Match, now: number): { match: Match; expired: boolean } {
  if (match.status !== "active" || match.timeControl.kind !== "sudden-death" || !match.clocks) {
    return { match, expired: false };
  }
  const side = match.state.toMove;
  const left = match.clocks[side] - Math.max(0, now - match.clockUpdatedAt);
  if (left > 0) {
    return {
      expired: false,
      match: {
        ...match,
        clocks: { ...match.clocks, [side]: left },
        clockUpdatedAt: now,
      },
    };
  }
  const closed = closeGame(match.state, opposite(side), "timeout");
  return {
    expired: true,
    match: syncResult({
      ...match,
      state: closed,
      clocks: { ...match.clocks, [side]: 0 },
      clockUpdatedAt: now,
      rematch: null,
    }),
  };
}

export function settle(state: ClubState, now: number): ClubState {
  const expired = markExpiredChallenges(state, now);
  let changed = expired !== state;
  const matches = expired.matches.map((match) => {
    const timed = withElapsedClock(match, now);
    if (!timed.expired) return match;
    changed = true;
    return timed.match;
  });
  if (!changed) return state;
  return { ...expired, matches };
}

function requireMatch(state: ClubState, matchId: string): Match | DomainResult {
  const match = state.matches.find((item) => item.id === matchId);
  if (!match) return fail(state, "That table is not in this prototype.");
  return match;
}

export function submitMove(
  state: ClubState,
  matchId: string,
  actorId: string,
  square: Square,
  now: number,
): DomainResult {
  const found = requireMatch(state, matchId);
  if (!("id" in found)) return found;
  if (found.status !== "active") return fail(state, "This match is already over.");

  const timed = withElapsedClock(found, now);
  if (timed.expired) {
    const name = memberById(state, seatId(found, found.state.toMove))?.displayName ?? "The player to move";
    return {
      ok: false,
      reason: `Time ran out for ${name}.`,
      state: replaceMatch(state, timed.match),
    };
  }

  const side = timed.match.state.toMove;
  if (seatId(timed.match, side) !== actorId) {
    return fail(replaceMatch(state, timed.match), "It is not your turn.");
  }

  const moved = applyMove(timed.match.state, square);
  if (!moved.ok) return fail(replaceMatch(state, timed.match), moved.reason);

  const next = syncResult({
    ...timed.match,
    state: moved.state,
    clockUpdatedAt: now,
  });
  const notice =
    next.status === "complete" && next.result?.reason === "score"
      ? resultNotice(state, next)
      : undefined;

  return { ok: true, state: replaceMatch(state, next), notice };
}

export function resignMatch(state: ClubState, matchId: string, actorId: string, now: number): DomainResult {
  const found = requireMatch(state, matchId);
  if (!("id" in found)) return found;
  if (found.status !== "active") return fail(state, "This match is already over.");
  const disc = discFor(found, actorId);
  if (!disc) return fail(state, "You are not seated at this table.");

  const timed = withElapsedClock(found, now);
  if (timed.expired) {
    return {
      ok: false,
      reason: "Time has already run out.",
      state: replaceMatch(state, timed.match),
    };
  }

  const closed = closeGame(timed.match.state, opposite(disc), "resignation");
  const next = syncResult({ ...timed.match, state: closed, clockUpdatedAt: now, rematch: null });
  return {
    ok: true,
    state: replaceMatch(state, next),
    notice: `${memberById(state, actorId)?.displayName ?? "A player"} resigned.`,
  };
}

export function setPresence(
  state: ClubState,
  matchId: string,
  actorId: string,
  present: boolean,
): DomainResult {
  const found = requireMatch(state, matchId);
  if (!("id" in found)) return found;
  const disc = discFor(found, actorId);
  if (!disc) return fail(state, "You are not seated at this table.");
  const next: Match = {
    ...found,
    present: { ...found.present, [disc]: present },
    rematch:
      found.rematch?.status === "pending"
        ? { ...found.rematch, status: "withdrawn" }
        : found.rematch,
  };
  const left = !next.present.dark || !next.present.light;
  return {
    ok: true,
    state: replaceMatch(state, next),
    notice: present
      ? "You are back at the table."
      : left
        ? "You left the table. Rematch is closed until both players return."
        : undefined,
  };
}

export function requestRematch(state: ClubState, matchId: string, actorId: string): DomainResult {
  const found = requireMatch(state, matchId);
  if (!("id" in found)) return found;
  if (found.status !== "complete") return fail(state, "Finish the match before asking for a rematch.");
  if (!discFor(found, actorId)) return fail(state, "You are not seated at this table.");
  if (!found.present.dark || !found.present.light) {
    return fail(state, "Rematch needs both players still at the table.");
  }
  if (found.rematch?.status === "pending") return fail(state, "A rematch request is already waiting.");

  return {
    ok: true,
    state: replaceMatch(state, {
      ...found,
      rematch: { requestedBy: actorId, status: "pending" },
    }),
    notice: "Rematch requested. It starts only if the other seat accepts.",
  };
}

export function withdrawRematch(state: ClubState, matchId: string, actorId: string): DomainResult {
  const found = requireMatch(state, matchId);
  if (!("id" in found)) return found;
  if (found.rematch?.status !== "pending" || found.rematch.requestedBy !== actorId) {
    return fail(state, "There is no rematch request of yours to withdraw.");
  }
  return {
    ok: true,
    state: replaceMatch(state, { ...found, rematch: { ...found.rematch, status: "withdrawn" } }),
    notice: "Rematch request withdrawn.",
  };
}

export function answerRematch(
  state: ClubState,
  matchId: string,
  actorId: string,
  accept: boolean,
  now: number,
  nextMatchId: string,
): DomainResult {
  const found = requireMatch(state, matchId);
  if (!("id" in found)) return found;
  if (found.rematch?.status !== "pending") return fail(state, "There is no rematch waiting.");
  if (found.rematch.requestedBy === actorId) return fail(state, "The other player answers the rematch.");
  if (!discFor(found, actorId)) return fail(state, "You are not seated at this table.");
  if (!found.present.dark || !found.present.light) {
    return fail(state, "Rematch needs both players still at the table.");
  }
  if (!accept) {
    return {
      ok: true,
      state: replaceMatch(state, { ...found, rematch: { ...found.rematch, status: "declined" } }),
      notice: "Rematch declined.",
    };
  }

  const created = createReversiMatch(state, {
    id: nextMatchId,
    darkId: found.lightId,
    lightId: found.darkId,
    mode: found.mode,
    timeControl: found.timeControl,
    now,
    local: found.local,
  });
  return {
    ok: true,
    matchId: nextMatchId,
    notice: "Rematch started. Colours are swapped.",
    state: {
      ...created.state,
      matches: created.state.matches.map((match) =>
        match.id === found.id
          ? { ...found, rematch: { ...found.rematch!, status: "accepted", nextMatchId } }
          : match,
      ),
    },
  };
}

export function openLocalTable(
  state: ClubState,
  opponentId: string,
  now: number,
  matchId: string,
): DomainResult {
  if (!areFriends(state, state.youId, opponentId)) {
    return fail(state, "Local tables are with friends.");
  }
  return createReversiMatch(state, {
    id: matchId,
    darkId: state.youId,
    lightId: opponentId,
    mode: "casual",
    timeControl: { kind: "untimed" },
    now,
    local: true,
    notice: `Local table with ${memberById(state, opponentId)?.displayName ?? "a friend"}. It stays on this device, and ratings do not change.`,
  });
}

/**
 * Accepting a pending challenge creates one match.
 * A second accept sees status accepted and must not create another.
 * Chess and Scrabble challenges are rejected rather than given a fake board.
 */
export function acceptChallenge(
  state: ClubState,
  challengeId: string,
  actorId: string,
  now: number,
  matchId: string,
): DomainResult {
  const current = markExpiredChallenges(state, now);
  const challenge = current.challenges.find((item) => item.id === challengeId);
  if (!challenge) return fail(current, "That challenge is no longer here.");
  if (challenge.recipientId !== actorId) return fail(current, "Only the recipient can accept this challenge.");
  if (challenge.status === "expired" || challenge.expiresAt <= now) {
    return fail(
      {
        ...current,
        challenges: current.challenges.map((item) =>
          item.id === challengeId && item.status === "pending" ? { ...item, status: "expired" } : item,
        ),
      },
      "This challenge has expired.",
    );
  }
  if (challenge.status !== "pending") {
    return fail(current, "This challenge can no longer be accepted.");
  }
  if (challenge.game !== "reversi") {
    return fail(current, "That game is not open yet, so the challenge cannot start a match.");
  }

  const created = createReversiMatch(current, {
    id: matchId,
    darkId: challenge.challengerId,
    lightId: challenge.recipientId,
    mode: challenge.mode,
    timeControl: challenge.timeControl,
    now,
    local: true,
  });
  return {
    ok: true,
    matchId,
    notice: "Challenge accepted. The board is set.",
    state: {
      ...created.state,
      challenges: created.state.challenges.map((item) =>
        item.id === challengeId ? { ...item, status: "accepted", matchId } : item,
      ),
    },
  };
}

function createReversiMatch(
  state: ClubState,
  input: {
    id: string;
    darkId: string;
    lightId: string;
    mode: Mode;
    timeControl: TimeControl;
    now: number;
    local: boolean;
    notice?: string;
  },
): DomainResult {
  const match: Match = {
    game: "reversi",
    id: input.id,
    mode: input.mode,
    timeControl: input.timeControl,
    darkId: input.darkId,
    lightId: input.lightId,
    state: initialState(),
    status: "active",
    result: null,
    clocks: freshClocks(input.timeControl),
    clockUpdatedAt: input.now,
    present: { dark: true, light: true },
    rematch: null,
    talk: [],
    local: input.local,
  };
  return {
    ok: true,
    matchId: match.id,
    notice: input.notice,
    state: { ...state, matches: [match, ...state.matches] },
  };
}

function resultNotice(state: ClubState, match: Match): string {
  if (!match.result) return "The match is over.";
  const tally = score(match.state.board);
  if (match.result.winner === "draw") return `Drawn, ${tally.dark} to ${tally.light}.`;
  const winnerId = seatId(match, match.result.winner);
  const name = memberById(state, winnerId)?.displayName ?? "The winner";
  return `${name} has the board, ${Math.max(tally.dark, tally.light)} to ${Math.min(tally.dark, tally.light)}.`;
}

export function ratingsUnchanged(before: ClubState, after: ClubState): boolean {
  return before.members.every((member) => {
    const next = after.members.find((item) => item.id === member.id);
    return JSON.stringify(next?.ratings) === JSON.stringify(member.ratings);
  });
}
