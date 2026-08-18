import {
  Card,
  StatTile,
  StatusTile,
  TileGrid,
  TrendTile,
} from "@vcyberizadmin/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type AnchorHTMLAttributes } from "react";

/**
 * CX-TIL. Three variants answering three different questions — "how many",
 * "which way is it moving", "is this OK" — rather than one tile with eight
 * optional props.
 */

const meta = {
  title: "Data display/Stat tiles",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </svg>
);

const PlugIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 22v-5M9 2v6M15 2v6M7 8h10v3a5 5 0 0 1-10 0V8Z" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

/** The three variants side by side. */
export const ThreeVariants: Story = {
  name: "The three variants",
  render: () => (
    <TileGrid min={240}>
      <StatTile
        label="Total findings"
        value="1,204"
        caption="Across 38 assets"
      />
      <TrendTile
        label="Mean time to remediate"
        value="4.2"
        denominator="days"
        delta={18}
        baseline="vs last 30 days"
        polarity="up-bad"
        series={[6.8, 6.1, 5.9, 5.2, 4.4, 3.6, 3.5, 4.2]}
      />
      <StatusTile
        label="Scanner fleet"
        value="Degraded"
        tone="warning"
        icon={<PlugIcon />}
        caption="2 of 9 collectors unreachable"
      />
    </TileGrid>
  ),
};

/**
 * Polarity is per-metric, not global. Both tiles moved up by the same 12% —
 * one is good news, one is bad, and neither is guessing.
 */
export const Polarity: Story = {
  name: "Polarity — red-up is not always bad",
  render: () => (
    <div className="flex flex-col gap-6">
      <TileGrid min={240}>
        <TrendTile
          label="Findings resolved"
          value="312"
          delta={12}
          baseline="vs last 7 days"
          polarity="up-good"
          series={[180, 205, 214, 240, 262, 275, 298, 312]}
        />
        <TrendTile
          label="Open findings"
          value="148"
          delta={12}
          baseline="vs last 7 days"
          polarity="up-bad"
          series={[96, 104, 112, 118, 126, 133, 140, 148]}
        />
        <TrendTile
          label="Assets in scope"
          value="1,204"
          delta={12}
          baseline="vs last 7 days"
          series={[1020, 1044, 1080, 1102, 1130, 1160, 1188, 1204]}
        />
        <TrendTile
          label="Policy violations"
          value="0"
          delta={0}
          baseline="vs last 7 days"
          polarity="up-bad"
          series={[0, 0, 0, 0, 0, 0, 0, 0]}
        />
      </TileGrid>
      <Card title="Why the third tile has no colour" padding="sm">
        <p className="text-fg-2 text-small">
          It declares no <code>polarity</code>. There is no correct global
          default — more assets in scope is neither good nor bad — so omitting it
          yields a colourless delta rather than a confident wrong one. The fourth
          shows a zero delta: never coloured, and the word is “No change”, not
          “Up 0%”.
        </p>
      </Card>
    </div>
  ),
};

/** Health at a glance: 3px semantic rail plus a corner glyph. */
export const StatusVariant: Story = {
  name: "Status tiles",
  render: () => (
    <TileGrid min={220}>
      <StatusTile
        label="Assessment engine"
        value="Operational"
        tone="success"
        icon={<ShieldIcon />}
      />
      <StatusTile
        label="Ingest lag"
        value="Degraded"
        tone="warning"
        icon={<ClockIcon />}
        caption="Behind by 14 minutes"
      />
      <StatusTile
        label="Exploit validation"
        value="Blocked"
        tone="danger"
        icon={<PlugIcon />}
        caption="Awaiting client approval"
      />
      <StatusTile
        label="Next scheduled run"
        value="02:00"
        tone="info"
        icon={<ClockIcon />}
        caption="1 scanning · 1 in analysis"
      />
    </TileGrid>
  ),
};

