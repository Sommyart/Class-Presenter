import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Button } from "./Button";
import { Bell } from "lucide-react";

export const BasicPopoverExample = {
  size: "sm",
  backdrop: "surface",
  title: "Basic Popover",
  component: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Click me</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p style={{ margin: 0 }}>
          This is a basic popover with simple text content.
        </p>
      </PopoverContent>
    </Popover>
  ),
};

export const PopoverWithCard = {
  size: "sm",
  backdrop: "surface",
  title: "Popover with card",
  component: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Bell size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent removeBackgroundAndPadding>
        <div
          style={{
            background: "var(--surface)",
            padding: "var(--spacing-3)",
            border: "1px solid var(--border)",
          }}
        >
          Card
        </div>
      </PopoverContent>
    </Popover>
  ),
};
