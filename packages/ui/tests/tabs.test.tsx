/**
 * CX-TAB — Tabs and Segmented.
 *
 * The keyboard contract is the part worth testing. Roving tabindex, wrap-around
 * arrows, Home/End and skip-the-disabled are all invisible to a mouse user and
 * to every other check in this repo: none of them changes the markup enough for
 * a snapshot to notice, and all of them break silently under refactor.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Segmented, Tabs } from "../src/tabs.js";

const ITEMS = [
  { value: "overview", label: "Overview" },
  { value: "timeline", label: "Timeline" },
  { value: "ledger", label: "Ledger" },
];

describe("Tabs — structure", () => {
  it("exposes a tablist with an accessible name", () => {
    render(<Tabs items={ITEMS} label="Record views" />);
    expect(screen.getByRole("tablist", { name: "Record views" })).toBeInTheDocument();
  });

  it("selects the first enabled tab by default", () => {
    render(<Tabs items={ITEMS} label="Views" />);
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  });

  it("skips a disabled first tab when choosing the default", () => {
    render(
      <Tabs
        label="Views"
        items={[{ value: "a", label: "A", disabled: true, disabledReason: "No access" }, ...ITEMS]}
      />,
    );
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  });

  it("gives the disabled tab its reason, so it is not a dead end", () => {
    render(
      <Tabs
        label="Views"
        items={[{ value: "a", label: "A", disabled: true, disabledReason: "No access" }, ...ITEMS]}
      />,
    );
    expect(screen.getByRole("tab", { name: "A" })).toHaveAttribute("title", "No access");
  });

  it("keeps exactly one tab stop for the whole control", () => {
    // Roving tabindex: without it, Tab walks every tab before leaving.
    render(<Tabs items={ITEMS} label="Views" />);
    const stops = screen.getAllByRole("tab").filter((t) => t.getAttribute("tabindex") === "0");
    expect(stops).toHaveLength(1);
    expect(stops[0]).toHaveAccessibleName("Overview");
  });

  it("renders a count of zero rather than hiding it", () => {
    // An empty tab is information.
    render(<Tabs label="Views" items={[{ value: "a", label: "Open", count: 0 }]} />);
    expect(screen.getByRole("tab", { name: /Open/ })).toHaveTextContent("0");
  });

  it("wires the panel to the selected tab", () => {
    render(
      <Tabs items={ITEMS} label="Views">
        <p>Panel body</p>
      </Tabs>,
    );
    const panel = screen.getByRole("tabpanel");
    const selected = screen.getByRole("tab", { name: "Overview" });

    expect(panel).toHaveAccessibleName("Overview");
    expect(selected).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", selected.id);
  });

  it("renders no panel when given no children", () => {
    render(<Tabs items={ITEMS} label="Views" />);
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
  });
});

describe("Tabs — pointer", () => {
  it("selects on click when uncontrolled", async () => {
    const user = userEvent.setup();
    render(<Tabs items={ITEMS} label="Views" />);

    await user.click(screen.getByRole("tab", { name: "Timeline" }));

    expect(screen.getByRole("tab", { name: "Timeline" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "false");
  });

  it("reports the change and does NOT move on its own when controlled", async () => {
    // A controlled component that also updates its own state would drift out of
    // sync with the parent's value the moment the parent rejects a change.
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Tabs items={ITEMS} label="Views" value="overview" onChange={onChange} />);

    await user.click(screen.getByRole("tab", { name: "Ledger" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith("ledger");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  });

  it("does not select a disabled tab", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Tabs
        label="Views"
        onChange={onChange}
        items={[...ITEMS, { value: "locked", label: "Locked", disabled: true }]}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Locked" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Tabs — keyboard", () => {
  it("moves and selects with ArrowRight (automatic activation)", async () => {
    const user = userEvent.setup();
    render(<Tabs items={ITEMS} label="Views" />);

    await user.tab();
    await user.keyboard("{ArrowRight}");

    const timeline = screen.getByRole("tab", { name: "Timeline" });
    expect(timeline).toHaveFocus();
    expect(timeline).toHaveAttribute("aria-selected", "true");
  });

  it("moves left", async () => {
    const user = userEvent.setup();
    render(<Tabs items={ITEMS} label="Views" value={undefined} defaultValue="timeline" />);

    await user.tab();
    await user.keyboard("{ArrowLeft}");

    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
  });

  it("wraps from the last tab to the first", async () => {
    const user = userEvent.setup();
    render(<Tabs items={ITEMS} label="Views" defaultValue="ledger" />);

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
  });

  it("wraps backwards from the first tab to the last", async () => {
    const user = userEvent.setup();
    render(<Tabs items={ITEMS} label="Views" />);

    await user.tab();
    await user.keyboard("{ArrowLeft}");

    expect(screen.getByRole("tab", { name: "Ledger" })).toHaveFocus();
  });

  it("Home goes to the first tab, End to the last", async () => {
    const user = userEvent.setup();
    render(<Tabs items={ITEMS} label="Views" defaultValue="timeline" />);

    await user.tab();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Ledger" })).toHaveFocus();

    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
  });

  it("steps over a disabled tab rather than stopping on it", async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        label="Views"
        items={[
          { value: "a", label: "A" },
          { value: "b", label: "B", disabled: true },
          { value: "c", label: "C" },
        ]}
      />,
    );

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "C" })).toHaveFocus();
  });

  it("Home skips a disabled first tab", async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        label="Views"
        items={[
          { value: "a", label: "A", disabled: true },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
        ]}
      />,
    );

    await user.tab();
    await user.keyboard("{End}");
    await user.keyboard("{Home}");

    expect(screen.getByRole("tab", { name: "B" })).toHaveFocus();
  });

  it("ignores keys it does not own", async () => {
    const user = userEvent.setup();
    render(<Tabs items={ITEMS} label="Views" />);

    await user.tab();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
  });
});

describe("Segmented", () => {
  const OPTIONS = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
  ];

  it("is a radiogroup, not a tablist", () => {
    // The rule the library cannot enforce with types: Tabs change the VIEW of
    // one record, Segmented changes WHICH RECORDS are listed. The roles are
    // what carry that distinction to assistive tech.
    render(<Segmented items={OPTIONS} value="all" onChange={() => {}} label="Status" />);
    expect(screen.getByRole("radiogroup", { name: "Status" })).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("marks exactly one option checked", () => {
    render(<Segmented items={OPTIONS} value="active" onChange={() => {}} label="Status" />);
    const checked = screen.getAllByRole("radio").filter((r) => r.getAttribute("aria-checked") === "true");
    expect(checked).toHaveLength(1);
    expect(checked[0]).toHaveAccessibleName("Active");
  });

  it("reports a click", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Segmented items={OPTIONS} value="all" onChange={onChange} label="Status" />);

    await user.click(screen.getByRole("radio", { name: "Suspended" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith("suspended");
  });

  it("is fully controlled — it does not move itself", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Segmented items={OPTIONS} value="all" onChange={onChange} label="Status" />);

    await user.click(screen.getByRole("radio", { name: "Active" }));

    expect(screen.getByRole("radio", { name: "All" })).toHaveAttribute("aria-checked", "true");
  });

  it("moves with the arrow keys", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Segmented items={OPTIONS} value="all" onChange={onChange} label="Status" />);

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith("active");
  });
});
