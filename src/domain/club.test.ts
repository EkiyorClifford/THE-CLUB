import { describe, expect, it } from "vitest";

import { notationToSquare } from "@/games/reversi/engine";

import { cancelChallenge, pendingIncomingCount, sendChallenge } from "./challenges";
import { formatExpiry } from "./format";
import {
  acceptChallenge,
  answerRematch,
  ratingsUnchanged,
  requestRematch,
  resignMatch,
  setPresence,
  settle,
  submitMove,
} from "./matches";
import { answerFriendRequest, blockMember, endFriendship, requestFriendship, sendDirectMessage, unblockMember } from "./social";
import type { ClubState, Member } from "./types";
import { CHALLENGE_TTL_MS } from "./types";

const now = 1_700_000_000_000;

function member(id: string, presence: Member["presence"]): Member {
  return {
    id,
    displayName: id,
    username: id,
    presence,
    ratings: {
      reversi: { value: 1500, games: 4 },
      chess: { value: 1500, games: 4 },
    },
  };
}

function club(): ClubState {
  return {
    youId: "inez",
    members: [member("inez", "online"), member("mara", "online"), member("ada", "offline"), member("leah", "offline")],
    friendships: [
      { id: "f-mara", memberIds: ["inez", "mara"] },
      { id: "f-ada", memberIds: ["inez", "ada"] },
    ],
    friendRequests: [{ id: "req-leah", fromId: "leah", toId: "inez", status: "pending" }],
    challenges: [],
    matches: [],
    blocks: [],
    conversations: [
      {
        id: "talk-mara",
        memberIds: ["inez", "mara"],
        messages: [],
      },
      {
        id: "talk-secret",
        memberIds: ["mara", "ada"],
        messages: [{ id: "hidden", authorId: "mara", body: "Private", sentAt: now }],
      },
    ],
  };
}

function sendReversi(state: ClubState, challengerId: string, recipientId: string, id = "ch-1") {
  return sendChallenge(state, {
    id,
    challengerId,
    recipientId,
    game: "reversi",
    mode: "rated",
    timeControl: { kind: "sudden-death", secondsPerPlayer: 600 },
    now,
  });
}

