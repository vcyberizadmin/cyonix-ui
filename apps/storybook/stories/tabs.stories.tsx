import { Card, Segmented, Tabs, type TabItem } from "@vcyberizadmin/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/**
 * CX-TAB. Two controls that look alike and do different jobs — the standard
 * records that they get swapped, so the distinction is the point of this page.
 */

const meta = {
  title: "Input/Tabs & segmented",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const RECORD_VIEWS: TabItem[] = [
  { value: "overview", label: "Overview" },
  { value: "findings", label: "Findings", count: 148 },
  { value: "timeline", label: "Timeline", count: 62 },
  { value: "evidence", label: "Evidence", count: 0 },
  { value: "raw", label: "Raw", disabled: true, disabledReason: "Raw output is retained for 30 days; this run is older." },
];

/** Tabs change the view of ONE record. */
export const RecordTabs: Story = {
  name: "Tabs — one record, many views",
  render: function TabsStory() {
    const [tab, setTab] = useState("findings");
    return (
      <div className="flex flex-col gap-6">
        <Tabs items={RECORD_VIEWS} value={tab} onChange={setTab} label="Assessment views">
          <Card title={RECORD_VIEWS.find((t) => t.value === tab)?.label} padding="sm">
            <p className="text-fg-2 text-small">
              One record — assessment <code>ASM-4471</code> — seen four ways.
              Arrow keys move and select; Tab leaves the bar in one step rather
              than walking every tab. The “Evidence” count reads <code>0</code>
              rather than disappearing: an empty tab is information.
            </p>
          </Card>
        </Tabs>
      </div>
    );
  },
};

/** Segmented changes WHICH RECORDS are listed. */
export const SegmentedFilters: Story = {
  name: "Segmented — which records are listed",
  render: function SegmentedStory() {
    const [scope, setScope] = useState("all");
    const [size, setSize] = useState("md");
    const items: TabItem[] = [
      { value: "all", label: "All", count: 38 },
      { value: "active", label: "Active", count: 34 },
      { value: "trial", label: "Trial", count: 3 },
      { value: "suspended", label: "Suspended", count: 1 },
    ];
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-fg-muted text-[10.5px] font-semibold tracking-[0.1em] uppercase">
            fill — the control owns its area
          </p>
          <Segmented items={items} value={scope} onChange={setScope} label="Tenant scope" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-fg-muted text-[10.5px] font-semibold tracking-[0.1em] uppercase">
            tint — beside other controls in a filter toolbar
          </p>
          <Segmented
            items={items}
            value={scope}
            onChange={setScope}
            label="Tenant scope, tinted"
            variant="tint"
            size="sm"
          />
        </div>
        <Card title="Same control, one implementation" padding="sm">
          <p className="text-fg-2 text-small">
            <code>SegmentedFilter</code> in the table toolbar is this component
            with <code>variant="tint"</code>, so the roving focus, the disabled
            handling and the ARIA live in one place instead of two copies that
            drift.
          </p>
        </Card>
        <div className="flex flex-col gap-2">
          <p className="text-fg-muted text-[10.5px] font-semibold tracking-[0.1em] uppercase">
            two sizes
          </p>
          <Segmented
            items={[
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
            ]}
            value={size}
            onChange={setSize}
            label="Size"
          />
        </div>
      </div>
    );
  },
};

/**
 * The standard's recorded cost: "past ~6 tabs the bar scrolls and later tabs
 * become invisible". The bar fades whichever edge is cut off and scrolls the
 * selected tab into view, so a deep link to the last tab lands visible.
 */
export const ManyTabs: Story = {
  name: "Nine tabs (scroll, fade, deep link)",
  render: function ManyTabsStory() {
    const items: TabItem[] = [
      "Overview",
      "Findings",
      "Timeline",
      "Evidence",
      "Assets",
      "Scope",
      "Approvals",
      "Report",
      "Retest",
    ].map((label) => ({ value: label.toLowerCase(), label, count: label.length * 7 }));
    // Starts on the LAST tab, as a deep link would.
    const [tab, setTab] = useState("retest");
    return (
      <div className="max-w-[560px]">
        <Tabs items={items} value={tab} onChange={setTab} label="Many views">
          <p className="text-fg-2 text-small">
            Opened on “Retest”, the ninth tab. It was scrolled into view on
            arrival — without that, a deep link lands on an apparently empty bar.
          </p>
        </Tabs>
      </div>
    );
  },
};
