/**
 * CX-NAV, CX-DCK, CX-CBR, CX-CMD — navigation chrome.
 *
 * Every one of these tells the user where they are, and every one does it
 * through an attribute rather than a visible difference a screenshot could
 * catch: aria-current on the active item, aria-expanded on a collapsible group,
 * aria-activedescendant on the palette's virtual cursor. Lose one and the
 * component still looks correct.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Command } from "../src/layout/index.js";
import {
  Breadcrumb,
  CommandPalette,
  ConsoleBar,
  DockRail,
  NavRail,
  ThemeToggle,
} from "../src/layout/index.js";

const GROUPS = [
  { label: "Monitor", items: [{ label: "Overview", href: "/overview" }] },
  {
    label: "Respond",
    items: [
      { label: "Incidents", href: "/incidents" },
      { label: "Cases", href: "/cases" },
    ],
  },
];

describe("NavRail", () => {
  it("marks the active item as the current page", () => {
    render(<NavRail groups={GROUPS} activeHref="/incidents" />);
    const current = screen.getByRole("link", { name: /Incidents/ });
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("marks exactly one item current", () => {
    const { container } = render(<NavRail groups={GROUPS} activeHref="/incidents" />);
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it("marks nothing current when the route is unknown", () => {
    const { container } = render(<NavRail groups={GROUPS} activeHref="/nowhere" />);
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
  });

  it("renders every item as a link", () => {
    render(<NavRail groups={GROUPS} activeHref="/overview" />);
    expect(screen.getByRole("link", { name: /Overview/ })).toHaveAttribute("href", "/overview");
    expect(screen.getByRole("link", { name: /Cases/ })).toHaveAttribute("href", "/cases");
  });

  it("renders a count of zero rather than hiding it", () => {
    render(
      <NavRail
        activeHref="/x"
        groups={[{ label: "G", items: [{ label: "Queue", href: "/q", count: 0 }] }]}
      />,
    );
    expect(screen.getByRole("link", { name: /Queue/ })).toHaveTextContent("0");
  });
});

describe("DockRail", () => {
  it("marks the active item as the current page", () => {
    render(
      <DockRail
        activeHref="/incidents"
        items={[
          { label: "Overview", href: "/overview" },
          { label: "Incidents", href: "/incidents" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: /Incidents/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /Overview/ })).not.toHaveAttribute("aria-current");
  });

  it("renders each item once, not once per breakpoint", () => {
    // The rail and the bottom dock are the same list shown at different
    // breakpoints. Rendering both trees would double every link for a screen
    // reader, which sees no media query.
    render(<DockRail items={[{ label: "Overview", href: "/overview" }]} />);
    expect(screen.getAllByRole("link", { name: /Overview/ })).toHaveLength(1);
  });
});

describe("Breadcrumb", () => {
  it("is a labelled navigation landmark", () => {
    render(<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Incidents" }]} />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });

  it("marks the last crumb as the current page", () => {
    render(<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Incidents" }]} />);
    expect(screen.getByText("Incidents")).toHaveAttribute("aria-current", "page");
  });

  it("never links the current page, even when given an href", () => {
    // A link to where you already are is noise.
    render(
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Incidents", href: "/inc" }]} />,
    );
    expect(screen.queryByRole("link", { name: "Incidents" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });

  it("links the intermediate crumbs", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Assets", href: "/assets" },
          { label: "web-01" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Assets" })).toHaveAttribute("href", "/assets");
  });

  it("renders a single crumb as the current page", () => {
    render(<Breadcrumb items={[{ label: "Home", href: "/" }]} />);
    expect(screen.getByText("Home")).toHaveAttribute("aria-current", "page");
  });
});

describe("CommandPalette", () => {
  /**
   * Opens the palette the way an app does — by flipping `open` — rather than
   * mounting it already open.
   *
   * Both paths must focus the input — the test below covers mounting already
   * open, which is where that used to fail. This helper keeps the rest of the
   * keyboard tests on the path an app actually takes.
   */
  function openPalette(commands: Command[]) {
    const view = render(<CommandPalette open={false} commands={commands} />);
    view.rerender(<CommandPalette open commands={commands} />);
    return view;
  }

  const COMMANDS = [
    { id: "scan", label: "Run scan", group: "Actions", onRun: vi.fn() },
    { id: "export", label: "Export report", group: "Actions", onRun: vi.fn() },
    { id: "settings", label: "Open settings", group: "Navigate", onRun: vi.fn() },
  ];

  it("is a labelled modal dialog holding a combobox", () => {
    render(<CommandPalette open commands={COMMANDS} />);
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("lists every command before any query", () => {
    render(<CommandPalette open commands={COMMANDS} />);
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("filters as the user types", async () => {
    const user = userEvent.setup();
    render(<CommandPalette open commands={COMMANDS} />);

    await user.type(screen.getByRole("combobox"), "export");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Export report");
  });

  it("says so when nothing matches, rather than showing an empty box", async () => {
    const user = userEvent.setup();
    render(<CommandPalette open commands={COMMANDS} />);

    await user.type(screen.getByRole("combobox"), "zzzz");

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText(/No matches/)).toBeInTheDocument();
  });

  it("tracks the active option with aria-activedescendant", () => {
    // The virtual cursor: focus stays in the input, so this attribute is the
    // ONLY thing telling a screen reader which row is highlighted.
    render(<CommandPalette open commands={COMMANDS} />);
    const input = screen.getByRole("combobox");
    const active = screen.getAllByRole("option").find((o) => o.getAttribute("aria-selected") === "true");

    expect(active).toBeDefined();
    expect(input).toHaveAttribute("aria-activedescendant", active!.id);
  });

  it("focuses its input on open, so the user can just type", async () => {
    openPalette(COMMANDS);
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());
  });

  it("focuses its input when mounted ALREADY open", async () => {
    // Same root cause as the Modal case in overlays.test.tsx, and worse here:
    // a palette that does not focus its own input swallows every keystroke
    // until the user clicks it. `initialFocus` points at an input INSIDE the
    // portal, so it was null at exactly the same moment the panel was.
    render(<CommandPalette open commands={COMMANDS} />);
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());
  });

  it("moves the cursor with ArrowDown", async () => {
    const user = userEvent.setup();
    openPalette(COMMANDS);
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());

    await user.keyboard("{ArrowDown}");

    const options = screen.getAllByRole("option");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-activedescendant", options[1]!.id);
  });

  it("wraps at the end of the list", async () => {
    const user = userEvent.setup();
    openPalette(COMMANDS);
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());

    await user.keyboard("{ArrowUp}");

    expect(screen.getAllByRole("option").at(-1)).toHaveAttribute("aria-selected", "true");
  });

  it("runs the active command on Enter", async () => {
    const onRun = vi.fn();
    const user = userEvent.setup();
    openPalette([{ id: "a", label: "Run scan", onRun }]);
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());

    await user.keyboard("{Enter}");

    expect(onRun).toHaveBeenCalledOnce();
  });

  it("runs a command on click", async () => {
    const onRun = vi.fn();
    const user = userEvent.setup();
    render(<CommandPalette open commands={[{ id: "a", label: "Run scan", onRun }]} />);

    await user.click(screen.getByRole("option", { name: /Run scan/ }));

    expect(onRun).toHaveBeenCalledOnce();
  });

  it("resets the cursor to the top when the query changes", async () => {
    // Otherwise Enter runs whatever happened to be at the old index in a list
    // that is now completely different.
    const user = userEvent.setup();
    render(<CommandPalette open commands={COMMANDS} />);

    await user.keyboard("{ArrowDown}");
    await user.type(screen.getByRole("combobox"), "o");

    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");
  });
});

