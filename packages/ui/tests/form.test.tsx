/**
 * CX-FLD — Field and the controls.
 *
 * Field's whole job is invisible: it mints an id and pushes it, plus
 * aria-describedby, aria-invalid and disabled, onto whatever control sits
 * inside it, through context. Nothing about that shows up in a build, a type
 * check or a screenshot — it shows up when a screen-reader user cannot tell
 * which input the error belongs to.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Checkbox,
  Field,
  FieldBoundary,
  Input,
  Select,
  Switch,
  Textarea,
} from "../src/form/index.js";

describe("Field — association", () => {
  it("connects the label to the control", async () => {
    const user = userEvent.setup();
    render(
      <Field label="Hostname">
        <Input />
      </Field>,
    );

    const input = screen.getByLabelText("Hostname");
    await user.click(screen.getByText("Hostname"));
    expect(input).toHaveFocus();
  });

  it("gives every control in a form a distinct id", () => {
    // useId collisions would point both labels at one input.
    render(
      <>
        <Field label="First">
          <Input />
        </Field>
        <Field label="Second">
          <Input />
        </Field>
      </>,
    );
    const [a, b] = screen.getAllByRole("textbox");
    expect(a!.id).not.toBe("");
    expect(a!.id).not.toBe(b!.id);
  });

  it("associates the hint through aria-describedby", () => {
    render(
      <Field label="Hostname" hint="Must be unique. 2–150 characters.">
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText("Hostname")).toHaveAccessibleDescription(
      "Must be unique. 2–150 characters.",
    );
  });

  it("adds no description when there is nothing to describe", () => {
    render(
      <Field label="Hostname">
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText("Hostname")).not.toHaveAttribute("aria-describedby");
  });

  it("marks the control invalid and describes the error", () => {
    render(
      <Field label="Hostname" error="Use letters, digits and hyphens only.">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("Hostname");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Use letters, digits and hyphens only.");
  });

  it("replaces the hint with the error rather than stacking them", () => {
    // Documented: hint and error share ONE slot.
    render(
      <Field label="Hostname" hint="Must be unique." error="Already taken.">
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText("Hostname")).toHaveAccessibleDescription("Already taken.");
    expect(screen.queryByText("Must be unique.")).not.toBeInTheDocument();
  });

  it("is not invalid when there is no error", () => {
    render(
      <Field label="Hostname" hint="Must be unique.">
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText("Hostname")).not.toHaveAttribute("aria-invalid");
  });

  it("pushes disabled down to the control", () => {
    render(
      <Field label="Hostname" disabled>
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText("Hostname")).toBeDisabled();
  });

  it("renders the disabled reason as visible text", () => {
    // A disabled control whose reason lives only in a title attribute is a
    // dead end.
    render(
      <Field label="Hostname" disabled disabledReason="Locked while the scan runs.">
        <Input />
      </Field>,
    );
    expect(screen.getByText("Locked while the scan runs.")).toBeVisible();
    expect(screen.getByLabelText("Hostname")).toHaveAccessibleDescription(
      "Locked while the scan runs.",
    );
  });

  it("marks the optional exceptions, not the required majority", () => {
    render(
      <Field label="Notes" optional>
        <Textarea />
      </Field>,
    );
    expect(screen.getByText(/optional/i)).toBeInTheDocument();
  });

  it("wires a render-prop child with the same control props", () => {
    render(
      <Field label="Hostname" error="Bad value">
        {(control) => <input {...control} aria-label="Hostname" />}
      </Field>,
    );
    const input = screen.getByLabelText("Hostname");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.id).not.toBe("");
  });
});

describe("Field — every control type picks up the wiring", () => {
  it.each([
    ["Input", <Input key="i" />],
    ["Textarea", <Textarea key="t" />],
    [
      "Select",
      <Select key="s">
        <option value="a">A</option>
      </Select>,
    ],
    ["Checkbox", <Checkbox key="c" />],
    ["Switch", <Switch key="w" />],
  ])("%s", (_name, control) => {
    render(
      <Field label="Enabled" error="Nope">
        {control}
      </Field>,
    );
    const el = screen.getByLabelText("Enabled");
    expect(el.id).not.toBe("");
    expect(el).toHaveAttribute("aria-invalid", "true");
  });
});

describe("FieldBoundary", () => {
  it("stops the association reaching nested controls", () => {
    // Two inner controls would otherwise share one id, and `label for` would
    // point at whichever the browser found first.
    render(
      <Field label="Published">
        <FieldBoundary>
          <input aria-label="Month" />
          <input aria-label="Year" />
        </FieldBoundary>
      </Field>,
    );

    expect(screen.getByLabelText("Month").id).toBe("");
    expect(screen.getByLabelText("Year").id).toBe("");
  });

  it("leaves the inner controls rendering and usable", async () => {
    const user = userEvent.setup();
    render(
      <Field label="Published">
        <FieldBoundary>
          <input aria-label="Month" />
        </FieldBoundary>
      </Field>,
    );
    await user.type(screen.getByLabelText("Month"), "08");
    expect(screen.getByLabelText("Month")).toHaveValue("08");
  });

  it("does not mark nested controls invalid", () => {
    // A validation error on the date reported by the month dropdown is not the
    // thing that is wrong.
    render(
      <Field label="Published" error="Pick a date">
        <FieldBoundary>
          <input aria-label="Month" />
        </FieldBoundary>
      </Field>,
    );
    expect(screen.getByLabelText("Month")).not.toHaveAttribute("aria-invalid");
  });
});

describe("controls", () => {
  it("Input accepts typing and reports it", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Input aria-label="Host" onChange={onChange} />);

    await user.type(screen.getByLabelText("Host"), "web-01");

    expect(screen.getByLabelText("Host")).toHaveValue("web-01");
    expect(onChange).toHaveBeenCalled();
  });

  it("Input forwards its ref", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input aria-label="Host" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("Checkbox toggles", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Enabled" />);

    const box = screen.getByRole("checkbox", { name: "Enabled" });
    expect(box).not.toBeChecked();
    await user.click(box);
    expect(box).toBeChecked();
  });

  it("Switch is a real input with role=switch", () => {
    // Keeping the native input means keyboard, form submission and
    // screen-reader semantics come for free.
    render(<Switch aria-label="Enabled" />);
    const control = screen.getByRole("switch", { name: "Enabled" });
    expect(control.tagName).toBe("INPUT");
    expect(control).toHaveAttribute("type", "checkbox");
  });

  it("Switch toggles by click", async () => {
    // Regression: an earlier version sized the wrapper from a `size-0` input,
    // which has NO HIT AREA — clicking the visible switch did nothing.
    const user = userEvent.setup();
    render(<Switch aria-label="Enabled" />);

    const control = screen.getByRole("switch", { name: "Enabled" });
    await user.click(control);
    expect(control).toBeChecked();
  });

  it("Switch toggles by keyboard", async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Enabled" />);

    await user.tab();
    await user.keyboard(" ");

    expect(screen.getByRole("switch", { name: "Enabled" })).toBeChecked();
  });

  it("Switch submits with a form", () => {
    render(
      <form>
        <Switch aria-label="Enabled" name="enabled" defaultChecked />
      </form>,
    );
    expect(screen.getByRole("switch", { name: "Enabled" })).toHaveAttribute("name", "enabled");
  });

  it("Select reports the chosen option", async () => {
    const user = userEvent.setup();
    render(
      <Select aria-label="Region" defaultValue="eu">
        <option value="eu">EU</option>
        <option value="us">US</option>
      </Select>,
    );

    await user.selectOptions(screen.getByLabelText("Region"), "us");
    expect(screen.getByLabelText("Region")).toHaveValue("us");
  });

  it("a disabled control cannot be typed into", async () => {
    const user = userEvent.setup();
    render(
      <Field label="Host" disabled>
        <Input />
      </Field>,
    );
    await user.type(screen.getByLabelText("Host"), "x");
    expect(screen.getByLabelText("Host")).toHaveValue("");
  });

  it("an explicit prop beats the field's context value", () => {
    // Controls spread `{...field} {...props}`, so a caller can override.
    render(
      <Field label="Host" disabled>
        <Input disabled={false} />
      </Field>,
    );
    expect(screen.getByLabelText("Host")).toBeEnabled();
  });
});
