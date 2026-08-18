import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Merges class names, with later Tailwind utilities beating earlier ones.
 *
 * This is what lets a consumer pass `className` to override a component's
 * built-in classes instead of fighting them on specificity.
 *
 * WHY THIS IS EXTENDED AND NOT PLAIN `twMerge`
 * -------------------------------------------
 * tailwind-merge decides which classes conflict from a built-in map of
 * Tailwind's DEFAULT scales. It has never seen this theme's type scale, so it
 * has to guess what `text-h2` is — and it guesses "colour", because
 * `text-<anything>` is a valid colour utility. `text-h2` and `text-danger` then
 * land in the same conflict group and the later one evicts the earlier:
 *
 *     cn("font-display text-h2 font-bold", "text-danger")
 *       →  "font-display font-bold text-danger"     // 30px silently became 15px
 *
 * Nothing errors, no class is missing from the stylesheet, and the verifier is
 * happy because every surviving class resolves. It is only visible if you
 * measure the rendered font size. This shipped in 0.1.0 in two places: a
 * StatTile whose value carried a tone, and every ImpactBox row in the confirm
 * dialog.
 *
 * Declaring the custom scales fixes every call site at once, and — the point of
 * doing it here rather than reordering classes at each call site — genuine size
 * conflicts still merge: `cn("text-h2", "text-h3")` correctly yields `text-h3`.
 *
 * Any new `--text-*` or `--shadow-*` token added to @vcyberizadmin/theme must be
 * added below, or it inherits the same silent bug. scripts/verify-merge.mjs
 * asserts these stay wired up.
 */
const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["display", "h1", "h2", "h3", "body", "small", "label"] },
      ],
      // Same failure mode: `shadow-e2` would otherwise be read as a shadow
      // COLOUR rather than a shadow.
      shadow: [{ shadow: ["e1", "e2", "e3", "e4"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs));
}
