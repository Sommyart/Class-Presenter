import { Badge } from "./Badge";

export const PrimaryBadge = {
  size: "sm",
  backdrop: "surface",
  title: "Primary Badge",
  component: () => <Badge>Active</Badge>,
};

export const SecondaryBadge = {
  size: "sm",
  backdrop: "surface",
  title: "Secondary Badge",
  component: () => <Badge variant="secondary">Premium</Badge>,
};

export const OutlineBadge = {
  size: "sm",
  backdrop: "surface",
  title: "Outline Badge",
  component: () => <Badge variant="outline">Draft</Badge>,
};

export const DestructiveBadge = {
  size: "sm",
  backdrop: "surface",
  title: "Destructive Badge",
  component: () => <Badge variant="destructive">Expired</Badge>,
};

export const SuccessBadge = {
  size: "sm",
  backdrop: "surface",
  title: "Success Badge",
  component: () => <Badge variant="success">Completed</Badge>,
};

export const WarningBadge = {
  size: "sm",
  backdrop: "surface",
  title: "Warning Badge",
  component: () => <Badge variant="warning">Caution</Badge>,
};
