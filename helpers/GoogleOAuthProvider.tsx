import {
  OAuthProviderInterface,
  OAuthTokens,
  StandardUserData,
  OAuthError,
} from "./OAuthProvider";
import * as crypto from "crypto";



export class GoogleOAuthProvider implements OAuthProviderInterface {
  public readonly name = "google";
  public readonly clientId: string;
  public readonly authUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  public readonly scopes = "openid email profile";
  public readonly redirectUri: string;
  private readonly clientSecret: string;
  private readonly tokenUrl = "https://oauth2.googleapis.com/token";
  private readonly userInfoUrl = "https://openidconnect.googleapis.com/v1/userinfo";

  constructor(redirectUri: string) {
    this.clientId = process.env.GOOGLE_CLIENT_ID || "";
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    this.redirectUri = redirectUri;

    if (!this.clientId) {
      const error = new Error(
        "GOOGLE_CLIENT_ID environment variable is required"
      );
      console.error("GoogleOAuthProvider initialization failed:", error);
      throw error;
    }

    if (!this.clientSecret) {
      const error = new Error(
        "GOOGLE_CLIENT_SECRET environment variable is required"
      );
      console.error("GoogleOAuthProvider initialization failed:", error);
      throw error;
    }
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<OAuthTokens> {
    console.log(
      "GoogleOAuthProvider: Exchanging authorization code for tokens",
      {
        codeLength: code.length,
        redirectUri,
        hasPKCE: !!codeVerifier,
        codeVerifierLength: codeVerifier?.length,
      }
    );

    const requestBody = {
      grant_type: "authorization_code",
      code: code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri,
      ...(codeVerifier && { code_verifier: codeVerifier }),
    };

    let response: Response;
    try {
      response = await fetch(this.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(requestBody as Record<string, string>).toString(),
      });
    } catch (fetchError) {
      console.error("GoogleOAuthProvider: Token exchange fetch error:", {
        error:
          fetchError instanceof Error ? fetchError.message : String(fetchError),
        url: this.tokenUrl,
      });

      throw new OAuthError(
        "NETWORK_ERROR",
        `Token exchange request failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
        this.name,
        fetchError
      );
    }

    if (!response.ok) {
      let errorText: string;
      try {
        const errorData = JSON.parse(await response.text()) as {
          error?: string;
          message?: string;
        };
        errorText =
          errorData.error ?? errorData.message ?? "Unknown error response";
      } catch (textError) {
        errorText = "Could not read error response body";
        console.error(
          "GoogleOAuthProvider: Failed to read error response text:",
          textError
        );
      }

      console.error(
        "GoogleOAuthProvider: Token exchange failed with error response:",
        {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          headers: Object.fromEntries(response.headers.entries()),
        }
      );

      throw new OAuthError(
        "TOKEN_EXCHANGE_FAILED",
        `Token exchange failed: ${response.status} ${response.statusText}. Response: ${errorText}`,
        this.name,
        { status: response.status, body: errorText }
      );
    }

    let data: any;
    try {
      data = JSON.parse(await response.text());
    } catch (jsonError) {
      console.error(
        "GoogleOAuthProvider: Failed to parse token exchange response JSON:",
        {
          error:
            jsonError instanceof Error ? jsonError.message : String(jsonError),
          status: response.status,
        }
      );

      throw new OAuthError(
        "TOKEN_EXCHANGE_FAILED",
        `Token exchange succeeded but response is not valid JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
        this.name,
        jsonError
      );
    }

    if (!data.access_token) {
      throw new OAuthError(
        "TOKEN_EXCHANGE_FAILED",
        "No access token received from Google",
        this.name,
        data
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || undefined,
      expiresIn: data.expires_in || undefined,
      tokenType: data.token_type || "Bearer",
      scope: data.scope || undefined,
    };
  }

  async fetchUserInfo(tokens: OAuthTokens): Promise<any> {
    // Use the token_type from the tokens parameter, defaulting to "Bearer" if not provided
    const tokenType = tokens.tokenType || "Bearer";

    const authHeader = `${tokenType} ${tokens.accessToken}`;

    let response: Response;
    try {
      response = await fetch(this.userInfoUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      });
    } catch (fetchError) {
      console.error("GoogleOAuthProvider: User info fetch error:", {
        error:
          fetchError instanceof Error ? fetchError.message : String(fetchError),
        url: this.userInfoUrl,
      });

      throw new OAuthError(
        "NETWORK_ERROR",
        `User info request failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
        this.name,
        fetchError
      );
    }

    if (!response.ok) {
      let errorText: string;
      try {
        const errorData = JSON.parse(await response.text()) as {
          error?: string;
          message?: string;
        };
        errorText =
          errorData.error ?? errorData.message ?? "Unknown error response";
      } catch (textError) {
        errorText = "Could not read error response body";
        console.error(
          "GoogleOAuthProvider: Failed to read user info error response text:",
          textError
        );
      }

      console.error(
        "GoogleOAuthProvider: User info fetch failed with error response:",
        {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          headers: Object.fromEntries(response.headers.entries()),
          tokenType: tokenType,
          authHeaderUsed: `${tokenType} [REDACTED]`,
        }
      );

      throw new OAuthError(
        "USER_INFO_FETCH_FAILED",
        `User info fetch failed: ${response.status} ${response.statusText}. Response: ${errorText}`,
        this.name,
        { status: response.status, body: errorText }
      );
    }

    let data: any;
    try {
      data = JSON.parse(await response.text());
    } catch (jsonError) {
      console.error(
        "GoogleOAuthProvider: Failed to parse user info response JSON:",
        {
          error:
            jsonError instanceof Error ? jsonError.message : String(jsonError),
          status: response.status,
        }
      );

      throw new OAuthError(
        "USER_INFO_FETCH_FAILED",
        `User info fetch succeeded but response is not valid JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
        this.name,
        jsonError
      );
    }

    return data;
  }

  mapUserData(userInfo: any): StandardUserData {
    if (!userInfo) {
      throw new OAuthError(
        "PROVIDER_ERROR",
        "No user info provided to map",
        this.name,
        userInfo
      );
    }

    if (!userInfo.sub) {
      throw new OAuthError(
        "PROVIDER_ERROR",
        "Google user info missing required sub field",
        this.name,
        userInfo
      );
    }

    if (!userInfo.email) {
      throw new OAuthError(
        "PROVIDER_ERROR",
        "Google user info missing required email field",
        this.name,
        userInfo
      );
    }

    const mappedData: StandardUserData = {
      email: userInfo.email,
      displayName: userInfo.name || userInfo.email.split("@")[0], // Fallback to email prefix if no name
      avatarUrl: userInfo.picture || null, // Support avatar URL if provided
      providerUserId: userInfo.sub,
    };

    return mappedData;
  }

  private generateCodeVerifier(): string {
    // Generate random bytes and convert to base64url using Node.js crypto
    return crypto.randomBytes(32).toString("base64url");
  }

  private generateCodeChallenge(codeVerifier: string): string {
    // Hash the code verifier with SHA256 and convert to base64url using Node.js crypto
    return crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  }

  generateAuthorizationUrl(state: string): {
    url: string;
    codeVerifier: string;
  } {
    // Generate PKCE parameters
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "select_account",
    });

    const authUrl = `${this.authUrl}?${params.toString()}`;

    return { url: authUrl, codeVerifier };
  }
}
