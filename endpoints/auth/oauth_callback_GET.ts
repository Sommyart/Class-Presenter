import { db } from "../../helpers/db";
import {
  createOAuthPopupResponseHtml,
  type OAuthTokenSuccessMessage,
  type OAuthErrorMessage,
} from "../../helpers/oauthPopupMessage";
import {
  OAuthProviderInterface,
  type OAuthProviderType,
  oauthProviders,
} from "../../helpers/OAuthProvider";
import { getOAuthProvider } from "../../helpers/getOAuthProvider";
import { ensureUserStorage } from "../../helpers/userStorage";
import { schema } from "./oauth_callback_GET.schema";
import crypto from "crypto";
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // Parse and validate query parameters with specific Zod error handling
    let result;
    try {
      result = schema.parse(queryParams);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        const errorMessage: OAuthErrorMessage = {
          type: "OAUTH_ERROR",
          provider: "unknown" as any,
          error: {
            message: "Invalid request parameters",
            code: "validation_error",
            details: validationError.errors
              .map((err) => err.message)
              .join(", "),
          },
        };
        return new Response(createOAuthPopupResponseHtml(errorMessage), {
          status: 400,
          headers: { "Content-Type": "text/html" },
        });
      }
      // Re-throw non-Zod errors to be handled by the outer catch block
      throw validationError;
    }

    const { code, state, error } = result;

    // Verify state parameter and retrieve stored information first
    const oauthStateResults = await db
      .selectFrom("oauthStates")
      .select(["id", "redirectUrl", "expiresAt", "codeVerifier", "provider"])
      .where("state", "=", state)
      .limit(1)
      .execute();

    if (oauthStateResults.length === 0) {
      console.error("Invalid OAuth state - not found in database");
      const errorMessage: OAuthErrorMessage = {
        type: "OAUTH_ERROR",
        provider: "unknown" as any,
        error: {
          message: "Invalid OAuth state",
          code: "invalid_state",
        },
      };
      return new Response(createOAuthPopupResponseHtml(errorMessage), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    const oauthState = oauthStateResults[0];

    // Validate that the provider from the database is a supported provider
    if (!oauthProviders.includes(oauthState.provider as OAuthProviderType)) {
      console.error(
        "Unsupported OAuth provider from database:",
        oauthState.provider,
      );
      const errorMessage: OAuthErrorMessage = {
        type: "OAUTH_ERROR",
        provider: "unknown" as any,
        error: {
          message: "Unsupported OAuth provider",
          code: "unsupported_provider",
          details: `Provider '${oauthState.provider}' is not supported`,
        },
      };
      return new Response(createOAuthPopupResponseHtml(errorMessage), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Cast to OAuthProviderType after validation
    const providerName = oauthState.provider as OAuthProviderType;

    // Handle OAuth error responses
    if (error) {
      console.error("OAuth error received:", error);
      const errorMessage: OAuthErrorMessage = {
        type: "OAUTH_ERROR",
        provider: providerName,
        error: {
          message: "OAuth authentication failed",
          code: "oauth_error",
          details: error,
        },
      };
      return new Response(createOAuthPopupResponseHtml(errorMessage), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    // When no error is present, code is required
    if (!code) {
      console.error("Missing required code parameter");
      const errorMessage: OAuthErrorMessage = {
        type: "OAUTH_ERROR",
        provider: providerName,
        error: {
          message: "Missing required OAuth authorization code",
          code: "missing_code",
        },
      };
      return new Response(createOAuthPopupResponseHtml(errorMessage), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Check if state has expired
    const now = new Date();
    if (oauthState.expiresAt < now) {
      console.error("OAuth state has expired");
      // Clean up expired state
      await db
        .deleteFrom("oauthStates")
        .where("id", "=", oauthState.id)
        .execute();
      const errorMessage: OAuthErrorMessage = {
        type: "OAUTH_ERROR",
        provider: providerName,
        error: {
          message: "OAuth state has expired",
          code: "state_expired",
        },
      };
      return new Response(createOAuthPopupResponseHtml(errorMessage), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Validate that redirect URI is stored
    if (!oauthState.redirectUrl) {
      console.error("Missing redirect URL in stored OAuth state");
      const errorMessage: OAuthErrorMessage = {
        type: "OAUTH_ERROR",
        provider: providerName,
        error: {
          message: "Invalid OAuth state - missing redirect URL",
          code: "invalid_state_redirect",
        },
      };
      return new Response(createOAuthPopupResponseHtml(errorMessage), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Create provider instance using the helper
    let oauthProvider: OAuthProviderInterface;
    try {
      oauthProvider = getOAuthProvider(providerName, oauthState.redirectUrl);
    } catch (providerError) {
      console.error("Failed to create OAuth provider:", providerError);
      const errorMessage: OAuthErrorMessage = {
        type: "OAUTH_ERROR",
        provider: oauthState.provider,
        error: {
          message: "OAuth provider configuration error",
          code: "provider_config_error",
          details:
            providerError instanceof Error
              ? providerError.message
              : "Unknown provider configuration error",
        },
      };
      return new Response(createOAuthPopupResponseHtml(errorMessage), {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Exchange authorization code for access token using stored redirect URI
    let tokens;
    try {
      // All providers now handle PKCE internally - always pass the code_verifier
      tokens = await oauthProvider.exchangeCodeForTokens(
        code,
        oauthState.redirectUrl,
        oauthState.codeVerifier,
      );
    } catch (tokenError) {
      console.error("Failed to exchange authorization code:", tokenError);

      if (tokenError instanceof Error) {
        console.error("Token exchange error details:", {
          name: tokenError.name,
          message: tokenError.message,
          stack: tokenError.stack?.substring(0, 500) + "...",
        });
      }

      const errorMessage: OAuthErrorMessage = {
        type: "OAUTH_ERROR",
        provider: oauthState.provider,
        error: {
          message: "Failed to exchange authorization code for access token",
          code: "token_exchange_failed",
          details:
            tokenError instanceof Error
              ? tokenError.message
              : "Unknown error occurred during token exchange",
        },
      };
      return new Response(createOAuthPopupResponseHtml(errorMessage), {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    }

    if (!tokens.accessToken) {
      console.error("No access token received from provider");
      console.error("Token response was:", tokens);
      const errorMessage: OAuthErrorMessage = {
        type: "OAUTH_ERROR",
        provider: oauthState.provider,
        error: {
          message: "No access token received from OAuth provider",
          code: "no_access_token",
        },
      };
      return new Response(createOAuthPopupResponseHtml(errorMessage), {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Fetch user information from provider
    let userInfo;
    try {
      userInfo = await oauthProvider.fetchUserInfo(tokens);
    } catch (userInfoError) {
      console.error("Failed to fetch user information:", userInfoError);

      if (userInfoError instanceof Error) {
        console.error("User info fetch error details:", {
          name: userInfoError.name,
          message: userInfoError.message,
        });
      }

      const errorMessage: OAuthErrorMessage = {
        type: "OAUTH_ERROR",
        provider: oauthState.provider,
        error: {
          message: "Failed to fetch user information from OAuth provider",
          code: "user_info_failed",
          details:
            userInfoError instanceof Error
              ? userInfoError.message
              : "Unknown error occurred while fetching user info",
        },
      };
      return new Response(createOAuthPopupResponseHtml(errorMessage), {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Map provider-specific user data to our format
    let mappedUserData;
    try {
      mappedUserData = oauthProvider.mapUserData(userInfo);
    } catch (mappingError) {
      console.error("Failed to map user data:", mappingError);
      const errorMessage: OAuthErrorMessage = {
        type: "OAUTH_ERROR",
        provider: oauthState.provider,
        error: {
          message: "Failed to process user information",
          code: "user_data_mapping_failed",
          details:
            mappingError instanceof Error
              ? mappingError.message
              : "Unknown error occurred while processing user data",
        },
      };
      return new Response(createOAuthPopupResponseHtml(errorMessage), {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    }

    if (!mappedUserData.email || !mappedUserData.displayName) {
      console.error("Missing required user information from provider");
      console.error("Mapped user data:", mappedUserData);
      const errorMessage: OAuthErrorMessage = {
        type: "OAUTH_ERROR",
        provider: oauthState.provider,
        error: {
          message: "Incomplete user information received from OAuth provider",
          code: "incomplete_user_info",
        },
      };
      return new Response(createOAuthPopupResponseHtml(errorMessage), {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Find or create user in database
    let user;
    const existingUsers = await db
      .selectFrom("users")
      .select(["id", "email", "displayName", "role", "avatarUrl"])
      .where("email", "=", mappedUserData.email)
      .limit(1)
      .execute();

    if (existingUsers.length > 0) {
      user = existingUsers[0];

      // Check if this user has any OAuth accounts (smart linking logic)
      const existingOAuthAccounts = await db
        .selectFrom("oauthAccounts")
        .select(["id", "provider", "providerUserId"])
        .where("userId", "=", user.id)
        .execute();

      if (existingOAuthAccounts.length === 0) {
        // No OAuth accounts - check if user has a password set
        const userPassword = await db
          .selectFrom("userPasswords")
          .select(["userId"])
          .where("userId", "=", user.id)
          .limit(1)
          .execute();

        if (userPassword.length > 0) {
          // User has a password but no OAuth accounts - they need to login with password first to link accounts
          console.log("Password user trying to OAuth login - blocking");

          // Clean up OAuth state since we're discarding this attempt
          await db
            .deleteFrom("oauthStates")
            .where("id", "=", oauthState.id)
            .execute();

          const errorMessage: OAuthErrorMessage = {
            type: "OAUTH_ERROR",
            provider: oauthState.provider as OAuthProviderType,
            error: {
              message: `You already have an account with ${mappedUserData.email}. Please login with your password instead.`,
              code: "account_linking_required",
              details: mappedUserData.email,
            },
          };
          return new Response(createOAuthPopupResponseHtml(errorMessage), {
            status: 400,
            headers: { "Content-Type": "text/html" },
          });
        }
      }

      // This is an OAuth user - check if this specific provider is already linked
      const existingProviderAccount = existingOAuthAccounts.find(
        (account) => account.provider === providerName,
      );

      if (existingProviderAccount) {
        // Update existing OAuth account
        console.log(
          "Updating existing OAuth account for provider:",
          providerName,
        );
        await db
          .updateTable("oauthAccounts")
          .set({
            providerUserId: mappedUserData.providerUserId,
            providerEmail: mappedUserData.email,
            updatedAt: now,
          })
          .where("id", "=", existingProviderAccount.id)
          .execute();
      } else {
        // Link new OAuth provider to existing OAuth user
        console.log(
          "Linking new OAuth provider to existing user:",
          providerName,
        );
        await db
          .insertInto("oauthAccounts")
          .values({
            userId: user.id,
            provider: providerName,
            providerUserId: mappedUserData.providerUserId,
            providerEmail: mappedUserData.email,
            createdAt: now,
            updatedAt: now,
          })
          .execute();
      }

      // Update user information if needed
      await db
        .updateTable("users")
        .set({
          displayName: mappedUserData.displayName,
          avatarUrl: user.avatarUrl || mappedUserData.avatarUrl || null,
          updatedAt: now,
        })
        .where("id", "=", user.id)
        .execute();
    } else {
      console.log("Creating new user");

      // Create new user
      const newUsers = await db
        .insertInto("users")
        .values({
          email: mappedUserData.email,
          displayName: mappedUserData.displayName,
          avatarUrl: mappedUserData.avatarUrl || null,
          role: "user",
          createdAt: now,
          updatedAt: now,
        })
        .returning(["id", "email", "displayName", "role", "avatarUrl"])
        .execute();

      user = newUsers[0];

      // Google/OAuth signups bypass the password registration endpoint, so
      // seed their 1GB storage quota row here too. Without this a Google
      // signup would have no quota record and uploads would fail.
      await ensureUserStorage(user.id);

      // Create OAuth account record for new user
      await db
        .insertInto("oauthAccounts")
        .values({
          userId: user.id,
          provider: providerName,
          providerUserId: mappedUserData.providerUserId,
          providerEmail: mappedUserData.email,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }

    // Create temporary token that can be exchanged for a session
    const tempToken = crypto.randomUUID();
    const tempTokenExpiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    await db
      .insertInto("sessions")
      .values({
        id: tempToken,
        userId: user.id,
        expiresAt: tempTokenExpiresAt,
        createdAt: now,
        lastAccessed: now,
      })
      .execute();

    await db
      .deleteFrom("oauthStates")
      .where("id", "=", oauthState.id)
      .execute();

    // Determine redirect URL
    const redirectUrl = oauthState.redirectUrl;

    // Create response with temporary token instead of user data
    const successMessage: OAuthTokenSuccessMessage = {
      type: "OAUTH_TOKEN_SUCCESS",
      provider: oauthState.provider as any,
      token: tempToken,
    };

    const response = new Response(
      createOAuthPopupResponseHtml(successMessage),
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      },
    );

    return response;
  } catch (error) {
    console.error("Error in generic OAuth callback:", error);

    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 1000) + "...",
      });
    }

    const errorMessage: OAuthErrorMessage = {
      type: "OAUTH_ERROR",
      provider: "unknown" as any,
      error: {
        message: "Internal server error during OAuth authentication",
        code: "internal_error",
        details:
          error instanceof Error
            ? error.message
            : "Unknown internal error occurred",
      },
    };

    return new Response(createOAuthPopupResponseHtml(errorMessage), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}
