import { initials } from "@/domain/format";
import { cx } from "@/lib/cx";

export function Monogram({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-grid shrink-0 place-items-center border border-line bg-paper-sunk font-display leading-none",
        size === "lg" ? "size-16 text-xl" : "size-10 text-sm",
      )}
    >
      {initials(name)}
    </span>
  );
}

export function Presence({ presence }: { presence: "online" | "offline" }) {
  const here = presence === "online";
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
      <span className={cx("size-2 shrink-0", here ? "bg-online" : "border border-ink-faint")} aria-hidden="true" />
      {here ? "In the room" : "Away"}
    </span>
  );
}
