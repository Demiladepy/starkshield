import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { InMemoryEventStore } from "./in-memory-event-store.js";
import { createStarkshieldMcpServer } from "./create-server.js";
import { ADVERTISED_TOOLS, getRecentToolCalls } from "./tool-log.js";

export async function startHttpServer(port: number): Promise<void> {
  const app = createMcpExpressApp();
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  app.get("/status", (_req, res) => {
    res.json({
      ok: true,
      service: "starkshield-mcp",
      tools: ADVERTISED_TOOLS,
      recentToolCalls: getRecentToolCalls(),
      sessions: Object.keys(transports).length,
    });
  });

  app.all("/mcp", async (req, res) => {
    try {
      const sessionHeader = req.headers["mcp-session-id"];
      const sessionId = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader;
      let transport: StreamableHTTPServerTransport | undefined;

      if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
      } else if (!sessionId && req.method === "POST" && isInitializeRequest(req.body)) {
        const eventStore = new InMemoryEventStore();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          eventStore,
          onsessioninitialized: (sid) => {
            transports[sid] = transport!;
          },
        });
        transport.onclose = () => {
          const sid = transport!.sessionId;
          if (sid && transports[sid]) delete transports[sid];
        };
        const server = createStarkshieldMcpServer();
        await server.connect(transport);
      } else {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: initialize POST first or pass valid mcp-session-id",
          },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  await new Promise<void>((resolve, reject) => {
    try {
      const httpServer = app.listen(port, () => resolve());
      httpServer.on("error", reject);
    } catch (e) {
      reject(e);
    }
  });
  // eslint-disable-next-line no-console
  console.error(`starkshield-mcp HTTP listening on :${port} (MCP: POST /mcp, status: GET /status)`);
}
