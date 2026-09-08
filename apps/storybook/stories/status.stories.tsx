import { Card, SeverityBadge, StatusPill } from "@cyonix/ui";
import {
  BASE_VOCABULARY,
  bySeverity,
  CATEGORICAL,
  extendVocabulary,
  SEQUENTIAL,
  SEVERITIES,
  severityRank,
  STATUS_TONES,
  type Severity,
} from "@cyonix/ui/lib/status";
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * CX-STA collapses five rival status implementations into one vocabulary:
 * three in SOC (a Badge merging semantic and severity, a StatusPill on raw
 * Tailwind colours, and a third inlined in tables) and two in VAPT (one in
 * ui.tsx, another in badges.tsx — same repo).
 */

const meta = {
  title: "Data/Status & severity",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className="text-fg-muted text-[10px] font-semibold tracking-[0.1em] uppercase">
      {label}
    </span>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

/** The two languages side by side. They must never share one axis. */
export const TwoLanguages: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Card title="Semantic — what happened" hint="Shaped dot">
        <div className="flex flex-col gap-5">
          <Row label="Tones">
            {STATUS_TONES.map((tone) => (
              <StatusPill key={tone} status={tone} tone={tone} />
            ))}
          </Row>
          <Row label="Lifecycle">
            {["Active", "Suspended", "Inactive", "Draft", "Offboarded"].map((s) => (
              <StatusPill key={s} status={s} />
            ))}
          </Row>
          <Row label="Jobs — Running and Provisioning pulse (liveness)">
            {["Queued", "Running", "Provisioning", "Passed", "Failed"].map((s) => (
              <StatusPill key={s} status={s} />
            ))}
          </Row>
        </div>
      </Card>

      <Card title="Severity — how bad, ranked" hint="3px leading bar">
        <div className="flex flex-col gap-5">
          <Row label="Scale">
            {SEVERITIES.map((s) => (
              <SeverityBadge key={s} severity={s} />
            ))}
          </Row>
          <Row label="With the expected response">
            <div className="flex flex-col items-start gap-2">
              {SEVERITIES.map((s) => (
                <SeverityBadge key={s} severity={s} withAction />
              ))}
            </div>
          </Row>
        </div>
      </Card>
    </div>
  ),
};

/**
 * The accessibility property that matters: drop the colour and the vocabulary
 * still reads, because every tone owns a distinct SHAPE and always carries a
 * label. If this panel becomes unreadable, the encoding has been broken.
 */
export const GreyscaleProof: Story = {
  name: "Greyscale proof (WCAG 2.2 AA)",
  render: () => (
    <div className="flex flex-col gap-6">
      <p className="text-fg-2 text-small max-w-2xl">
        The lower panel is the upper one with all colour removed. Filled circle,
        haloed circle, diamond, hollow ring, square, absent — six tones, six
        shapes. Severity keeps its leading bar, so ranked never reads as
        semantic.
      </p>
      {[false, true].map((grey) => (
        <div
          key={String(grey)}
          className="border-rule flex flex-wrap items-center gap-2 rounded-md border p-4"
          style={grey ? { filter: "grayscale(1)" } : undefined}
        >
          {STATUS_TONES.map((tone) => (
            <StatusPill key={tone} status={tone} tone={tone} />
          ))}
          {SEVERITIES.map((s) => (
            <SeverityBadge key={s} severity={s} />
          ))}
        </div>
      ))}
    </div>
  ),
};

/** Extending per app without forking — the standard's stated gap. */
const VAPT_VOCAB = extendVocabulary({
  Exploited: "danger",
  Triaging: { tone: "info", live: true },
  "Awaiting retest": "warning",
  Remediated: "success",
  "Accepted risk": "draft",
});

export const ExtendedVocabulary: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <p className="text-fg-2 text-small max-w-2xl">
        The base vocabulary is lifecycle-biased. VAPT assessment states and SOC
        alert states layer over it with <code>extendVocabulary</code> — no fork,
        and the shape/label discipline comes along automatically.
      </p>
      <Row label={`VAPT states (base has ${Object.keys(BASE_VOCABULARY).length} entries)`}>
        {["Exploited", "Triaging", "Awaiting retest", "Remediated", "Accepted risk"].map(
          (s) => (
            <StatusPill key={s} status={s} vocabulary={VAPT_VOCAB} />
          ),
        )}
      </Row>
      <Row label="Unknown status falls back to neutral rather than throwing">
        <StatusPill status="Something nobody registered" />
      </Row>
    </div>
  ),
};

/** severityRank() is what lets a table sort Critical-first without guessing. */
const FINDINGS: { id: string; severity: Severity }[] = [
  { id: "CVE-2026-1188", severity: "Low" },
  { id: "CVE-2026-0042", severity: "Critical" },
  { id: "CVE-2026-7781", severity: "Medium" },
  { id: "CVE-2026-3390", severity: "Info" },
  { id: "CVE-2026-5501", severity: "High" },
];

export const RankedSorting: Story = {
  render: () => (
    <Card title="Sorted with bySeverity()" hint="Critical first, always">
      <div className="flex flex-col">
        {[...FINDINGS].sort(bySeverity((f) => f.severity)).map((f, i) => (
          <div
            key={f.id}
            className={`flex items-center justify-between gap-4 py-2.5 ${
              i > 0 ? "border-rule border-t" : ""
            }`}
          >
            <span className="font-mono text-[13px]">{f.id}</span>
            <span className="flex items-center gap-3">
              <span className="text-fg-muted font-mono text-[11px]">
                rank {severityRank(f.severity)}
              </span>
              <SeverityBadge severity={f.severity} />
            </span>
          </div>
        ))}
      </div>
    </Card>
  ),
};

/** Chart ramps ship with the vocabulary so charts inherit the same discipline. */
export const ChartRamps: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Row label="Categorical — unranked series only, never a status hue">
        {CATEGORICAL.map((c) => (
          <span key={c} className={`h-8 w-16 rounded-sm ${c}`} />
        ))}
      </Row>
      <Row label="Sequential — single-hue magnitude">
        {SEQUENTIAL.map((c) => (
          <span key={c} className={`h-8 w-10 rounded-sm ${c}`} />
        ))}
      </Row>
    </div>
  ),
};
