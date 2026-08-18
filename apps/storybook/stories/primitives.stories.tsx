import {
  Button,
  Card,
  ChipStack,
  Code,
  EmptyState,
  ErrorState,
  InsightPanel,
  Note,
  Skeleton,
  StatusPill,
  Tag,
} from "@vcyberizadmin/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/**
 * Step 3 of the rollout: the zero-dependency primitives everything else
 * composes from. CX-TAG, CX-STE and CX-INS.
 */
const meta = { title: "Primitives/Overview", parameters: { layout: "padded" } } satisfies Meta;
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

/** CX-TAG. The trap: a Tag looks close enough to a StatusPill that misuse is
 *  likely. A Tag labels a non-status attribute — the last row shows both so the
 *  difference is obvious in review. */
export const TagsAndCode: Story = {
  name: "CX-TAG — tag · chip · code",
  render: () => (
    <div className="flex flex-col gap-8">
      <Card title="Tag" hint="Labels, not status">
        <div className="flex flex-col gap-5">
          <Row label="Plain labels">
            {["Terraform", "Kubernetes", "PCI-DSS v4", "v2.14.0"].map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </Row>
          <Row label="Categorical identity dots — never the severity ladder">
            {["Recon", "Exploit", "Report", "Comply", "Ledger", "Other"].map((t, i) => (
              <Tag key={t} dot={(i + 1) as 1}>
                {t}
              </Tag>
            ))}
          </Row>
          <Row label="Filtering tags must LOOK clickable">
            {["Critical only", "Unassigned"].map((t) => (
              <Tag key={t} onClick={() => undefined}>
                {t}
              </Tag>
            ))}
          </Row>
          <Row label="Overflow collapses to +n, remainder on hover">
            <ChipStack
              max={3}
              items={[
                { label: "Terraform", dot: 1 },
                { label: "Kubernetes", dot: 2 },
                { label: "Vault", dot: 3 },
                { label: "Consul", dot: 4 },
                { label: "Nomad", dot: 5 },
              ]}
            />
          </Row>
          <Row label="Tag vs StatusPill — the visual similarity is the trap">
            <Tag dot={2}>Kubernetes</Tag>
            <span className="text-fg-muted text-[11px]">is an attribute ·</span>
            <StatusPill status="Running" />
            <span className="text-fg-muted text-[11px]">is a state</span>
          </Row>
        </div>
      </Card>

      <Card title="Code" hint="Machine values in mono">
        <Row label="Copyable — click to copy">
          <Code copyable>CVE-2026-0042</Code>
          <Code copyable>assessment:update</Code>
          <Code>sha256:9f2a…c41b</Code>
        </Row>
      </Card>
    </div>
  ),
};

/** CX-STE. The `variant` prop is required, so the "nothing exists" vs "nothing
 *  matches" distinction cannot be skipped — that conflation is the dead-end
 *  screen this component exists to remove. */
export const States: Story = {
  name: "CX-STE — empty · loading · error",
  render: () => {
    const [loading, setLoading] = useState(false);
    return (
      <div className="flex flex-col gap-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card title="variant=&quot;empty&quot;" padding="none">
            <EmptyState
              variant="empty"
              title="No assessments yet"
              description="Run your first assessment to start collecting findings."
              action={<Button size="sm">New assessment</Button>}
            />
          </Card>
          <Card title="variant=&quot;filtered&quot;" padding="none">
            <EmptyState
              variant="filtered"
              title="No findings match these filters"
              description="3 filters are active, including severity: Critical."
              action={
                <Button size="sm" variant="outline">
                  Clear filters
                </Button>
              }
            />
          </Card>
        </div>

        <Card title="Error — danger tone on the left rule only">
          <ErrorState
            title="Could not load findings"
            description="The assessment service did not respond. Retrying usually works; if it does not, quote the reference below."
            correlationId="req_8f21c4de"
            action={
              <Button size="sm" variant="outline">
                Retry
              </Button>
            }
          />
        </Card>

        <Card
          title="Skeleton"
          hint="Suppressed for 200ms so fast loads never flash"
          actions={
            <Button size="sm" variant="outline" onClick={() => setLoading((v) => !v)}>
              {loading ? "Stop" : "Simulate load"}
            </Button>
          }
          padding="none"
        >
          {loading ? (
            <Skeleton rows={4} rowHeight={44} columns={["28%", "18%", "24%", "12%"]} />
          ) : (
            <div className="text-fg-muted text-small px-4 py-8 text-center">
              Idle — the skeleton mirrors the real row height and column widths,
              so nothing jumps when data arrives.
            </div>
          )}
        </Card>
      </div>
    );
  },
};

/** CX-INS. Note refuses a brand tone at the type level; InsightPanel labels AI
 *  output and cites what it derives from. */
export const NotesAndInsight: Story = {
  name: "CX-INS — note & insight panel",
  render: () => (
    <div className="flex flex-col gap-8">
      <Card title="Note" hint="Four tones. No brand tone exists.">
        <div className="flex flex-col gap-3">
          <Note tone="info" title="Scope applies to sub-domains">
            Wildcard targets include every resolved sub-domain at scan time.
          </Note>
          <Note tone="warning" title="This will pause active scans">
            Two assessments are mid-run and will be requeued.
          </Note>
          <Note tone="danger" title="Credentials will be revoked">
            Any integration using this key stops working immediately.
          </Note>
          <Note tone="success">Retest passed — all 12 findings remediated.</Note>
        </div>
        <p className="text-fg-muted text-small mt-4">
          Place a note adjacent to what it describes, never at the top of a long
          form. They accumulate: three on one form and none get read.
        </p>
      </Card>

      <Card title="Insight panel" hint="Machine-generated, and says so">
        <InsightPanel
          confidence="medium"
          sources={[
            { label: "CVE-2026-0042", href: "#" },
            { label: "asset:api-gateway-prod", href: "#" },
            { label: "run_7741", href: "#" },
          ]}
          actions={
            <>
              <Tag onClick={() => undefined}>Open finding</Tag>
              <Tag onClick={() => undefined}>Assign to me</Tag>
              <Tag onClick={() => undefined}>Suppress</Tag>
            </>
          }
        >
          The exposed admin endpoint on <Code>api-gateway-prod</Code> matches the
          pattern behind two prior criticals in this tenant. It is reachable from
          the public attack surface and is not covered by the current WAF rule set.
        </InsightPanel>
        <p className="text-fg-muted text-small mt-4">
          Suggested actions are chips, never auto-executed. The confidence signal
          is mandatory in spirit — without one an insight panel reads as certainty.
        </p>
      </Card>
    </div>
  ),
};