/** A tile that filters a list is a link and looks like one on hover. */
export const DrillThrough: Story = {
  name: "Drill-through",
  render: function DrillThroughStory() {
    const [target, setTarget] = useState<string | null>(null);

    const NoNavLink = ({
      href,
      ...props
    }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        href={href}
        onClick={(event) => {
          event.preventDefault();
          setTarget(href ?? null);
        }}
        {...props}
      />
    );

    return (
      <div className="flex flex-col gap-6">
        <TileGrid min={220}>
          <StatTile
            label="Critical open"
            value="3"
            tone="danger"
            caption="Immediate action"
            href="/findings?severity=Critical&status=open"
            linkComponent={NoNavLink}
          />
          <StatTile
            label="High open"
            value="17"
            tone="warning"
            href="/findings?severity=High&status=open"
            linkComponent={NoNavLink}
          />
          <TrendTile
            label="Awaiting retest"
            value="24"
            delta={9}
            baseline="vs last sprint"
            polarity="up-bad"
            series={[31, 29, 28, 26, 22, 21, 22, 24]}
            href="/findings?status=retest"
            linkComponent={NoNavLink}
          />
          <StatusTile
            label="SLA breaches"
            value="2"
            tone="danger"
            icon={<ClockIcon />}
            href="/findings?sla=breached"
            linkComponent={NoNavLink}
          />
        </TileGrid>
        <Card title="Drill-through target" padding="sm">
          <p className="text-fg-2 text-small font-mono">
            {target ?? "Click a tile — nothing navigates in Storybook."}
          </p>
        </Card>
      </div>
    );
  },
};

/**
 * The three consoles, each using the variant that fits. One component set,
 * three dashboards.
 */
export const AcrossConsoles: Story = {
  name: "Across the three consoles",
  render: () => (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h3 className="font-display text-h3 font-semibold">VAPT</h3>
        <TileGrid min={200}>
          <StatTile label="Active assessments" value="4" caption="2 red team" />
          <StatTile label="Critical open" value="3" tone="danger" />
          <StatusTile
            label="Exploit sandbox"
            value="Operational"
            tone="success"
            icon={<ShieldIcon />}
          />
          <StatTile label="Reports due" value="2" denominator="this week" />
        </TileGrid>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-h3 font-semibold">Tenant</h3>
        <TileGrid min={200}>
          <StatTile label="Tenants" value="38" caption="3 provisioning" />
          <StatTile label="Active users" value="1,204" />
          <StatTile label="Trials ending" value="5" tone="warning" />
          <StatTile label="Suspended" value="1" />
          <StatTile label="Seats in use" value="892" denominator="of 1,500" />
        </TileGrid>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-h3 font-semibold">SOC</h3>
        <TileGrid min={240}>
          <TrendTile
            label="Alerts triaged"
            value="1,847"
            delta={22}
            baseline="vs yesterday"
            polarity="up-good"
            series={[1210, 1340, 1402, 1510, 1588, 1690, 1760, 1847]}
          />
          <TrendTile
            label="Dwell time"
            value="38"
            denominator="min"
            delta={11}
            baseline="vs last 24h"
            polarity="up-bad"
            series={[52, 48, 45, 44, 41, 39, 34, 38]}
          />
          <StatusTile
            label="Detection pipeline"
            value="Healthy"
            tone="success"
            icon={<PlugIcon />}
            caption="14 sources connected"
          />
        </TileGrid>
      </section>
    </div>
  ),
};

/**
 * The grid wraps rather than shrinking, which is what stops seven tiles from
 * becoming seven unreadable slivers.
 */
export const WrapNotShrink: Story = {
  name: "Wrap, not shrink (seven tiles)",
  render: () => (
    <div className="flex flex-col gap-6">
      <TileGrid min={200}>
        {[
          ["Tenants", "38"],
          ["Active", "34"],
          ["Trial", "3"],
          ["Suspended", "1"],
          ["Users", "1,204"],
          ["Seats", "892"],
          ["Overdue", "2"],
        ].map(([label, value]) => (
          <StatTile key={label} label={label!} value={value!} />
        ))}
      </TileGrid>
      <Card title="Seven is too many" padding="sm">
        <p className="text-fg-2 text-small">
          The standard caps a scannable row at five. The grid wraps at a 200px
          minimum so the seventh tile drops to a second row instead of shrinking
          the other six — but the real fix is fewer tiles.
        </p>
      </Card>
    </div>
  ),
};
