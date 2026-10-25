export function getOAuthRedirectUri(url: string): string {
  const urlObj = new URL(url);
  return `${urlObj.origin}/_api/auth/oauth_callback`;
}
