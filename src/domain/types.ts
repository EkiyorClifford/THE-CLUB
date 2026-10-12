import type { ReversiState } from "@/games/reversi/engine";

export type GameId = "reversi" | "chess" | "scrabble";
export type Mode = "casual" | "rated";
export type Disc = "dark" | "light";

export type Rating = {
  value: number;
  games: number;
};

export type Member = {
  id: string;
  displayName: string;
  username: string;
  presence: "online" | "offline";
  ratings: Record<"reversi" | "chess", Rating>;
};

export type TimeControl =
  | { kind: "untimed" }
  | { kind: "sudden-death"; secondsPerPlayer: number };

export type ChallengeStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled";

export type Challenge = {
  id: string;
  challengerId: string;
  recipientId: string;
  game: GameId;
  mode: Mode;
  timeControl: TimeControl;
  status: ChallengeStatus;
  createdAt: number;
  expiresAt: number;
  matchId?: string;
};

export type MatchResult = {
  winner: Disc | "draw";
  reason: "score" | "resignation" | "timeout";
};

export type ChatMessage = {
  id: string;
  authorId: string;
  body: string;
  sentAt: number;
};

export type Match = {
  game: "reversi";
  id: string;
  mode: Mode;
  timeControl: TimeControl;
  darkId: string;
  lightId: string;
  state: ReversiState;
  status: "active" | "complete";
  result: MatchResult | null;
  clocks: { dark: number; light: number } | null;
  clockUpdatedAt: number;
  /** Who is still in the match screen. Rematch requires both. */
  present: { dark: boolean; light: boolean };
  rematch:
    | {
        requestedBy: string;
        status: "pending" | "accepted" | "declined" | "withdrawn";
        nextMatchId?: string;
      }
    | null;
  talk: ChatMessage[];
  local: boolean;
};

export type Friendship = {
  id: string;
  memberIds: [string, string];
};

export type FriendRequest = {
  id: string;
  fromId: string;
  toId: string;
  status: "pending" | "accepted" | "declined";
};

export type Conversation = {
  id: string;
  memberIds: [string, string];
  messages: ChatMessage[];
};

/** A block is directional. Either direction closes messages and challenges. */
export type Block = {
  id: string;
  blockerId: string;
  blockedId: string;
};

export type ClubState = {
  youId: string;
  members: Member[];
  friendships: Friendship[];
  friendRequests: FriendRequest[];
  challenges: Challenge[];
  matches: Match[];
  conversations: Conversation[];
  blocks: Block[];
};

export type DomainResult = {
  ok: boolean;
  state: ClubState;
  reason?: string;
  notice?: string;
  matchId?: string;
};

export const CHALLENGE_TTL_MS = 15 * 60 * 1000;

export const TIME_CONTROLS = [
  {
    id: "untimed",
    label: "Untimed",
    detail: "The board waits. Either player can move when they return.",
    timeControl: { kind: "untimed" } as TimeControl,
  },
  {
    id: "10",
    label: "10 minutes",
    detail: "Each player has 10 minutes. Only the side to move loses time.",
    timeControl: { kind: "sudden-death", secondsPerPlayer: 600 } as TimeControl,
  },
  {
    id: "5",
    label: "5 minutes",
    detail: "Each player has 5 minutes. Only the side to move loses time.",
    timeControl: { kind: "sudden-death", secondsPerPlayer: 300 } as TimeControl,
  },
] as const;
