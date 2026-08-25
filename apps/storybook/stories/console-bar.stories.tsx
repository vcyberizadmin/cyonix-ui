import {
  ConsoleBar,
  Logo,
  type ConsoleBarProps,
} from "@vcyberizadmin/ui/layout";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  BarActions,
  Bot,
  Lock,
  NOTIFS,
  SOC_USER,
  SOC_USER_MENU,
  TENANTS,
} from "./soc-fixtures.js";

/**
 * CX-CBR — the console bar, as the SOC console uses it.
 *
 * Drag the preview narrower to watch the bar shed load in order: the inline
 * scope tabs drop one at a time into the picker (which takes over naming the
 * current scope), the search affordance goes below `lg`, and below `xl` the
 * theme and settings controls fold into the profile panel as labelled rows.
 *
 * For the bar alongside the dock rail, see Layout/Console Frame.
 */

function BarDemo(args: ConsoleBarProps) {
  const [tenant, setTenant] = useState(args.scope?.current ?? "all");
  const [notifs, setNotifs] = useState(NOTIFS);
  const [log, setLog] = useState<string>("—");

  const hasNotifications = !!args.notifications;

  return (
    <div className="bg-bg flex h-dvh flex-col">
      <ConsoleBar
        {...args}
        scope={
          args.scope && {
            ...args.scope,
            current: tenant,
            onChange: (id) => {
              setTenant(id);
              setLog(`scope → ${id}`);
            },
          }
        }
        onSearch={args.onSearch && (() => setLog("search opened"))}
        notifications={
          hasNotifications
            ? {
                items: notifs.map((n) => ({
                  ...n,
                  onSelect: () => {
                    setNotifs((all) =>
                      all.map((x) => (x.id === n.id ? { ...x, unread: false } : x)),
                    );
                    setLog(`opened ${n.title}`);
                  },
                })),
                onMarkAllRead: () =>
                  setNotifs((all) => all.map((x) => ({ ...x, unread: false }))),
              }
            : undefined
        }
      />
      <div className="text-fg-muted text-small min-w-0 flex-1 p-8">
        <p>
          Content column. The scope tabs, the bell and the avatar all open
          CX-TIP popovers, so Escape, click-outside and focus return come from
          the shared overlay stack.
        </p>
        <p className="text-fg mt-4 font-mono text-[12px]">last action: {log}</p>
      </div>
    </div>
  );
}

const meta = {
  title: "Layout/ConsoleBar",
  component: ConsoleBar,
  parameters: { layout: "fullscreen" },
  render: (args) => <BarDemo {...args} />,
} satisfies Meta<typeof ConsoleBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The SOC console as shipped: scope tabs, agent search, theme and settings
 *  inline, notifications and profile. */
const SOC_ARGS = {
  brand: <Logo mini size="md" />,
  brandHref: "/overview",
  scope: {
    current: "all",
    options: TENANTS,
    pinned: ["all", "nwb", "mrh"],
    onChange: () => {},
    pickerLabel: "Tenants",
  },
  onSearch: () => {},
  searchIcon: <Bot />,
  notifications: { items: NOTIFS },
  user: SOC_USER,
  userMenu: SOC_USER_MENU,
  actions: <BarActions />,
} satisfies ConsoleBarProps;

export const SOC: Story = { args: SOC_ARGS };

/** An unpinned scope is current. The picker takes over naming it and the ink
 *  moves under the picker, so the bar never stops showing where you are. */
export const UnpinnedScope: Story = {
  args: { ...SOC_ARGS, scope: { ...SOC_ARGS.scope, current: "vnt" } },
};

/** Nothing unread: no badge on the bell, and no "Mark all read" to press. */
export const Quiet: Story = {
  args: {
    ...SOC_ARGS,
    notifications: { items: NOTIFS.map((n) => ({ ...n, unread: false })) },
  },
};

/** Single tenant, no search — the minimum the bar needs to be useful. */
export const Minimal: Story = {
  args: {
    user: { name: "Ada Okafor", role: "Analyst" },
    userMenu: [{ label: "Log out", icon: <Lock /> }],
    notifications: { items: [] },
  },
};
