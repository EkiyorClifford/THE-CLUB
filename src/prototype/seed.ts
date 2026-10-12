import { boardFromDiagram, completedFromBoard, initialState } from "@/games/reversi/engine";

import { CHALLENGE_TTL_MS, type ClubState } from "@/domain/types";

export function createSeed(now: number): ClubState {
  const recordBoard = completedFromBoard(
    boardFromDiagram(`
      DDDDDDDD
      DDDDDDDD
      DDDDDDDD
      DDDDDDDD
      DDDDDDDD
      LLLLLLLL
      LLLLLLLL
      LLLLLLLL
    `),
  );

  return {
    youId: "inez",
    members: [
      {
        id: "inez",
        displayName: "Inez Calder",
        username: "inez",
        presence: "online",
        ratings: { reversi: { value: 1516, games: 18 }, chess: { value: 1490, games: 11 } },
      },
      {
        id: "mara",
        displayName: "Mara Ellison",
        username: "mara",
        presence: "online",
        ratings: { reversi: { value: 1544, games: 22 }, chess: { value: 1602, games: 30 } },
      },
      {
        id: "julian",
        displayName: "Julian Okonkwo",
        username: "julian",
        presence: "online",
        ratings: { reversi: { value: 1488, games: 9 }, chess: { value: 1710, games: 40 } },
      },
      {
        id: "ada",
        displayName: "Ada Voss",
        username: "ada",
        presence: "offline",
        ratings: { reversi: { value: 1412, games: 7 }, chess: { value: 1433, games: 4 } },
      },
      {
        id: "theo",
        displayName: "Theo Marchetti",
        username: "theo",
        presence: "offline",
        ratings: { reversi: { value: 1500, games: 0 }, chess: { value: 1508, games: 6 } },
      },
      {
        id: "leah",
        displayName: "Leah Quinn",
        username: "leah",
        presence: "offline",
        ratings: { reversi: { value: 1500, games: 0 }, chess: { value: 1500, games: 0 } },
      },
      {
        id: "samir",
        displayName: "Samir Adeyemi",
        username: "samir",
        presence: "online",
        ratings: { reversi: { value: 1521, games: 3 }, chess: { value: 1500, games: 0 } },
      },
    ],
    friendships: [
      { id: "f-mara", memberIds: ["inez", "mara"] },
      { id: "f-julian", memberIds: ["inez", "julian"] },
      { id: "f-ada", memberIds: ["inez", "ada"] },
      { id: "f-theo", memberIds: ["inez", "theo"] },
    ],
    friendRequests: [{ id: "req-leah", fromId: "leah", toId: "inez", status: "pending" }],
    challenges: [
      {
        id: "ch-julian",
        challengerId: "julian",
        recipientId: "inez",
        game: "reversi",
        mode: "casual",
        timeControl: { kind: "untimed" },
        status: "pending",
        createdAt: now - (CHALLENGE_TTL_MS - 70_000),
        expiresAt: now + 70_000,
      },
      {
        id: "ch-theo",
        challengerId: "theo",
        recipientId: "inez",
        game: "reversi",
        mode: "rated",
        timeControl: { kind: "sudden-death", secondsPerPlayer: 300 },
        status: "pending",
        createdAt: now - 3 * 60_000,
        expiresAt: now - 3 * 60_000 + CHALLENGE_TTL_MS,
      },
      {
        id: "ch-ada",
        challengerId: "inez",
        recipientId: "ada",
        game: "reversi",
        mode: "casual",
        timeControl: { kind: "sudden-death", secondsPerPlayer: 600 },
        status: "pending",
        createdAt: now - 2 * 60_000,
        expiresAt: now - 2 * 60_000 + CHALLENGE_TTL_MS,
      },
    ],
    matches: [
      {
        game: "reversi",
        id: "table-mara",
        mode: "rated",
        timeControl: { kind: "sudden-death", secondsPerPlayer: 600 },
        darkId: "inez",
        lightId: "mara",
        state: initialState(),
        status: "active",
        result: null,
        clocks: { dark: 600_000, light: 600_000 },
        clockUpdatedAt: now,
        present: { dark: true, light: true },
        rematch: null,
        talk: [],
        local: true,
      },
      {
        game: "reversi",
        id: "record-ada",
        mode: "casual",
        timeControl: { kind: "untimed" },
        darkId: "inez",
        lightId: "ada",
        state: recordBoard,
        status: "complete",
        result: { winner: "dark", reason: "score" },
        clocks: null,
        clockUpdatedAt: now - 86_400_000,
        present: { dark: false, light: false },
        rematch: null,
        talk: [],
        local: true,
      },
    ],
    blocks: [],
    conversations: [
      {
        id: "talk-mara",
        memberIds: ["inez", "mara"],
        messages: [
          {
            id: "msg-mara-1",
            authorId: "mara",
            body: "Are you sitting down tonight?",
            sentAt: now - 60 * 60_000,
          },
          {
            id: "msg-inez-1",
            authorId: "inez",
            body: "Yes. I'll take the dark discs.",
            sentAt: now - 50 * 60_000,
          },
        ],
      },
    ],
  };
}
