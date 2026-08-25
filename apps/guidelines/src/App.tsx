import type { ReactNode } from "react";
import { DocNav, DocTopBar, Section } from "./chrome.js";

/**
 * A code block, local to this page.
 *
 * `Code` in the library is an INLINE chip — a rounded token for a symbol name
 * inside a sentence — and has no block form. The design system reference has
 * `pre.code`; we do not. Logged as a gap rather than papered over: when a
 * CodeBlock ships, this goes.
 */
function Pre({ children }: { children: ReactNode }) {
  return (
    <pre className="bg-neutral-950 text-neutral-200 border-rule overflow-x-auto rounded-lg border p-5 font-mono text-[12px] leading-relaxed">
      {children}
    </pre>
  );
}
import { Foundations } from "./sections/foundations.js";
import { Charts } from "./sections/charts.js";
import { Components } from "./sections/components.js";

const VERSION = "v0.2";

export function App() {
  return (
    <div className="mx-auto flex max-w-[1600px]">
      <DocNav />
      <main className="min-w-0 flex-1">
        <DocTopBar version={VERSION} />
        <div id="top" className="max-w-[1180px] space-y-20 px-5 py-10 sm:px-9">
          <section>
            <span className="bg-wash-accent/30 text-accent-ink rounded-sm px-2 py-1 text-[10.5px] font-extrabold tracking-[0.05em] uppercase">
              Design system
            </span>
            <h1 className="font-display mt-4 text-[40px] leading-[1.05] font-bold tracking-tight sm:text-[54px]">
              Cyonix Design
              <br />
              Guidelines
            </h1>
            <p className="text-fg-2 mt-5 max-w-[620px] text-[16px] leading-relaxed">
              The visual language behind the Cyonix consoles. Everything on this page is
              rendered from <code className="font-mono text-[14px]">@vcyberizadmin/ui</code> and{" "}
              <code className="font-mono text-[14px]">@vcyberizadmin/theme</code> — the same
              components and tokens the products run on, so this page cannot drift from them.
              Flip the theme in the top bar to check any component in both modes.
            </p>
          </section>

          <Foundations />
          <Components />
          <Charts />

          <Section
            id="tokens"
            title="Token export"
            lede="The contract a host app fulfils. Install the theme, define the three font variables, and every component works."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div>
                <p className="text-fg-quaternary mb-2.5 font-mono text-[11.5px] font-semibold tracking-[0.04em] uppercase">
                  Install
                </p>
                <Pre>{`pnpm add @vcyberizadmin/ui @vcyberizadmin/theme`}</Pre>
              </div>
              <div>
                <p className="text-fg-quaternary mb-2.5 font-mono text-[11.5px] font-semibold tracking-[0.04em] uppercase">
                  app.css
                </p>
                <Pre>{`@import "tailwindcss";
@import "@vcyberizadmin/theme";
@source "../node_modules/@vcyberizadmin/ui/dist/**/*.js";

/* theme.css names no families — supply them, as next/font does. */
:root {
  --font-space-grotesk: "Space Grotesk";
  --font-inter: "Inter";
  --font-jetbrains-mono: "JetBrains Mono";
}`}</Pre>
              </div>
            </div>
          </Section>

          <footer className="border-rule text-fg-2 flex flex-wrap items-center gap-4 border-t pt-10 pb-16 text-[13px]">
            <p className="font-bold">cyonix.ai — design guidelines {VERSION}</p>
            <p className="text-fg-quaternary ml-auto text-[12.5px]">
              Tokens: Cyonix Token Variables · Type: Space Grotesk, Inter, JetBrains Mono
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
