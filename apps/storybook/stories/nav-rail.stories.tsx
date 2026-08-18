import { NavRail, type NavGroup, type NavRailProps } from "@cyonix/ui/layout";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
} from "react";

/**
 * The point of these three stories: one component, three real console configs,
 * no per-app forks. Each `groups` array below mirrors that app's actual nav.
 */

/** Stand-in for the app-supplied icon node (apps pass lucide). */
const Dot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="7" />
  </svg>
);

const Brand = ({ module }: { module: string }) => (
  <span className="flex items-center gap-2">
    <span className="cx-logo-spark grid size-7 shrink-0 place-items-center rounded-md text-[13px] font-bold text-white">
      C
    </span>
    <span className="font-display text-[15px] font-bold">CYONIX.AI</span>
    <span className="bg-wash-2 text-fg-muted rounded-sm px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase">
      {module}
    </span>
  </span>
);

const BrandMini = () => (
  <span className="cx-logo-spark grid size-8 place-items-center rounded-md text-[13px] font-bold text-white">
    C
  </span>
);

const Liveness = () => (
  <span className="flex items-center gap-2">
    <span className="bg-ok size-1.5 rounded-full" />
    Threads active
  </span>
);

/** VAPT — from cyonix-vapt/src/components/navConfig.ts */
const VAPT_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <Dot /> },
      {
        label: "Assessments",
        href: "/assessments",
        icon: <Dot />,
        count: 12,
        children: [
          { label: "Active Runs", href: "/assessments?bucket=active" },
          { label: "Pending Review", href: "/assessments?bucket=review" },
          { label: "Completed", href: "/assessments?bucket=done" },
        ],
      },
      { label: "Approvals", href: "/approvals", icon: <Dot />, count: 3, countTone: "alert" },
      { label: "Schedule", href: "/schedule", icon: <Dot /> },
      { label: "My Queue", href: "/queue", icon: <Dot />, count: 7 },
    ],
  },
  {
    label: "Reconnaissance",
    items: [
      { label: "Attack Surface", href: "/attack-surface", icon: <Dot />, count: 148 },
      { label: "Assets", href: "/assets", icon: <Dot />, count: 1204 },
      { label: "Modules", href: "/modules", icon: <Dot />, tag: "Beta" },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Tenants", href: "/tenants", icon: <Dot />, count: 47 },
      { label: "Team", href: "/team", icon: <Dot /> },
      { label: "Roles & Access", href: "/roles", icon: <Dot /> },
      { label: "Audit Ledger", href: "/audit", icon: <Dot /> },
      { label: "ATT&CK Coverage", href: "/attack", icon: <Dot />, tag: "Soon" },
    ],
  },
];

/** SOC — the deepest nav (~30 items); exercises the live-badge slot. */
const SOC_GROUPS: NavGroup[] = [
  {
    label: "Detect",
    items: [
      { label: "Overview", href: "/soc", icon: <Dot /> },
      {
        label: "Alerts",
        href: "/soc/alerts",
        icon: <Dot />,
        count: 26,
        countTone: "alert",
        children: [
          { label: "Triage", href: "/soc/alerts/triage" },
          { label: "Suppressed", href: "/soc/alerts/suppressed" },
        ],
      },
      {
        label: "Investigation Queue",
        href: "/soc/queue",
        icon: <Dot />,
        // Live slot: the item owns its polling, so one busy badge never
        // re-renders the rail.
        liveBadge: (
          <span className="bg-warning/15 text-warning rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums">
            14 live
          </span>
        ),
      },
      { label: "Hunting", href: "/soc/hunting", icon: <Dot />, tag: "Beta" },
    ],
  },
  {
    label: "Respond",
    items: [
      { label: "Cases", href: "/soc/cases", icon: <Dot />, count: 9 },
      { label: "Playbooks", href: "/soc/playbooks", icon: <Dot /> },
      { label: "Automations", href: "/soc/automations", icon: <Dot />, tag: "Soon" },
    ],
  },
];

/** Tenant — the flattest of the three. */
const TENANT_GROUPS: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { label: "Overview", href: "/", icon: <Dot /> },
      { label: "Tenants", href: "/tenants", icon: <Dot />, count: 47 },
      { label: "Modules", href: "/modules", icon: <Dot /> },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", href: "/users", icon: <Dot /> },
      { label: "Billing", href: "/billing", icon: <Dot /> },
      { label: "Settings", href: "/settings", icon: <Dot /> },
    ],
  },
];

/**
 * Storybook has no router, and these hrefs point at routes that do not exist
 * here — following them would just blank the preview. So the demo swaps in a
 * link that cancels navigation and moves `activeHref` in local state instead.
 *
 * This is exactly the `linkComponent` seam the real apps use to pass
 * `next/link`. The anchors keep their real `href`, so focus order, middle-click
 * and "copy link address" still behave; only the plain left-click is
 * intercepted.
 */
function RailDemo(args: NavRailProps) {
  const [activeHref, setActiveHref] = useState(args.activeHref);

  // Re-seed when switching between stories.
  useEffect(() => setActiveHref(args.activeHref), [args.activeHref]);

  // Stable identity — a new component type each render would remount the
  // whole rail and throw away its expand state on every click.
  const NoNavLink = useMemo(
    () =>
      function NoNavLink({
        href,
        ...props
      }: AnchorHTMLAttributes<HTMLAnchorElement>) {
        return (
          <a
            href={href}
            onClick={(event) => {
              event.preventDefault();
              if (href) setActiveHref(href);
            }}
            {...props}
          />
        );
      },
    [],
  );

  return (
    <div className="flex h-dvh">
      <NavRail {...args} activeHref={activeHref} linkComponent={NoNavLink} />
      <div className="text-fg-muted text-small min-w-0 flex-1 p-8">
        <p>
          Content column. It gets <code>min-w-0</code> so a wide table owns the
          overflow, never the layout.
        </p>
        <p className="mt-4">
          Clicking a nav item moves the active state without navigating —
          the rail renders links through <code>linkComponent</code>, so the host
          decides what a click does.
        </p>
        <p className="text-fg mt-4 font-mono text-[12px]">
          activeHref: {activeHref ?? "—"}
        </p>
      </div>
    </div>
  );
}

const meta = {
  title: "Layout/NavRail",
  component: NavRail,
  parameters: { layout: "fullscreen" },
  argTypes: {
    mini: { control: "boolean" },
    activeHref: { control: "text" },
  },
  render: (args) => <RailDemo {...args} />,
} satisfies Meta<typeof NavRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VAPT: Story = {
  args: {
    groups: VAPT_GROUPS,
    activeHref: "/assessments?bucket=review",
    brand: <Brand module="VAPT" />,
    brandMini: <BrandMini />,
    footer: <Liveness />,
    storageKey: "sb.vapt",
  },
};

export const SOC: Story = {
  args: {
    groups: SOC_GROUPS,
    activeHref: "/soc/queue",
    brand: <Brand module="AiSOC" />,
    brandMini: <BrandMini />,
    footer: <Liveness />,
    storageKey: "sb.soc",
  },
};

export const Tenant: Story = {
  args: {
    groups: TENANT_GROUPS,
    activeHref: "/tenants",
    brand: <Brand module="Tenant" />,
    brandMini: <BrandMini />,
    storageKey: "sb.tenant",
  },
};

/** Minimised: 68px, labels become tooltips, children hidden entirely rather
 *  than floated, and an alert count leaves a dot so urgent work stays visible. */
export const Minimised: Story = {
  args: {
    ...VAPT.args,
    mini: true,
    storageKey: "sb.mini",
  },
};
