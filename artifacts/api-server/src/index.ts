import app from "./app";
import { logger } from "./lib/logger";
import { createServer } from "node:http";
import { attachMultiplayerSignaling } from "./lib/multiplayerSignaling";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);
const signalingServer = attachMultiplayerSignaling(server);

server.listen(port, () => {
  logger.info({ port }, "Server listening");
});

const shutdown = () => {
  for (const client of signalingServer.clients) {
    client.close(1001, "Server shutting down");
  }
  signalingServer.close();
  server.close(() => process.exit(0));
};

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
