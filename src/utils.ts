import { SpotifyApi, type AccessToken } from "@spotify/web-api-ts-sdk";
import { config } from "./config.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

export async function createSpotifyClient(authInfo: AuthInfo | undefined): Promise<SpotifyApi> {
  if (!authInfo) {
    throw new Error("No auth info provided");
  }

  try {
    const spotifyAccessToken: AccessToken = {
      access_token: authInfo.token,
      token_type: "Bearer",
      expires_in: authInfo.expiresAt as number,
      refresh_token: "NONE",
    };
    const client = SpotifyApi.withAccessToken(config.SPOTIFY_CLIENT_ID, spotifyAccessToken);
    return client;
  } catch (error) {
    throw new Error(`Failed to create Spotify API client: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
