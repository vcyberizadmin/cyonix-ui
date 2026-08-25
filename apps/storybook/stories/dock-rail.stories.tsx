import { Card } from "@vcyberizadmin/ui";
import {
  AppShell,
  DockRail,
  DockReveal,
  Logo,
  type DockRailProps,
} from "@vcyberizadmin/ui/layout";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AskAgent, SOC_ITEMS, useNoNavLink } from "./soc-fixtures.js";

/**
 * CX-DCK — the floating dock rail, as the SOC console uses it.
 *
 * Resize the preview across 1280px to see the whole point of the component:
 * above it the rail is a 76px pill that widens to 232px on hover WITHOUT
 * moving the content column; below it the same markup becomes a bottom dock
 * with the primary action lifted out of its centre.
 *
 * For the rail alongside the console bar, see Layout/Console Frame.
 */

function DockDemo(args: DockRailProps) {
  const { activeHref, NoNavLink } = useNoNavLink(args.activeHref);

  return (
    <div className="bg-bg flex h-dvh">
      <DockRail {...args} activeHref={activeHref} linkComponent={NoNavLink} />
      <div className="text-fg-muted text-small min-w-0 flex-1 p-8 max-xl:pb-28">
        <p>
          Content column. Hover the rail: it widens to 232px OVER this text
          rather than pushing it, so nothing here reflows.
        </p>
        <p className="mt-4">
          Tab into the rail to get the same expansion from the keyboard — it is
          bound to <code>focus-within</code>, not just <code>hover</code>.
        </p>
        <p className="text-fg mt-4 font-mono text-[12px]">
          activeHref: {activeHref ?? "—"}
        </p>
      </div>
    </div>
  );
}

const meta = {
  title: "Layout/DockRail",
  component: DockRail,
  parameters: { layout: "fullscreen" },
  argTypes: { activeHref: { control: "text" } },
  render: (args) => <DockDemo {...args} />,
} satisfies Meta<typeof DockRail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The SOC console as shipped: four destinations, a live alert count in the
 *  danger tone, the agent action, and the module badge at the foot. */
export const SOC: Story = {
  args: {
    items: SOC_ITEMS,
    activeHref: "/overview",
    brand: <Logo size="lg" />,
    brandMini: <Logo mini size="lg" />,
    brandHref: "/overview",
    action: <AskAgent />,
    actionLabel: "Ask the agent",
    footer: (
      <>
        S<DockReveal>OC</DockReveal>
      </>
    ),
  },
};

/** Nothing urgent: no badges at all. An empty queue renders no count rather
 *  than a zero, which would read as a state worth checking. */
export const Quiet: Story = {
  args: {
    ...SOC.args,
    activeHref: "/cases",
    items: SOC_ITEMS.map(({ count: _count, countTone: _tone, ...item }) => item),
  },
};

/** Without an action or a footer — the minimum a dock needs to be useful. */
export const Bare: Story = {
  args: {
    items: SOC_ITEMS,
    activeHref: "/alerts",
    brand: <Logo size="lg" />,
    brandMini: <Logo mini size="lg" />,
  },
};

/** In the shell. `railMode="dock"` is what stops CX-SHL wrapping a rail that
 *  is already responsive in a drawer it does not need. */
export const InShell: Story = {
  args: { items: SOC_ITEMS },
  render: function InShellStory() {
    const { activeHref, NoNavLink } = useNoNavLink("/overview");

    return (
      <AppShell
        railMode="dock"
        rail={
          <DockRail
            items={SOC_ITEMS}
            activeHref={activeHref}
            linkComponent={NoNavLink}
            brand={<Logo size="lg" />}
            brandMini={<Logo mini size="lg" />}
            brandHref="/overview"
            action={<AskAgent />}
            actionLabel="Ask the agent"
            footer={
              <>
                S<DockReveal>OC</DockReveal>
              </>
            }
          />
        }
      >
        <Card>
          <p className="text-fg text-small">
            The shell reserves scroll room at the foot of this column below
            1280px, so the dock never covers the last row.
          </p>
        </Card>
        {Array.from({ length: 8 }, (_, index) => (
          <Card key={index}>
            <p className="text-fg-muted text-small">Panel {index + 1}</p>
          </Card>
        ))}
      </AppShell>
    );
  },
};
