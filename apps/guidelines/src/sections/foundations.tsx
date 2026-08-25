import { Logo } from "@vcyberizadmin/ui/layout";
import { useEffect, useState } from "react";
import { Demo, Section, Spec } from "../chrome.js";

/* The Base Collection, named the way the token file names it. */
const RAMPS: Array<[string, string[]]> = [
  ["Neutral", ["0","50","100","200","300","400","500","600","700","800","850","900","950"]],
  ["Orange", ["50","100","150","200","250","300","350","400","450","500","550","600"]],
  ["Red", ["100","150","200","250","300","350","400","450","500","550"]],
  ["Green", ["50","100","150","200","250","300","350","400","450","500","550","600"]],
  ["Amber", ["50","100","150","200","250","300","350","400","450","500","550","600"]],
  ["Blue", ["50","100","150","200","250","300","350","400","450","500","550","600"]],
  ["Amethyst", ["50","100","150","200","250","300","350","400","450","500","550","600"]],
];

const ROLE_TOKENS: Array<[string, string]> = [
  ["--bg", "app background"],
  ["--surface", "cards and elevated surfaces"],
  ["--surface-2", "elements inside a card"],
  ["--rule", "hairline dividers"],
  ["--fg", "primary text"],
  ["--fg-2", "secondary text"],
  ["--fg-muted", "tertiary text, captions"],
  ["--accent", "primary action, current location"],
  ["--accent-fg", "ink that sits ON the accent fill"],
  ["--ok", "success mark"],
  ["--warning", "warning mark"],
  ["--danger", "error mark"],
  ["--info", "info mark"],
  ["--ai", "agent output — Amethyst, and only this"],
];
const ROLE_NAMES = ROLE_TOKENS.map(([t]) => t);

/**
 * Reads the tokens back out of the document rather than restating them.
 *
 * A guidelines page that hard-codes its own swatches is a second source of
 * truth, and the first thing to drift. These come from getComputedStyle, so the
 * page is wrong only if the theme is wrong — and it re-reads when the theme
 * class flips, because most of these differ between modes.
 */
function useRoleValues(): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      const next: Record<string, string> = {};
      for (const n of ROLE_NAMES) next[n] = cs.getPropertyValue(n).trim();
      setValues(next);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
  return values;
}

