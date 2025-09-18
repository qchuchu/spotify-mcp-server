import "dotenv/config";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Request, type Response } from "express";

import { getServer } from "./server.js";
import { config } from "./config.js";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import { protectedResourceHandlerClerk } from "@clerk/mcp-tools/express";
import { mcpAuthMetadataRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";

const app = express();
app.use(cors({ exposedHeaders: ["WWW-Authenticate"] }));
app.use(clerkMiddleware());
app.use(express.json());

app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      transport.close();
    });

    const server = getServer();
    await server.connect(transport);

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

app.get("/mcp", async (req: Request, res: Response) => {
  console.log("Received GET MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    }),
  );
});

app.delete("/mcp", async (req: Request, res: Response) => {
  console.log("Received DELETE MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    }),
  );
});

app.get(
  "/.well-known/oauth-protected-resource/mcp",
  // Specify the scopes that your MCP server needs here
  protectedResourceHandlerClerk({}),
);

// This is still often needed for clients that implement the older mcp spec
//app.get("/.well-known/oauth-authorization-server", authServerMetadataHandlerClerk);

app.use(
  mcpAuthMetadataRouter({
    oauthMetadata: {
      issuer: "https://merry-goblin-20.clerk.accounts.dev",
      authorization_endpoint: "https://merry-goblin-20.clerk.accounts.dev/oauth/authorize",
      token_endpoint: "https://merry-goblin-20.clerk.accounts.dev/oauth/token",
      revocation_endpoint: "https://merry-goblin-20.clerk.accounts.dev/oauth/token/revoke",
      jwks_uri: "https://merry-goblin-20.clerk.accounts.dev/.well-known/jwks.json",
      registration_endpoint: "https://merry-goblin-20.clerk.accounts.dev/oauth/register",
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["client_secret_basic", "none", "client_secret_post"],
      scopes_supported: ["openid", "profile", "email", "public_metadata", "private_metadata"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
      claims_supported: ["sub", "iss", "aud", "exp", "iat", "email", "name"],
      service_documentation: "https://clerk.com/docs/oauth/scoped-access",
      ui_locales_supported: ["en"],
      op_tos_uri: "https://clerk.com/legal/standard-terms",
      code_challenge_methods_supported: ["S256"],
    },
    resourceServerUrl: new URL("http://localhost:3000"),
  }),
);

app.listen(config.MCP_HTTP_PORT, (error) => {
  if (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
  console.log(`MCP Streamable HTTP Server listening on port ${config.MCP_HTTP_PORT}`);
});

process.on("SIGINT", async () => {
  console.log("Server shutdown complete");
  process.exit(0);
});
