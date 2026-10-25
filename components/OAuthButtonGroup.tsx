import React from "react";
import { GoogleLoginButton } from "./GoogleLoginButton";
import styles from "./OAuthButtonGroup.module.css";

interface OAuthButtonGroupProps {
  className?: string;
  disabled?: boolean;
}

export const OAuthButtonGroup: React.FC<OAuthButtonGroupProps> = ({
  className,
  disabled,
}) => {
  // Google sign-in is only offered when the deployment has OAuth credentials.
  if (import.meta.env.VITE_GOOGLE_AUTH !== "true") return null;
  return (
    <div className={`${styles.container} ${className || ""}`}>
      <GoogleLoginButton disabled={disabled} />
      {/* Add more buttons here for other oauth providers as needed */}
    </div>
  );
};
