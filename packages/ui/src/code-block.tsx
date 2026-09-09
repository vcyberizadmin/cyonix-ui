/**
 * CodeBlock — a detection rule, a query, a payload. Multi-line, numbered.
 *
 * The sibling of `Code`, which is an inline chip for a hostname or a hash. This
 * is the block form, and the difference that matters is the gutter: a detection
 * rule gets discussed line by line ("the join on line 4 is the expensive one"),
 * so the numbers are content, not decoration.
 *
 * They are rendered as real text rather than a CSS counter so that they survive
 * a copy — but the copy affordance deliberately copies the CODE ONLY. Pasting a
 * rule with "01  " welded to every line is worse than useless, and that is
 * exactly what a naive select-all gives you, which is the reason `onCopy`
 * exists rather than leaving the caller to read `textContent`.
 *
 * Its ground is `--code-bg`, a step darker than any surface in either theme, so
 * a block reads as machine output rather than as another panel.
 */
import { cn } from "./lib/cn.js";

export interface CodeBlockProps {
  /** The source. Split on newlines; trailing blank lines are dropped. */
  children: string;
  /** Omit the gutter for something short that nobody will cite by line. */
  numbered?: boolean;
  /**
   * Given the code WITHOUT line numbers, so a paste is usable. Wire it to a
   * clipboard write and a toast; the component owns neither.
   */
  onCopy?: (code: string) => void;
  /** Accessible label, e.g. "Detection logic". */
  label?: string;
  className?: string;
}

export function CodeBlock({
  children,
  numbered = true,
  onCopy,
  label,
  className,
}: CodeBlockProps) {
  const lines = children.replace(/\n+$/, "").split("\n");
  const width = String(lines.length).length;

  return (
    <pre
      {...(label ? { role: "region", "aria-label": label } : {})}
      className={cn(
        "bg-code text-code-fg overflow-x-auto rounded-lg px-[1.1rem] py-4 font-mono text-[12px] leading-[1.7]",
        className,
      )}
    >
      <code>
        {lines.map((line, index) => (
          <span key={index} className="block">
            {numbered && (
              // aria-hidden: a screen reader announcing "zero one" before
              // every line turns a six-line rule into forty words of noise.
              <span aria-hidden="true" className="text-code-gutter select-none">
                {String(index + 1).padStart(width, "0")}
                {"  "}
              </span>
            )}
            {line || " "}
          </span>
        ))}
      </code>
      {onCopy && (
        <button
          type="button"
          onClick={() => onCopy(lines.join("\n"))}
          className="sr-only"
        >
          Copy
        </button>
      )}
    </pre>
  );
}
