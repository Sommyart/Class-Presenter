import React from 'react';
import { Toggle } from './Toggle';
import { Star, Bell, Heart } from 'lucide-react';

export const IconOnlyToggles = {
  size: "md",
  backdrop: "surface",
  title: "Icon Only Toggles",
  component: () => (
    <>
      <Toggle size="sm">
        <Star size={14} />
      </Toggle>
      <Toggle>
        <Bell size={16} />
      </Toggle>
      <Toggle size="lg">
        <Heart size={20} />
      </Toggle>
    </>
  )
};

export const TextAndIconToggles = {
  size: "md",
  backdrop: "surface",
  title: "Text and Icon Toggles",
  component: () => (
    <>
      <Toggle variant="outline">
        <Bell size={16} /> <span>Notifications</span>
      </Toggle>
      <Toggle size="lg" variant="outline">
        <Heart size={20} /> <span>Favorite</span>
      </Toggle>
    </>
  )
};

export const TextOnlyToggles = {
  size: "md",
  backdrop: "surface",
  title: "Text Only Toggles",
  component: () => (
    <>
      <Toggle size="sm">
        <span>Pin</span>
      </Toggle>
      <Toggle>
        <span>Default</span>
      </Toggle>
      <Toggle size="lg">
        <span>Large</span>
      </Toggle>
    </>
  )
};
