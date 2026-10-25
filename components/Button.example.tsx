import React from 'react';
import { Button } from './Button';
import { StarIcon, SendIcon, TrashIcon, PlusIcon, MenuIcon } from 'lucide-react';

export const VariantExamples = {
  size: "md",
  backdrop: "surface",
  title: "Button Variants",
  component: () => (
    <>
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
    </>
  )
};

export const SizeExamples = {
  size: "md",
  backdrop: "surface",
  title: "Button Sizes",
  component: () => (
    <>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </>
  )
};

export const IconButtonExamples = {
  size: "md",
  backdrop: "surface",
  title: "Icon Buttons",
  component: () => (
    <>
      <Button size="icon-sm"><StarIcon size={14} /></Button>
      <Button size="icon-md"><SendIcon size={16} /></Button>
      <Button size="icon-lg"><PlusIcon size={20} /></Button>
      <Button variant="outline" size="icon-md"><MenuIcon size={16} /></Button>
      <Button variant="destructive" size="icon-md"><TrashIcon size={16} /></Button>
    </>
  )
};

export const ButtonWithIconsExamples = {
  size: "md",
  backdrop: "surface",
  title: "Buttons with Icons",
  component: () => (
    <>
      <Button><StarIcon size={16} /> Star</Button>
      <Button variant="secondary"><SendIcon size={16} /> Send</Button>
      <Button variant="destructive"><TrashIcon size={16} /> Delete</Button>
    </>
  )
};

export const StateExamples = {
  size: "md",
  backdrop: "surface",
  title: "Button States",
  component: () => (
    <>
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
    </>
  )
};