describe("challenges", () => {
  it("sends a challenge with the chosen game, mode, and a 15 minute expiry", () => {
    const sent = sendReversi(club(), "inez", "ada");
    expect(sent.ok).toBe(true);
    const challenge = sent.state.challenges[0];
    expect(challenge?.game).toBe("reversi");
    expect(challenge?.mode).toBe("rated");
    expect(challenge?.timeControl).toEqual({ kind: "sudden-death", secondsPerPlayer: 600 });
    expect(challenge?.expiresAt).toBe(now + CHALLENGE_TTL_MS);
    expect(formatExpiry(challenge?.expiresAt ?? 0, now)).toBe("Expires in 15:00");
  });

  it("formats a countdown in minutes and seconds", () => {
    expect(formatExpiry(now + (8 * 60 + 42) * 1000, now)).toBe("Expires in 08:42");
  });

  it("allows only one pending outgoing challenge", () => {
    const first = sendReversi(club(), "inez", "ada", "ch-1");
    const second = sendReversi(first.state, "inez", "mara", "ch-2");
    expect(second.ok).toBe(false);
    expect(second.state.challenges).toHaveLength(1);
  });

  it("refuses chess because that table is not open", () => {
    const sent = sendChallenge(club(), {
      id: "ch-chess",
      challengerId: "inez",
      recipientId: "mara",
      game: "chess",
      mode: "casual",
      timeControl: { kind: "untimed" },
      now,
    });
    expect(sent.ok).toBe(false);
    expect(sent.state.challenges).toHaveLength(0);
  });

  it("expires a challenge at the deadline and refuses acceptance", () => {
    const sent = sendReversi(club(), "mara", "inez");
    const challenge = sent.state.challenges[0];
    expect(challenge).toBeDefined();
    const expired = acceptChallenge(sent.state, challenge!.id, "inez", challenge!.expiresAt, "match-1");
    expect(expired.ok).toBe(false);
    expect(expired.reason).toMatch(/expired/i);
    expect(expired.state.matches).toHaveLength(0);
    expect(expired.state.challenges[0]?.status).toBe("expired");
    expect(pendingIncomingCount(expired.state, "inez", challenge!.expiresAt)).toBe(0);
  });

  it("accepts once, only for the recipient, and never twice", () => {
    const sent = sendReversi(club(), "mara", "inez");
    const id = sent.state.challenges[0]!.id;
    const wrong = acceptChallenge(sent.state, id, "ada", now + 1000, "match-x");
    expect(wrong.ok).toBe(false);
    expect(wrong.state.matches).toHaveLength(0);

    const accepted = acceptChallenge(sent.state, id, "inez", now + 1000, "match-1");
    expect(accepted.ok).toBe(true);
    expect(accepted.state.matches).toHaveLength(1);
    expect(accepted.state.challenges[0]?.status).toBe("accepted");
    expect(accepted.state.matches[0]?.mode).toBe("rated");
    expect(accepted.state.matches[0]?.darkId).toBe("mara");

    const again = acceptChallenge(accepted.state, id, "inez", now + 1000, "match-2");
    expect(again.ok).toBe(false);
    expect(again.state.matches).toHaveLength(1);
    expect(ratingsUnchanged(sent.state, accepted.state)).toBe(true);
  });

  it("does not start a match from a withdrawn challenge", () => {
    const sent = sendReversi(club(), "inez", "mara");
    const id = sent.state.challenges[0]!.id;
    const cancelled = cancelChallenge(sent.state, id, "inez", now + 1000);
    expect(cancelled.state.challenges[0]?.status).toBe("cancelled");
    const accepted = acceptChallenge(cancelled.state, id, "mara", now + 1000, "match-1");
    expect(accepted.ok).toBe(false);
    expect(accepted.state.matches).toHaveLength(0);
  });

  it("counts only live incoming challenges in the badge", () => {
    const first = sendReversi(club(), "mara", "inez", "ch-1");
    const second = sendChallenge(first.state, {
      id: "ch-2",
      challengerId: "ada",
      recipientId: "inez",
      game: "reversi",
      mode: "casual",
      timeControl: { kind: "untimed" },
      now,
    });
    expect(pendingIncomingCount(second.state, "inez", now)).toBe(2);
    const expired = settle(second.state, now + CHALLENGE_TTL_MS);
    expect(pendingIncomingCount(expired, "inez", now + CHALLENGE_TTL_MS)).toBe(0);
    expect(expired.challenges.every((challenge) => challenge.status === "expired")).toBe(true);
  });
});

describe("matches", () => {
  function started() {
    const sent = sendReversi(club(), "mara", "inez");
    return acceptChallenge(sent.state, sent.state.challenges[0]!.id, "inez", now + 1000, "match-1");
  }

  it("lets the side to move play and rejects the other player", () => {
    const accepted = started();
    const square = notationToSquare("c4");
    expect(square).not.toBeNull();
    const wrong = submitMove(accepted.state, "match-1", "inez", square!, now + 2000);
    expect(wrong.ok).toBe(false);
    expect(wrong.state.matches[0]?.state.log).toHaveLength(0);

    const played = submitMove(accepted.state, "match-1", "mara", square!, now + 2000);
    expect(played.ok).toBe(true);
    expect(played.state.matches[0]?.state.log[0]).toMatchObject({ notation: "c4" });
    expect(played.state.matches[0]?.state.toMove).toBe("light");
  });

  it("rejects an illegal square without changing the board", () => {
    const accepted = started();
    const before = accepted.state.matches[0]?.state.board;
    const illegal = submitMove(accepted.state, "match-1", "mara", { row: 0, col: 0 }, now + 2000);
    expect(illegal.ok).toBe(false);
    expect(illegal.state.matches[0]?.state.board).toEqual(before);
  });

  it("stops moves after completion and does not change ratings", () => {
    const accepted = started();
    const resigned = resignMatch(accepted.state, "match-1", "mara", now + 3000);
    expect(resigned.ok).toBe(true);
    expect(resigned.state.matches[0]?.result).toEqual({ winner: "light", reason: "resignation" });
    expect(ratingsUnchanged(accepted.state, resigned.state)).toBe(true);

    const late = submitMove(resigned.state, "match-1", "inez", notationToSquare("d3")!, now + 4000);
    expect(late.ok).toBe(false);
    expect(late.state.matches[0]?.result).toEqual({ winner: "light", reason: "resignation" });

    const again = resignMatch(resigned.state, "match-1", "inez", now + 5000);
    expect(again.ok).toBe(false);
    expect(again.state).toBe(resigned.state);
  });

  it("loses on time from the stored clock, not a second application", () => {
    const accepted = started();
    const match = accepted.state.matches[0];
    expect(match).toBeDefined();
    const armed = {
      ...accepted.state,
      matches: [
        {
          ...match!,
          clocks: { dark: 5_000, light: 5_000 },
          clockUpdatedAt: now,
        },
      ],
    };
    const settled = settle(armed, now + 5_000);
    expect(settled.matches[0]?.result).toEqual({ winner: "light", reason: "timeout" });
    const repeated = settle(settled, now + 9_000);
    expect(repeated).toBe(settled);
    expect(ratingsUnchanged(armed, settled)).toBe(true);
  });

  it("starts a rematch only when the other player accepts", () => {
    const accepted = started();
    const finished = resignMatch(accepted.state, "match-1", "mara", now + 3000);
    const asked = requestRematch(finished.state, "match-1", "inez");
    expect(asked.ok).toBe(true);
    expect(asked.state.matches).toHaveLength(1);

    const left = setPresence(finished.state, "match-1", "mara", false);
    expect(requestRematch(left.state, "match-1", "inez").ok).toBe(false);

    const rematch = answerRematch(asked.state, "match-1", "mara", true, now + 4000, "match-2");
    expect(rematch.ok).toBe(true);
    expect(rematch.state.matches).toHaveLength(2);
    expect(rematch.state.matches[0]?.darkId).toBe("inez");
    expect(rematch.state.matches[1]?.rematch?.status).toBe("accepted");
  });
});

