import {
  Button, Card, Checkbox, Code, DataTable, DueChip, EmptyState, ErrorState,
  Field, FilterChip, IconButton, Input, Note, Progress, Segmented, Select,
  SeverityBadge, Skeleton, StatTile, StatusPill, StatusTile, Switch, Tag,
  Textarea, TileGrid, TrendTile, type Column,
} from "@vcyberizadmin/ui";
import { Breadcrumb, PageHeader } from "@vcyberizadmin/ui/layout";
import { Menu, Popover, Tooltip } from "@vcyberizadmin/ui/overlays";
import { useState } from "react";
import { Demo, Section, Spec } from "../chrome.js";

const Gear = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 17H5M19 7h-9" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
  </svg>
);
const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

interface Alert { id: string; host: string; severity: "Critical" | "High" | "Medium" | "Low"; owner: string; dueDays: number }
const ALERTS: Alert[] = [
  { id: "AL-2291", host: "FIN-WS-2214", severity: "Critical", owner: "You", dueDays: -1 },
  { id: "AL-2290", host: "HR-LT-0091", severity: "High", owner: "A. Okafor", dueDays: 2 },
  { id: "AL-2287", host: "OPS-SRV-12", severity: "Medium", owner: "Unassigned", dueDays: 6 },
];

export function Components() {
  const [seg, setSeg] = useState("all");
  const [checked, setChecked] = useState(true);
  const [on, setOn] = useState(true);

  const columns: Column<Alert>[] = [
    { key: "id", header: "Alert", compact: true, cell: (r) => <span className="font-mono text-[12px]">{r.id}</span> },
    { key: "host", header: "Host", cell: (r) => r.host },
    { key: "severity", header: "Severity", compact: true, cell: (r) => <SeverityBadge severity={r.severity} /> },
    { key: "owner", header: "Owner", cell: (r) => r.owner },
    { key: "dueDays", header: "Due", compact: true, align: "right", cell: (r) => <DueChip days={r.dueDays} /> },
  ];

  return (
    <>
      <Section id="buttons" title="Buttons"
        lede="One primary per view. The corner is a plain radius; the label is Space Grotesk at 14px.">
        <div className="grid gap-4">
          <Demo label="Variants">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Investigate<Arrow /></Button>
              <Button variant="outline">Assign</Button>
              <Button variant="solid">Export</Button>
              <Button variant="edge">Recommended</Button>
              <Button variant="danger">Close account</Button>
              <Button variant="ghost">Skip</Button>
            </div>
          </Demo>
          <div className="grid gap-4 lg:grid-cols-2">
            <Demo label="Sizes">
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button>Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </Demo>
            <Demo label="Icon only &amp; states">
              <div className="flex flex-wrap items-center gap-3">
                <IconButton label="Settings" size="sm"><Gear /></IconButton>
                <IconButton label="Settings"><Gear /></IconButton>
                <IconButton label="Settings" size="lg"><Gear /></IconButton>
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
              </div>
            </Demo>
          </div>
        </div>
      </Section>

      <Section id="forms" title="Inputs &amp; forms"
        lede="Every control carries a label, and every error says what to do about it.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo label="Fields">
            <div className="space-y-5">
              <Field label="Alert title"><Input defaultValue="Credential dumping on FIN-WS-2214" /></Field>
              <Field label="Assignee" hint="Routed by the Assignment Agent when left empty.">
                <Select defaultValue="you">
                  <option value="you">You</option>
                  <option value="ada">A. Okafor</option>
                  <option value="none">Unassigned</option>
                </Select>
              </Field>
              <Field label="Analyst note"><Textarea rows={3} placeholder="What did you find?" /></Field>
            </div>
          </Demo>
          <Demo label="Validation">
            <div className="space-y-5">
              <Field label="Retention window" error="Must be between 30 and 365 days.">
                <Input defaultValue="12" />
              </Field>
              <Field label="Webhook" hint="Delivered within 30 seconds of an escalation.">
                <Input placeholder="https://…" />
              </Field>
              <Field label="Disabled"><Input disabled defaultValue="Managed by your tenant" /></Field>
            </div>
          </Demo>
        </div>
      </Section>

      <Section id="controls" title="Selection controls"
        lede="A switch commits immediately; a checkbox waits for a save. Choose by whether the change is reversible.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo label="Switch &amp; checkbox">
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[13.5px] font-medium">
                <Switch checked={on} onChange={(e) => setOn(e.currentTarget.checked)} />
                Auto-contain critical alerts
              </label>
              <label className="flex items-center gap-3 text-[13.5px] font-medium">
                <Checkbox checked={checked} onChange={(e) => setChecked(e.currentTarget.checked)} />
                Notify on escalation
              </label>
            </div>
          </Demo>
          <Demo label="Segmented">
            <div className="space-y-4">
              <Segmented
                label="Severity"
                value={seg}
                onChange={setSeg}
                items={[
                  { value: "all", label: "All", count: 31 },
                  { value: "crit", label: "Critical", count: 4 },
                  { value: "high", label: "High", count: 12 },
                  { value: "low", label: "Low", count: 15 },
                ]}
              />
              <Segmented
                label="Scope" variant="tint" value={seg} onChange={setSeg}
                items={[{ value: "all", label: "All" }, { value: "crit", label: "Mine" }]}
              />
            </div>
          </Demo>
        </div>
      </Section>

      <Section id="chips" title="Chips, tags &amp; badges"
        lede="A status pill carries a shaped dot; a severity badge carries a leading bar. That difference is what lets an operator tell what happened from how bad.">
        <div className="grid gap-4 lg:grid-cols-3">
          <Demo label="Status">
            <div className="flex flex-wrap gap-2">
              <StatusPill status="Active" /><StatusPill status="Running" />
              <StatusPill status="Failed" /><StatusPill status="Queued" />
            </div>
          </Demo>
          <Demo label="Severity">
            <div className="flex flex-wrap gap-2">
              <SeverityBadge severity="Critical" /><SeverityBadge severity="High" />
              <SeverityBadge severity="Medium" /><SeverityBadge severity="Low" />
            </div>
          </Demo>
          <Demo label="Tags &amp; filters">
            <div className="flex flex-wrap items-center gap-2">
              <Tag>Beta</Tag><Tag>MITRE T1003</Tag>
              <FilterChip field="owner" value="You" onRemove={() => {}} />
            </div>
          </Demo>
        </div>
      </Section>

      <Section id="cards" title="Cards &amp; tiles"
        lede="A tile states one number. A card holds a composition. Neither takes a shadow at rest.">
        <div className="space-y-4">
          <TileGrid>
            <StatTile label="Open alerts" value="31" />
            <TrendTile label="Median triage" value="4m" delta={-12} baseline="vs. last week" />
            <StatusTile label="Ingest" value="Healthy" tone="success" />
            <StatTile label="Resolved by agents" value="87%" />
          </TileGrid>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><p className="text-fg text-[13.5px]">A plain card. 16px radius, hairline border, no shadow.</p></Card>
            <Card nested><p className="text-fg text-[13.5px]">A nested card steps down to the ground colour. One level only.</p></Card>
          </div>
        </div>
      </Section>

      <Section id="feedback" title="Feedback &amp; status"
        lede="An empty state explains what would be here; an error explains what to do next. Neither apologises.">
        <div className="grid gap-4 lg:grid-cols-3">
          <Demo label="Notes">
            <div className="space-y-3">
              <Note tone="info">Watch data syncs every 15 minutes.</Note>
              <Note tone="warning">Hydration is 800 ml behind target.</Note>
              <Note tone="danger">Containment failed on 2 hosts.</Note>
            </div>
          </Demo>
          <Demo label="Progress &amp; loading">
            <div className="space-y-4">
              <Progress value={62} />
              <Progress value={88} />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            </div>
          </Demo>
          <Demo label="Empty &amp; error">
            <div className="space-y-4">
              <EmptyState variant="filtered" title="No alerts match" description="Widen the severity filter or clear the search." />
              <ErrorState title="Could not reach the connector" description="Retry, or check the credential in Settings." />
            </div>
          </Demo>
        </div>
      </Section>

      <Section id="navigation" title="Navigation"
        lede="Two rail patterns ship: NavRail for a console with groups and sub-items, DockRail for one whose whole surface fits in four destinations.">
        <div className="grid gap-4">
          <Demo label="Page header &amp; breadcrumb">
            <Breadcrumb items={[{ label: "Alerts", href: "#" }, { label: "AL-2291" }]} />
            <div className="mt-4">
              <PageHeader
                title="Credential dumping on FIN-WS-2214"
                meta="Escalated by the Triage Agent at 94% confidence."
                actions={<><Button variant="outline" size="sm">Assign</Button><Button size="sm">Contain</Button></>}
              />
            </div>
          </Demo>
          <Demo label="Where the rails live">
            <p className="text-fg-2 text-[13.5px]">
              The rails and the console bar own the whole viewport, so they are documented
              in Storybook under <code className="font-mono text-[12px]">Layout/Console Frame</code> rather
              than inline here — a 76px rail in a 700px column would misrepresent them.
            </p>
          </Demo>
        </div>
      </Section>

      <Section id="overlays" title="Overlays"
        lede="Escape, click-outside, focus return and one-at-a-time all come from the shared overlay stack, so no component reimplements them.">
        <Demo label="Triggers">
          <div className="flex flex-wrap items-center gap-3">
            <Tooltip content="Contains the host and reverses in 30 days">
              <Button variant="outline" size="sm">Hover me</Button>
            </Tooltip>
            <Popover
              label="Details"
              content={<p className="text-fg-2 max-w-[240px] text-[13px]">A popover may carry controls — that is what separates it from a tooltip.</p>}
            >
              <Button variant="outline" size="sm">Popover</Button>
            </Popover>
            <Menu
              label="Row actions"
              triggerClassName="bg-wash-2 text-fg hover:bg-wash-3 duration-instant ease-brand flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-[13px] font-bold transition-colors"
              trigger={<>Actions<Gear /></>}
              items={[
                { label: "Assign to me" },
                { label: "Mark false positive" },
                { label: "Delete", danger: true },
              ]}
            />
          </div>
        </Demo>
      </Section>

      <Section id="tables" title="Tables"
        lede="Sorting, compact columns and per-column alignment. A column sized by its content has no share of the table to truncate against.">
        <DataTable
          columns={columns}
          rows={ALERTS}
          rowKey={(r) => r.id}
        />
      </Section>
    </>
  );
}
