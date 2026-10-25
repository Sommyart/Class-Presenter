import { useState } from "react";
import { Checkbox } from "./Checkbox";

export const BasicCheckbox = {
  size: "sm",
  backdrop: "surface",
  title: "Basic Checkbox",
  component: () => (
    <>
      <Checkbox id="basic" />
      <label htmlFor="basic">Basic checkbox</label>
    </>
  ),
};

export const CheckedCheckbox = {
  size: "sm",
  backdrop: "surface",
  title: "Checked Checkbox",
  component: () => (
    <>
      <Checkbox id="checked" defaultChecked />
      <label htmlFor="checked">Checked by default</label>
    </>
  ),
};

export const DisabledStates = {
  size: "sm",
  backdrop: "surface",
  title: "Disabled States",
  component: () => (
    <>
      <div style={{ display: "flex", gap: "var(--spacing-xs)" }}>
        <Checkbox id="disabled" disabled />
        <label htmlFor="disabled">Disabled</label>
      </div>
      <div style={{ display: "flex", gap: "var(--spacing-xs)" }}>
        <Checkbox id="disabledChecked" disabled defaultChecked />
        <label htmlFor="disabledChecked">Disabled checked</label>
      </div>
    </>
  ),
};

export const ControlledCheckbox = {
  size: "sm",
  backdrop: "surface",
  title: "Controlled Checkbox",
  component: () => {
    const [isChecked, setIsChecked] = useState(false);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Checkbox
            id="controlled"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
          />
          <label htmlFor="controlled">Controlled checkbox</label>
        </div>
        <div style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>
          Checked: {isChecked ? "true" : "false"}
        </div>
      </div>
    );
  },
};
