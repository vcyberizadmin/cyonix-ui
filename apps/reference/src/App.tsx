/**
 * The SOC console's Overview, Alerts and Cases screens, rebuilt from
 * @cyonix/ui alone.
 *
 * This app exists to be DIFFED against the design reference, not shipped. Its
 * job is to fail: every place it needs an arbitrary class, a wrapper div doing
 * a component's job, or a value the theme does not carry is a gap in the
 * library, and finding those by building is more reliable than finding them by
 * reading the reference's CSS.
 *
 * Rule for anyone editing it: if a panel here cannot be expressed with library
 * components and role tokens, FIX THE LIBRARY rather than reaching for an
 * arbitrary value. A `w-[268px]` here is a bug report.
 */
import { useState } from "react";
import {
  Card,
  EmptyState,
  IconTile,
  MeterRow,
  QueueRow,
  RecordCard,
  RowFacts,
  Segmented,
  SeverityBadge,
  StatusPill,
  Tag,
} from "@cyonix/ui";
import { AppShell, ConsoleBar, DockRail, Logo } from "@cyonix/ui/layout";
import { Donut, Sankey, StepArea } from "@cyonix/ui/charts";
import * as Icon from "./icons.js";
import {
  AGENTS,
  ALERTS,
  AUTONOMY,
  CASES,
  FP_BY_SOURCE,
  QUEUE,
  FLOW_LINKS,
  FLOW_NODES,
  KPIS,
  SEVERITY_SLICES,
  TENANTS,
  VOLUME,
  VOLUME_LABELS,
} from "./data.js";

const NAV = [
  // Only Overview carries a filled variant: the reference's RAIL config gives
  // `solid: 'i-house-solid'` for that one item and null for the rest, so the
  // other three stay stroked when current and are marked by the edge tab
  // alone. `activeIcon` falls back to `icon`, so omitting it is correct here
  // rather than passing the same glyph twice.
  { label: "Overview", href: "#overview", icon: <Icon.House />, activeIcon: <Icon.HouseSolid /> },
  { label: "Alerts", href: "#alerts", icon: <Icon.ShieldAlert />, count: 4, countTone: "alert" as const },
  { label: "Cases", href: "#cases", icon: <Icon.FolderOpen />, count: 2 },
  { label: "Sources", href: "#sources", icon: <Icon.Workflow /> },
];

const KPI_ICON = {
  "Open alerts": <Icon.ShieldAlert />,
  MTTD: <Icon.Radar />,
  MTTR: <Icon.Clock />,
  "False positive rate": <Icon.CircleX />,
} as const;

