import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { type MaxInt } from "@spotify/web-api-ts-sdk";
import { createSpotifyClient } from "./utils.js";

const queryDescription = `
Your search query.

You can narrow down your search using field filters. The available filters are album, artist, track, year, upc, tag:hipster, tag:new, isrc, and genre. Each field filter only applies to certain result types.

The artist and year filters can be used while searching albums, artists and tracks. You can filter on a single year or a range (e.g. 1955-1960).
The album filter can be used while searching albums and tracks.
The genre filter can be used while searching artists and tracks.
The isrc and track filters can be used while searching tracks.
The upc, tag:new and tag:hipster filters can only be used while searching albums. The tag:new filter will return albums released in the past two weeks and tag:hipster can be used to return only albums with the lowest 10% popularity.

Example: q=remaster%2520track%3ADoxy%2520artist%3AMiles%2520Davis

`;

export const getServer = (): McpServer => {
  const server = new McpServer(
    {
      name: "spotify-mcp-server",
      version: "0.0.1",
    },
    { capabilities: {} },
  );

  server.tool(
    "get-my-playlists",
    "Get my playlists",
    {
      limit: z.number().min(1).max(50).optional().default(20).describe("The number of playlists to get"),
      offset: z.number().min(0).max(100_000).optional().default(0).describe("The offset of the playlists to get"),
    },
    async ({ limit, offset }, { authInfo }): Promise<CallToolResult> => {
      try {
        const client = await createSpotifyClient(authInfo);
        const playlists = await client.currentUser.playlists.playlists(limit as MaxInt<50>, offset);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(playlists.items, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : "Unknown error occurred",
            },
          ],
        };
      }
    },
  );

  server.tool(
    "search",
    "Search Resources in Spotify",
    {
      query: z.string().describe(queryDescription),
      type: z
        .array(z.enum(["album", "artist", "track", "playlist", "show", "episode", "audiobook"]))
        .min(1)
        .describe("The types of resources to search for"),
    },
    async ({ query, type }, { authInfo }): Promise<CallToolResult> => {
      const client = await createSpotifyClient(authInfo);
      const results = await client.search(query, type);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "get-user-saved-tracks",
    "Get user's saved tracks to understand their music taste",
    {
      limit: z.number().min(1).max(50).optional().default(20).describe("The number of saved tracks to get"),
      offset: z.number().min(0).max(100_000).optional().default(0).describe("The offset of the saved tracks to get"),
    },
    async ({ limit, offset }, { authInfo }): Promise<CallToolResult> => {
      try {
        const client = await createSpotifyClient(authInfo);
        const savedTracks = await client.currentUser.tracks.savedTracks(limit as MaxInt<50>, offset);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(savedTracks.items, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : "Unknown error occurred",
            },
          ],
        };
      }
    },
  );

  return server;
};
