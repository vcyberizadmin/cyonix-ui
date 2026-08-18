import { Button, Card } from "@cyonix/ui";
import {
  ConfirmDialog,
  Drawer,
  Menu,
  Modal,
  type MenuItemDef,
} from "@cyonix/ui/overlays";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/**
 * Every overlay here runs on the same `useOverlay` hook, so focus trapping,
 * Escape, focus restore, scroll-lock and portal rendering behave identically.
 * That shared machinery is the point — the standard notes Tenant is the only
 * console with an accessible overlay today.
 */

const meta = {
  title: "Overlays/Overview",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col gap-6 p-8">{children}</div>
  );
}

/* ---------------------------------------------------------------- Modal ---- */

function ModalDemo() {
  const [size, setSize] = useState<"sm" | "md" | "lg" | null>(null);
  return (
    <Stage>
      <p className="text-fg-2 text-small">
        Scrim is Onyx at 80% with a 2px blur; the panel takes radius-lg and e-4
        and enters on the 400ms emphasis curve. Focus lands on the panel, not the
        first field, so a screen reader hears the title first. Escape, the scrim
        and the footer all dismiss.
      </p>
      <div className="flex gap-3">
        {(["sm", "md", "lg"] as const).map((value) => (
          <Button key={value} variant="outline" onClick={() => setSize(value)}>
            Open {value}
          </Button>
        ))}
      </div>

      <Modal
        open={size !== null}
        onClose={() => setSize(null)}
        size={size ?? "md"}
        title="Edit scan window"
        description="Applies to every asset currently in scope."
        footer={
          <>
            <Button variant="outline" onClick={() => setSize(null)}>
              Cancel
            </Button>
            <Button onClick={() => setSize(null)}>Save changes</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-fg-2 text-small">
            Long content scrolls here while the header and footer stay put.
          </p>
          {Array.from({ length: 8 }, (_, index) => (
            <Card key={index} padding="sm">
              <span className="text-small">Scan target {index + 1}</span>
            </Card>
          ))}
        </div>
      </Modal>
    </Stage>
  );
}

export const ModalStory: Story = { name: "Modal", render: () => <ModalDemo /> };

/* --------------------------------------------------------------- Drawer ---- */

const RECORDS = ["api-gateway-prod", "vault-eu-west", "edge-cdn-01"];

function DrawerDemo() {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;
  return (
    <Stage>
      <p className="text-fg-2 text-small">
        Right-anchored at 480px, e-3, slides in over 240ms. Next/previous steps
        through the current filtered result set — not the raw table — and the row
        that opened it stays selected. Below <code>sm</code> it becomes a bottom
        sheet at 90dvh.
      </p>
      <div className="flex flex-col gap-2">
        {RECORDS.map((record, recordIndex) => (
          <button
            key={record}
            type="button"
            onClick={() => setIndex(recordIndex)}
            className={
              "border-rule hover:bg-wash-hover cursor-pointer rounded-md border px-4 py-3 text-left font-mono text-[13px] " +
              (index === recordIndex ? "bg-wash-2 text-accent" : "text-fg-2")
            }
          >
            {record}
          </button>
        ))}
      </div>

      <Drawer
        open={open}
        onClose={() => setIndex(null)}
        title={index !== null ? RECORDS[index] : ""}
        description="Asset detail"
        onPrevious={
          index !== null && index > 0 ? () => setIndex(index - 1) : undefined
        }
        onNext={
          index !== null && index < RECORDS.length - 1
            ? () => setIndex(index + 1)
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setIndex(null)}>
              Close
            </Button>
            <Button>Run assessment</Button>
          </>
        }
      >
        <p className="text-fg-2 text-small">
          Inspect a record without leaving the list. The list stays visible and in
          position behind the scrim.
        </p>
      </Drawer>
    </Stage>
  );
}

export const DrawerStory: Story = { name: "Drawer", render: () => <DrawerDemo /> };