function Kpis() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map((k) => (
        <Card key={k.label} padding="none" className="p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-fg-2 text-[13px] font-bold">{k.label}</p>
            <IconTile tone={k.tone} size="sm">
              {KPI_ICON[k.label as keyof typeof KPI_ICON]}
            </IconTile>
          </div>
          <p className="mt-4 flex items-baseline gap-1.5">
            <span className="text-[30px] leading-none font-extrabold tabular-nums">
              {k.value}
            </span>
            {k.unit && (
              <span className="text-fg-2 text-[13px] font-bold">{k.unit}</span>
            )}
          </p>
          <p
            className={
              "mt-2.5 flex items-center gap-1.5 text-[12.5px] font-bold " +
              (k.good ? "text-ok-ink" : "text-danger-ink")
            }
          >
            <span className="[&_svg]:size-3.5">
              {k.good ? <Icon.TrendDown /> : <Icon.TrendUp />}
            </span>
            {k.delta}
            <span className="text-fg-2 truncate font-semibold">{k.sub}</span>
          </p>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------ AI investigation ---- */

const AGENT_ICON = {
  triage: <Icon.ShieldAlert />,
  enrich: <Icon.Radar />,
  hunt: <Icon.Workflow />,
  report: <Icon.Clock />,
} as const;

function AiInvestigation() {
  const pct = Math.round((AUTONOMY.auto / AUTONOMY.handled) * 100);
  const busiest = Math.max(...AGENTS.map((a) => a.runs));

  return (
    <Card padding="none" className="p-5">
      <h2 className="text-h3 font-extrabold tracking-tight">AI investigation</h2>
      <p className="text-fg-2 mt-1.5 text-[12.5px] font-medium">
        Every alert is triaged, investigated and routed by an agent before an
        analyst sees it.
      </p>

      <div className="mt-5 grid grid-cols-1 items-center gap-6 md:grid-cols-[auto_1fr] md:gap-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="flex shrink-0 flex-col items-center gap-2.5">
            <Donut
              slices={[
                { label: "Closed by agent", value: AUTONOMY.auto },
                { label: "Handed to analysts", value: AUTONOMY.human },
              ]}
              ramp="categorical"
              size={104}
              thickness={12}
              legend={false}
              totalLabel="handled"
            />
            <Tag className="bg-sev-info/15 text-sev-info">
              {pct}% resolved without a human
            </Tag>
          </div>

          <div className="flex gap-7 sm:flex-col sm:gap-3">
            <div>
              <p className="text-[19px] leading-none font-extrabold tabular-nums">
                {AUTONOMY.auto.toLocaleString("en-US")}
              </p>
              <p className="text-fg-2 mt-1 text-[11.5px] font-semibold">
                closed by agents
              </p>
            </div>
            <div>
              <p className="text-[19px] leading-none font-extrabold tabular-nums">
                {AUTONOMY.human.toLocaleString("en-US")}
              </p>
              <p className="text-fg-2 mt-1 text-[11.5px] font-semibold">
                handed to analysts
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3.5">
          {AGENTS.map((a) => (
            <MeterRow
              key={a.key}
              label={a.name}
              tone={a.tone}
              fraction={a.runs / busiest}
              icon={
                <IconTile tone={a.tone === "ok" ? "ok" : a.tone === "med" ? "info" : a.tone === "violet" ? "ai" : "warning"} size="xs">
                  {AGENT_ICON[a.key as keyof typeof AGENT_ICON]}
                </IconTile>
              }
              value={`${a.runs.toLocaleString("en-US")} · ${a.avg} avg`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

/* --------------------------------------- False positives by source ---- */

function FalsePositives() {
  return (
    <Card padding="none" className="flex min-h-[260px] flex-col p-5">
      <h2 className="text-h3 font-extrabold tracking-tight">
        False positives by source
      </h2>
      <div className="mt-4 space-y-3.5">
        {[...FP_BY_SOURCE]
          .sort((a, b) => b[2] - a[2])
          .map(([name, total, fp]) => (
            <MeterRow
              key={name}
              label={name}
              value={`${fp}% of ${total}`}
              fraction={fp / 100}
              // Threshold, not rank: past half the source is costing more than
              // it finds, and between a third and a half it is worth tuning.
              tone={fp >= 50 ? "crit" : fp >= 35 ? "accent" : "med"}
            />
          ))}
      </div>
    </Card>
  );
}

/* -------------------------------------------- Assigned to analysts ---- */

function AssignedToAnalysts() {
  const busiest = Math.max(...QUEUE.map(([, n]) => n));

  return (
    <Card padding="none" className="flex min-h-[260px] flex-col p-5">
      <h2 className="text-h3 font-extrabold tracking-tight">
        Assigned to analysts
      </h2>
      <div className="mt-4 space-y-3.5">
        {[...QUEUE]
          .sort((a, b) => b[1] - a[1])
          .map(([name, n]) => (
            <MeterRow
              key={name}
              label={name}
              value={n}
              fraction={n / busiest}
              // Unassigned is the only row that is a problem rather than a
              // workload, so it is the only one that takes a severity colour.
              tone={name === "Unassigned" ? "crit" : "accent"}
            />
          ))}
      </div>
    </Card>
  );
}

/* -------------------------------------------------- Waiting on you ---- */

function WaitingOnYou() {
  const waiting = ALERTS.filter(
    (a) => a.status === "New" || a.status === "Investigating",
  ).slice(0, 4);

  return (
    <Card padding="none" className="p-5">
      <h2 className="text-h3 font-extrabold tracking-tight">Waiting on you</h2>
      <div className="mt-4 space-y-2">
        {waiting.length > 0 ? (
          waiting.map((a) => (
            <QueueRow
              key={a.id}
              severity={a.severity}
              title={a.title}
              onOpen={() => {}}
              tags={<StatusPill status={a.status} />}
              facts={
                <RowFacts
                  items={[
                    <span className="font-mono text-[11.5px]">{a.id}</span>,
                    a.rule,
                    a.owner,
                  ]}
                />
              }
              trailing={
                <>
                  <SeverityBadge severity={a.severity} />
                  <span className="text-fg-2 text-[11.5px] font-semibold">
                    {a.ago}
                  </span>
                </>
              }
            />
          ))
        ) : (
          <EmptyState variant="empty" title="Nothing waiting for triage." />
        )}
      </div>
    </Card>
  );
}

function Overview() {
  const [window, setWindow] = useState("24h");

  return (
    <div className="space-y-4 xl:space-y-5">
      <Kpis />

      <div className="grid gap-4 xl:grid-cols-3 xl:gap-5">
        <Card padding="none" className="flex min-h-[320px] flex-col p-5 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-h3 font-extrabold tracking-tight">
                Alert volume
              </h2>
              <p className="text-fg-2 mt-1 flex items-center gap-2 text-[12.5px] font-semibold">
                <span className="text-ok-ink font-bold">−12%</span>
                vs. previous 24h · hover to read a point
              </p>
            </div>
            <p className="flex items-baseline gap-1.5">
              <span className="text-[30px] leading-none font-extrabold tabular-nums">
                1,421
              </span>
              <span className="text-fg-2 text-[13px] font-bold">alerts</span>
            </p>
          </div>

          <StepArea
            series={VOLUME}
            labels={VOLUME_LABELS}
            label="Alert volume over the last 24 hours"
            height={190}
            className="mt-4 flex-1"
          />

          {/* Full width, so the segment boundaries line up with the plot
              above rather than huddling at the left. */}
          <Segmented
            items={[
              { value: "24h", label: "24h" },
              { value: "7d", label: "7d" },
              { value: "30d", label: "30d" },
              { value: "90d", label: "90d" },
            ]}
            value={window}
            onChange={setWindow}
            label="Time window"
            stretch
            className="mt-4"
          />
        </Card>

        <Card padding="none" className="flex min-h-[320px] flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-h3 font-extrabold tracking-tight">
              Open by severity
            </h2>
            <span className="text-fg-2 [&_svg]:size-[19px]">
              <Icon.ShieldAlert />
            </span>
          </div>
          <Donut
            slices={SEVERITY_SLICES}
            shape="squircle"
            size={196}
            thickness={20}
            totalLabel="open"
            legendPlacement="below"
            className="mt-4 flex-1 justify-between"
          />
        </Card>
      </div>

      <Card padding="none" className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-h3 font-extrabold tracking-tight">Alert flow</h2>
            <p className="text-fg-2 mt-1 text-[12.5px] font-semibold">
              Source → agent decision → outcome. Hover a band to trace one path.
            </p>
          </div>
          <p className="flex items-baseline gap-1.5">
            <span className="text-[30px] leading-none font-extrabold tabular-nums">
              1,284
            </span>
            <span className="text-fg-2 text-[13px] font-bold">alerts · 24h</span>
          </p>
        </div>
        <Sankey
          nodes={FLOW_NODES}
          links={FLOW_LINKS}
          label="Alert flow from source through agent decision to outcome"
          height={300}
          className="mt-4"
        />
      </Card>

      <AiInvestigation />

      <div className="grid gap-4 xl:grid-cols-2 xl:gap-5">
        <FalsePositives />
        <AssignedToAnalysts />
      </div>

      <WaitingOnYou />
    </div>
  );
}

const VERDICT_TONE = {
  "True positive": "danger",
  "Needs human": "warning",
  "Likely benign": "ok",
} as const;

function Alerts() {
  const [severity, setSeverity] = useState("all");
  const [mine, setMine] = useState("all");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          items={[
            { value: "all", label: "All" },
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
          value={severity}
          onChange={setSeverity}
          label="Severity"
        />
        <Segmented
          items={[
            { value: "all", label: "All" },
            { value: "mine", label: "Mine" },
          ]}
          value={mine}
          onChange={setMine}
          label="Ownership"
          className="ml-auto"
        />
      </div>

      <Card padding="none" className="p-4">
        <p className="text-fg-2 px-1 pb-3 text-[13px] font-bold">
          {ALERTS.length} alerts in queue
        </p>
        <div className="space-y-2">
          {ALERTS.map((a) => (
            <QueueRow
              key={a.id}
              severity={a.severity}
              title={a.title}
              onOpen={() => {}}
              tags={
                <>
                  <Tag className={`bg-${VERDICT_TONE[a.verdict as keyof typeof VERDICT_TONE]}/12 text-${VERDICT_TONE[a.verdict as keyof typeof VERDICT_TONE]}-ink`}>
                    {a.verdict}
                  </Tag>
                  <StatusPill status={a.status} />
                </>
              }
              facts={
                <RowFacts
                  items={[
                    <span className="font-mono text-[11.5px]">{a.id}</span>,
                    a.rule,
                    a.source,
                    a.host,
                    a.user,
                    `${a.confidence}% · ${a.owner}`,
                  ]}
                />
              }
              trailing={
                <>
                  <SeverityBadge severity={a.severity} />
                  <span className="text-fg-2 text-[11.5px] font-semibold">
                    {a.ago}
                  </span>
                </>
              }
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function Cases() {
  const [status, setStatus] = useState("open");
  const [view, setView] = useState("cards");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          items={[
            { value: "all", label: "All" },
            { value: "open", label: "Open" },
            { value: "closed", label: "Closed" },
            { value: "action", label: "Action required" },
          ]}
          value={status}
          onChange={setStatus}
          label="Case status"
        />
        <Segmented
          items={[
            { value: "cards", label: <span className="[&_svg]:size-4"><Icon.Grid2x2 /></span> },
            { value: "table", label: <span className="[&_svg]:size-4"><Icon.Rows3 /></span> },
          ]}
          value={view}
          onChange={setView}
          label="View mode"
          className="ml-auto"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {CASES.map((c) => (
          <RecordCard
            key={c.id}
            severity={c.severity}
            title={c.title}
            needsAction={!!c.needs}
            onOpen={() => {}}
            meta={
              <>
                <Tag dot={1}>{c.tenant}</Tag>
                <span className="text-fg-2 font-mono text-[11.5px] font-semibold">
                  {c.id}
                </span>
                <SeverityBadge severity={c.severity} />
                <StatusPill status={c.status} />
              </>
            }
            flag={c.needs ? <Tag className="bg-accent/12 text-accent-ink">Action required</Tag> : undefined}
            footer={
              <>
                <span>{c.owner}</span>
                <span>{c.alerts} alert{c.alerts === 1 ? "" : "s"}</span>
                <span>{c.at}</span>
                <span className="text-fg-2 ml-auto text-[12px]">{c.slaLabel}</span>
              </>
            }
          />
        ))}
      </div>
    </div>
  );
}

const SCREENS = {
  "#overview": { title: "Overview", render: () => <Overview /> },
  "#alerts": { title: "Alerts", render: () => <Alerts /> },
  "#cases": { title: "Cases", render: () => <Cases /> },
  "#sources": { title: "Sources", render: () => <p>Not rebuilt yet.</p> },
} as const;

export function App() {
  const [href, setHref] = useState<keyof typeof SCREENS>("#overview");
  const [tenant, setTenant] = useState("all");
  const screen = SCREENS[href];

  return (
    <AppShell
      railMode="dock"
      rail={
        <DockRail
          items={NAV}
          activeHref={href}
          brand={<Logo size="xl" />}
          brandMini={<Logo mini size="xl" />}
          footer="SOC"
          linkComponent={({ href: to, ...rest }: { href: string }) => (
            <a
              {...rest}
              href={to}
              onClick={(e) => {
                e.preventDefault();
                setHref(to as keyof typeof SCREENS);
              }}
            />
          )}
        />
      }
      topBar={
        <ConsoleBar
          brand={<Logo mini size="sm" />}
          scope={{
            current: tenant,
            options: TENANTS,
            onChange: setTenant,
            pinned: ["all", "nwb", "mrh"],
          }}
          onSearch={() => {}}
          searchPlaceholder="Ask the agent or search…"
          searchHint="⌘K"
          searchIcon={<Icon.Bot />}
          notifications={{ items: [] }}
          user={{ name: "You", role: "SOC lead · on shift" }}
        />
      }
    >
      {/* ConsoleBar takes no children, so the page's heading lives here. It is
          visually hidden because the reference shows no page title — the
          current scope tab and the rail's ink already say where you are — but
          a screen reader still needs one per view. */}
      <h1 className="sr-only">{screen.title}</h1>
      {screen.render()}
    </AppShell>
  );
}
