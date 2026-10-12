# Architecture

Phase 0 and Phase 1 are a local prototype. The domain rules are real. Persistence, auth, and live sync are not.

## Why a prototype

The workspace had no application and no Supabase credentials. Inventing a connected backend would have misrepresented the product. The interface tells you when something lives only on this device.

When a Supabase project exists, the same rules should move behind server actions. The database becomes the source of truth. Realtime only distributes states the server has already accepted.

## Boundaries

- `src/games/reversi` knows the rules of Reversi and nothing about React or the club.
- `src/domain` accepts or rejects challenges, moves, friendships, and messages. It never changes a rating.
- `src/prototype` holds sample people and the browser store.
- `src/components` and `src/app` render that store.

Chess will later sit beside Reversi behind the same match actions, using a chess rules library. Scrabble waits until there is a dictionary, a tile bag, and scoring. Neither is given a fake board.

## Matches

One match record holds the engine state, the mode, the clocks, the result, presence, and table talk. A challenge is a separate record. Accepting a pending challenge creates a match and marks the challenge accepted. A second accept finds that status and creates nothing.

The challenger takes dark and moves first. A rematch swaps colours and is a new match. Requesting a rematch does not create it.

Casual and rated are stored on the match. Completion does not write a rating. That is deliberate: the prototype must not invent an Elo change.

Planned rating, once results are server-settled:

- Algorithm: Elo.
- Starting rating: 1500.
- K-factor: 32.
- Separate rating per game.
- Applied once, in the same transaction as the result, only for a completed rated match that has not already been rated.
- Casual results never enter that transaction.
- Players with zero settled games stay unranked.

## Clocks

Time controls are untimed, 5 minutes, or 10 minutes. Only the side to move loses time. In this prototype the clock is `stored remaining − (now − last update)` in the browser. A disconnected tab does not pause it, but the clock is not authoritative. The server version should store the timestamp of the last committed move and decide timeouts there.

## Challenges

Pending challenges expire 15 minutes after they are sent. Expiry is `expiresAt <= now`. The recipient is the only person who can accept or decline. The sender is the only person who can withdraw. One member may have only one pending outgoing challenge.

The database version should accept with a conditional update: `status = 'pending' and expires_at > now()`, and insert the match in the same transaction.

## Messages

Direct messages require a friendship and membership in the conversation. Table talk is stored on the match and is limited to the two players. The two are not the same list.

The prototype also refuses an empty message, a message over 500 characters, a second message inside one second, and more than 20 messages from the same author in a minute. That check is local. It is not a security boundary until it runs on the server.

The prototype keeps a block list on this device. A block in either direction refuses new challenges and private messages, and cancels pending challenges between the pair. Ending a friendship does the same for pending challenges and stops new messages. The server must enforce blocking itself. Hiding a button is not the rule.

## Membership

The sample treats Inez as a member. Other people are a fixed directory. Friend requests do not grant membership, and this build does not send club invitations.

## Not in this phase

Redis, extra services, public matchmaking, multiple clubs, attachments, and voice are out of scope.
