import { Card } from "@vcyberizadmin/ui";
import {
  Donut,
  FunnelFlow,
  ProportionBar,
  RankedBars,
  Sparkline,
} from "@vcyberizadmin/ui/charts";
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * CX-CHT. Five charts, no charting library — every one of them is arithmetic
 * and SVG. The legend is the accessible equivalent, and it always carries the
 * count AND the percentage.
 */

const meta = {
  title: "Data display/Charts",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SEVERITY = [
  { label: "Critical", value: 3 },
  { label: "High", value: 17 },
  { label: "Medium", value: 64 },
  { label: "Low", value: 48 },
  { label: "Info", value: 16 },
];

export const Distribution: Story = {
  name: "Donut — read a distribution",
  render: () => (
    <div className="grid grid-cols-1 gap-6 min-[1000px]:grid-cols-2">
      <Card title="Findings by severity">
        <Donut slices={SEVERITY} totalLabel="findings" />
      </Card>
      <Card title="Connector types (unranked)">
        <Donut
          ramp="categorical"
          totalLabel="sources"
          slices={[
            { label: "Cloud", value: 6 },
            { label: "Identity", value: 3 },
            { label: "Endpoint", value: 4 },
            { label: "Network", value: 1 },
          ]}
        />
      </Card>
      <Card title="Why two ramps" padding="sm" className="min-[1000px]:col-span-2">
        <p className="text-fg-2 text-small">
          Severity is <strong>ranked</strong>, so it takes the severity ladder.
          Connector type has no order, so it takes the categorical ramp. The
          standard forbids mixing them, which the API enforces by taking one{" "}
          <code>ramp</code> for the whole chart. The centre carries the total so
          the number everyone wants is not derived from the legend.
        </p>
      </Card>
    </div>
  ),
};

export const Proportion: Story = {
  name: "ProportionBar — a proportion, cheaply",
  render: () => (
    <div className="flex flex-col gap-6">
      <Card title="Open findings by severity">
        <ProportionBar slices={SEVERITY} />
      </Card>
      <Card title="Inline, no legend — beside its own numbers" padding="sm">
        <div className="flex flex-col gap-3">
          <ProportionBar slices={SEVERITY} legend={false} size="sm" />
          <p className="text-fg-muted text-[11px]">
            Percentages are distributed by largest remainder, so a legend always
            totals exactly 100 rather than 99 or 101.
          </p>
        </div>
      </Card>
    </div>
  ),
};

export const Ranked: Story = {
  name: "RankedBars — compare categories",
  render: () => (
    <div className="grid grid-cols-1 gap-6 min-[1000px]:grid-cols-2">
      <Card title="Top MITRE techniques">
        <RankedBars
          max={6}
          items={[
            { label: "T1078 Valid Accounts", value: 412 },
            { label: "T1566 Phishing", value: 388 },
            { label: "T1059 Command Interpreter", value: 241 },
            { label: "T1110 Brute Force", value: 190 },
            { label: "T1486 Data Encrypted for Impact", value: 96 },
            { label: "T1021 Remote Services", value: 74 },
            { label: "T1053 Scheduled Task", value: 41 },
            { label: "T1547 Boot Autostart", value: 22 },
          ]}
        />
      </Card>
      <Card title="Findings by severity (scale order, not magnitude)">
        <RankedBars items={SEVERITY} ramp="severity" sort={false} />
      </Card>
    </div>
  ),
};

export const Funnel: Story = {
  name: "FunnelFlow — follow a pipeline",
  render: () => (
    <div className="grid grid-cols-1 gap-6 min-[1000px]:grid-cols-2">
      <Card title="Alert triage pipeline">
        <FunnelFlow
          stages={[
            { label: "Alerts received", value: 18420 },
            { label: "Deduplicated", value: 6210 },
            { label: "Auto-triaged", value: 1847 },
            { label: "Analyst reviewed", value: 412 },
            { label: "Escalated to case", value: 38 },
            { label: "Confirmed incident", value: 6 },
          ]}
        />
      </Card>
      <Card title="Why bars and not a Sankey" padding="sm">
        <p className="text-fg-2 text-small">
          A Sankey's ribbons encode the same single number as a bar's width while
          being much harder to read precisely. The operator's question here —
          “where are we losing them” — is answered by the drop-off figure between
          stages, so that is stated in words and figures rather than implied by a
          shape.
        </p>
      </Card>
    </div>
  ),
};

export const Sparklines: Story = {
  name: "Sparkline",
  render: () => (
    <Card title="Trend shape, no axes">
      <div className="flex flex-col gap-5">
        {[
          { label: "Alerts triaged", series: [1210, 1340, 1402, 1510, 1588, 1690, 1760, 1847] },
          { label: "Dwell time (min)", series: [52, 48, 45, 44, 41, 39, 34, 38] },
          { label: "Flat", series: [12, 12, 12, 12, 12, 12] },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-6">
            <span className="text-fg-2 text-small">{row.label}</span>
            <Sparkline series={row.series} width={120} height={28} />
          </div>
        ))}
        <p className="text-fg-muted text-[11px]">
          Each carries an automatic text equivalent — the accessible name states
          the direction, the endpoints and the range, because a sparkline without
          a y-axis cannot imply precision it does not have.
        </p>
      </div>
    </Card>
  ),
};
