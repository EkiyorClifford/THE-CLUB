"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { cancelChallenge, declineChallenge, memberById, sendChallenge } from "@/domain/challenges";
import {
  acceptChallenge as acceptChallengeAction,
  answerRematch as answerRematchAction,
  openLocalTable as openLocalTableAction,
  requestRematch as requestRematchAction,
  resignMatch,
  setPresence,
  submitMove,
  withdrawRematch,
} from "@/domain/matches";
import {
  answerFriendRequest,
  blockMember,
  endFriendship,
  ensureDirectConversation,
  requestFriendship,
  sendDirectMessage,
  sendTableMessage,
  unblockMember,
} from "@/domain/social";
import type { ClubState, DomainResult, GameId, Member, Mode, TimeControl } from "@/domain/types";
import type { Square } from "@/games/reversi/engine";

import { commitClub, currentClub, getClub, getClubNow, getServerClub, getServerNow, openClub, restoreClub, subscribeClub } from "./memory";

const ClubContext = createContext<ClubContextValue | null>(null);

type ClubContextValue = {
  state: ClubState;
  now: number;
  notice: string | null;
  you: Member;
  dismissNotice: () => void;
  member: (id: string) => Member | null;
  acceptChallenge: (id: string) => DomainResult;
  declineChallenge: (id: string) => DomainResult;
  cancelChallenge: (id: string) => DomainResult;
  sendChallenge: (input: {
    recipientId: string;
    game: GameId;
    mode: Mode;
    timeControl: TimeControl;
  }) => DomainResult;
  playMove: (matchId: string, square: Square) => DomainResult;
  resign: (matchId: string) => DomainResult;
  requestRematch: (matchId: string, actorId: string) => DomainResult;
  answerRematch: (matchId: string, actorId: string, accept: boolean) => DomainResult;
  withdrawRematch: (matchId: string) => DomainResult;
  setSeatPresence: (matchId: string, actorId: string, present: boolean) => DomainResult;
  openLocalTable: (opponentId: string) => DomainResult;
  sendTableMessage: (matchId: string, body: string) => DomainResult;
  sendDirectMessage: (conversationId: string, body: string) => DomainResult;
  writeToFriend: (otherId: string, body: string) => DomainResult;
  ensureConversation: (otherId: string) => DomainResult;
  answerFriend: (requestId: string, accept: boolean) => DomainResult;
  requestFriend: (otherId: string) => DomainResult;
  endFriendship: (otherId: string) => DomainResult;
  blockMember: (otherId: string) => DomainResult;
  unblockMember: (otherId: string) => DomainResult;
  restore: () => void;
};

function nextId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ClubProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribeClub, getClub, getServerClub);
  const now = useSyncExternalStore(subscribeClub, getClubNow, getServerNow);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    openClub();
  }, []);

  const value = useMemo<ClubContextValue | null>(() => {
    if (!state) return null;
    const you = memberById(state, state.youId);
    if (!you) return null;

    const apply = (result: DomainResult) => {
      commitClub(result.state);
      setNotice(result.ok ? (result.notice ?? null) : (result.reason ?? "That action could not be completed."));
      return result;
    };

    return {
      state,
      now,
      notice,
      you,
      dismissNotice: () => setNotice(null),
      member: (id) => memberById(currentClub(), id),
      acceptChallenge: (id) => {
        const current = currentClub();
        return apply(acceptChallengeAction(current, id, current.youId, Date.now(), nextId("match")));
      },
      declineChallenge: (id) => {
        const current = currentClub();
        return apply(declineChallenge(current, id, current.youId, Date.now()));
      },
      cancelChallenge: (id) => {
        const current = currentClub();
        return apply(cancelChallenge(current, id, current.youId, Date.now()));
      },
      sendChallenge: (input) => {
        const current = currentClub();
        return apply(
          sendChallenge(current, {
            ...input,
            id: nextId("challenge"),
            challengerId: current.youId,
            now: Date.now(),
          }),
        );
      },
      playMove: (matchId, square) => {
        const current = currentClub();
        const match = current.matches.find((item) => item.id === matchId);
        const actorId = match ? (match.state.toMove === "dark" ? match.darkId : match.lightId) : current.youId;
        return apply(submitMove(current, matchId, actorId, square, Date.now()));
      },
      resign: (matchId) => {
        const current = currentClub();
        return apply(resignMatch(current, matchId, current.youId, Date.now()));
      },
      requestRematch: (matchId, actorId) => apply(requestRematchAction(currentClub(), matchId, actorId)),
      answerRematch: (matchId, actorId, accept) =>
        apply(answerRematchAction(currentClub(), matchId, actorId, accept, Date.now(), nextId("match"))),
      withdrawRematch: (matchId) => apply(withdrawRematch(currentClub(), matchId, currentClub().youId)),
      setSeatPresence: (matchId, actorId, present) => apply(setPresence(currentClub(), matchId, actorId, present)),
      openLocalTable: (opponentId) =>
        apply(openLocalTableAction(currentClub(), opponentId, Date.now(), nextId("match"))),
      sendTableMessage: (matchId, body) => {
        const current = currentClub();
        return apply(sendTableMessage(current, matchId, current.youId, body, Date.now(), nextId("msg")));
      },
      sendDirectMessage: (conversationId, body) => {
        const current = currentClub();
        return apply(sendDirectMessage(current, conversationId, current.youId, body, Date.now(), nextId("msg")));
      },
      writeToFriend: (otherId, body) => {
        const current = currentClub();
        const ensured = ensureDirectConversation(current, current.youId, otherId, nextId("talk"));
        if (!ensured.ok || !ensured.matchId) {
          setNotice(ensured.reason ?? "Messages are not available.");
          return ensured;
        }
        return apply(sendDirectMessage(ensured.state, ensured.matchId, current.youId, body, Date.now(), nextId("msg")));
      },
      ensureConversation: (otherId) => {
        const current = currentClub();
        const result = ensureDirectConversation(current, current.youId, otherId, nextId("talk"));
        if (result.ok && result.state !== current) commitClub(result.state);
        if (!result.ok) setNotice(result.reason ?? "Messages are not available.");
        return result;
      },
      answerFriend: (requestId, accept) => {
        const current = currentClub();
        return apply(answerFriendRequest(current, requestId, current.youId, accept, nextId("friend")));
      },
      requestFriend: (otherId) => {
        const current = currentClub();
        return apply(requestFriendship(current, current.youId, otherId, nextId("req")));
      },
      endFriendship: (otherId) => {
        const current = currentClub();
        return apply(endFriendship(current, current.youId, otherId, Date.now()));
      },
      blockMember: (otherId) => {
        const current = currentClub();
        return apply(blockMember(current, current.youId, otherId, nextId("block"), Date.now()));
      },
      unblockMember: (otherId) => apply(unblockMember(currentClub(), currentClub().youId, otherId)),
      restore: () => {
        restoreClub();
        setNotice("The sample club has been restored on this device.");
      },
    };
  }, [notice, now, state]);

  if (!value) {
    return (
      <div className="min-h-dvh bg-paper text-ink">
        <p className="px-5 pt-6 font-display text-3xl italic">The Club</p>
        <p className="px-5 pt-8 text-ink-soft">Opening the club…</p>
      </div>
    );
  }

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}

export function useClub(): ClubContextValue {
  const value = useContext(ClubContext);
  if (!value) throw new Error("useClub must be used within ClubProvider.");
  return value;
}
