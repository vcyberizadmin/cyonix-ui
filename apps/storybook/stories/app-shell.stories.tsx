import { Card } from "@vcyberizadmin/ui";
import { AppShell, NavRail, TopBar, type NavGroup } from "@vcyberizadmin/ui/layout";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
} from "react";

/**
 * The whole navigation frame: CX-SHL holding CX-NAV and CX-TOP.
 * Every top-bar group is individually optional, which is what lets one
 * component serve an operations console and the Tenant console alike.
 */

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

const GROUPS: NavGroup[] = [
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
          { label: "Active Runs", href: "/assessments/active" },
          { label: "Pending Review", href: "/assessments/review" },
        ],
      },
      {
        label: "Approvals",
        href: "/approvals",
        icon: <Dot />,
        count: 3,
        countTone: "alert",
      },
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
];

const TENANTS = [
  { id: "all", name: "All tenants" },
  { id: "vantage", name: "Vantage Public Sector" },
  { id: "northwind", name: "Northwind Health" },
];

function Frame({ full }: { full: boolean }) {
  const [activeHref, setActiveHref] = useState("/assessments/review");
  const [scope, setScope] = useState("all");
  const [window_, setWindow] = useState("Last 24h");

  const NoNavLink = useMemo(
    () =>
      function NoNavLink({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
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
    <AppShell
      rail={
        <NavRail
          groups={GROUPS}
          activeHref={activeHref}
          linkComponent={NoNavLink}
          brand={<Brand module={full ? "VAPT" : "Tenant"} />}
          brandMini={<BrandMini />}
          footer={
            <span className="flex items-center gap-2">
              <span className="bg-ok size-1.5 rounded-full" />
              Threads active
            </span>
          }
          storageKey={full ? "sb.shell.full" : "sb.shell.min"}
        />
      }
      topBar={
        <TopBar
          scope={{
            current: scope,
            options: TENANTS,
            onChange: setScope,
          }}
          onSearch={() => undefined}
          searchPlaceholder="Search findings, assets, CVEs"
          // Every group below is optional. The Tenant console needs no time
          // window or clock, so the minimal story simply omits them.
          timeWindow={
            full
              ? {
                  current: window_,
                  options: ["Last 1h", "Last 24h", "Last 7d", "Last 30d"],
                  onChange: setWindow,
                }
              : undefined
          }
          help={full ? { text: "How assessments are scored" } : undefined}
          status={full ? { tone: "ok", label: "Operational" } : undefined}
          clock={full}
          notifications={{ count: full ? 7 : 0, onOpen: () => undefined }}
          user={{ name: "A. Fernando", role: "Lead analyst" }}
          userMenu={[
            { label: "Profile" },
            { label: "Preferences" },
            { label: "Sign out", danger: true },
          ]}
        />
      }
    >
      <h1 className="font-display text-h2 font-bold">Assessments</h1>
      <Card title="Pending review" hint={`Scope: ${
        TENANTS.find((t) => t.id === scope)?.name
      }`}>
        <p className="text-fg-2 text-small">
          Content is padded 24px and takes <code>min-w-0</code>, so a wide table
          owns its overflow rather than pushing the layout sideways. Tab from the
          address bar — the first focusable element is the skip-to-content link.
        </p>
      </Card>
    </AppShell>
  );
}

const meta = {
  title: "Layout/AppShell",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** An operations console: every top-bar group in play. */
export const OperationsConsole: Story = {
  name: "Operations console (all groups)",
  render: () => <Frame full />,
};

/** The Tenant console: no time window, no clock, no status strip. */
export const TenantConsole: Story = {
  name: "Tenant console (minimal groups)",
  render: () => <Frame full={false} />,
};
