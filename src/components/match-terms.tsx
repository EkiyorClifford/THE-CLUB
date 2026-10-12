"use client";

import { TIME_CONTROLS, type Mode } from "@/domain/types";
import { cx } from "@/lib/cx";

export function MatchTerms({
  mode,
  timeId,
  onMode,
  onTime,
}: {
  mode: Mode;
  timeId: (typeof TIME_CONTROLS)[number]["id"];
  onMode: (mode: Mode) => void;
  onTime: (id: (typeof TIME_CONTROLS)[number]["id"]) => void;
}) {
  const selected = TIME_CONTROLS.find((item) => item.id === timeId) ?? TIME_CONTROLS[0];

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="eyebrow">Mode</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Choice pressed={mode === "casual"} onClick={() => onMode("casual")} label="Casual" detail="The result is kept. Ratings do not change." />
          <Choice
            pressed={mode === "rated"}
            onClick={() => onMode("rated")}
            label="Rated"
            detail="Marked as rated. This prototype does not change the number."
          />
        </div>
      </fieldset>
      <fieldset>
        <legend className="eyebrow">Time</legend>
        <div className="mt-2 grid gap-2">
          {TIME_CONTROLS.map((control) => (
            <button
              key={control.id}
              type="button"
              aria-pressed={timeId === control.id}
              onClick={() => onTime(control.id)}
              className={cx(
                "min-h-11 border px-3 py-2 text-left",
                timeId === control.id ? "border-ink bg-paper-sunk" : "border-line bg-paper-raised",
              )}
            >
              <span className="font-semibold">{control.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-ink-soft">{selected.detail}</p>
      </fieldset>
    </div>
  );
}

function Choice({
  pressed,
  onClick,
  label,
  detail,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cx("min-h-11 border px-3 py-2 text-left", pressed ? "border-ink bg-paper-sunk" : "border-line bg-paper-raised")}
    >
      <span className="block font-semibold">{label}</span>
      <span className="mt-1 block text-sm text-ink-soft">{detail}</span>
    </button>
  );
}
