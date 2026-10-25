import { OAuthProviderInterface, OAuthProviderType } from "./OAuthProvider";
import { FlootOAuthProvider } from "./FlootOAuthProvider";

export function getOAuthProvider(
  providerName: OAuthProviderType,
  redirectUri: string
): OAuthProviderInterface {
  switch (providerName) {
    case "floot":
      return new FlootOAuthProvider(redirectUri);
    // add more providers here
  }
}
