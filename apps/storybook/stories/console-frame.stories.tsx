import { Card, StatTile, TileGrid } from "@vcyberizadmin/ui";
import {
  AppShell,
  ConsoleBar,
  DockRail,
  DockReveal,
  Logo,
} from "@vcyberizadmin/ui/layout";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  AskAgent,
  BarActions,
  Bot,
  NOTIFS,
  SOC_ITEMS,
  SOC_USER,
  SOC_USER_MENU,
  TENANTS,
  useNoNavLink,
} from "./soc-fixtures.js";

/**
 * The whole SOC console frame: CX-SHL holding CX-DCK and CX-CBR.
 *
 * This is the story that proves the three components are one system rather
 * than three ports that happen to share a repo. Everything here comes from the
 * same fixtures the DockRail and ConsoleBar stories use, so if the rail and the
 * bar ever disagree about the console, this is where it shows.
 *
 * Two things worth resizing for:
 *  · Across 1280px the rail becomes a bottom dock and the bar sheds its inline
 *    theme/settings buttons INTO the profile panel. The agent affordance
 *    changes hands at the same breakpoint: the bar's search field above, the
 *    dock's centre FAB below. It is never in both places and never in neither.
 *  · The rail expands OVER this content on hover. Nothing in the frame reflows.
 */

function Frame({ initialScope = "all" }: { initialScope?: string }) {
  const { activeHref, NoNavLink } = useNoNavLink("/overview");
  const [scope, setScope] = useState(initialScope);
  const [notifs, setNotifs] = useState(NOTIFS);

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
      topBar={
        <ConsoleBar
          brand={<Logo mini size="md" />}
          brandHref="/overview"
          scope={{
            current: scope,
            options: TENANTS,
            pinned: ["all", "nwb", "mrh"],
            onChange: setScope,
            pickerLabel: "Tenants",
          }}
          onSearch={() => {}}
          searchIcon={<Bot />}
          notifications={{
            items: notifs,
            onMarkAllRead: () =>
              setNotifs((all) => all.map((n) => ({ ...n, unread: false }))),
          }}
          user={SOC_USER}
          userMenu={SOC_USER_MENU}
          actions={<BarActions />}
        />
      }
    >
      <TileGrid>
        <StatTile label="Open alerts" value="31" />
        <StatTile label="Cases in flight" value="8" />
        <StatTile label="Resolved by agents" value="87%" />
        <StatTile label="Median triage" value="4m" />
      </TileGrid>

      <Card>
        <p className="text-fg text-small">
          Scope is <strong>{TENANTS.find((t) => t.id === scope)?.name}</strong>.
          Switching it in the bar re-scopes everything below — here, just this
          line.
        </p>
      </Card>

      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index}>
          <p className="text-fg-muted text-small">Panel {index + 1}</p>
        </Card>
      ))}
    </AppShell>
  );
}

const meta = {
  title: "Layout/Console Frame",
  component: AppShell,
  parameters: { layout: "fullscreen" },
  // `Frame` composes the shell itself, so nothing here is driven by args.
  // AppShell requires `children`, and the arg contract has to be satisfied
  // even though the render never reads it.
  args: { children: null },
  render: () => <Frame />,
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The console as an operator meets it. */
export const SOC: Story = {};

/** Scoped to a tenant that is not pinned inline. The bar's picker takes over
 *  naming it, so the frame never stops saying whose data this is. */
export const UnpinnedScope: Story = {
  render: () => <Frame initialScope="vnt" />,
};
