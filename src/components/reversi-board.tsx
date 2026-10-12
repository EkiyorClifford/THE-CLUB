"use client";

import { useRef, useState } from "react";

import { discsFlipped, legalMoves, squareToNotation, type ReversiState, type Square } from "@/games/reversi/engine";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

type Props = {
  state: ReversiState;
  disabled?: boolean;
  onMove: (square: Square) => void;
};

export function ReversiBoard({ state, disabled = false, onMove }: Props) {
  const moves = disabled ? [] : legalMoves(state);
  const legal = new Set(moves.map((square) => key(square)));
  const [focus, setFocus] = useState<Square>({ row: 3, col: 2 });
  const refs = useRef<Array<Array<HTMLButtonElement | null>>>([]);

  function focusSquare(square: Square) {
    const next = {
      row: (square.row + 8) % 8,
      col: (square.col + 8) % 8,
    };
    setFocus(next);
    refs.current[next.row]?.[next.col]?.focus();
  }

  return (
    <div className="bg-felt-deep px-2 pt-2 pb-3 sm:px-3 sm:pt-3">
      <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-1">
        <div className="grid grid-rows-8">
          {FILES.map((_, index) => (
            <span key={index} className="grid place-items-center text-xs text-disc-light tabular-nums">
              {8 - index}
            </span>
          ))}
        </div>
        <div
          role="grid"
          aria-label="Reversi board"
          className="grid grid-cols-8 gap-px bg-felt-line"
          onKeyDown={(event) => {
            const directions: Record<string, Square> = {
              ArrowUp: { row: -1, col: 0 },
              ArrowDown: { row: 1, col: 0 },
              ArrowLeft: { row: 0, col: -1 },
              ArrowRight: { row: 0, col: 1 },
            };
            const step = directions[event.key];
            if (!step) return;
            event.preventDefault();
            focusSquare({ row: focus.row + step.row, col: focus.col + step.col });
          }}
        >
          {state.board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const square = { row: rowIndex, col: colIndex };
              const playable = legal.has(key(square));
              const flips = playable ? discsFlipped(state.board, square, state.toMove).length : 0;
              const notation = squareToNotation(square);
              const isLast = state.lastMove?.row === rowIndex && state.lastMove.col === colIndex;
              const label = cell
                ? `${notation}, ${cell} disc${isLast ? ", last move" : ""}`
                : playable
                  ? `Play ${notation}, flips ${flips}`
                  : `${notation}, empty`;
              return (
                <button
                  key={notation}
                  ref={(node) => {
                    const line = refs.current[rowIndex] ?? [];
                    line[colIndex] = node;
                    refs.current[rowIndex] = line;
                  }}
                  type="button"
                  role="gridcell"
                  aria-label={label}
                  aria-disabled={!playable}
                  tabIndex={focus.row === rowIndex && focus.col === colIndex ? 0 : -1}
                  disabled={!playable}
                  onFocus={() => setFocus(square)}
                  onClick={() => {
                    if (playable) onMove(square);
                  }}
                  className="board-square relative grid aspect-square place-items-center bg-felt disabled:cursor-default"
                >
                  {cell ? <span className={cell === "dark" ? "disc disc-dark" : "disc disc-light"} /> : null}
                  {playable ? (
                    <span className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
                      <span className="size-[18%] rounded-full border border-disc-light" />
                    </span>
                  ) : null}
                  {isLast ? <span className="pointer-events-none absolute inset-[3px] border border-brass" aria-hidden="true" /> : null}
                </button>
              );
            }),
          )}
        </div>
        <span />
        <div className="grid grid-cols-8">
          {FILES.map((file) => (
            <span key={file} className="grid place-items-center text-xs text-disc-light uppercase">
              {file}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function key(square: Square): string {
  return `${square.row}-${square.col}`;
}