describe("ThemeToggle", () => {
  it("names the ACTION and carries the state separately", async () => {
    // "Toggle theme" alone leaves a screen-reader user guessing which one they
    // are in.
    render(<ThemeToggle theme="dark" />);
    const button = await screen.findByRole("button", { name: "Switch to light theme" });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("flips its name and state with the theme", () => {
    render(<ThemeToggle theme="light" />);
    const button = screen.getByRole("button", { name: "Switch to dark theme" });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("reports the requested theme without moving on its own when controlled", async () => {
    const onThemeChange = vi.fn();
    const user = userEvent.setup();
    render(<ThemeToggle theme="dark" onThemeChange={onThemeChange} />);

    await user.click(screen.getByRole("button"));

    expect(onThemeChange).toHaveBeenCalledExactlyOnceWith("light");
    expect(screen.getByRole("button")).toHaveAccessibleName("Switch to light theme");
  });

  it("writes the theme onto the document element", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle defaultTheme="dark" />);

    await user.click(screen.getByRole("button"));

    expect(document.documentElement.dataset["theme"]).toBe("light");
  });
});

describe("ConsoleBar", () => {
  const SCOPES = [
    { id: "all", name: "All tenants" },
    { id: "nb", name: "Northbank" },
    { id: "ac", name: "Acme Corp" },
  ];

  it("renders the pinned scopes as tabs", () => {
    render(
      <ConsoleBar
        user={{ name: "Ada" }}
        scope={{ current: "all", options: SCOPES, onChange: () => {} }}
      />,
    );
    expect(screen.getByRole("button", { name: "All tenants" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Northbank" })).toBeInTheDocument();
  });

  it("marks the current scope", () => {
    render(
      <ConsoleBar
        user={{ name: "Ada" }}
        scope={{ current: "nb", options: SCOPES, onChange: () => {} }}
      />,
    );
    expect(screen.getByRole("button", { name: "Northbank" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("reports a scope change", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ConsoleBar
        user={{ name: "Ada" }}
        scope={{ current: "all", options: SCOPES, onChange }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Acme Corp" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith("ac");
  });

  it("opens the search affordance when given one", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<ConsoleBar user={{ name: "Ada" }} onSearch={onSearch} />);

    await user.click(screen.getByRole("button", { name: /search/i }));

    expect(onSearch).toHaveBeenCalled();
  });
});
