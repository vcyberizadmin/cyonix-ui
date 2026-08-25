import { Logo } from "@vcyberizadmin/ui/layout";
import { cn } from "@vcyberizadmin/ui";
import { useEffect, useState, type ReactNode } from "react";
import { ALL_SECTIONS, NAV } from "./nav.js";

/**
 * Highlights the section currently in view.
 *
 * Rather than "whichever section last crossed the top", it tracks every
 * intersecting section and picks the highest one on the page. The simpler
 * version flickers between two neighbours whenever a short section is fully
 * visible alongside the next, which is exactly what happens on this page.
 */
function useScrollSpy(): string {
  const [active, setActive] = useState(ALL_SECTIONS[0]?.id ?? "");

  useEffect(() => {
    // The registry claims a link can never point at a missing section. It only
    // *claims* it — nothing enforced it, and the Charts section shipped in the
    // nav with no section behind it, so the link scrolled nowhere and the spy
    // could never highlight it. Nothing failed; the page just quietly lied.
    // This makes the invariant real in development.
    if (import.meta.env.DEV) {
      const missing = ALL_SECTIONS.filter((s) => !document.getElementById(s.id));
      if (missing.length) {
        console.error(
          `[guidelines] ${missing.length} nav entr${missing.length === 1 ? "y has" : "ies have"} no section in the page: ` +
            missing.map((s) => `#${s.id}`).join(", ") +
            ". Add the section, or remove it from nav.ts.",
        );
      }
    }

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = ALL_SECTIONS.find((s) => visible.has(s.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-12% 0px -70% 0px" },
    );
    for (const section of ALL_SECTIONS) {
      const node = document.getElementById(section.id);
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);

  return active;
}

function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    document.documentElement.classList.toggle("light", !dark);
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

const Sun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
const Moon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]">
    <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
  </svg>
);
const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export function DocNav() {
  const active = useScrollSpy();
  return (
    <aside className="border-rule sticky top-0 hidden h-dvh w-[254px] shrink-0 flex-col border-r px-4 py-6 lg:flex">
      <a href="#top" className="mb-7 flex items-center gap-3 px-2">
        <Logo size="md" />
      </a>
      <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="text-fg-quaternary mb-1.5 px-3 text-[10.5px] font-bold tracking-[0.12em] uppercase">
              {group.label}
            </p>
            {group.sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                aria-current={active === section.id ? "true" : undefined}
                className={cn(
                  "duration-instant ease-brand block rounded-md px-3 py-1.5 text-[13.5px] font-bold transition-colors",
                  active === section.id
                    ? "text-accent-ink bg-wash-accent/25"
                    : "text-fg-2 hover:text-fg hover:bg-wash-hover",
                )}
              >
                {section.label}
              </a>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function DocTopBar({ version }: { version: string }) {
  const { dark, toggle } = useTheme();
  return (
    <header className="border-rule bg-bg/85 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="flex h-[70px] items-center gap-4 px-5 sm:px-9">
        <span className="lg:hidden">
          <Logo mini size="md" />
        </span>
        <div className="text-fg-2 hidden items-center gap-2 text-[13px] font-bold sm:flex">
          <span>Cyonix</span>
          <Chevron />
          <span className="text-fg">Design Guidelines</span>
          <span className="bg-wash-2 text-fg-2 ml-1 rounded-sm px-1.5 py-0.5 text-[10.5px] font-extrabold tracking-[0.03em] uppercase">
            {version}
          </span>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          className="bg-wash-2 text-fg hover:bg-wash-3 duration-instant ease-brand ml-auto grid size-11 cursor-pointer place-items-center rounded-lg transition-colors"
        >
          {dark ? <Sun /> : <Moon />}
        </button>
      </div>
    </header>
  );
}

/** A documented section: heading, one-line rationale, then the specimens. */
export function Section({
  id,
  title,
  lede,
  children,
}: {
  id: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-[26px] font-bold tracking-tight">{title}</h2>
      {lede && <p className="text-fg-2 mt-2 max-w-[70ch] text-[15px]">{lede}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** A specimen panel. `label` is the uppercase meta line the reference uses. */
export function Demo({
  label,
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-surface border-rule rounded-xl border p-6", className)}>
      {label && (
        <p className="text-fg-quaternary mb-4 font-mono text-[11.5px] font-semibold tracking-[0.04em] uppercase">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

/** Mono meta line — the reference calls this `.spec`. */
export function Spec({ children }: { children: ReactNode }) {
  return (
    <span className="text-fg-quaternary font-mono text-[11.5px] font-semibold">
      {children}
    </span>
  );
}
