import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import { Button } from "./Button";
import { Input } from "./Input";

export const BasicDialogExample = {
  size: "sm",
  backdrop: "surface",
  title: "Basic Dialog",
  component: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button>Open Basic Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Basic Dialog</DialogTitle>
          <DialogDescription>
            This is a basic dialog with a title, description, and footer
            buttons.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const DialogWithContentExample = {
  size: "sm",
  backdrop: "surface",
  title: "Edit Profile Dialog",
  component: () => {
    const [name, setName] = useState("Jane Doe");
    const [email, setEmail] = useState("jane.doe@example.com");

    return (
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button variant="outline">Edit Profile</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information below. Click Save when you're
              done to apply the changes to your account.
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
              <label
                htmlFor="profile-name"
                style={{ fontSize: "0.875rem", fontWeight: 500 }}
              >
                Full Name
              </label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
              <label
                htmlFor="profile-email"
                style={{ fontSize: "0.875rem", fontWeight: 500 }}
              >
                Email Address
              </label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};
