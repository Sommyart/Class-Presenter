import React from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./Resizable";

export const HorizontalSplitExample = {
  size: "lg",
  backdrop: "surface",
  title: "Horizontal Split",
  component: () => (
    <ResizablePanelGroup direction="horizontal" style={{ height: "200px" }}>
      <ResizablePanel>Left Panel Content</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>Right Panel Content</ResizablePanel>
    </ResizablePanelGroup>
  ),
};

export const VerticalSplitExample = {
  size: "lg",
  backdrop: "surface",
  title: "Vertical Split",
  component: () => (
    <ResizablePanelGroup direction="vertical" style={{ height: "200px" }}>
      <ResizablePanel>Top Panel Content</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>Bottom Panel Content</ResizablePanel>
    </ResizablePanelGroup>
  ),
};

export const ComplexLayoutExample = {
  size: "lg",
  backdrop: "surface",
  title: "Complex Layout",
  component: () => (
    <ResizablePanelGroup direction="horizontal" style={{ height: "200px" }}>
      <ResizablePanel>Navigation Panel</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel>Main Content</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Details Panel</ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>Preview Panel</ResizablePanel>
    </ResizablePanelGroup>
  ),
};
