import { Spinner } from "./Spinner";

export const SpinnerSizesExample = {
  size: "md",
  backdrop: "surface",
  title: "Spinner Sizes",
  component: () => (
    <>
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      </>
  ),
};

export const SpinnerLoadingStateExample = {
  size: "md",
  backdrop: "surface",
  title: "Loading State Example",
  component: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.25rem 0.75rem",
        background: "var(--color-gray-200)",
        borderRadius: "var(--radius-md)",
        fontSize: "var(--font-size-sm)",
      }}
    >
      <Spinner size="sm" />
      Loading...
    </div>
  ),
};
