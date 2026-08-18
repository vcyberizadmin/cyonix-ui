import { Button, Card, Code, StatusPill, Tag } from "@vcyberizadmin/ui";
import {
  Popover,
  ToastProvider,
  Tooltip,
  useToast,
} from "@vcyberizadmin/ui/overlays";
import type { Meta, StoryObj } from "@storybook/react-vite";

/** Step 5 and 6 remainder: CX-TST and CX-TIP. */
const meta = {
  title: "Overlays/Toast & tooltip",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function ToastDemo() {
  const { toast, dismissAll } = useToast();
  return (
    <div className="flex flex-col gap-6">
      <Card title="Toast" hint="Bottom-right, stacks upward, max 4">
        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            onClick={() =>
              toast({
                tone: "success",
                title: "Assessment queued",
                description: "3 targets in scope.",
              })
            }
          >
            Success (4s)
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() =>
              toast({
                tone: "error",
                title: "Could not reach the scanner",
                description: "Retry, or check the connector status.",
              })
            }
          >
            Error (persists)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast({
                tone: "success",
                title: "Finding suppressed",
                description: "CX-1188 hidden from the register.",
                undo: { onUndo: () => toast({ tone: "info", title: "Suppression reverted" }) },
              })
            }
          >
            With undo
          </Button>
          <Button
            size="sm"
            variant="solid"
            onClick={() =>
              // Same title each time: dedupe collapses it into one with a count,
              // instead of stacking six copies.
              Array.from({ length: 6 }, () =>
                toast({ tone: "warning", title: "Rate limit reached" }),
              )
            }
          >
            Fire 6 identical (dedupe)
          </Button>
          <Button
            size="sm"
            variant="solid"
            onClick={() =>
              Array.from({ length: 7 }, (_, i) =>
                toast({ tone: "info", title: `Bulk job ${i + 1} started` }),
              )
            }
          >
            Fire 7 distinct (queue cap)
          </Button>
          <Button size="sm" variant="ghost" onClick={dismissAll}>
            Dismiss all
          </Button>
        </div>
        <p className="text-fg-muted text-small mt-4">
          Errors persist until dismissed and announce assertively; everything else
          clears after 4s. Undo stays available for the full duration. A toast is
          easily missed — never make it the only record of something that matters.
        </p>
      </Card>
    </div>
  );
}

export const Toasts: Story = {
  name: "CX-TST — toast",
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
};

export const TooltipsAndPopovers: Story = {
  name: "CX-TIP — tooltip & popover",
  render: () => (
    <div className="flex flex-col gap-6">
      <Card title="Tooltip" hint="400ms hover, instant on focus">
        <div className="flex flex-wrap items-center gap-6">
          <Tooltip content="Findings are scored with CVSS v3.1 and adjusted for reachability.">
            <button
              type="button"
              className="text-fg-2 border-rule hover:text-fg cursor-pointer rounded-sm border px-2 py-1 text-[12px]"
            >
              What is this score?
            </button>
          </Tooltip>

          <Tooltip content="An assessment must be complete before it can be archived.">
            <span tabIndex={0} className="inline-flex">
              <Button size="sm" variant="outline" disabled>
                Archive
              </Button>
            </span>
          </Tooltip>

          <Tooltip content="sha256:9f2a4c81e0b7d3f5a6c2189be44c7712fa0d93cc41b8e5027d6a1f3b9c8e4d15">
            <span
              tabIndex={0}
              className="text-fg-2 max-w-[160px] truncate font-mono text-[12px]"
            >
              sha256:9f2a4c81e0b7d3f5a6c2189be44c7712fa0d93cc41b8e5027d6a1f3b9c8e4d15
            </span>
          </Tooltip>
        </div>
        <p className="text-fg-muted text-small mt-4">
          Every tooltip has a focus path — hover-only content is invisible on
          touch and to keyboard users. A tooltip can never contain a control:
          <Code>content</Code> is typed as a string, so you would notice.
        </p>
      </Card>

      <Card title="Popover" hint="Click to open; may contain controls">
        <div className="flex flex-wrap items-center gap-6">
          <Popover
            label="Asset preview"
            content={
              <div className="flex flex-col gap-2">
                <p className="font-display text-fg text-[13px] font-semibold">
                  api-gateway-prod
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusPill status="Running" />
                  <Tag dot={2}>Kubernetes</Tag>
                </div>
                <p className="text-fg-2 text-small">
                  Public ingress · 4 open findings · last scanned 2h ago
                </p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm">Open asset</Button>
                  <Button size="sm" variant="outline">
                    Rescan
                  </Button>
                </div>
              </div>
            }
          >
            <button
              type="button"
              className="text-accent cursor-pointer font-mono text-[12px] underline underline-offset-2"
            >
              api-gateway-prod
            </button>
          </Popover>

          <span className="text-fg-muted text-small">
            Escape closes; it traps nothing, so you can tab straight out.
          </span>
        </div>
      </Card>
    </div>
  ),
};