describe("friends and messages", () => {
  it("establishes friendship only after acceptance", () => {
    const requested = requestFriendship(club(), "inez", "leah", "req-2");
    expect(requested.ok).toBe(false);
    const accepted = answerFriendRequest(club(), "req-leah", "inez", true, "f-leah");
    expect(accepted.ok).toBe(true);
    expect(accepted.state.friendships.some((item) => item.memberIds.includes("leah"))).toBe(true);
    const duplicate = answerFriendRequest(accepted.state, "req-leah", "inez", true, "f-leah-2");
    expect(duplicate.ok).toBe(false);
  });

  it("lets friends exchange messages and hides other conversations", () => {
    const sent = sendDirectMessage(club(), "talk-mara", "inez", "I'll take dark.", now, "msg-1");
    expect(sent.ok).toBe(true);
    expect(sent.state.conversations[0]?.messages[0]?.body).toBe("I'll take dark.");

    const stranger = sendDirectMessage(club(), "talk-secret", "inez", "Hello", now, "msg-2");
    expect(stranger.ok).toBe(false);
    expect(stranger.state.conversations.find((item) => item.id === "talk-secret")?.messages).toHaveLength(1);

    const ended = endFriendship(sent.state, "inez", "mara", now + 10);
    const blocked = sendDirectMessage(ended.state, "talk-mara", "inez", "Still there?", now + 20, "msg-3");
    expect(blocked.ok).toBe(false);
  });

  it("rejects an empty message", () => {
    const sent = sendDirectMessage(club(), "talk-mara", "inez", "   ", now, "msg-1");
    expect(sent.ok).toBe(false);
  });

  it("closes messages and challenges in both directions after a block", () => {
    const blocked = blockMember(club(), "ada", "inez", "block-1", now);
    expect(blocked.ok).toBe(true);

    const fromBlocker = sendReversi(blocked.state, "ada", "inez", "ch-block");
    expect(fromBlocker.ok).toBe(false);
    const fromOther = sendReversi(blocked.state, "inez", "ada", "ch-block-2");
    expect(fromOther.ok).toBe(false);

    const message = sendDirectMessage(blocked.state, "talk-mara", "inez", "Hello Mara", now, "msg-ok");
    expect(message.ok).toBe(true);
    const toBlocked = sendDirectMessage(
      {
        ...blocked.state,
        conversations: [
          ...blocked.state.conversations,
          { id: "talk-ada", memberIds: ["inez", "ada"], messages: [] },
        ],
      },
      "talk-ada",
      "inez",
      "Still there?",
      now,
      "msg-ada",
    );
    expect(toBlocked.ok).toBe(false);

    const opened = unblockMember(blocked.state, "ada", "inez");
    expect(opened.ok).toBe(true);
    expect(sendReversi(opened.state, "inez", "ada", "ch-again").ok).toBe(true);
  });
});
