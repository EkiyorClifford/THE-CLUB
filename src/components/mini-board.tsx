import type { Board } from "@/games/reversi/engine";

export function MiniBoard({ board, label, size = "md" }: { board: Board; label: string; size?: "sm" | "md" }) {
  return (
    <div
      className={size === "sm" ? "grid size-16 shrink-0 grid-cols-8 gap-px bg-felt-line p-px" : "grid size-28 shrink-0 grid-cols-8 gap-px bg-felt-line p-px sm:size-32"}
      aria-hidden={label ? undefined : true}
      role="img"
      aria-label={label}
    >
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <span key={`${rowIndex}-${colIndex}`} className="bg-felt">
            {cell ? (
              <span
                className={
                  cell === "dark"
                    ? "m-auto mt-[14%] block size-[72%] rounded-full bg-disc-dark"
                    : "m-auto mt-[14%] block size-[72%] rounded-full bg-disc-light"
                }
              />
            ) : null}
          </span>
        )),
      )}
    </div>
  );
}
