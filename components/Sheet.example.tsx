import { useState } from "react";
import { Button } from "./Button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "./Sheet";

export const BasicSheetExample = {
  size: "md",
  backdrop: "surface",
  title: "Basic Sheet",
  component: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>
            This is a basic sheet that slides in from the right side.
          </SheetDescription>
        </SheetHeader>
        <div style={{ padding: "1rem" }}>
          <p>Sheet content goes here</p>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const SheetWithFooterExample = {
  size: "md",
  backdrop: "surface",
  title: "Sheet with Footer",
  component: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">Sheet with Footer</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Manage your account settings and preferences.
          </SheetDescription>
        </SheetHeader>
        <div style={{ padding: "1rem" }}>
          <p>Content area</p>
        </div>
        <SheetFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const BottomSheetExample = {
  size: "md",
  backdrop: "surface",
  title: "Bottom Sheet",
  component: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Bottom Sheet</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Bottom Sheet</SheetTitle>
          <SheetDescription>
            This sheet slides up from the bottom of the screen.
          </SheetDescription>
        </SheetHeader>
        <div style={{ padding: "1rem" }}>
          <p>Bottom sheet content</p>
        </div>
      </SheetContent>
    </Sheet>
  ),
};
