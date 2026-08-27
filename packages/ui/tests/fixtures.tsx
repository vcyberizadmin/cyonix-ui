/**
 * One minimal, valid instance of every component the library exports.
 *
 * This registry is the input to the smoke test, and its completeness is itself
 * asserted (see exports.test.ts) — a new export with no fixture fails the
 * suite. That is the point: the cheapest useful test for a component library is
 * "does every published component still render", and it only stays useful if
 * nothing can be added without being covered.
 *
 * Fixtures are deliberately minimal. Required props only, plus whatever a
 * component genuinely cannot render without. Rich examples belong in Storybook.
 */
import type { ReactElement } from "react";

import { Button, IconButton } from "../src/button.js";
import { Card } from "../src/card.js";
import { Code } from "../src/code.js";
import { DefinitionCard, DescriptionList } from "../src/definition.js";
import { Note, InsightPanel } from "../src/note.js";
import { Skeleton } from "../src/skeleton.js";
import { EmptyState, ErrorState } from "../src/states.js";
import { SeverityBadge, StatusPill } from "../src/status.js";
import { Segmented, Tabs } from "../src/tabs.js";
import { ChipStack, Tag } from "../src/tag.js";
import { StatTile, StatusTile, TileGrid, TrendTile } from "../src/tile.js";

import { Checkbox, Field, FieldGrid, Input, Select, Switch, Textarea } from "../src/form/index.js";
import {
  DataTable,
  DueChip,
  FilterChip,
  Pagination,
  Progress,
  SegmentedFilter,
  SeverityCounts,
  Toolbar,
  TwoLineCell,
} from "../src/table/index.js";
import {
  Calendar,
  DatePicker,
  DateRangeFilter,
  DateRangePicker,
  EMPTY_RANGE,
} from "../src/date/index.js";
import {
  ConfirmDialog,
  Drawer,
  ImpactBox,
  Menu,
  Modal,
  Popover,
  ToastProvider,
  Tooltip,
} from "../src/overlays/index.js";
import {
  AppShell,
  Breadcrumb,
  CommandPalette,
  ConsoleBar,
  DockRail,
  DockReveal,
  Logo,
  NavRail,
  PageHeader,
  SettingsShell,
  ThemeToggle,
  TopBar,
} from "../src/layout/index.js";
import {
  AxisBars,
  Donut,
  FunnelFlow,
  Gauge,
  Heatmap,
  ProportionBar,
  RankedBars,
  Sparkline,
  StepArea,
} from "../src/charts/index.js";

const SLICES = [
  { label: "Critical", value: 4 },
  { label: "High", value: 11 },
  { label: "Medium", value: 27 },
];

const SERIES = [3, 7, 4, 9, 6, 11, 8] as const;

const NAV_GROUPS = [
  { label: "Monitor", items: [{ label: "Overview", href: "/overview" }] },
  {
    label: "Respond",
    items: [{ label: "Incidents", href: "/incidents", count: 3, countTone: "alert" as const }],
  },
];

const ROWS = [
  { id: "a", host: "web-01", severity: "high" },
  { id: "b", host: "db-02", severity: "low" },
];

