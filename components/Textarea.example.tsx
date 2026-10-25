import React from 'react';
import { Textarea } from './Textarea';

export const DefaultTextarea = {
  size: "md",
  backdrop: "surface",
  title: "Default Textarea",
  component: () => <Textarea placeholder="Enter your description..." />
}

export const NonResizableTextarea = {
  size: "md",
  backdrop: "surface",
  title: "Non-resizable Textarea",
  component: () => <Textarea placeholder="This textarea cannot be resized" disableResize />
}

export const DisabledTextarea = {
  size: "md",
  backdrop: "surface",
  title: "Disabled Textarea",
  component: () => <Textarea placeholder="Disabled textarea" disabled />
}

export const MultilineTextarea = {
  size: "md",
  backdrop: "surface",
  title: "Multiline Textarea",
  component: () => <Textarea placeholder="Multiline textarea" rows={10} />
}

export const ClearVariantTextarea = {
  size: "md",
  backdrop: "surface",
  title: "Clear Variant",
  component: () => <Textarea placeholder="Clear textarea" rows={4} variant="clear" />
}
