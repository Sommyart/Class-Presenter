import React from "react";
import { Search } from "lucide-react";
import { Input } from "./Input";

export const BasicInput = {
  size: "md",
  backdrop: "surface",
  title: "Basic Input",
  component: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-md)",
      }}
    >
      <Input placeholder="Hover over me" />
      <Input placeholder="I am disabled" disabled />
      <Input defaultValue="I have a value" />
    </div>
  ),
};

export const SearchInput = {
  size: "md",
  backdrop: "surface",
  title: "Search Input with Icon",
  component: () => (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Search
        size={18}
        style={{
          position: "absolute",
          left: "var(--spacing-3)",
          color: "var(--muted-foreground)",
          pointerEvents: "none",
        }}
      />
      <Input
        type="search"
        placeholder="Search..."
        style={{
          paddingLeft: "calc(var(--spacing-3) * 2 + 18px)",
        }}
      />
    </div>
  ),
};

export const InputStates = {
  size: "md",
  backdrop: "surface",
  title: "Input States",
  component: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-md)",
      }}
    >
      <Input placeholder="Placeholder text" />
      <Input value="Filled value" />
      <Input value="Disabled" disabled />
      <Input value="Read-only" readOnly />
    </div>
  ),
};

export const InputTypes = {
  size: "md",
  backdrop: "surface",
  title: "Input Types",
  component: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-md)",
      }}
    >
      <Input type="text" placeholder="Text" />
      <Input type="password" placeholder="Password" />
      <Input type="email" placeholder="Email" />
      <Input type="number" placeholder="Number" />
      <Input type="search" placeholder="Search" />
    </div>
  ),
};
