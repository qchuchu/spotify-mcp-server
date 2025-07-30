import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js";
import express, { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";

import { getServer } from "./server.js";
import { config } from "./config.js";

const app = express();
app.use(express.json());

type SessionId = string;
const transports = new Map<SessionId, StreamableHTTPServerTransport>();

app.post("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  try {
    let transport: StreamableHTTPServerTransport;
    if (sessionId && transports.has(sessionId)) {
      transport = transports.get(sessionId)!;
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        eventStore: new InMemoryEventStore(),
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          console.log(`Session initialized with ID: ${sessionId}`);
          transports.set(sessionId, transport);
        },
      });

      transport.onclose = () => {
        const deleted = transport.sessionId && transports.delete(transport.sessionId);
        if (deleted) {
          console.log(`Transport closed for session ${transport.sessionId}, removing from transports map`);
        }
      };

      const server = getServer();
      await server.connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      });

      return;
    }

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
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).send("Session not found");
    return;
  }

  await transport.handleRequest(req, res);
});

app.delete("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).send("Session not found");
    return;
  }

  try {
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("Error handling session termination:", error);
    if (!res.headersSent) {
      res.status(500).send("Error processing session termination");
    }
  }
});

app.listen(config.MCP_HTTP_PORT, (error) => {
  if (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
  console.log(`MCP Streamable HTTP Server listening on port ${config.MCP_HTTP_PORT}`);
});

process.on("SIGINT", async () => {
  transports.forEach(async (transport, sessionId) => {
    try {
      await transport.close();
      transports.delete(sessionId);
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  });
  console.log("Server shutdown complete");
  process.exit(0);
});
