import { areFriends, isBlocked, memberById, messageBodySchema } from "./challenges";
import type { ChatMessage, ClubState, Conversation, DomainResult, FriendRequest } from "./types";

function fail(state: ClubState, reason: string): DomainResult {
  return { ok: false, state, reason };
}

const MESSAGE_GAP_MS = 1000;
const MESSAGE_WINDOW_MS = 60_000;
const MESSAGE_WINDOW_LIMIT = 20;

export type Relationship = "self" | "friends" | "incoming" | "outgoing" | "none";

export function relationship(state: ClubState, viewerId: string, otherId: string): Relationship {
  if (viewerId === otherId) return "self";
  if (areFriends(state, viewerId, otherId)) return "friends";
  const request = state.friendRequests.find(
    (item) =>
      item.status === "pending" &&
      ((item.fromId === otherId && item.toId === viewerId) ||
        (item.fromId === viewerId && item.toId === otherId)),
  );
  if (!request) return "none";
  return request.toId === viewerId ? "incoming" : "outgoing";
}

export function requestFriendship(state: ClubState, fromId: string, toId: string, requestId: string): DomainResult {
  if (fromId === toId) return fail(state, "You cannot add yourself.");
  if (!memberById(state, toId)) return fail(state, "No member by that name is in this prototype directory.");
  const current = relationship(state, fromId, toId);
  if (current === "friends") return fail(state, "You are already friends.");
  if (current === "outgoing" || current === "incoming") {
    return fail(state, "A friend request is already waiting.");
  }
  if (isBlocked(state, fromId, toId)) {
    return fail(state, "Friend requests are closed between these members.");
  }
  const request: FriendRequest = { id: requestId, fromId, toId, status: "pending" };
  return {
    ok: true,
    state: { ...state, friendRequests: [request, ...state.friendRequests] },
    notice: "Friend request sent.",
  };
}

export function answerFriendRequest(
  state: ClubState,
  requestId: string,
  actorId: string,
  accept: boolean,
  friendshipId: string,
): DomainResult {
  const request = state.friendRequests.find((item) => item.id === requestId);
  if (!request || request.status !== "pending") return fail(state, "That friend request is no longer waiting.");
  if (request.toId !== actorId) return fail(state, "Only the recipient can answer this request.");

  if (!accept) {
    return {
      ok: true,
      notice: "Friend request declined.",
      state: {
        ...state,
        friendRequests: state.friendRequests.map((item) =>
          item.id === requestId ? { ...item, status: "declined" } : item,
        ),
      },
    };
  }

  return {
    ok: true,
    notice: "You are now friends.",
    state: {
      ...state,
      friendRequests: state.friendRequests.map((item) =>
        item.id === requestId ? { ...item, status: "accepted" } : item,
      ),
      friendships: [
        { id: friendshipId, memberIds: [request.fromId, request.toId] },
        ...state.friendships,
      ],
    },
  };
}

export function endFriendship(state: ClubState, actorId: string, otherId: string, now: number): DomainResult {
  if (!areFriends(state, actorId, otherId)) return fail(state, "You are not friends.");
  return {
    ok: true,
    notice: "Friendship ended.",
    state: {
      ...state,
      friendships: state.friendships.filter((friendship) => {
        const [left, right] = friendship.memberIds;
        return !((left === actorId && right === otherId) || (left === otherId && right === actorId));
      }),
      challenges: state.challenges.map((challenge) => {
        const pair = [challenge.challengerId, challenge.recipientId];
        const involved = pair.includes(actorId) && pair.includes(otherId);
        if (involved && challenge.status === "pending" && challenge.expiresAt > now) {
          return { ...challenge, status: "cancelled" as const };
        }
        return challenge;
      }),
    },
  };
}

export function sendDirectMessage(
  state: ClubState,
  conversationId: string,
  authorId: string,
  body: string,
  now: number,
  messageId: string,
): DomainResult {
  const conversation = state.conversations.find((item) => item.id === conversationId);
  if (!conversation) return fail(state, "That conversation is not available.");
  if (!conversation.memberIds.includes(authorId)) {
    return fail(state, "You cannot read or write this conversation.");
  }
  const otherId = conversation.memberIds.find((id) => id !== authorId);
  if (!otherId || !areFriends(state, authorId, otherId)) {
    return fail(state, "Private messages are for friends.");
  }
  if (isBlocked(state, authorId, otherId)) {
    return fail(state, "Messages are closed between these members.");
  }
  return appendMessage(state, conversation, authorId, body, now, messageId);
}

