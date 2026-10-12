import { z } from "zod";

import { CHALLENGE_TTL_MS, type Challenge, type ClubState, type DomainResult, type GameId, type Mode, type TimeControl } from "./types";

export const messageBodySchema = z.string().trim().min(1, "Write a message before sending.").max(500, "Messages stay within 500 characters.");

/** Either direction is enough. The server must enforce this; the button is not the rule. */
export function isBlocked(state: ClubState, a: string, b: string): boolean {
  return state.blocks.some(
    (block) =>
      (block.blockerId === a && block.blockedId === b) || (block.blockerId === b && block.blockedId === a),
  );
}

export function memberById(state: ClubState, id: string) {
  return state.members.find((member) => member.id === id) ?? null;
}

export function areFriends(state: ClubState, a: string, b: string): boolean {
  return state.friendships.some((friendship) => {
    const [left, right] = friendship.memberIds;
    return (left === a && right === b) || (left === b && right === a);
  });
}

function fail(state: ClubState, reason: string): DomainResult {
  return { ok: false, state, reason };
}

function pendingOutgoing(state: ClubState, challengerId: string, now: number): Challenge | undefined {
  return state.challenges.find(
    (challenge) =>
      challenge.challengerId === challengerId &&
      challenge.status === "pending" &&
      challenge.expiresAt > now,
  );
}

export function pendingIncoming(state: ClubState, memberId: string, now: number): Challenge[] {
  return state.challenges.filter(
    (challenge) =>
      challenge.recipientId === memberId &&
      challenge.status === "pending" &&
      challenge.expiresAt > now,
  );
}

export function pendingIncomingCount(state: ClubState, memberId: string, now: number): number {
  return pendingIncoming(state, memberId, now).length;
}

export type ChallengeDraft = {
  id: string;
  challengerId: string;
  recipientId: string;
  game: GameId;
  mode: Mode;
  timeControl: TimeControl;
  now: number;
};

/**
 * One pending outgoing challenge per member.
 * Acceptance must still be conditional in the database: status = pending and expires_at > now().
 */
export function sendChallenge(state: ClubState, draft: ChallengeDraft): DomainResult {
  if (draft.challengerId === draft.recipientId) {
    return fail(state, "You cannot challenge yourself.");
  }
  if (!memberById(state, draft.recipientId)) {
    return fail(state, "That member is not in the club directory.");
  }
  if (!areFriends(state, draft.challengerId, draft.recipientId)) {
    return fail(state, "Challenges are between friends.");
  }
  if (isBlocked(state, draft.challengerId, draft.recipientId)) {
    return fail(state, "Challenges are closed between these members.");
  }
  if (draft.game !== "reversi") {
    return fail(state, "Only Reversi can be challenged in this prototype. Chess and Scrabble are not open.");
  }
  if (pendingOutgoing(state, draft.challengerId, draft.now)) {
    return fail(state, "You already have a challenge waiting. Withdraw it before sending another.");
  }

  const challenge: Challenge = {
    id: draft.id,
    challengerId: draft.challengerId,
    recipientId: draft.recipientId,
    game: draft.game,
    mode: draft.mode,
    timeControl: draft.timeControl,
    status: "pending",
    createdAt: draft.now,
    expiresAt: draft.now + CHALLENGE_TTL_MS,
  };
  const recipient = memberById(state, draft.recipientId);
  const away =
    recipient?.presence === "offline"
      ? " They are away, and the challenge still expires in 15 minutes."
      : "";

  return {
    ok: true,
    state: { ...state, challenges: [challenge, ...state.challenges] },
    notice: `Challenge sent to ${recipient?.displayName ?? "your friend"}.${away}`,
  };
}

export function declineChallenge(state: ClubState, challengeId: string, actorId: string, now: number): DomainResult {
  const challenge = state.challenges.find((item) => item.id === challengeId);
  if (!challenge) return fail(state, "That challenge is no longer here.");
  if (challenge.recipientId !== actorId) return fail(state, "Only the recipient can decline this challenge.");
  if (challenge.status !== "pending") return fail(state, "This challenge is no longer waiting.");
  if (challenge.expiresAt <= now) return expireOne(state, challengeId, "This challenge has expired.");

  return {
    ok: true,
    state: updateChallenge(state, challengeId, { status: "declined" }),
    notice: "Challenge declined.",
  };
}

export function cancelChallenge(state: ClubState, challengeId: string, actorId: string, now: number): DomainResult {
  const challenge = state.challenges.find((item) => item.id === challengeId);
  if (!challenge) return fail(state, "That challenge is no longer here.");
  if (challenge.challengerId !== actorId) return fail(state, "Only the sender can withdraw this challenge.");
  if (challenge.status !== "pending") return fail(state, "This challenge is no longer waiting.");
  if (challenge.expiresAt <= now) return expireOne(state, challengeId, "This challenge has expired.");

  return {
    ok: true,
    state: updateChallenge(state, challengeId, { status: "cancelled" }),
    notice: "Challenge withdrawn.",
  };
}

export function markExpiredChallenges(state: ClubState, now: number): ClubState {
  let changed = false;
  const challenges = state.challenges.map((challenge) => {
    if (challenge.status === "pending" && challenge.expiresAt <= now) {
      changed = true;
      return { ...challenge, status: "expired" as const };
    }
    return challenge;
  });
  if (!changed) return state;
  return { ...state, challenges };
}

function expireOne(state: ClubState, challengeId: string, reason: string): DomainResult {
  return {
    ok: false,
    reason,
    state: updateChallenge(state, challengeId, { status: "expired" }),
  };
}

function updateChallenge(state: ClubState, challengeId: string, patch: Partial<Challenge>): ClubState {
  return {
    ...state,
    challenges: state.challenges.map((challenge) =>
      challenge.id === challengeId ? { ...challenge, ...patch } : challenge,
    ),
  };
}