export function Foundations() {
  const roles = useRoleValues();

  return (
    <>
      <Section id="principles" title="Principles"
        lede="Four rules that settle most design arguments before they start.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["One accent, earned", "Orange marks the current location or the single most important action. If two things are orange, one of them is wrong."],
            ["Mark and ink differ", "The hue you fill with is not the hue you set text in. Every semantic colour ships as a pair, because the fill version fails contrast as a label."],
            ["Hairlines, not gaps", "Groups separate by a rule. Space alone reads as an accident; a line reads as a decision."],
            ["Dark is the master", "Designed dark first and mirrored to light through tokens, never through one-off overrides."],
          ].map(([title, body]) => (
            <Demo key={title}>
              <h3 className="font-display text-[16px] font-bold">{title}</h3>
              <p className="text-fg-2 mt-2 text-[13.5px] leading-relaxed">{body}</p>
            </Demo>
          ))}
        </div>
      </Section>

      <Section id="brand" title="Brand &amp; logo"
        lede="The official artwork. The wordmark takes currentColor, so one component serves both themes and there is no light/dark pair to keep in sync.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Demo className="flex min-h-[190px] flex-col items-center justify-center gap-5">
            <Logo size="lg" /><Spec>full lockup · 498 × 97</Spec>
          </Demo>
          <Demo className="flex min-h-[190px] flex-col items-center justify-center gap-5">
            <Logo mini size="lg" /><Spec>star · collapsed rail</Spec>
          </Demo>
          <Demo className="flex min-h-[190px] flex-col items-center justify-center gap-5">
            <Logo size="lg" module="SOC" /><Spec>module badge</Spec>
          </Demo>
          <Demo className="flex min-h-[190px] flex-col items-center justify-center gap-5">
            <span className="grid size-[76px] place-items-center rounded-[26px]"
              style={{ background: "var(--spark)" }}>
              <Logo mini size="lg" />
            </span>
            <Spec>spark gradient · logo only</Spec>
          </Demo>
        </div>
      </Section>

      <Section id="colour" title="Colour"
        lede="Seven ramps from the Base Collection, assigned to roles by the Color Tokens. Components never hard-code a hex; they read a role.">
        <div className="space-y-6">
          {RAMPS.map(([name, steps]) => (
            <div key={name}>
              <h3 className="font-display mb-3 text-[15px] font-bold">{name}</h3>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-13">
                {steps.map((step) => (
                  <div key={step} className="bg-surface border-rule overflow-hidden rounded-md border">
                    <div className="h-11" style={{ background: `var(--${name.toLowerCase()}-${step})` }} />
                    <p className="text-fg-2 px-1.5 py-1 text-center font-mono text-[10px] font-semibold">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <h3 className="font-display mb-2 text-[15px] font-bold">Roles, live</h3>
            <p className="text-fg-2 mb-3 text-[13.5px]">
              Read from the document, not restated — flip the theme and these follow.
            </p>
            <div className="bg-surface border-rule overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead>
                    <tr className="text-fg-quaternary text-[10.5px] font-bold tracking-[0.08em] uppercase">
                      <th className="px-5 py-3">Token</th>
                      <th className="px-5 py-3">Value</th>
                      <th className="px-5 py-3">Role</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13.5px]">
                    {ROLE_TOKENS.map(([token, role]) => (
                      <tr key={token} className="border-rule border-t">
                        <td className="px-5 py-3">
                          <span className="text-fg font-mono text-[12px] font-semibold">{token}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-2.5">
                            <i className="border-rule size-6 rounded-md border"
                               style={{ background: `var(${token})` }} />
                            <Spec>{roles[token] || "—"}</Spec>
                          </span>
                        </td>
                        <td className="text-fg-2 px-5 py-3">{role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="type" title="Typography"
        lede="Space Grotesk for display, Inter for interface, JetBrains Mono for data. The theme names no families — the host app supplies them, the way next/font does.">
        <div className="bg-surface border-rule divide-rule divide-y rounded-xl border">
          {[
            ["Display / 40 / 700", "font-display text-[40px] font-bold tracking-tight", "Cyonix Console"],
            ["H2 / 30 / 700", "font-display text-[30px] font-bold tracking-tight", "Alert triage"],
            ["H3 / 22 / 700", "font-display text-[22px] font-bold", "Open by severity"],
            ["Body / 15 / 400", "text-[15px]", "Every alert is triaged and routed by an agent before an analyst sees it."],
            ["Small / 13.5 / 500", "text-fg-2 text-[13.5px] font-medium", "+8.2 · increasing steadily"],
            ["Label / 12 / 600", "text-fg-muted text-[12px] font-semibold tracking-[0.1em] uppercase", "Severity · status · owner"],
            ["Mono / 12 / 500", "font-mono text-[12px] tabular-nums", "AL-2291 · 94% confidence"],
          ].map(([spec, cls, sample]) => (
            <div key={spec} className="flex flex-wrap items-baseline gap-x-8 gap-y-2 p-6">
              <span className="w-[150px] shrink-0"><Spec>{spec}</Spec></span>
              <span className={cls}>{sample}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="layout" title="Spacing &amp; radius"
        lede="A 4px base. The radius scale is the Global Tokens set — seven steps plus none and full.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo label="Spacing">
            <div className="space-y-3">
              {[["0",2],["1",4],["2",8],["3",12],["4",16],["5",20],["6",24],["7",32],["8",40],["9",48],["10",56]].map(([name, px]) => (
                <div key={String(name)} className="flex items-center gap-4">
                  <span className="w-6 shrink-0"><Spec>{name}</Spec></span>
                  <span className="bg-accent h-3 rounded-sm" style={{ width: `${Number(px) * 2}px` }} />
                  <Spec>{px}px</Spec>
                </div>
              ))}
            </div>
          </Demo>
          <Demo label="Radius">
            <div className="flex flex-wrap gap-4">
              {[["none","0"],["1","2px"],["2","4px"],["3","6px"],["4","8px"],["5","10px"],["6","12px"],["7","16px"],["full","999px"]].map(([name, r]) => (
                <div key={name} className="text-center">
                  <div className="bg-surface-2 border-rule size-[68px] border" style={{ borderRadius: r }} />
                  <p className="mt-2"><Spec>{name} · {r}</Spec></p>
                </div>
              ))}
            </div>
          </Demo>
        </div>
      </Section>

      <Section id="elevation" title="Elevation"
        lede="Depth comes from the surface step first and shadow second. Cards at rest take no shadow — elevation is for overlays.">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[["Flat","none","surface step only"],["Menu","var(--e-2)","--e-2"],["Drawer","var(--e-3)","--e-3"],["Modal","var(--e-4)","--e-4"]].map(([name, shadow, note]) => (
            <div key={name} className="bg-surface border-rule rounded-xl border p-6"
                 style={{ boxShadow: shadow === "none" ? undefined : shadow }}>
              <p className="font-display text-[14px] font-bold">{name}</p>
              <p className="mt-2"><Spec>{note}</Spec></p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="motion" title="Motion"
        lede="One curve, four durations. Hover a card to play it. Everything respects prefers-reduced-motion.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[["Instant · 120ms","120ms","hover, focus, small state flips"],["Standard · 240ms","240ms","dropdowns, tooltips, inline expansion"],["Emphasis · 400ms","400ms","modals, drawers, chart draw-in"],["Page · 700ms","700ms","route and full-panel transitions"]].map(([name, ms, note]) => (
            <Demo key={name} className="group cursor-pointer">
              <div className="bg-wash-2 h-2 overflow-hidden rounded-full">
                <i className="bg-accent block h-full w-1/4 rounded-full group-hover:w-full"
                   style={{ transition: `width ${ms} var(--ease)` }} />
              </div>
              <p className="font-display mt-4 text-[14px] font-bold">{name}</p>
              <p className="mt-1.5"><Spec>{note}</Spec></p>
            </Demo>
          ))}
        </div>
      </Section>
    </>
  );
}
