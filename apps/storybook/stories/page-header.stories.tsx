import { Button, Card, Tag } from "@vcyberizadmin/ui";
import {
  Breadcrumb,
  CommandPalette,
  PageHeader,
  type Command,
} from "@vcyberizadmin/ui/layout";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/** Step 7 remainder: CX-HDR and CX-CMD. */
const meta = {
  title: "Layout/Page header & palette",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Header: Story = {
  name: "CX-HDR — page header",
  render: () => (
    <div className="flex flex-col gap-10">
      <PageHeader
        breadcrumb={[
          { label: "Assessments", href: "/assessments" },
          { label: "Vantage Public Sector", href: "/assessments/vantage" },
          // Last crumb is text even though an href is passed — the component
          // refuses to link to the page you are already on.
          { label: "CX-1188", href: "/assessments/vantage/cx-1188" },
        ]}
        eyebrow="Red team operations"
        title="Exposed admin endpoint"
        fr="FR-4.2.1"
        meta="api-gateway-prod · owned by A. Fernando · Enterprise plan"
        actions={
          <>
            <Button variant="ghost" size="sm">Export</Button>
            <Button variant="solid" size="sm">Reassign</Button>
            <Button size="sm">Start retest</Button>
          </>
        }
      />

      <Card title="Shallow route" hint="Eyebrow OR breadcrumb, not both">
        <PageHeader
          title="Settings"
          meta="Platform configuration"
          actions={<Button size="sm">Save changes</Button>}
        />
      </Card>

      <Card title="Customer-facing build" hint="showInternal={false} hides the FR chip">
        <PageHeader
          eyebrow="Compliance"
          title="PCI-DSS v4 coverage"
          fr="FR-9.1"
          showInternal={false}
          meta="82 of 96 controls evidenced"
        />
      </Card>

      <Card title="Breadcrumb on its own">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Tenants", href: "/tenants" },
            { label: "Northwind Health" },
          ]}
        />
      </Card>
    </div>
  ),
};

const ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="7" />
  </svg>
);

export const Palette: Story = {
  name: "CX-CMD — command palette",
  render: () => {
    const [log, setLog] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const record = (what: string) => setLog((l) => [what, ...l].slice(0, 5));

    const commands: Command[] = [
      { id: "go-dash", group: "Navigate", label: "Dashboard", icon: ICON, onRun: () => record("→ Dashboard") },
      { id: "go-find", group: "Navigate", label: "Findings", icon: ICON, shortcut: "g f", onRun: () => record("→ Findings") },
      { id: "go-assets", group: "Navigate", label: "Attack surface", icon: ICON, onRun: () => record("→ Attack surface") },
      { id: "go-settings", group: "Navigate", label: "Settings", icon: ICON, onRun: () => record("→ Settings") },
      { id: "new-assess", group: "Actions", label: "Start assessment", shortcut: "⌘N", onRun: () => record("ran: Start assessment") },
      { id: "new-case", group: "Actions", label: "Create case", onRun: () => record("ran: Create case") },
      { id: "toggle-theme", group: "Actions", label: "Toggle theme", shortcut: "⌘⇧L", onRun: () => record("ran: Toggle theme") },
    ];

    // Stands in for a record search: resolves late, so you can see local
    // results render first and remote ones append underneath.
    const onSearch = async (query: string): Promise<Command[]> => {
      await new Promise((r) => setTimeout(r, 600));
      return ["CX-1188 Exposed admin endpoint", "CX-1150 Stale IAM access key"]
        .filter((t) => t.toLowerCase().includes(query.toLowerCase()))
        .map((t) => ({
          id: t,
          group: "Records",
          label: t,
          hint: "finding",
          onRun: () => record(`opened ${t}`),
        }));
    };

    return (
      <div className="flex flex-col gap-4">
        <Card title="Command palette" hint="⌘K / Ctrl+K, or the button">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={() => setOpen(true)}>Open palette</Button>
            <span className="text-fg-muted text-small">
              Press <Tag>⌘K</Tag> anywhere. Empty query shows recents once you have run something.
            </span>
          </div>
          <p className="text-fg-muted text-small mt-4">
            Type <code>ca</code> — the word-start bonus puts &quot;Create case&quot; above
            substring matches. Type <code>cx</code> and the Records group appears
            ~600ms later, underneath the local results, without blocking them.
          </p>
        </Card>

        <Card title="Ran" padding="sm">
          {log.length === 0 ? (
            <span className="text-fg-muted text-small">nothing yet</span>
          ) : (
            <ul className="flex flex-col gap-1">
              {log.map((entry, i) => (
                <li key={i} className="text-fg-2 font-mono text-[12px]">{entry}</li>
              ))}
            </ul>
          )}
        </Card>

        {/* Code editors bind ⌘K themselves, so the palette must not fight them. */}
        <Card title="⌘K inside a code editor is suppressed" padding="sm">
          <div data-code-editor className="border-rule bg-bg rounded-sm border p-3">
            <textarea
              defaultValue="# focus here and press ⌘K — the palette must NOT open"
              rows={2}
              className="text-fg-2 w-full resize-none bg-transparent font-mono text-[12px] focus:outline-none"
            />
          </div>
        </Card>

        <CommandPalette
          commands={commands}
          onSearch={onSearch}
          open={open}
          onOpenChange={setOpen}
          storageKey="sb.palette"
        />
      </div>
    );
  },
};
