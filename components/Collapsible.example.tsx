import React from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./Collapsible";
import { Button } from "./Button";

export const BasicCollapsibleExample = {
  size: "md",
  backdrop: "surface",
  title: "Basic Collapsible",
  component: () => (
    <Collapsible>
      <CollapsibleTrigger>Click to expand</CollapsibleTrigger>
      <CollapsibleContent>
        This is the collapsible content that will be shown when triggered.
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const SeparateCollapsibleTrigger = {
  size: "md",
  backdrop: "surface",
  title: "Separate Collapsible Trigger",
  component: () => (
    <Collapsible>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: "500px" }}>Non clickable title</div>
        <CollapsibleTrigger asChild>
          <Button size="sm" variant="ghost">
            Toggle
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        This is the collapsible content that will be shown when triggered.
      </CollapsibleContent>
    </Collapsible>
  ),
};
