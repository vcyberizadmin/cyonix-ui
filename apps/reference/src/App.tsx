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
  Annotation,
  Button,
  Card,
  CodeBlock,
  DescriptionList,
  EmptyState,
  FilterChip,
  IconButton,
  IconTile,
  MeterRow,
  QueueRow,
  RecordCard,
  RowFacts,
  Segmented,
  SegmentedFilter,
  SeverityBadge,
  StatusPill,
  Tag,
  Timeline,
  Toolbar,
  type Tone,
} from "@cyonix/ui";
import { AppShell, ConsoleBar, DockRail, Logo } from "@cyonix/ui/layout";
import { Donut, Sankey, StepArea } from "@cyonix/ui/charts";
import * as Icon from "./icons.js";
import {
  AGENTS,
  ALERT_DETAIL,
  ALERTS,
  CASE_DETAIL,
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
  triage: <Icon.Zap />,
  invest: <Icon.ScanSearch />,
  assign: <Icon.UserCheck />,
  contain: <Icon.Ban />,
} as const;

function AiInvestigation() {
  const pct = Math.round((AUTONOMY.auto / AUTONOMY.handled) * 100);
  const busiest = Math.max(...AGENTS.map((a) => a.runs));

  return (
    <Card padding="none" className="p-5">
      <h2 className="text-panel font-bold tracking-tight">AI investigation</h2>
      <p className="text-fg-2 mt-1.5 text-[12.5px] font-medium">
        Every alert is triaged, investigated and routed by an agent before an
        analyst sees it.
      </p>

      <div className="mt-5 grid grid-cols-1 items-center gap-6 md:grid-cols-[auto_1fr] md:gap-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="flex shrink-0 flex-col items-center gap-2.5">
            <Donut
              slices={[{ label: "Resolved without a human", value: pct }]}
              max={100}
              tone="ok"
              centerValue={`${pct}%`}
              size={104}
              thickness={12}
              legend={false}
            />
            <Tag className="bg-sev-info/15 text-sev-info">
              <span className="[&_svg]:size-3">
                <Icon.Bot />
              </span>
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
                <IconTile tone={a.tone} size="xs">
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
      <h2 className="text-subpanel font-bold tracking-tight">
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
      <h2 className="text-subpanel font-bold tracking-tight">
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

function WaitingOnYou({ onOpen }: { onOpen: Open }) {
  const waiting = ALERTS.filter(
    (a) => a.status === "New" || a.status === "Investigating",
  ).slice(0, 4);

  return (
    <Card padding="none" className="p-5">
      <h2 className="text-subpanel font-bold tracking-tight">Waiting on you</h2>
      <div className="mt-4 space-y-2">
        {waiting.length > 0 ? (
          waiting.map((a) => (
            <QueueRow
              key={a.id}
              severity={a.severity}
              title={a.title}
              onOpen={() => onOpen("alert")}
              tags={<StatusTag status={a.status} />}
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

function Overview({ onOpen }: { onOpen: Open }) {
  const [window, setWindow] = useState("24h");

  return (
    <div className="space-y-4 xl:space-y-5">
      <Kpis />

      <div className="grid gap-4 xl:grid-cols-3 xl:gap-5">
        <Card padding="none" className="flex min-h-[320px] flex-col p-5 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-panel font-bold tracking-tight">
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
            <h2 className="text-panel font-bold tracking-tight">
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
            <h2 className="text-panel font-bold tracking-tight">Alert flow</h2>
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

      <WaitingOnYou onOpen={onOpen} />
    </div>
  );
}

/* Verdict tones exactly as the reference's VERDICT_STYLE assigns them. */
const VERDICT_TONE = {
  "True positive": "crit",
  "False positive": "low",
  "Needs human": "high",
  "Likely benign": "ok",
} as const;

/* And its STATUS map: new is rose, investigating azure, contained violet,
   closed mint, and a false positive drops out of the ladder entirely. */
const STATUS_TONE = {
  New: "crit",
  Investigating: "med",
  Contained: "violet",
  Closed: "ok",
  "False positive": "neutral",
} as const;

/* Every verdict tag carries the bot glyph: the tag's claim is "an agent
   decided this", and the icon is what says so. */
const VerdictTag = ({ verdict }: { verdict: string }) => (
  <Tag tone={VERDICT_TONE[verdict as keyof typeof VERDICT_TONE] ?? "neutral"}>
    <span className="[&_svg]:size-3">
      <Icon.Bot />
    </span>
    {verdict}
  </Tag>
);

const StatusTag = ({ status }: { status: string }) => (
  <Tag tone={STATUS_TONE[status as keyof typeof STATUS_TONE] ?? "neutral"}>
    {status}
  </Tag>
);

function Alerts({ onOpen }: { onOpen: Open }) {
  const [severity, setSeverity] = useState("all");
  const [mine, setMine] = useState("all");
  const [query, setQuery] = useState("");

  /* Filtering for real, not just rendering the controls: a toolbar that does
     not narrow anything cannot show whether its result count, its chips or its
     empty state work. */
  const shown = ALERTS.filter((a) => {
    if (severity !== "all" && a.severity.toLowerCase() !== severity) return false;
    if (mine === "mine" && a.owner !== "You") return false;
    if (query) {
      const hay = `${a.title} ${a.rule} ${a.host} ${a.user}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <Toolbar
          surface="bare"
          search={{
            value: query,
            onChange: setQuery,
            placeholder: "Filter by title, rule, host or user…",
          }}
          resultCount={{ shown: shown.length, total: ALERTS.length }}
          chips={
            <>
              {severity !== "all" && (
                <FilterChip
                  field="Severity"
                  value={severity}
                  onRemove={() => setSeverity("all")}
                />
              )}
              {mine === "mine" && (
                <FilterChip
                  field="Owner"
                  value="You"
                  onRemove={() => setMine("all")}
                />
              )}
            </>
          }
          onClearAll={() => {
            setSeverity("all");
            setMine("all");
            setQuery("");
          }}
        >
          <SegmentedFilter
            options={[
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
          <SegmentedFilter
            options={[
              { value: "all", label: "All" },
              { value: "mine", label: "Mine" },
            ]}
            value={mine}
            onChange={setMine}
            label="Ownership"
          />
        </Toolbar>

      {/* The results live in their own card, as the console has them: the
          filter row stands on the page and the list is the object below it. */}
      <Card padding="none" className="p-4 sm:p-5">
        <p className="text-fg-2 mb-4 text-[13px] font-bold">
          {shown.length} alert{shown.length === 1 ? "" : "s"} in queue
        </p>
        <div className="space-y-2">
          {shown.length === 0 ? (
            <EmptyState
              variant="empty"
              title="No alerts match these filters."
            />
          ) : (
            shown.map((a) => (
            <QueueRow
              key={a.id}
              severity={a.severity}
              title={a.title}
              onOpen={() => onOpen("alert")}
              tags={
                <>
                  <VerdictTag verdict={a.verdict} />
                  <StatusTag status={a.status} />
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
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function Cases({ onOpen }: { onOpen: Open }) {
  const [status, setStatus] = useState("open");
  const [view, setView] = useState("cards");
  const [query, setQuery] = useState("");

  const shown = CASES.filter((c) => {
    if (status === "closed" && c.status !== "Closed") return false;
    if (status === "open" && c.status === "Closed") return false;
    if (status === "action" && !c.needs) return false;
    if (query) {
      const hay = `${c.title} ${c.id} ${c.tenant} ${c.owner}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <Toolbar
          surface="bare"
          search={{
            value: query,
            onChange: setQuery,
            placeholder: "Filter cases…",
          }}
          resultCount={{ shown: shown.length, total: CASES.length }}
          chips={
            status !== "open" ? (
              <FilterChip
                field="Status"
                value={status}
                onRemove={() => setStatus("open")}
              />
            ) : null
          }
          onClearAll={() => {
            setStatus("open");
            setQuery("");
          }}
        >
          <SegmentedFilter
            options={[
              { value: "all", label: "All" },
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
              { value: "action", label: "Action required" },
            ]}
            value={status}
            onChange={setStatus}
            label="Case status"
          />
          {/* The card/table toggle, which the reference builds from a
              segmented with two icon labels — no dedicated component needed. */}
          <Segmented
            items={[
              { value: "cards", label: <span className="[&_svg]:size-4"><Icon.Grid2x2 /></span> },
              { value: "table", label: <span className="[&_svg]:size-4"><Icon.Rows3 /></span> },
            ]}
            value={view}
            onChange={setView}
            label="View mode"
            size="sm"
          />
        </Toolbar>

      {shown.length === 0 ? (
        <Card padding="none" className="p-5">
          <EmptyState variant="empty" title="No cases match these filters." />
        </Card>
      ) : (
      <div className="grid gap-4 xl:grid-cols-2">
        {shown.map((c) => (
          <RecordCard
            key={c.id}
            severity={c.severity}
            title={c.title}
            needsAction={!!c.needs}
            onOpen={() => onOpen("case")}
            meta={
              <>
                <Tag dot={1}>{c.tenant}</Tag>
                <span className="text-fg-2 font-mono text-[11.5px] font-semibold">
                  {c.id}
                </span>
                <SeverityBadge severity={c.severity} />
                <StatusTag status={c.status} />
              </>
            }
            flag={c.needs ? <Tag className="bg-accent/12 text-accent-ink">Action required</Tag> : undefined}
            footer={
              <>
                <Owner name={c.owner} />
                <span className="flex items-center gap-1.5">
                  <span className="[&_svg]:size-3.5">
                    <Icon.ShieldAlert />
                  </span>
                  {c.alerts} alert{c.alerts === 1 ? "" : "s"}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="[&_svg]:size-3.5">
                    <Icon.Clock />
                  </span>
                  {c.at}
                </span>
                {/* The bar, not just the figure: "3h 17m left" alone carries no
                    urgency until you know what it is left of. */}
                <Sla {...c} className="min-w-[150px] flex-1" />
              </>
            }
          />
        ))}
      </div>
      )}
    </div>
  );
}

/* -------------------------------------------------- Alert detail ------- */

const AGENT_BY_KEY = Object.fromEntries(AGENTS.map((a) => [a.key, a]));

/**
 * The SLA readout, with its colour derived rather than chosen.
 *
 * This was hard-coded to green, which is wrong for most of a clock's life: the
 * reference thresholds on ELAPSED time — past 75% it is critical, past 50% it
 * is the accent, and only below that is it ok. At 62% the case-detail header
 * should have been orange. A fixed tone here says "fine" right up to a breach,
 * which is the one thing an SLA bar must not do.
 */
function slaTone(elapsedPct: number, status: string): Tone {
  if (status === "Closed") return "ok";
  if (elapsedPct >= 75) return "crit";
  if (elapsedPct >= 50) return "accent";
  return "ok";
}

function Sla({
  sla,
  slaLabel,
  slaTarget,
  status,
  className,
}: {
  sla: number;
  slaLabel: string;
  slaTarget: string;
  status: string;
  className?: string;
}) {
  return (
    <MeterRow
      orientation="inline"
      label="Time to SLA breach"
      title={slaTarget}
      tone={slaTone(sla, status)}
      fraction={sla / 100}
      value={slaLabel}
      className={className}
    />
  );
}

/**
 * A person as a face plus a name.
 *
 * The reference has this three times (case header, case row, alert row) and it
 * is the last shape on these screens with no library component behind it —
 * there is no Avatar in @cyonix/ui at all. It is written here first, against
 * the real screens, and belongs in the library once the API has stopped moving;
 * a `w-[22px]` in this file is a bug report, and so is this whole function.
 *
 * Initials, not an image: the reference falls back to them whenever FACE has no
 * portrait for a name, and it has none for any of the analysts in this data.
 */
function Owner({ name, size = 22 }: { name: string; size?: number }) {
  const initials = name
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((part) => part[0]!)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="bg-wash-2 text-fg-2 grid shrink-0 place-items-center rounded-full font-extrabold"
        style={{
          width: size,
          height: size,
          fontSize: Math.round(size * 0.42),
        }}
      >
        {initials}
      </span>
      <span className="text-fg truncate">{name}</span>
    </span>
  );
}

function AlertDetail({ onBack }: { onBack: () => void }) {
  const a = ALERT_DETAIL;
  const agent = AGENT_BY_KEY[a.ai.agent]!;
  const router = AGENT_BY_KEY[a.ai.assignedBy]!;
  const verdictTone = VERDICT_TONE[a.ai.verdict as keyof typeof VERDICT_TONE];

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mb-4">
        <span className="[&_svg]:size-4">
          <Icon.ArrowLeft />
        </span>
        All alerts
      </Button>

      <Card padding="none" className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <IconTile tone="crit" size="md" className="size-12 rounded-[14px] [&_svg]:size-6">
            <Icon.ShieldAlert />
          </IconTile>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={a.severity} />
              <StatusTag status={a.status} />
              <span className="text-fg-2 font-mono text-[11.5px] font-semibold">
                {a.id}
              </span>
            </div>
            <h1 className="mt-2 text-[22px] leading-tight font-extrabold tracking-tight sm:text-[26px]">
              {a.title}
            </h1>
            <p className="text-fg-2 mt-1.5 text-[13px] font-semibold">
              {a.rule} · {a.sensor} · fired {a.time} ({a.ago})
              {a.assignee ? ` · assigned to ${a.assignee}` : " · unassigned"}
            </p>
          </div>
        </div>

        {/* The analyst approves or overrides what the agent decided. This row
            is the whole point of the screen, so it sits above the evidence. */}
        <div className="border-rule mt-5 flex flex-wrap items-center gap-2.5 border-t pt-5">
          <p className="text-fg-muted mr-1 text-[11px] font-extrabold tracking-[0.04em] uppercase">
            Agent recommends
          </p>
          <Button size="sm">
            <span className="[&_svg]:size-4">
              <Icon.Check />
            </span>
            Approve — {a.ai.recommendation.toLowerCase()} {a.ai.recTarget}
          </Button>
          <Button variant="tonal" size="sm">
            <span className="[&_svg]:size-4">
              <Icon.CircleX />
            </span>
            Override
          </Button>
          <Button variant="tonal" size="sm">
            <span className="[&_svg]:size-4">
              <Icon.Sliders />
            </span>
            Send to tuning
          </Button>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {/* Ringed in the verdict's own tone: the panel IS the verdict. */}
          <Card padding="none" ring={verdictTone} className="p-5">
            <div className="flex flex-wrap items-start gap-3">
              <IconTile tone={agent.tone} size="sm" className="size-10 rounded-xl [&_svg]:size-5">
                {AGENT_ICON[a.ai.agent as keyof typeof AGENT_ICON]}
              </IconTile>
              <div className="min-w-0 flex-1">
                <h2 className="text-subpanel font-bold tracking-tight">
                  AI investigation
                </h2>
                <p className="text-fg-2 mt-1 text-[12.5px] font-semibold">
                  {agent.name} · {a.ai.steps.length} steps in {a.ai.took}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <VerdictTag verdict={a.ai.verdict} />
                <span className="text-[13px] font-extrabold tabular-nums">
                  {a.ai.confidence}%
                </span>
              </div>
            </div>

            <p className="text-fg-2 mt-4 text-[14px] leading-relaxed font-medium">
              {a.ai.reasoning}
            </p>

            <MeterRow
              className="mt-4"
              label="Confidence"
              tone={verdictTone}
              fraction={a.ai.confidence / 100}
              value={
                a.ai.confidence >= 75
                  ? "above auto-route threshold"
                  : "below 75% — held for a human"
              }
            />

            <details className="border-rule group mt-4 border-t pt-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-extrabold">
                <span className="ease-brand transition-transform duration-instant group-open:rotate-90 [&_svg]:size-4">
                  <Icon.ChevronRight />
                </span>
                Show the {a.ai.steps.length} steps it ran
              </summary>
              <Timeline
                className="mt-4"
                size="sm"
                tone={agent.tone}
                items={a.ai.steps.map((st, i) => ({
                  title: st.k,
                  time: st.t,
                  description: st.d,
                  icon:
                    i === a.ai.steps.length - 1 ? <Icon.Check /> : <Icon.Bot />,
                }))}
              />
            </details>
          </Card>

          <Card padding="none" className="p-5">
            <h2 className="text-subpanel font-bold tracking-tight">
              What happened
            </h2>
            <p className="text-fg-2 mt-2.5 text-[14px] leading-relaxed font-medium">
              {a.summary}
            </p>
            <div className="border-rule mt-5 border-t pt-5">
              <DescriptionList
                layout="inline"
                items={[
                  { label: "Tactic", value: a.tactic },
                  { label: "Technique", value: a.tech, mono: true },
                  { label: "Sensor", value: a.sensor },
                  { label: "Fired at", value: a.time },
                  { label: "Rule", value: a.rule, mono: true },
                  { label: "Case", value: a.case ?? "None", mono: true },
                ]}
              />
            </div>
          </Card>

          <Card padding="none" className="p-5">
            <h2 className="text-subpanel font-bold tracking-tight">
              Event timeline
            </h2>
            <Timeline
              className="mt-4"
              tone="crit"
              items={a.events.map((ev) => ({
                title: ev.k,
                time: ev.t,
                description: ev.d,
                icon: <Icon.ShieldAlert />,
              }))}
            />
          </Card>

          <Card padding="none" className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-subpanel font-bold tracking-tight">
                Detection logic
              </h2>
              <Button variant="ghost" size="sm">
                <span className="[&_svg]:size-4">
                  <Icon.Copy />
                </span>
                Copy
              </Button>
            </div>
            <CodeBlock className="mt-3.5" label="Detection logic">
              {a.logic.join("\n")}
            </CodeBlock>
          </Card>
        </div>

        <div className="space-y-4">
          <Card padding="none" className="p-5">
            <h2 className="text-subpanel font-bold tracking-tight">
              Assignment
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <IconTile tone={router.tone} size="sm" className="size-10 rounded-xl [&_svg]:size-5">
                {AGENT_ICON[a.ai.assignedBy as keyof typeof AGENT_ICON]}
              </IconTile>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-extrabold">
                  {a.ai.assignedTo}
                </span>
                <span className="text-fg-2 block truncate text-[12px] font-semibold">
                  routed by {router.name}
                </span>
              </span>
            </div>
            <p className="border-rule text-fg-2 mt-4 border-t pt-4 text-[13px] leading-relaxed font-medium">
              {a.ai.why}
            </p>
            <Button variant="tonal" size="sm" className="mt-4 w-full">
              <span className="[&_svg]:size-4">
                <Icon.UserCheck />
              </span>
              Reassign
            </Button>
          </Card>

          <Card padding="none" className="p-5">
            <h2 className="text-subpanel font-bold tracking-tight">
              Threat intel
            </h2>
            <div className="mt-4 space-y-3">
              {a.intel.map(([value, verdict, note]) => (
                <div key={value}>
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate font-mono text-[12px] font-semibold">
                      {value}
                    </span>
                    <Tag tone={verdict === "malicious" ? "crit" : "high"}>
                      {verdict}
                    </Tag>
                  </div>
                  <p className="text-fg-2 mt-1 text-[12px] font-medium">
                    {note}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------- Case detail ------- */

const CASE_TABS = [
  "Investigation",
  "Observables",
  "Timeline",
  "Case log",
  "Notes",
  "Agent audit",
];

/**
 * Splits a narrative on its known entity terms and wraps each in an
 * `Annotation`, so the nouns explain themselves without breaking the sentence.
 * The reference does the same with a regex over the case's own entity list.
 */
function annotate(text: string, entities: typeof CASE_DETAIL.entities) {
  if (entities.length === 0) return text;
  const rx = new RegExp(
    `(${entities.map((e) => e.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  return text.split(rx).map((part, i) => {
    const hit = entities.find((e) => e.term.toLowerCase() === part.toLowerCase());
    if (!hit) return part;
    return (
      <Annotation
        key={i}
        kind={hit.kind}
        tone={hit.tone}
        value={hit.term}
        note={hit.note}
        detail={
          hit.intel ? (
            <span className="flex items-center justify-between gap-2">
              <span className="text-fg-muted text-[11px] font-extrabold tracking-[0.04em] uppercase">
                Threat intel
              </span>
              <Tag tone="crit">{hit.intel}</Tag>
            </span>
          ) : undefined
        }
      >
        {part}
      </Annotation>
    );
  });
}

function CaseDetail({ onBack }: { onBack: () => void }) {
  const c = CASE_DETAIL;
  const [tab, setTab] = useState("Investigation");
  const linked = ALERTS.filter((a) => c.linked.includes(a.id));

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mb-4">
        <span className="[&_svg]:size-4">
          <Icon.ArrowLeft />
        </span>
        All cases
      </Button>

      <Card padding="none" className="p-4 xl:p-6">
        <div className="flex flex-wrap items-start gap-3 xl:gap-4">
          <IconTile tone="crit" size="md" className="hidden size-12 rounded-[14px] xl:grid [&_svg]:size-6">
            <Icon.FolderOpen />
          </IconTile>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Tag dot={1}>{c.tenant}</Tag>
              <SeverityBadge severity={c.severity} />
              <StatusTag status={c.status} />
              <span className="text-fg-2 font-mono text-[11.5px] font-semibold">
                {c.id}
              </span>
              {c.needs && <Tag tone="accent">Action required</Tag>}
            </div>
            <h1 className="mt-2 text-[22px] leading-tight font-extrabold tracking-tight xl:text-[26px]">
              {c.title}
            </h1>

            {/* MITRE techniques as outbound chips: the id is the machine value
                and the name is what makes it readable, so both are shown. */}
            <p className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-fg-muted shrink-0 text-[11px] font-extrabold tracking-[0.04em] uppercase">
                MITRE ATT&amp;CK
              </span>
              {c.mitre.map(([id, name]) => (
                <a
                  key={id}
                  href={`https://attack.mitre.org/techniques/${id.replace(".", "/")}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open ${id} — ${name} on attack.mitre.org`}
                  className="bg-surface text-fg-2 hover:text-fg duration-instant ease-brand inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 transition-colors"
                >
                  <span className="text-fg font-mono text-[11px] font-semibold">
                    {id}
                  </span>
                  <span className="text-[12px] font-semibold">{name}</span>
                  {/* These leave the console. Without the marker the chip reads
                      as a filter, which is what every other chip here is. */}
                  <span className="text-fg-muted [&_svg]:size-3">
                    <Icon.ExternalLink />
                  </span>
                </a>
              ))}
            </p>

            {/* A <div>, not a <p>: the SLA meter renders divs, and a div inside
                a p is invalid HTML — the browser closes the paragraph early and
                the strip falls apart. This is a facts row, not prose. */}
            <div className="text-fg-2 mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] font-semibold">
              <Owner name={c.owner} />
              <span className="hidden items-center gap-1.5 xl:flex">
                <span className="[&_svg]:size-3.5">
                  {AGENT_ICON[c.openedBy]}
                </span>
                opened by {AGENT_BY_KEY[c.openedBy]!.name}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="[&_svg]:size-3.5">
                  <Icon.Clock />
                </span>
                {c.at}
              </span>
              <span className="hidden xl:inline">updated {c.updated}</span>
              {/* The inline orientation, which is why it exists: bar and figure
                  on one line inside a strip that has already said what it is. */}
              <Sla {...c} className="min-w-[160px] flex-1" />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Primary, per the reference: of the three, adding a note is the
                one a human is here to do. */}
            <IconButton label="Add note" variant="primary" size="sm">
              <Icon.MessageCircle />
            </IconButton>
            <IconButton label="Report" variant="tonal" size="sm">
              <Icon.FileText />
            </IconButton>
            <IconButton label="Resolve" variant="tonal" size="sm">
              <Icon.Check />
            </IconButton>
          </div>
        </div>

      </Card>

      {/* Outside the card, deliberately. The reference closes the header before
          the tabs, so they stand on the page between the header and the body
          they switch — a control, not part of the thing above it. Nested in the
          card they read as belonging to the header instead of to the content. */}
      <Segmented
        items={CASE_TABS.map((t) => ({ value: t, label: t }))}
        value={tab}
        onChange={setTab}
        label="Case section"
        stretch
        className="mx-auto mt-4 max-w-[780px]"
      />

      <div className="mt-4">
        {tab === "Investigation" ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              <Card padding="none" className="p-5 xl:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-subpanel font-bold tracking-tight">
                    Executive summary
                  </h2>
                  <Tag tone="violet">
                    <span className="[&_svg]:size-3">
                      <Icon.Bot />
                    </span>
                    drafted by agent
                  </Tag>
                </div>
                <p className="text-fg-2 mt-2.5 text-[13.5px] leading-relaxed font-medium">
                  {annotate(c.exec, c.entities)}
                </p>

                <div className="border-rule mt-5 border-t pt-4">
                  <p className="flex items-center justify-between gap-3">
                    <span className="text-fg-muted text-[11px] font-extrabold tracking-[0.04em] uppercase">
                      Conclusion
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {c.verdict.provisional && (
                        <span className="text-accent-ink text-[11.5px] font-bold">
                          provisional
                        </span>
                      )}
                      <VerdictTag verdict={c.verdict.ai} />
                    </span>
                  </p>
                  <p className="mt-2 text-[13.5px] leading-relaxed font-semibold">
                    {annotate(c.conclusion, c.entities)}
                  </p>
                </div>
              </Card>

              <Card padding="none" className="p-5">
                <h2 className="text-subpanel font-bold tracking-tight">
                  Findings
                </h2>
                <div className="mt-4 space-y-3.5">
                  {c.findings.map((f) => (
                    <div key={f.k}>
                      <p className="text-[13.5px] font-extrabold">{f.k}</p>
                      <p className="text-fg-2 mt-0.5 text-[12.5px] font-medium">
                        {f.d}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card padding="none" className="p-5">
                <h2 className="text-subpanel font-bold tracking-tight">
                  Actions taken
                </h2>
                <Timeline
                  className="mt-4"
                  size="sm"
                  tone="accent"
                  items={c.actions.map((ac) => ({
                    title: ac.k,
                    time: ac.t,
                    description: ac.d,
                    icon: <Icon.Check />,
                  }))}
                />
              </Card>

              <Card padding="none" className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-subpanel font-bold tracking-tight">
                    Linked alerts
                  </h2>
                  <span className="bg-surface-3 text-fg grid h-[21px] min-w-[21px] place-items-center rounded-full px-1.5 text-[11px] font-extrabold">
                    {linked.length}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {linked.map((a) => (
                    <QueueRow
                      key={a.id}
                      severity={a.severity}
                      title={a.title}
                      tags={<StatusTag status={a.status} />}
                      facts={
                        <RowFacts
                          items={[
                            <span className="font-mono text-[11.5px]">{a.id}</span>,
                            a.rule,
                          ]}
                        />
                      }
                    />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : tab === "Timeline" ? (
          <Card padding="none" className="p-5">
            <h2 className="text-subpanel font-bold tracking-tight">
              Case timeline
            </h2>
            <Timeline
              className="mt-4"
              tone="crit"
              items={ALERT_DETAIL.events.map((ev) => ({
                title: ev.k,
                time: ev.t,
                description: ev.d,
                icon: <Icon.ShieldAlert />,
              }))}
            />
          </Card>
        ) : (
          <Card padding="none" className="p-5">
            <EmptyState variant="empty" title={`${tab} not rebuilt yet.`} />
          </Card>
        )}
      </div>
    </div>
  );
}

/* The rail's four destinations. Detail screens are NOT here: they are reached
   by opening a record, not by navigating, and the rail keeps the list they came
   from marked as current — which is what the reference does. */
const SCREENS = {
  "#overview": { title: "Overview", render: (open: Open) => <Overview onOpen={open} /> },
  "#alerts": { title: "Alerts", render: (open: Open) => <Alerts onOpen={open} /> },
  "#cases": { title: "Cases", render: (open: Open) => <Cases onOpen={open} /> },
  "#sources": { title: "Sources", render: (open: Open) => <p>Not rebuilt yet.</p> },
} as const;

type Open = (kind: "alert" | "case") => void;
type Route = keyof typeof SCREENS;

export function App() {
  const [href, setHref] = useState<Route>("#overview");
  const [detail, setDetail] = useState<"alert" | "case" | null>(null);
  const [tenant, setTenant] = useState("all");
  const screen = SCREENS[href];

  const open: Open = (kind) => setDetail(kind);
  const go = (to: Route) => {
    setDetail(null);
    setHref(to);
  };

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
                go(to as Route);
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
      {detail === "alert" ? (
        <AlertDetail onBack={() => setDetail(null)} />
      ) : detail === "case" ? (
        <CaseDetail onBack={() => setDetail(null)} />
      ) : (
        screen.render(open)
      )}
    </AppShell>
  );
}
