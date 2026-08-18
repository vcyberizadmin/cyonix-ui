import {
  Card,
  DefinitionCard,
  DescriptionList,
  TileGrid,
} from "@vcyberizadmin/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * CX-DEF. A definition object is anything configured once and applied many
 * times: a role, a playbook, a detection rule, a connector, a module.
 */

const meta = {
  title: "Content/Definition card",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The card grid: auto-fit at a 320px minimum. */
export const Roles: Story = {
  name: "Definition grid",
  render: () => (
    <TileGrid min={320}>
      <DefinitionCard
        title="Tenant Administrator"
        rank="Level 4"
        isDefault
        readOnly
        readOnlyReason="Built-in roles cannot be edited. Clone to customise."
        description="Full control of one tenant: users, subscriptions, connectors and audit export. Cannot reach other tenants or platform settings."
        capabilities={[
          { label: "tenant:*" },
          { label: "user:write" },
          { label: "billing:read" },
          { label: "audit:export" },
          { label: "connector:write" },
          { label: "sso:configure" },
        ]}
        meta={["v3", "T. Kurukulaarachchi", "2026-06-01"]}
        action={{ label: "Clone" }}
      />
      <DefinitionCard
        title="Read-only Auditor"
        rank="Level 1"
        isDefault
        readOnly
        readOnlyReason="Built-in roles cannot be edited. Clone to customise."
        description="Sees everything, changes nothing. Intended for external audit engagements with a fixed end date."
        capabilities={[{ label: "*:read" }, { label: "audit:export" }]}
        meta={["v1", "System", "2026-01-14"]}
        action={{ label: "Clone" }}
      />
      <DefinitionCard
        title="Copy of Tenant Administrator"
        rank="Level 4"
        description="Cloned for Northwind Health. Billing removed; SSO configuration retained."
        capabilities={[
          { label: "tenant:*" },
          { label: "user:write" },
          { label: "audit:export" },
          { label: "sso:configure" },
        ]}
        meta={["v1", "A. Fernando", "2026-08-11"]}
        action={{ label: "Edit" }}
      />
      <DefinitionCard
        title="Incident Responder"
        rank="Level 3"
        description="Triage and containment during an active incident. Time-boxed elevation, expires with the incident."
        capabilities={[
          { label: "alert:write" },
          { label: "host:isolate" },
          { label: "case:write" },
        ]}
        meta={["v2", "N. Perera", "2026-07-22"]}
        action={{ label: "Edit" }}
      />
    </TileGrid>
  ),
};

/**
 * The rule worth keeping: a read-only object shows its action DISABLED WITH THE
 * REASON rather than hiding it. Hiding the control teaches nothing.
 */
export const ReadOnlyTeaches: Story = {
  name: "Read-only shows the reason",
  render: () => (
    <div className="flex flex-col gap-6">
      <TileGrid min={320}>
        <DefinitionCard
          title="Built-in — reason shown"
          isDefault
          readOnly
          readOnlyReason="Built-in definitions cannot be edited. Clone to customise."
          description="The disabled Clone control plus its reason is what teaches the clone-to-customise model."
          meta={["v1", "System"]}
          action={{ label: "Clone" }}
        />
        <DefinitionCard
          title="Custom — action live"
          description="A cloned definition is editable, so the same control is enabled and no explanation is needed."
          meta={["v1", "A. Fernando"]}
          action={{ label: "Edit" }}
        />
      </TileGrid>
      <Card title="Why the type requires the reason" padding="sm">
        <p className="text-fg-2 text-small">
          <code>readOnly</code> without <code>readOnlyReason</code> does not
          compile. A disabled control with no explanation is worse than no
          control at all — the operator learns only that they cannot proceed.
        </p>
      </Card>
    </div>
  ),
};

/** DescriptionList: the label/value primitive behind detail panes. */
export const Descriptions: Story = {
  name: "DescriptionList",
  render: () => (
    <div className="grid grid-cols-1 gap-6 min-[900px]:grid-cols-2">
      <Card title="inline — scannable down the labels">
        <DescriptionList
          items={[
            { label: "Asset", value: "web-01.northwind.example", mono: true },
            { label: "Environment", value: "Production" },
            { label: "First seen", value: "2026-03-04" },
            { label: "Owner", value: null },
            { label: "Fingerprint", value: "a3f9c2e1d8b7", mono: true },
          ]}
        />
      </Card>
      <Card title="stacked — for values that wrap">
        <DescriptionList
          layout="stacked"
          items={[
            { label: "Detection rule", value: "Impossible travel, 2 geographies within 5 minutes" },
            { label: "Data source", value: "identity.signin", mono: true },
            { label: "MITRE", value: "T1078.004 — Valid Accounts: Cloud Accounts" },
            { label: "Suppression", value: "" },
          ]}
        />
      </Card>
      <Card title="Empty values are explicit" padding="sm" className="min-[900px]:col-span-2">
        <p className="text-fg-2 text-small">
          “Owner” and “Suppression” have no value, and both render an em-dash.
          A blank cell is indistinguishable from a rendering bug, and in an audit
          view “not set” is itself the answer.
        </p>
      </Card>
    </div>
  ),
};
