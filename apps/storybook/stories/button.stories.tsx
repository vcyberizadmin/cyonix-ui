import { Button } from "@cyonix/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const VARIANTS = ["primary", "outline", "solid", "edge", "danger", "ghost"] as const;

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Request changes" },
  argTypes: {
    variant: { control: "select", options: VARIANTS },
    size: { control: "select", options: ["sm", "md", "lg"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: "primary" } };

/**
 * Every variant side by side. The chamfered bottom-right corner should be
 * visible on all of them — it is the identity's one shape rule.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

/** Async actions hold disabled until settled so nothing double-submits. */
export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button loading>Saving</Button>
      <Button variant="outline" loading>
        Saving
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant} disabled>
          {variant}
        </Button>
      ))}
    </div>
  ),
};
