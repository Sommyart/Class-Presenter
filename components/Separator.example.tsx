import React from "react";
import { Separator } from "./Separator";

export const BasicHorizontal = {
  size: "md",
  backdrop: "surface",
  title: "Basic horizontal separator",
  component: () => (
    <div>
      <div>Above content</div>
      <Separator />
      <div>Below content</div>
    </div>
  ),
};

export const VerticalSeparator = {
  size: "md",
  backdrop: "surface",
  title: "Vertical separator",
  component: () => (
    <div style={{ display: "flex", height: "1rem", gap: "var(--spacing-sm" }}>
      <span>Left</span>
      <Separator orientation="vertical" />
      <span>Right</span>
    </div>
  ),
};

export const MultipleVertical = {
  size: "md",
  backdrop: "surface",
  title: "Multiple vertical separators",
  component: () => (
    <div style={{ display: "flex", height: "1rem", gap: "var(--spacing-sm" }}>
      <span>Item 1</span>
      <Separator orientation="vertical" />
      <span>Item 2</span>
      <Separator orientation="vertical" />
      <span>Item 3</span>
    </div>
  ),
};

export const NonDecorative = {
  size: "md",
  backdrop: "surface",
  title: "Non-decorative separator",
  component: () => (
    <div>
      <div>Section 1</div>
      <Separator decorative={false} aria-label="Section divider" />
      <div>Section 2</div>
    </div>
  ),
};
