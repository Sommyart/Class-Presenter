import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./Avatar";

export const AvatarWithImage = {
  size: "sm",
  backdrop: "surface",
  title: "Avatar with image",
  component: () => (
    <Avatar>
      <AvatarImage src="https://github.com/yyjhao.png" alt="User avatar" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
};

export const AvatarWithFallback = {
  size: "sm",
  backdrop: "surface",
  title: "Avatar with fallback",
  component: () => (
    <Avatar>
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
};

export const AvatarWithBrokenImage = {
  size: "sm",
  backdrop: "surface",
  title: "Avatar with broken image (shows fallback)",
  component: () => (
    <Avatar>
      <AvatarImage src="https://invalid.url/image.jpg" alt="Broken image" />
      <AvatarFallback>EM</AvatarFallback>
    </Avatar>
  ),
};
