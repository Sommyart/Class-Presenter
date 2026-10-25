import React from 'react';
import { ToggleGroup, ToggleGroupItem } from './ToggleGroup';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

export const MultipleSelectionWithIcons = {
  size: "md",
  backdrop: "surface",
  title: "Multiple selection with icons",
  component: () => (
    <ToggleGroup type="single" size="md">
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <Bold size={16} />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <Italic size={16} />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        <Underline size={16} />
      </ToggleGroupItem>
    </ToggleGroup>
  )
};

export const SingleSelectionWithOutline = {
  size: "md",
  backdrop: "surface",
  title: "Single selection with outline variant",
  component: () => (
    <ToggleGroup type="single" defaultValue="left" size="lg" variant="outline">
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft size={20} />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter size={20} />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight size={20} />
      </ToggleGroupItem>
      <ToggleGroupItem value="justify" aria-label="Justify">
        <AlignJustify size={20} />
      </ToggleGroupItem>
    </ToggleGroup>
  )
};

export const TextOptionsWithDisabledState = {
  size: "md",
  backdrop: "surface",
  title: "Text options with disabled state",
  component: () => (
    <ToggleGroup type="single" defaultValue="1" size="sm">
      <ToggleGroupItem value="1">
        Option 1
      </ToggleGroupItem>
      <ToggleGroupItem value="2">
        Option 2
      </ToggleGroupItem>
      <ToggleGroupItem value="3" disabled>
        Disabled
      </ToggleGroupItem>
    </ToggleGroup>
  )
};
