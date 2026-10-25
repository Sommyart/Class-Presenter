import { Switch } from "./Switch";

export const BasicUsage = {
  size: "md",
  backdrop: "surface",
  title: "Basic usage",
  component: () => (
    <>
      <Switch id="airplane-mode" />
      <label htmlFor="airplane-mode">Airplane Mode</label>
    </>
  ),
};

export const DisabledState = {
  size: "md",
  backdrop: "surface",
  title: "Disabled state",
  component: () => (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <Switch id="disabled-unchecked" disabled />
        <label htmlFor="disabled-unchecked">Disabled Unchecked</label>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <Switch id="disabled-checked" disabled defaultChecked />
        <label htmlFor="disabled-checked">Disabled Checked</label>
      </div>
    </div>
  ),
};
