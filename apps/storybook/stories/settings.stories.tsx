import { Card, Field, FieldGrid, Input, Note, Select, Switch } from "@vcyberizadmin/ui";
import { SettingsShell, type SettingsSection } from "@vcyberizadmin/ui/layout";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/**
 * CX-SET. Tenant stacks settings in one column, which "does not survive ten
 * sections"; VAPT uses tabs, "fine for three and unusable at ten". This is
 * SOC's two-pane shell, which scales to the ten-plus all three are heading for.
 */

const meta = {
  title: "Layout/Settings shell",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SECTIONS: SettingsSection[] = [
  { id: "general", title: "General", description: "Name, region and default time window.", scope: "synced" },
  { id: "identity", title: "Identity & SSO", description: "SAML, SCIM provisioning and session length.", scope: "synced" },
  { id: "notifications", title: "Notifications", description: "Who is paged, for what severity, on which channel.", scope: "synced" },
  { id: "appearance", title: "Appearance", description: "Theme, density and table defaults for this browser.", scope: "device" },
  { id: "connectors", title: "Connectors", description: "Cloud, identity and endpoint data sources.", scope: "synced" },
  { id: "retention", title: "Data retention", description: "How long findings, evidence and raw output are kept.", scope: "synced" },
  { id: "api", title: "API & webhooks", description: "Tokens, signing secrets and delivery retries.", scope: "synced" },
  { id: "audit", title: "Audit log", description: "Export, streaming target and immutability window.", scope: "synced" },
  { id: "billing", title: "Billing", description: "Plan, seats and invoice contacts.", scope: "synced", disabled: true, disabledReason: "Billing is managed by the platform owner." },
];

/** The whole shell, with a dirty section and a scoped save. */
export const TwoPane: Story = {
  name: "Two-pane settings",
  render: function SettingsStory() {
    const [active, setActive] = useState("notifications");
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState<string | null>(null);

    const sections = SECTIONS.map((section) =>
      section.id === active ? { ...section, dirty } : section,
    );

    return (
      <SettingsShell
        sections={sections}
        active={active}
        onSectionChange={(id) => {
          setActive(id);
          setDirty(false);
        }}
        dirty={dirty}
        saving={saving}
        hint={saved ? `Saved ${saved}` : "Each section saves on its own"}
        onSave={() => {
          setSaving(true);
          setTimeout(() => {
            setSaving(false);
            setDirty(false);
            setSaved(active);
          }, 700);
        }}
        // Real apps wire this to ConfirmDialog; without it the shell falls back
        // to window.confirm rather than discarding work silently.
        confirmDiscard={(next) =>
          window.confirm(`Discard unsaved changes and open "${next}"?`)
        }
      >
        {active === "notifications" ? (
          <div className="flex flex-col gap-6">
            <FieldGrid>
              <Field label="Escalation channel" hint="Where a critical finding pages.">
                <Select onChange={() => setDirty(true)}>
                  <option>PagerDuty — SOC primary</option>
                  <option>Slack — #soc-critical</option>
                  <option>Email only</option>
                </Select>
              </Field>
              <Field label="Minimum severity to page">
                <Select onChange={() => setDirty(true)}>
                  <option>Critical</option>
                  <option>High and above</option>
                </Select>
              </Field>
              <Field label="Quiet hours" hint="Local to the tenant's region." optional>
                <Input placeholder="22:00 – 06:00" onChange={() => setDirty(true)} />
              </Field>
            </FieldGrid>
            <Field
              label="Page on SLA breach as well as on severity"
              orientation="inline"
              hint="Independent of the severity threshold above."
            >
              <Switch onChange={() => setDirty(true)} />
            </Field>
            <Note tone="info" title="Section-scoped saving">
              Editing any control above marks only this section dirty. Try
              switching section with unsaved changes — the shell asks first.
            </Note>
          </div>
        ) : (
          <Card nested padding="sm">
            <p className="text-fg-2 text-small">
              The <strong>{SECTIONS.find((s) => s.id === active)?.title}</strong>{" "}
              pane. Each section is a real route when a{" "}
              <code>linkComponent</code> is supplied, so it is linkable and Back
              works.
            </p>
          </Card>
        )}
      </SettingsShell>
    );
  },
};

/**
 * Below 900px the left pane becomes a disclosure rather than disappearing. The
 * standard records that this fallback does not exist in any console today.
 */
export const NarrowFallback: Story = {
  name: "Narrow — the pane collapses",
  parameters: { viewport: { defaultViewport: "mobile2" } },
  render: function NarrowStory() {
    const [active, setActive] = useState("appearance");
    return (
      <div className="max-w-[420px]">
        <SettingsShell
          sections={SECTIONS.slice(0, 5)}
          active={active}
          onSectionChange={setActive}
          onSave={() => undefined}
        >
          <p className="text-fg-2 text-small">
            Resize wider than 900px and the disclosure becomes the sticky
            250px rail again. The active section's title stays visible while
            collapsed, so the pane is never unlabelled.
          </p>
        </SettingsShell>
      </div>
    );
  },
};
