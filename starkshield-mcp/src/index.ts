#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createStarkshieldMcpServer } from "./create-server.js";
import { getHttpPort } from "./config.js";
import { startHttpServer } from "./http.js";

const port = getHttpPort();
if (port) {
  await startHttpServer(port);
} else {
  const server = createStarkshieldMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
