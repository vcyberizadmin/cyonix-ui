/**
 * CX-MOD, CX-DRW, CX-CNF, CX-MNU — the overlay stack.
 *
 * All four share `useOverlay`, which owns Escape, focus trapping, focus
 * restoration and reference-counted scroll locking. That shared machinery is
 * exactly the kind of code that keeps working for the common case and breaks
 * for the second overlay, the disabled item, or the user who never touches a
 * mouse — none of which any other check in this repo exercises.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog, Drawer, Menu, Modal, Popover, Tooltip } from "../src/overlays/index.js";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(
      <Modal open={false} title="Confirm" onClose={() => {}}>
        Body
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is a modal dialog with an accessible name", () => {
    render(
      <Modal open title="Delete asset" onClose={() => {}}>
        Body
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Delete asset");
  });

  it("takes focus when it is OPENED, so a screen reader hears the title first", async () => {
    const { rerender } = render(
      <Modal open={false} title="Delete asset" onClose={() => {}}>
        <button type="button">Inner</button>
      </Modal>,
    );
    rerender(
      <Modal open title="Delete asset" onClose={() => {}}>
        <button type="button">Inner</button>
      </Modal>,
    );

    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
  });

  it("takes focus when mounted ALREADY open", async () => {
    // The regression: usePortalTarget resolves in an effect, so on the first
    // render the panel does not exist and the focus effect had nothing to
    // focus. It fired once and never ran again, leaving focus on <body> — the
    // title unannounced, and the first Tab walking into the page behind the
    // scrim. Reachable from any route that renders a dialog open, or any
    // overlay driven by URL state.
    render(
      <Modal open title="Delete asset" onClose={() => {}}>
        <button type="button">Inner</button>
      </Modal>,
    );

    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
  });

  it("restores focus to the trigger on close", async () => {
    // Without this, closing a dialog dumps keyboard focus back on <body> and
    // the user restarts their tab journey from the top of the page.
    const user = userEvent.setup();

    const view = (open: boolean) => (
      <>
        <button type="button">Open</button>
        <Modal open={open} title="Confirm" onClose={() => {}}>
          Body
        </Modal>
      </>
    );

    const { rerender } = render(view(false));
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    expect(trigger).toHaveFocus();

    rerender(view(true));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());

    rerender(view(false));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("traps Tab inside the panel", async () => {
    const user = userEvent.setup();
    const view = (open: boolean) => (
      <>
        <button type="button">Outside</button>
        <Modal open={open} title="Confirm" onClose={() => {}}>
          <button type="button">First</button>
          <button type="button">Last</button>
        </Modal>
      </>
    );

    const { rerender } = render(view(false));
    rerender(view(true));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());

    await user.tab();
    await user.tab();
    await user.tab();

    expect(screen.getByRole("button", { name: "Outside" })).not.toHaveFocus();
  });
});

describe("Drawer", () => {
  it("is a modal dialog", () => {
    render(
      <Drawer open title="Asset details" onClose={() => {}}>
        Body
      </Drawer>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Asset details");
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Drawer open title="Details" onClose={onClose}>
        Body
      </Drawer>,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});

/**
 * Every portal overlay, swept — mounting already open must move focus in.
 *
 * The per-component tests above cover Modal and CommandPalette because that is
 * where the bug was found. This sweep is what stops the NEXT overlay
 * reintroducing it: the fix lives in useOverlay and applies to anything built
 * on it, so anything built on it is checked here.
 */