/* -------------------------------------------------------- ConfirmDialog ---- */

function ConfirmDemo() {
  const [mode, setMode] = useState<"reversible" | "irreversible" | null>(null);
  return (
    <Stage>
      <p className="text-fg-2 text-small">
        The title states the consequence, not the verb. The impact box enumerates
        what happens, with the reversible line in the success tone — the only
        green in a red dialog, which is exactly why it lands. Cancel holds default
        focus and Enter never confirms.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setMode("reversible")}>
          Reversible action
        </Button>
        <Button variant="danger" onClick={() => setMode("irreversible")}>
          Irreversible action
        </Button>
      </div>

      <ConfirmDialog
        open={mode === "reversible"}
        onClose={() => setMode(null)}
        onConfirm={() => setMode(null)}
        title="Remove Vantage Public Sector from view"
        impact={{
          items: [
            { text: "The tenant disappears from your console and reports." },
            { text: "Scheduled assessments stop running." },
            {
              text: "Nothing is deleted — you can restore it from Archived.",
              reversible: true,
            },
          ],
        }}
        guidance="Use Deactivate if you only need to pause access temporarily."
        confirmLabel="Remove from view"
        actor="Recorded as A. Fernando"
      />

      <ConfirmDialog
        open={mode === "irreversible"}
        onClose={() => setMode(null)}
        onConfirm={() => setMode(null)}
        title="Permanently delete the Vantage assessment history"
        impact={{
          items: [
            { text: "All 148 findings and their evidence are destroyed." },
            { text: "Exported reports keep working; live links break." },
            { text: "This cannot be undone." },
          ],
        }}
        guidance="Export the findings first if you may need them for audit."
        confirmLabel="Delete permanently"
        confirmPhrase="Vantage Public Sector"
        reason={{
          label: "Reason for deletion",
          placeholder: "Surfaced in the audit log",
          required: true,
        }}
        actor="Recorded as A. Fernando"
      />
    </Stage>
  );
}

export const ConfirmStory: Story = {
  name: "Confirm dialog",
  render: () => <ConfirmDemo />,
};

/* ----------------------------------------------------------------- Menu ---- */

function Dots() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

const ITEMS: MenuItemDef[] = [
  { label: "View findings" },
  { label: "Re-run assessment" },
  { label: "Export as PDF" },
  {
    label: "Archive",
    disabled: true,
    disabledReason: "An assessment must be complete before it can be archived",
  },
  // Listed here deliberately out of order — the component sorts danger last and
  // puts a separator above it, so the caller cannot get this wrong.
  { label: "Delete assessment", danger: true },
];

function MenuDemo() {
  return (
    <Stage>
      <p className="text-fg-2 text-small">
        Opens on click, never hover. Renders through a portal so a table&apos;s
        overflow cannot clip it, and flips above the trigger near the bottom
        edge. Arrows move, Escape closes and returns focus to the trigger.
        Destructive items are sorted last below a separator.
      </p>

      <Card padding="none" className="overflow-hidden">
        {RECORDS.map((record, index) => (
          <div
            key={record}
            className={
              "flex items-center justify-between px-4 py-3 " +
              (index > 0 ? "border-rule border-t" : "")
            }
          >
            <span className="font-mono text-[13px]">{record}</span>
            <Menu trigger={<Dots />} items={ITEMS} label={`Actions for ${record}`} />
          </div>
        ))}
      </Card>

      {/* Near the bottom of the viewport, to exercise the flip. */}
      <div className="mt-auto flex items-center justify-between">
        <span className="text-fg-muted text-small">
          This one is at the bottom edge — the panel should flip upward.
        </span>
        <Menu trigger={<Dots />} items={ITEMS} label="Actions" />
      </div>
    </Stage>
  );
}

export const MenuStory: Story = { name: "Menu", render: () => <MenuDemo /> };
