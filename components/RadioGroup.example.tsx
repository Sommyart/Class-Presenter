import { RadioGroup, RadioGroupItem } from "./RadioGroup";

export const BasicUsage = {
  size: "md",
  backdrop: "surface",
  title: "Basic usage",
  component: () => (
    <RadioGroup name="size" defaultValue="medium">
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
        <RadioGroupItem value="small" id="radio-small" />
        <label htmlFor="radio-small">Small</label>
        <RadioGroupItem value="medium" id="radio-medium" />
        <label htmlFor="radio-medium">Medium</label>
        <RadioGroupItem value="large" id="radio-large" />
        <label htmlFor="radio-large">Large</label>
      </div>
    </RadioGroup>
  ),
};
