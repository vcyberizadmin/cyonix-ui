import {
  Button,
  ChipStack,
  Code,
  DataTable,
  DueChip,
  FilterChip,
  Pagination,
  Progress,
  SegmentedFilter,
  SeverityBadge,
  SeverityCounts,
  StatusPill,
  Toolbar,
  TwoLineCell,
  type Column,
} from "@vcyberizadmin/ui";
import { Menu } from "@vcyberizadmin/ui/overlays";
import { SEVERITIES, type Severity } from "@vcyberizadmin/ui/lib/status";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";

/** Step 4: the workhorse surface. CX-TBL + CX-FLT + CX-PAG together, which is
 *  how they are actually used — toolbar above, pagination inside the border. */
const meta = {
  title: "Data/Table",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

interface Finding {
  id: string;
  title: string;
  asset: string;
  severity: Severity;
  status: string;
  owner: string;
  dueDays: number;
  progress: number;
  tags: string[];
}

const FINDINGS: Finding[] = [
  { id: "CX-1188", title: "Exposed admin endpoint", asset: "api-gateway-prod", severity: "Critical", status: "Running", owner: "A. Fernando", dueDays: -3, progress: 40, tags: ["Kubernetes", "PCI-DSS"] },
  { id: "CX-1201", title: "Weak TLS cipher suite", asset: "edge-cdn-01", severity: "Medium", status: "Pending review", owner: "R. Silva", dueDays: 5, progress: 80, tags: ["Terraform"] },
  { id: "CX-1150", title: "Stale IAM access key", asset: "vault-eu-west", severity: "High", status: "Active", owner: "K. Perera", dueDays: 0, progress: 10, tags: ["Vault", "SOC2", "PCI-DSS"] },
  { id: "CX-1244", title: "Verbose error responses", asset: "billing-svc", severity: "Low", status: "Approved", owner: "A. Fernando", dueDays: 21, progress: 100, tags: ["Consul"] },
  { id: "CX-1099", title: "Missing rate limit", asset: "auth-svc", severity: "High", status: "Failed", owner: "R. Silva", dueDays: 2, progress: 55, tags: ["Nomad", "SOC2"] },
  { id: "CX-1310", title: "Deprecated TLS 1.0 listener", asset: "legacy-lb", severity: "Info", status: "Draft", owner: "Unassigned", dueDays: 45, progress: 0, tags: [] },
];

const COUNTS = SEVERITIES.reduce<Partial<Record<Severity, number>>>((acc, s) => {
  acc[s] = FINDINGS.filter((f) => f.severity === s).length;
  return acc;
}, {});

function useColumns(): Column<Finding>[] {
  return useMemo(
    () => [
      {
        key: "id",
        header: "Finding",
        width: "24%",
        sortable: true,
        sortValue: (row) => row.title,
        cell: (row) => <TwoLineCell primary={row.title} secondary={row.id} />,
      },
      {
        key: "asset",
        header: "Asset",
        width: "16%",
        sortable: true,
        sortValue: (row) => row.asset,
        cell: (row) => <Code>{row.asset}</Code>,
      },
      {
        key: "severity",
        header: "Severity",
        width: "11%",
        truncate: false,
        sortable: true,
        // Ranked, not alphabetical — Critical must sort first.
        sortAs: "severity",
        sortValue: (row) => row.severity,
        cell: (row) => <SeverityBadge severity={row.severity} />,
      },
      {
        key: "status",
        header: "Status",
        width: "15%",
        truncate: false,
        sortable: true,
        sortValue: (row) => row.status,
        cell: (row) => <StatusPill status={row.status} />,
      },
      {
        key: "tags",
        header: "Frameworks",
        width: "13%",
        truncate: false,
        cell: (row) =>
          row.tags.length ? (
            <ChipStack max={2} items={row.tags.map((t, i) => ({ label: t, dot: ((i % 6) + 1) as 1 }))} />
          ) : (
            <span className="text-fg-muted text-[11px]">—</span>
          ),
      },
      {
        key: "due",
        header: "Due",
        width: "9%",
        truncate: false,
        sortable: true,
        sortAs: "number",
        sortValue: (row) => row.dueDays,
        cell: (row) => <DueChip days={row.dueDays} />,
      },
      {
        key: "progress",
        header: "Remediation",
        width: "12%",
        sortable: true,
        sortAs: "number",
        sortValue: (row) => row.progress,
        cell: (row) => <Progress value={row.progress} />,
      },
      {
        key: "actions",
        header: "",
        actions: true,
        cell: () => (
          <Menu
            label="Row actions"
            trigger={<span aria-hidden="true">⋯</span>}
            items={[
              { label: "Open finding" },
              { label: "Assign to me" },
              { label: "Suppress", danger: true },
            ]}
          />
        ),
      },
    ],
    [],
  );
}

/** The full surface. Click a header — the rows genuinely move. */
export const FindingsRegister: Story = {
  name: "Full surface",
  render: () => {
    const columns = useColumns();
    const [search, setSearch] = useState("");
    const [severity, setSeverity] = useState("all");
    const [selected, setSelected] = useState<string>();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const filtered = FINDINGS.filter(
      (f) =>
        (severity === "all" || f.severity === severity) &&
        (search === "" ||
          `${f.title} ${f.asset} ${f.id}`.toLowerCase().includes(search.toLowerCase())),
    );

    const chips = [
      ...(severity !== "all"
        ? [<FilterChip key="sev" field="Severity" value={severity} onRemove={() => setSeverity("all")} />]
        : []),
      ...(search
        ? [<FilterChip key="q" field="Search" value={search} onRemove={() => setSearch("")} />]
        : []),
    ];

    return (
      <div className="flex flex-col gap-4">
        <div className="border-rule bg-surface overflow-hidden rounded-md border">
          <Toolbar
            search={{ value: search, onChange: setSearch, placeholder: "Search findings, assets, IDs" }}
            chips={chips.length ? chips : undefined}
            onClearAll={chips.length ? () => { setSearch(""); setSeverity("all"); } : undefined}
            resultCount={{ shown: filtered.length, total: FINDINGS.length }}
            savedViews={{
              views: [{ id: "mine", name: "My open findings" }, { id: "overdue", name: "Overdue criticals" }],
              onSelect: () => undefined,
              onSave: () => undefined,
            }}
          >
            <SegmentedFilter
              label="Filter by severity"
              value={severity}
              onChange={(v) => { setSeverity(v); setPage(1); }}
              options={[
                { value: "all", label: "All", count: FINDINGS.length },
                ...SEVERITIES.map((s) => ({ value: s, label: s, count: COUNTS[s] ?? 0 })),
              ]}
            />
          </Toolbar>
        </div>

        <DataTable
          label="Findings"
          columns={columns}
          rows={filtered}
          rowKey={(row) => row.id}
          selectedKey={selected}
          onRowClick={(row) => setSelected(row.id)}
          defaultSort={{ key: "severity", direction: "asc" }}
          minWidth="1100px"
          empty={{
            variant: chips.length ? "filtered" : "empty",
            title: chips.length ? "No findings match these filters" : "No findings yet",
            description: chips.length
              ? "Clear a filter to widen the search."
              : "Run an assessment to start collecting findings.",
          }}
          footer={
            <Pagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          }
        />

        <div className="text-fg-muted text-small flex flex-wrap items-center gap-4">
          <span>Selected: <span className="font-mono">{selected ?? "none"}</span></span>
          <span className="flex items-center gap-2">
            Severity mix: <SeverityCounts counts={COUNTS} />
          </span>
        </div>
      </div>
    );
  },
};

/** All three states render in the table's own body, never replacing the page. */
export const BodyStates: Story = {
  name: "Loading · empty · error",
  render: () => {
    const columns = useColumns();
    const [state, setState] = useState<"loading" | "empty" | "error">("loading");
    return (
      <div className="flex flex-col gap-4">
        <SegmentedFilter
          label="State"
          value={state}
          onChange={(v) => setState(v as typeof state)}
          options={[
            { value: "loading", label: "Loading" },
            { value: "empty", label: "Empty" },
            { value: "error", label: "Error" },
          ]}
        />
        <DataTable
          label="Findings"
          columns={columns}
          rows={[]}
          rowKey={(row) => row.id}
          minWidth="1100px"
          loading={state === "loading"}
          error={
            state === "error"
              ? {
                  title: "Could not load findings",
                  description: "The assessment service did not respond. Retrying usually works.",
                  correlationId: "req_8f21c4de",
                  action: <Button size="sm" variant="outline">Retry</Button>,
                }
              : undefined
          }
          empty={{
            variant: "empty",
            title: "No findings yet",
            description: "Run an assessment to start collecting findings.",
            action: <Button size="sm">New assessment</Button>,
          }}
        />
      </div>
    );
  },
};
