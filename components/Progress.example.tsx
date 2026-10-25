import React from "react";
import { Progress } from "./Progress";

export const BasicProgress = {
  size: "md",
  backdrop: "surface",
  title: "Basic Progress",
  component: () => <Progress value={33} />,
};

export const AnimatedProgress = {
  size: "md",
  backdrop: "surface",
  title: "Animated Progress",
  component: () => {
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
      const timer = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    return <Progress value={progress} />;
  },
};

export const CompleteProgress = {
  size: "md",
  backdrop: "surface",
  title: "Complete Progress",
  component: () => <Progress value={100} />,
};

export const ZeroProgress = {
  size: "md",
  backdrop: "surface",
  title: "Zero Progress",
  component: () => <Progress value={0} />,
};
