import { User } from "./User";
import { OAuthProviderType } from "./OAuthProvider";

export type OAuthSuccessMessage = {
  type: "OAUTH_SUCCESS";
  provider: OAuthProviderType;
  user: User;
};

export type OAuthTokenSuccessMessage = {
  type: "OAUTH_TOKEN_SUCCESS";
  provider: OAuthProviderType;
  token: string;
};

export type OAuthErrorMessage = {
  type: "OAUTH_ERROR";
  // an error can be due to a invalid provider so we don't use the provider type
  provider: string;
  error: {
    message: string;
    code?: string;
    details?: string;
  };
};

export type OAuthPopupMessage =
  | OAuthSuccessMessage
  | OAuthTokenSuccessMessage
  | OAuthErrorMessage;

/**
 * Creates HTML for OAuth popup response that posts a message to the parent window
 * This ensures type-safe communication between the popup and parent window
 */
export function createOAuthPopupResponseHtml(
  message: OAuthPopupMessage
): string {
  const messageJson = JSON.stringify(message);
  const isSuccess =
    message.type === "OAUTH_SUCCESS" || message.type === "OAUTH_TOKEN_SUCCESS";

  return `
    <!DOCTYPE html>
    <html>
      <body>
        ${
          isSuccess
            ? "Authentication successful! Closing window..."
            : "Authentication failed. Please try again."
        }
        <script>
          function sendMessageToParent() {
            const message = ${messageJson};
            if (!window.opener) {
              location.href = "/";
              return true;
            }
            try {
              window.opener.postMessage(message, location.origin);
              return true
            } catch (error) {
              console.error(error);
            }
            return false
          }
          
          const success = sendMessageToParent();
          
          if (success) {
            setTimeout(() => {
              try {
                window.close();
              } catch (error) {
                console.error('Failed to close popup window:', error);
              }
            }, 1000);
          }
        </script>
      </body>
    </html>
  `;
}
