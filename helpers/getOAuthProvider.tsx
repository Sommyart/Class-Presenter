import { OAuthProviderInterface, OAuthProviderType } from "./OAuthProvider";
import { GoogleOAuthProvider } from "./GoogleOAuthProvider";

export function getOAuthProvider(
  providerName: OAuthProviderType,
  redirectUri: string
): OAuthProviderInterface {
  switch (providerName) {
    case "google":
      return new GoogleOAuthProvider(redirectUri);
    // add more providers here
  }
}
