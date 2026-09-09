/**
 * MeterRow's two orientations.
 *
 * Written after the inline form was added, and specifically after the bug that
 * forced it: the case-detail SLA readout was built by passing `label=""` to the
 * stacked form, which reserved a line for nothing and produced a full-width bar
 * with its figure adrift. The interesting assertions here are therefore about
 * what each orientation does with the LABEL, not about the bar.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MeterRow } from "../src/meter-row.js";

describe("MeterRow", () => {
  it("exposes the fill as a progressbar in both orientations", () => {
    const { rerender } = render(
      <MeterRow label="Zeek" fraction={0.58} value="58% of 350" />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "58");

    rerender(
      <MeterRow orientation="inline" label="Time to SLA breach" fraction={0.62} />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "62");
  });

  it("clamps a fraction outside 0..1 rather than overshooting the track", () => {
    const { rerender } = render(<MeterRow label="Over" fraction={2.4} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");

    rerender(<MeterRow label="Under" fraction={-0.5} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("shows the label as text when stacked", () => {
    render(<MeterRow label="Zeek" fraction={0.58} value="58% of 350" />);
    expect(screen.getByText("Zeek")).toBeInTheDocument();
    expect(screen.getByText("58% of 350")).toBeInTheDocument();
  });

  it("turns the label into the bar's accessible name when inline", () => {
    // The label must not be drawn — inline sits in a facts strip that has
    // already said what it is — but the bar still has to be nameable.
    render(
      <MeterRow
        orientation="inline"
        label="Time to SLA breach"
        fraction={0.62}
        value="2h 43m left"
      />,
    );
    expect(screen.queryByText("Time to SLA breach")).not.toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Time to SLA breach" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2h 43m left")).toBeInTheDocument();
  });

  it("nests only phrasing content when inline, so it is legal inside a text row", () => {
    // The reason this orientation exists at all: the stacked form renders
    // divs, and a div inside the <p>-like strip that holds it is invalid
    // HTML. Everything inline emits must be a span.
    const { container } = render(
      <MeterRow orientation="inline" label="SLA" fraction={0.5} value="2h left" />,
    );
    expect(container.querySelectorAll("div")).toHaveLength(0);
  });

  it("hangs the SLA target off the bar as a tooltip", () => {
    const { container } = render(
      <MeterRow
        orientation="inline"
        label="SLA"
        title="Containment in 8h"
        fraction={0.62}
      />,
    );
    expect(container.firstElementChild).toHaveAttribute("title", "Containment in 8h");
  });
});
