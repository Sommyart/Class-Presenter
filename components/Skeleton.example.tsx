import { Skeleton } from "./Skeleton";

export const TextSkeletonExample = {
  size: "md",
  backdrop: "surface",
  title: "Text Skeleton",
  component: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-sm)",
      }}
    >
      <Skeleton style={{ width: "200px", height: "2rem" }} />
      <Skeleton style={{ width: "160px", height: "1rem" }} />
      <Skeleton style={{ width: "180px", height: "1rem" }} />
    </div>
  ),
};

export const ProfileSkeletonExample = {
  size: "md",
  backdrop: "surface",
  title: "Profile Skeleton",
  component: () => (
    <div>
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-sm)",
          alignItems: "center",
        }}
      >
        <Skeleton
          style={{
            width: "4rem",
            height: "4rem",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-xs)",
          }}
        >
          <Skeleton style={{ width: "150px", height: "1.5rem" }} />
          <Skeleton style={{ width: "100px", height: "1rem" }} />
        </div>
      </div>
    </div>
  ),
};