/** name → a rendered instance. `name` must match the exported symbol. */
export const FIXTURES: Record<string, () => ReactElement> = {
  /* --- primitives --- */
  Button: () => <Button>Run scan</Button>,
  IconButton: () => <IconButton label="Dismiss">×</IconButton>,
  Card: () => <Card>Body</Card>,
  Code: () => <Code>npm i</Code>,
  Skeleton: () => <Skeleton />,
  Tag: () => <Tag>tagged</Tag>,
  ChipStack: () => <ChipStack items={[{ label: "prod" }, { label: "eu-west" }]} />,
  StatusPill: () => <StatusPill status="active" />,
  SeverityBadge: () => <SeverityBadge severity="Critical" />,
  Note: () => <Note>Heads up.</Note>,
  InsightPanel: () => <InsightPanel>Traffic is up.</InsightPanel>,
  EmptyState: () => <EmptyState variant="empty" title="Nothing yet" />,
  ErrorState: () => <ErrorState title="Could not load" />,
  DescriptionList: () => <DescriptionList items={[{ label: "Host", value: "web-01" }]} />,
  DefinitionCard: () => <DefinitionCard title="Asset" description="An asset definition." />,

  /* --- selection --- */
  Tabs: () => (
    <Tabs
      label="Views"
      items={[
        { value: "overview", label: "Overview" },
        { value: "timeline", label: "Timeline", count: 0 },
      ]}
    />
  ),
  Segmented: () => (
    <Segmented
      label="Filter"
      value="all"
      onChange={() => {}}
      items={[
        { value: "all", label: "All" },
        { value: "active", label: "Active" },
      ]}
    />
  ),

  /* --- tiles --- */
  StatTile: () => <StatTile label="Open" value={12} />,
  TrendTile: () => <TrendTile label="Mean time" value="4h" />,
  StatusTile: () => <StatusTile label="Posture" value="Healthy" tone="success" />,
  TileGrid: () => (
    <TileGrid>
      <StatTile label="Open" value={12} />
    </TileGrid>
  ),

  /* --- form --- */
  Field: () => (
    <Field label="Hostname">
      <Input />
    </Field>
  ),
  FieldGrid: () => (
    <FieldGrid>
      <Field label="Hostname">
        <Input />
      </Field>
    </FieldGrid>
  ),
  Input: () => <Input aria-label="Hostname" />,
  Textarea: () => <Textarea aria-label="Notes" />,
  Select: () => (
    <Select aria-label="Region">
      <option value="eu">EU</option>
    </Select>
  ),
  Checkbox: () => <Checkbox aria-label="Enabled" />,
  Switch: () => <Switch aria-label="Enabled" />,

  /* --- table --- */
  DataTable: () => (
    <DataTable
      columns={[
        { key: "host", header: "Host", cell: (r: (typeof ROWS)[number]) => r.host },
        { key: "severity", header: "Severity", cell: (r: (typeof ROWS)[number]) => r.severity },
      ]}
      rows={ROWS}
      rowKey={(r: (typeof ROWS)[number]) => r.id}
    />
  ),
  Pagination: () => <Pagination page={1} pageSize={25} total={140} onPageChange={() => {}} />,
  Toolbar: () => <Toolbar />,
  FilterChip: () => <FilterChip field="Severity" value="High" onRemove={() => {}} />,
  SegmentedFilter: () => (
    <SegmentedFilter
      label="Status"
      value="all"
      onChange={() => {}}
      options={[
        { value: "all", label: "All" },
        { value: "open", label: "Open" },
      ]}
    />
  ),
  TwoLineCell: () => <TwoLineCell primary="web-01" secondary="10.0.0.4" />,
  SeverityCounts: () => <SeverityCounts counts={{ Critical: 2, High: 5 }} />,
  DueChip: () => <DueChip days={3} />,
  Progress: () => <Progress value={40} />,

  /* --- date --- */
  Calendar: () => <Calendar month="2026-08-01" onMonthChange={() => {}} />,
  DatePicker: () => <DatePicker value="2026-08-26" onChange={() => {}} />,
  DateRangePicker: () => <DateRangePicker value={EMPTY_RANGE} onApply={() => {}} />,
  DateRangeFilter: () => <DateRangeFilter value={EMPTY_RANGE} onChange={() => {}} />,

  /* --- overlays. Rendered OPEN: a closed overlay renders nothing, which would
     make its fixture a test of the boolean rather than of the component. --- */
  Modal: () => (
    <Modal open title="Confirm" onClose={() => {}}>
      Body
    </Modal>
  ),
  Drawer: () => (
    <Drawer open title="Details" onClose={() => {}}>
      Body
    </Drawer>
  ),
  ConfirmDialog: () => <ConfirmDialog open title="Delete asset?" confirmLabel="Delete" onClose={() => {}} onConfirm={() => {}} />,
  ImpactBox: () => <ImpactBox items={[{ text: "Scans stop." }]} />,
  Menu: () => <Menu label="Actions" trigger={<span aria-hidden="true">⋯</span>} items={[{ label: "Rename" }]} />,
  Tooltip: () => (
    <Tooltip content="Re-run">
      <button type="button">Run</button>
    </Tooltip>
  ),
  Popover: () => (
    <Popover content={<p>Detail</p>}>
      <button type="button">More</button>
    </Popover>
  ),
  ToastProvider: () => <ToastProvider>App</ToastProvider>,

  /* --- layout --- */
  AppShell: () => <AppShell>Main</AppShell>,
  NavRail: () => <NavRail groups={NAV_GROUPS} activeHref="/overview" />,
  DockRail: () => <DockRail items={[{ label: "Overview", href: "/overview" }]} />,
  DockReveal: () => <DockReveal>Overview</DockReveal>,
  TopBar: () => <TopBar />,
  ConsoleBar: () => <ConsoleBar user={{ name: "Ada" }} />,
  PageHeader: () => <PageHeader title="Incidents" />,
  Breadcrumb: () => <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Incidents" }]} />,
  CommandPalette: () => (
    <CommandPalette open commands={[{ id: "scan", label: "Run scan", onRun: () => {} }]} />
  ),
  Logo: () => <Logo />,
  ThemeToggle: () => <ThemeToggle />,
  SettingsShell: () => (
    <SettingsShell
      active="general"
      sections={[{ id: "general", title: "General", description: "Basics" }]}
    >
      Settings body
    </SettingsShell>
  ),

  /* --- charts --- */
  Sparkline: () => <Sparkline series={SERIES} />,
  ProportionBar: () => <ProportionBar slices={SLICES} />,
  RankedBars: () => <RankedBars items={SLICES} />,
  FunnelFlow: () => <FunnelFlow stages={SLICES} />,
  Donut: () => <Donut slices={SLICES} />,
  Gauge: () => <Gauge slices={SLICES} />,
  AxisBars: () => <AxisBars points={[{ label: "Mon", value: 4 }, { label: "Tue", value: 9 }]} />,
  Heatmap: () => (
    <Heatmap
      rows={["web-01"]}
      columns={["Mon", "Tue"]}
      values={[[3, null]]}
    />
  ),
  StepArea: () => <StepArea series={SERIES} label="Events" />,
};