describe("focus on mount, across every overlay", () => {
  const OVERLAYS: Record<string, () => React.ReactElement> = {
    Modal: () => (
      <Modal open title="Confirm" onClose={() => {}}>
        <button type="button">Inner</button>
      </Modal>
    ),
    Drawer: () => (
      <Drawer open title="Details" onClose={() => {}}>
        <button type="button">Inner</button>
      </Drawer>
    ),
    ConfirmDialog: () => (
      <ConfirmDialog
        open
        title="Delete asset?"
        confirmLabel="Delete"
        onClose={() => {}}
        onConfirm={() => {}}
      />
    ),
  };

  it.each(Object.entries(OVERLAYS))("%s moves focus into the dialog", async (_name, node) => {
    render(node());

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  it("ConfirmDialog puts focus on Cancel, not the destructive action", async () => {
    // CX-CNF: the safe option holds default focus, so Enter cannot delete
    // something. That is what `initialFocus` exists for — and it was the option
    // most affected by the timing bug, since the ref points INSIDE the portal.
    render(
      <ConfirmDialog
        open
        title="Delete asset?"
        confirmLabel="Delete asset"
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );

    await waitFor(() => {
      expect(document.activeElement).toHaveAccessibleName(/cancel/i);
    });
  });
});

describe("the overlay stack", () => {
  it("Escape peels one layer — only the topmost overlay reacts", async () => {
    // The recorded defect this prevents: "Only one menu open at a time across
    // the app", and a drawer over a modal closing both at once.
    const closeOuter = vi.fn();
    const closeInner = vi.fn();
    const user = userEvent.setup();

    render(
      <>
        <Modal open title="Outer" onClose={closeOuter}>
          Outer body
        </Modal>
        <Drawer open title="Inner" onClose={closeInner}>
          Inner body
        </Drawer>
      </>,
    );

    await user.keyboard("{Escape}");

    expect(closeInner).toHaveBeenCalledOnce();
    expect(closeOuter).not.toHaveBeenCalled();
  });

  it("scroll locking is reference counted", () => {
    // Documented defect in the originals: "scroll-lock will conflict if a
    // drawer opens over it". The LAST overlay to close must restore the
    // original value, not the first.
    const before = document.body.style.overflow;

    const outer = render(
      <Modal open title="Outer" onClose={() => {}}>
        Outer
      </Modal>,
    );
    const inner = render(
      <Drawer open title="Inner" onClose={() => {}}>
        Inner
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe("hidden");

    inner.unmount();
    expect(document.body.style.overflow, "closing the inner overlay released the lock early").toBe(
      "hidden",
    );

    outer.unmount();
    expect(document.body.style.overflow).toBe(before);
  });
});

describe("ConfirmDialog", () => {
  it("names the action rather than saying OK", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open
        title="Delete asset?"
        confirmLabel="Delete asset"
        onClose={() => {}}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete asset" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("offers a way out", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open
        title="Delete asset?"
        confirmLabel="Delete"
        onClose={onClose}
        onConfirm={() => {}}
      />,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});

describe("Menu", () => {
  it("starts closed and reports it on the trigger", () => {
    render(
      <Menu trigger={<span aria-hidden="true">⋯</span>} label="Actions" items={[{ label: "Rename" }]} />,
    );
    expect(screen.getByRole("button", { name: "Actions" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens on click and updates aria-expanded", async () => {
    const user = userEvent.setup();
    render(
      <Menu trigger={<span aria-hidden="true">⋯</span>} label="Actions" items={[{ label: "Rename" }]} />,
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("runs the selected item and closes", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <Menu
        trigger={<span aria-hidden="true">⋯</span>} label="Actions"
        items={[{ label: "Rename", onSelect }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Rename" }));

    expect(onSelect).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("does not run a disabled item", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <Menu
        trigger={<span aria-hidden="true">⋯</span>} label="Actions"
        items={[{ label: "Delete", onSelect, disabled: true, disabledReason: "Read-only" }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: /Delete/ }));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Menu trigger={<span aria-hidden="true">⋯</span>} label="Actions" items={[{ label: "Rename" }]} />,
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("does not lock page scroll — a menu is not a modal", () => {
    render(
      <Menu trigger={<span aria-hidden="true">⋯</span>} label="Actions" items={[{ label: "Rename" }]} />,
    );
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});

describe("Tooltip and Popover", () => {
  it("Tooltip is not in the tree until hovered", () => {
    render(
      <Tooltip content="Re-run the scan">
        <button type="button">Run</button>
      </Tooltip>,
    );
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("Tooltip appears on hover", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Re-run the scan">
        <button type="button">Run</button>
      </Tooltip>,
    );

    await user.hover(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("Re-run the scan"));
  });

  it("Tooltip appears on keyboard focus, not only on hover", async () => {
    // A tooltip that only responds to a pointer is invisible to a keyboard user.
    const user = userEvent.setup();
    render(
      <Tooltip content="Re-run the scan">
        <button type="button">Run</button>
      </Tooltip>,
    );

    await user.tab();

    await waitFor(() => expect(screen.getByRole("tooltip")).toBeInTheDocument());
  });

  it("Popover reports its state on the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Popover content={<p>Detail</p>}>
        <button type="button">More</button>
      </Popover>,
    );

    const trigger = screen.getByRole("button", { name: "More" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog")).toHaveTextContent("Detail");
  });

  it("Popover closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Popover content={<p>Detail</p>}>
        <button type="button">More</button>
      </Popover>,
    );

    await user.click(screen.getByRole("button", { name: "More" }));
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
