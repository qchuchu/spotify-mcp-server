import "dotenv/config";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Request, type Response } from "express";

import { getServer } from "./server.js";
import { config } from "./config.js";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import { authServerMetadataHandlerClerk, mcpAuthClerk, protectedResourceHandlerClerk } from "@clerk/mcp-tools/express";

const app = express();
app.use(cors({ exposedHeaders: ["WWW-Authenticate"] }));
app.use(clerkMiddleware());
app.use(express.json());

app.post("/mcp", mcpAuthClerk, async (req: Request, res: Response) => {
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
app.get("/.well-known/oauth-authorization-server", authServerMetadataHandlerClerk);

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
