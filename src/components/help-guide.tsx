import type { HelpSection } from "@/help/reversi-guide";

export function HelpGuide({ sections }: { sections: readonly HelpSection[] }) {
  return (
    <div className="mt-8 space-y-8">
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={section.id}>
          <h2 id={section.id} className="font-display text-2xl font-medium">
            {section.title}
          </h2>
          {section.kind === "tip" ? <p className="eyebrow mt-2">Not a rule</p> : null}
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-2 max-w-xl text-ink-soft">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
