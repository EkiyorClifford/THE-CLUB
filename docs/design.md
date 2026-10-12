# Design

The Club should feel like a private members' room that happens to contain a beautiful table, not like a gaming dashboard.

## Direction

Warm paper, ink, and a deep felt board. Oxblood is the primary action and the challenge tray. Brass marks the last move and a short clock. Type is Fraunces for titles and Source Sans 3 for the interface. The wordmark is italic.

Game cards use photographs of the three boards, stored in `public/art`. Reversi is felt and discs. Chess is walnut and ivory. Scrabble is a wooden tile grid. Those pictures are not the playable board. The match still draws the engine state on felt.

Controls use a small radius. Buttons are at least 44px tall. On a narrow screen the five club routes sit in a bottom bar. Focus is a 2px ink outline, and on the felt it switches to the light disc colour.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#f3eee6` | Page |
| Paper raised | `#faf7f2` | Fields |
| Paper sunk | `#e6dfd2` | Notices, monograms |
| Ink | `#1b1714` | Text, button hover |
| Ink soft | `#5c534a` | Secondary text |
| Line | `#d4cbbd` | Rules and borders |
| Oxblood | `#6e2926` | Primary buttons, challenge tray, count |
| Brass | `#8d7043` | Turn mark, last move |
| Felt | `#17362c` | Squares |
| Felt deep | `#10261f` | Board frame |
| Disc dark | `#14110e` | Dark discs |
| Disc light | `#f4efe4` | Light discs |
| Online | `#2a6b45` | Presence, always with the words "In the room" |

Controls use a 6px radius on buttons and cards. The playable board is square. Buttons are at least 44px tall. Focus is a 2px ink outline, and on the felt it switches to the light disc colour so it stays visible.

Motion is limited to the disc colour change, and it is removed when the system asks for reduced motion.

## Composition

The lobby opens with a greeting, then three game cards. Reversi can be set up. Chess and Scrabble show the same kind of picture and say they are not open. Continue playing, invitations, friends, and recent results follow. On a wide screen the invitations sit in a side column. On a narrow screen the same order stacks, and the routes move to a bottom bar.

The match is a felt room. Players and clocks sit above the board. Moves, resignation, and table talk sit beside it on a wide screen, and behind Moves, Resign, and Chat on a narrow one.

Avatars are monograms. Missing images are not given a generated portrait.

## What the interface refuses to pretend

Chess and Scrabble are listed as closed. Rated results do not show a made-up rating delta. Clocks and messages are described as local.
