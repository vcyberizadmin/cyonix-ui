import { Button, Card } from "@vcyberizadmin/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Components/Card",
  component: Card,
  argTypes: {
    nested: { control: "boolean" },
    padding: { control: "select", options: ["none", "sm", "md", "lg"] },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {
  args: {
    className: "max-w-md",
    children: (
      <p className="text-fg-2 text-small">
        Card carries no state, so it stays in the server graph. Only Button
        crosses into the client bundle.
      </p>
    ),
  },
};

/** Header bar on the wash, separated by a hairline, with a right-aligned hint. */
export const WithHeader: Story = {
  args: {
    className: "max-w-xl",
    title: "Scan configuration",
    hint: "Applies to all assets in scope",
    actions: <Button size="sm">Save</Button>,
    children: (
      <p className="text-fg-2 text-small">
        No shadow at rest — elevation is reserved for overlays, so a card never
        competes with a modal or drawer.
      </p>
    ),
  },
};

/** One level only. A nested card steps down to the ground colour rather than
 *  adding a second border weight. */
export const Nested: Story = {
  args: {
    className: "max-w-xl",
    title: "Notification channels",
    children: (
      <Card nested title="Email" hint="2 recipients" padding="sm">
        <p className="text-fg-2 text-small">
          Past one level of nesting, use the settings shell (CX-SET) instead.
        </p>
      </Card>
    ),
  },
};
