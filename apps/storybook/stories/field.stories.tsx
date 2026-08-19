import {
  Button,
  Card,
  Checkbox,
  Field,
  FieldGrid,
  Input,
  Note,
  Select,
  Switch,
  Textarea,
} from "@vcyberizadmin/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/** CX-FLD. Tenant is the sole owner of a real field primitive — SOC and VAPT
 *  inline their inputs per page, so there is nothing to reconcile. */
const meta = {
  title: "Forms/Field & controls",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const AllControls: Story = {
  name: "Every control",
  render: () => (
    <Card title="Tenant onboarding" hint="Two columns above 720px">
      <FieldGrid>
        <Field label="Tenant name" hint="Must be unique. 2–150 characters.">
          <Input placeholder="Northwind Health" />
        </Field>

        <Field label="Subdomain" hint="Lowercase letters, numbers and hyphens.">
          <Input placeholder="northwind" />
        </Field>

        <Field label="Plan">
          <Select defaultValue="enterprise">
            <option value="trial">Trial</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </Select>
        </Field>

        <Field label="Primary region">
          <Select defaultValue="eu-west">
            <option value="eu-west">eu-west</option>
            <option value="us-east">us-east</option>
            <option value="ap-south">ap-south</option>
          </Select>
        </Field>

        <Field
          label="Notes"
          optional
          hint="Visible to platform administrators only."
          className="min-[720px]:col-span-2"
        >
          <Textarea placeholder="Anything the on-call team should know" />
        </Field>

        <Field
          label="Send onboarding email"
          orientation="inline"
          hint="Goes to the primary contact once provisioning completes."
        >
          <Checkbox defaultChecked />
        </Field>

        <Field
          label="Enable continuous scanning"
          orientation="inline"
          hint="Re-scans the attack surface every 24 hours."
        >
          <Switch defaultChecked />
        </Field>
      </FieldGrid>
    </Card>
  ),
};

/** An error REPLACES the hint in place — they never stack, so the layout does
 *  not jump as validation fires. */
export const HintAndError: Story = {
  name: "Hint · error · disabled",
  render: () => {
    const [value, setValue] = useState("nw");
    const [touched, setTouched] = useState(false);
    // The specified timing: validate on BLUR, then re-validate on change once an
    // error exists. Never while the user is first typing.
    const error =
      touched && value.trim().length < 3
        ? "Use at least 3 characters — this becomes the tenant's URL."
        : undefined;

    return (
      <div className="flex max-w-lg flex-col gap-6">
        <Card title="Validation timing">
          <div className="flex flex-col gap-4">
            <Field
              label="Subdomain"
              hint="Must be unique. 2–150 characters."
              error={error}
            >
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => setTouched(true)}
              />
            </Field>
            <Note tone="info">
              Blur the field with fewer than 3 characters. The error replaces the
              hint rather than appearing beneath it, and only then does typing
              re-validate.
            </Note>
          </div>
        </Card>

        <Card title="Disabled with a visible reason">
          <Field
            label="Billing contact"
            disabled
            disabledReason="Only the account owner can change the billing contact."
          >
            <Input defaultValue="finance@northwind.example" />
          </Field>
        </Card>

        <Card title="Required is assumed">
          <div className="flex flex-col gap-4">
            <Field label="Tenant name">
              <Input placeholder="Required — no asterisk needed" />
            </Field>
            <Field label="Internal reference" optional>
              <Input placeholder="Marked because it is the exception" />
            </Field>
          </div>
          <p className="text-fg-muted text-small mt-4">
            Marking the exceptions instead of starring every mandatory field keeps
            a long form readable.
          </p>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm">Cancel</Button>
          <Button size="sm">Create tenant</Button>
        </div>
      </div>
    );
  },
};

/** Both API shapes. The first is the one to reach for. */
export const BothApiShapes: Story = {
  name: "Context vs render prop",
  render: () => (
    <div className="flex max-w-lg flex-col gap-4">
      <Card title="Context — the default" padding="sm">
        <Field label="Asset name" hint="Picked up from context automatically.">
          <Input placeholder="api-gateway-prod" />
        </Field>
      </Card>
      <Card title="Render prop — for third-party controls" padding="sm">
        <Field label="Asset name" hint="Wiring passed explicitly.">
          {(control) => (
            <input
              {...control}
              placeholder="api-gateway-prod"
              className="bg-wash-1 border-rule text-fg placeholder:text-fg-muted focus:border-accent h-9 w-full rounded-sm border px-2.5 text-[13px] focus:outline-none"
            />
          )}
        </Field>
      </Card>
    </div>
  ),
};
