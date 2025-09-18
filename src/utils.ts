import { clerkClient } from "@clerk/express";
import { SpotifyApi, type AccessToken } from "@spotify/web-api-ts-sdk";
import { config } from "./config.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

export async function createSpotifyClient(authInfo: AuthInfo | undefined): Promise<SpotifyApi> {
  const userId = authInfo?.extra?.userId as string;

  if (!userId) {
    throw new Error("You are not authorized to use this tool - missing userId");
  }

  try {
    const { data } = await clerkClient.users.getUserOauthAccessToken(userId, "spotify");

    if (!data || data.length === 0) {
      throw new Error("No Spotify OAuth token found for user");
    }

    const spotifyAccessToken: AccessToken = {
      access_token: data[0].token,
      token_type: "Bearer",
      expires_in: data[0].expiresAt as number,
      refresh_token: data[0].tokenSecret as string,
    };

    const client = SpotifyApi.withAccessToken(config.SPOTIFY_CLIENT_ID, spotifyAccessToken);
    return client;
  } catch (error) {
    throw new Error(`Failed to create Spotify API client: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
