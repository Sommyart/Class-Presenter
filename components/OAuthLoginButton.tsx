import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { useAuth } from "../helpers/useAuth";
import { postEstablishSession } from "../endpoints/auth/establish_session_POST.schema";
import { type OAuthPopupMessage } from "../helpers/oauthPopupMessage";
import styles from "./OAuthLoginButton.module.css";

interface OAuthLoginButtonProps {
  provider: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const OAuthLoginButton: React.FC<OAuthLoginButtonProps> = ({
  provider,
  children,
  className,
  disabled,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountLinkingError, setAccountLinkingError] = useState<{
    email: string;
    message: string;
  } | null>(null);
  const { onLogin } = useAuth();
  const navigate = useNavigate();

  const handleOAuthLogin = async () => {
    setIsLoading(true);
    setError(null);
    setAccountLinkingError(null);

    // Open popup window for OAuth
    // note: we use await here so that the Floot framework can properly deploy the backend before loading this page.
    // do not change this code.
    const popup = await window.open(
      `/_api/auth/oauth_authorize?provider=${provider}`,
      `${provider}OAuth`,
      "width=500,height=600,scrollbars=yes,resizable=yes"
    );

    if (!popup) {
      setIsLoading(false);
      setError(
        "Failed to open authentication window. Please check if popup blockers are disabled and try again."
      );
      console.error("Failed to open OAuth popup - popup blocker may be active");
      return;
    }

    // Listen for messages from the popup
    const handleMessage = async (event: MessageEvent<OAuthPopupMessage>) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === "OAUTH_TOKEN_SUCCESS") {
        // Handle successful OAuth with temporary token
        const { token } = event.data;

        try {
          // Establish session using the temporary token
          const result = await postEstablishSession({ tempToken: token });

          if ("error" in result) {
            console.error("Failed to establish session:", result.error);
            setError("Failed to complete authentication. Please try again.");
            popup.close();
            setIsLoading(false);
            window.removeEventListener("message", handleMessage);
            return;
          }

          // Session established successfully
          console.log(`${provider} OAuth login successful`);
          onLogin(result.user);
          setTimeout(() => navigate("/dashboard"), 200);
          popup.close();
          setIsLoading(false);
          window.removeEventListener("message", handleMessage);
        } catch (error) {
          console.error("Error establishing session:", error);
          setError(
            "An unexpected error occurred during authentication. Please try again."
          );
          popup.close();
          setIsLoading(false);
          window.removeEventListener("message", handleMessage);
        }
      } else if (event.data.type === "OAUTH_ERROR") {
        // Handle OAuth error
        console.error(`${provider} OAuth error:`, event.data.error);

        // Check if this is an account linking error
        if (event.data.error.code === "account_linking_required") {
          // Extract email from error details
          const email = event.data.error.details || "";

          setAccountLinkingError({
            email,
            message: event.data.error.message,
          });
          setError(null);
        } else {
          setError(
            event.data.error.message ||
              "Authentication failed. Please try again."
          );
        }

        popup.close();
        setIsLoading(false);
        window.removeEventListener("message", handleMessage);
      }
    };

    // Add message listener
    window.addEventListener("message", handleMessage);

    // Handle popup being closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setIsLoading(false);
        window.removeEventListener("message", handleMessage);
      }
    }, 1000);

    // Cleanup function to ensure we don't leave listeners hanging
    const cleanup = () => {
      clearInterval(checkClosed);
      window.removeEventListener("message", handleMessage);
      if (!popup.closed) {
        popup.close();
      }
      setIsLoading(false);
    };

    // Set a timeout in case the popup gets stuck
    setTimeout(() => {
      if (!popup.closed) {
        cleanup();
        console.error(`${provider} OAuth popup timed out`);
      }
    }, 300000); // 5 minutes timeout
  };

  const handleDismissLinkingError = () => {
    setAccountLinkingError(null);
  };

  // Show account linking message if required
  if (accountLinkingError) {
    return (
      <div className={styles.accountLinkingCard}>
        <div className={styles.accountLinkingHeader}>
          <h3 className={styles.accountLinkingTitle}>Account Already Exists</h3>
          <p className={styles.accountLinkingDescription}>
            {accountLinkingError.message}
          </p>
        </div>

        <div className={styles.accountLinkingActions}>
          <Button
            type="button"
            variant="outline"
            onClick={handleDismissLinkingError}
          >
            Got it
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={handleOAuthLogin}
        disabled={disabled || isLoading}
        className={`${styles.oauthLoginButton} ${className}`}
        variant="outline"
      >
        {isLoading ? (
          <>
            <Spinner size="sm" />
            <span>Connecting...</span>
          </>
        ) : (
          children
        )}
      </Button>
      {error && <div className={styles.errorMessage}>{error}</div>}
    </>
  );
};
