import { Button, Card, IconButton } from "@vcyberizadmin/ui";
import { Logo, ThemeToggle } from "@vcyberizadmin/ui/layout";
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * The mark, the theme switch, and the icon-only control — the three exports
 * every console was hand-rolling.
 */

const meta = {
  title: "Foundations/Brand & controls",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Pencil = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const Trash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
);
const Dots = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="12" cy="19" r="1.6" />
  </svg>
);

export const Brand: Story = {
  name: "Logo — the only use of the spark gradient",
  render: () => (
    <div className="flex flex-col gap-6">
      <Card title="One mark, three consoles">
        <div className="flex flex-col gap-5">
          <Logo module="VAPT" />
          <Logo module="SOC" />
          <Logo module="Tenant" />
          <div className="flex items-center gap-6">
            <Logo mini />
            <Logo size="sm" module="VAPT" />
            <Logo size="lg" module="SOC" />
          </div>
        </div>
      </Card>
      <Card title="Why it is a component" padding="sm">
        <p className="text-fg-2 text-small">
          The design system restricts <code>--spark</code> to logo artwork:
          never a button background, never a UI fill, never a chart colour. This
          is the only legitimate use, so shipping it as a component is what keeps
          the gradient from escaping into the interface via copy-paste. The white
          “C” is exempt from contrast requirements as part of a brand mark — do
          not “fix” it.
        </p>
      </Card>
    </div>
  ),
};

export const Icons: Story = {
  name: "IconButton — 44×44 hit area, compact box",
  render: () => (
    <div className="flex flex-col gap-6">
      <Card title="Variants and sizes">
        <div className="flex flex-wrap items-center gap-4">
          <IconButton label="Edit"><Pencil /></IconButton>
          <IconButton label="More actions"><Dots /></IconButton>
          <IconButton label="Edit" variant="solid"><Pencil /></IconButton>
          <IconButton label="Delete" variant="danger"><Trash /></IconButton>
          <IconButton label="Edit" size="sm"><Pencil /></IconButton>
          <IconButton label="Edit" size="lg"><Pencil /></IconButton>
          <IconButton
            label="Delete"
            variant="danger"
            disabled
            disabledReason="Findings with evidence cannot be deleted."
          >
            <Trash />
          </IconButton>
        </div>
      </Card>
      <Card title="Two things it gets right" padding="sm">
        <p className="text-fg-2 text-small">
          The visual box is 32px but the hit area is a centred 44×44
          pseudo-element, so a dense toolbar row is not forced to 44px tall.
          And <code>label</code> is <strong>required by the type</strong> — an
          icon-only control with no accessible name is the commonest defect in
          icon toolbars, so it cannot be forgotten here.
        </p>
      </Card>
    </div>
  ),
};

export const Theme: Story = {
  name: "ThemeToggle",
  render: () => (
    <div className="flex flex-col gap-6">
      <Card title="Switch">
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-fg-2 text-small">
            Writes <code>data-theme</code> on <code>&lt;html&gt;</code>.
          </span>
        </div>
      </Card>
      <Card title="It cannot prevent a flash on its own" padding="sm">
        <p className="text-fg-2 text-small">
          The browser paints the server HTML before any effect runs, so the app
          must set <code>data-theme</code> before first paint with a blocking
          inline script in <code>&lt;head&gt;</code> using the same storage key.
          The component reads whatever that script decided, so the two cannot
          disagree. Storybook's own toolbar control drives a wrapper class
          instead, so this button and the toolbar are independent here.
        </p>
      </Card>
      <Card title="Primary action, for scale" padding="sm">
        <Button>Save changes</Button>
      </Card>
    </div>
  ),
};
