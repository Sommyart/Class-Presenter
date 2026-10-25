import React from "react";
import { Slider } from "./Slider";

export const BasicSlider = {
  size: "md",
  backdrop: "surface",
  title: "Basic Slider",
  component: () => <Slider defaultValue={[50]} max={100} step={1} />,
};

export const StepSlider = {
  size: "md",
  backdrop: "surface",
  title: "Step Slider",
  component: () => <Slider defaultValue={[40]} max={100} step={10} />,
};

export const RangeSlider = {
  size: "md",
  backdrop: "surface",
  title: "Range Slider",
  component: () => <Slider defaultValue={[20, 80]} max={100} step={1} />,
};

export const DisabledSlider = {
  size: "md",
  backdrop: "surface",
  title: "Disabled Slider",
  component: () => <Slider defaultValue={[60]} max={100} step={1} disabled />,
};