export function sendTableMessage(
  state: ClubState,
  matchId: string,
  authorId: string,
  body: string,
  now: number,
  messageId: string,
): DomainResult {
  const match = state.matches.find((item) => item.id === matchId);
  if (!match) return fail(state, "That table is not in this prototype.");
  if (match.darkId !== authorId && match.lightId !== authorId) {
    return fail(state, "Only the two players can speak at this table.");
  }
  const parsed = messageBodySchema.safeParse(body);
  if (!parsed.success) {
    return fail(state, parsed.error.issues[0]?.message ?? "That message cannot be sent.");
  }
  const limited = withinRate(match.talk, authorId, now);
  if (limited) return fail(state, limited);

  const message: ChatMessage = { id: messageId, authorId, body: parsed.data, sentAt: now };
  return {
    ok: true,
    state: {
      ...state,
      matches: state.matches.map((item) =>
        item.id === matchId ? { ...item, talk: [...item.talk, message] } : item,
      ),
    },
  };
}

export function blockMember(
  state: ClubState,
  actorId: string,
  otherId: string,
  blockId: string,
  now: number,
): DomainResult {
  if (actorId === otherId) return fail(state, "You cannot block yourself.");
  if (!memberById(state, otherId)) return fail(state, "That member is not in the club directory.");
  if (state.blocks.some((block) => block.blockerId === actorId && block.blockedId === otherId)) {
    return fail(state, "You have already blocked this member.");
  }
  return {
    ok: true,
    notice: "Blocked on this device. Messages and challenges are closed both ways.",
    state: {
      ...state,
      blocks: [{ id: blockId, blockerId: actorId, blockedId: otherId }, ...state.blocks],
      challenges: state.challenges.map((challenge) => {
        const pair = [challenge.challengerId, challenge.recipientId];
        const involved = pair.includes(actorId) && pair.includes(otherId);
        if (involved && challenge.status === "pending" && challenge.expiresAt > now) {
          return { ...challenge, status: "cancelled" as const };
        }
        return challenge;
      }),
    },
  };
}

export function unblockMember(state: ClubState, actorId: string, otherId: string): DomainResult {
  const mine = state.blocks.some((block) => block.blockerId === actorId && block.blockedId === otherId);
  if (!mine) return fail(state, "You have not blocked this member.");
  return {
    ok: true,
    notice: "Block removed on this device.",
    state: {
      ...state,
      blocks: state.blocks.filter((block) => !(block.blockerId === actorId && block.blockedId === otherId)),
    },
  };
}

export function ensureDirectConversation(state: ClubState, viewerId: string, otherId: string, conversationId: string): DomainResult {
  if (!areFriends(state, viewerId, otherId)) return fail(state, "Private messages are for friends.");
  if (isBlocked(state, viewerId, otherId)) return fail(state, "Messages are closed between these members.");
  const existing = state.conversations.find((conversation) => {
    const [left, right] = conversation.memberIds;
    return (left === viewerId && right === otherId) || (left === otherId && right === viewerId);
  });
  if (existing) return { ok: true, state, matchId: existing.id };
  const conversation: Conversation = {
    id: conversationId,
    memberIds: [viewerId, otherId],
    messages: [],
  };
  return {
    ok: true,
    matchId: conversation.id,
    state: { ...state, conversations: [conversation, ...state.conversations] },
  };
}

function appendMessage(
  state: ClubState,
  conversation: Conversation,
  authorId: string,
  body: string,
  now: number,
  messageId: string,
): DomainResult {
  const parsed = messageBodySchema.safeParse(body);
  if (!parsed.success) {
    return fail(state, parsed.error.issues[0]?.message ?? "That message cannot be sent.");
  }
  const limited = withinRate(conversation.messages, authorId, now);
  if (limited) return fail(state, limited);
  const message: ChatMessage = { id: messageId, authorId, body: parsed.data, sentAt: now };
  return {
    ok: true,
    state: {
      ...state,
      conversations: state.conversations.map((item) =>
        item.id === conversation.id ? { ...item, messages: [...item.messages, message] } : item,
      ),
    },
  };
}

function withinRate(messages: ChatMessage[], authorId: string, now: number): string | null {
  const own = messages.filter((message) => message.authorId === authorId);
  const last = own[own.length - 1];
  if (last && now - last.sentAt < MESSAGE_GAP_MS) {
    return "Wait a moment before sending another message.";
  }
  const recent = own.filter((message) => now - message.sentAt < MESSAGE_WINDOW_MS).length;
  if (recent >= MESSAGE_WINDOW_LIMIT) {
    return "You have sent too many messages in the last minute.";
  }
  return null;
}
