import { randomInt, randomUUID } from "node:crypto";
import type { IncomingMessage, Server } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";
import { logger } from "./logger";

type PeerRole = "host" | "guest";

interface RoomPeer {
  id: string;
  role: PeerRole;
  socket: WebSocket;
}

interface Room {
  code: string;
  host: RoomPeer;
  peers: Map<string, RoomPeer>;
  expiresAt: number;
}

const rooms = new Map<string, Room>();
const ROOM_TTL_MS = 60 * 60 * 1000;
const MAX_GUESTS = 8;
const MAX_ACTIVE_ROOMS = 256;
const MAX_SIGNAL_BYTES = 32 * 1024;

function sendJson(socket: WebSocket, value: unknown): void {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(value));
}

function rejectUpgrade(socket: Duplex, status: number, text: string): void {
  socket.write(`HTTP/1.1 ${status} ${text}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

function createRoom(hostSocket: WebSocket): Room {
  let code = "";
  do {
    code = String(randomInt(100_000, 1_000_000));
  } while (rooms.has(code));

  const host: RoomPeer = { id: randomUUID(), role: "host", socket: hostSocket };
  const room: Room = {
    code,
    host,
    peers: new Map([[host.id, host]]),
    expiresAt: Date.now() + ROOM_TTL_MS,
  };
  rooms.set(code, room);
  sendJson(hostSocket, { type: "room-created", code, peerId: host.id });
  logger.info({ activeRooms: rooms.size }, "Multiplayer room created");
  return room;
}

function closeRoom(room: Room, reason: string): void {
  if (rooms.get(room.code) !== room) return;
  rooms.delete(room.code);
  for (const peer of room.peers.values()) {
    if (peer.role !== "host") sendJson(peer.socket, { type: "room-closed", reason });
    if (peer.socket.readyState === WebSocket.OPEN) peer.socket.close(1000, reason);
  }
  logger.info({ activeRooms: rooms.size }, "Multiplayer room closed");
}

function attachPeer(socket: WebSocket, room: Room, peer: RoomPeer): void {
  room.peers.set(peer.id, peer);

  socket.on("message", (data, isBinary) => {
    const payload = Array.isArray(data)
      ? Buffer.concat(data)
      : Buffer.isBuffer(data)
        ? data
        : Buffer.from(data);
    if (isBinary || payload.byteLength > MAX_SIGNAL_BYTES) {
      socket.close(1009, "Signaling message too large");
      return;
    }

    let message: unknown;
    try {
      message = JSON.parse(payload.toString());
    } catch {
      socket.close(1003, "Invalid signaling message");
      return;
    }
    if (!message || typeof message !== "object") return;

    const packet = message as Record<string, unknown>;
    room.expiresAt = Date.now() + ROOM_TTL_MS;

    if (packet.type === "heartbeat") {
      sendJson(socket, { type: "heartbeat" });
      return;
    }

    if (packet.type !== "signal" || typeof packet.targetId !== "string" ||
        !packet.signal || typeof packet.signal !== "object") {
      return;
    }

    const target = room.peers.get(packet.targetId);
    if (!target || target.role === peer.role || target.socket.readyState !== WebSocket.OPEN) return;
    sendJson(target.socket, {
      type: "signal",
      fromId: peer.id,
      signal: packet.signal,
    });
  });

  socket.on("close", () => {
    if (peer.role === "host") {
      closeRoom(room, "Host left");
      return;
    }

    room.peers.delete(peer.id);
    room.expiresAt = Date.now() + ROOM_TTL_MS;
    sendJson(room.host.socket, { type: "peer-left", peerId: peer.id });
  });

  socket.on("error", (error) => {
    logger.debug({ err: error, role: peer.role }, "Multiplayer signaling socket error");
  });
}

export function attachMultiplayerSignaling(server: Server): WebSocketServer {
  const webSocketServer = new WebSocketServer({
    noServer: true,
    maxPayload: MAX_SIGNAL_BYTES,
    perMessageDeflate: false,
  });

  server.on("upgrade", (request: IncomingMessage, socket, head) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname !== "/api/multiplayer") {
      rejectUpgrade(socket, 404, "Not Found");
      return;
    }

    const role = url.searchParams.get("role");
    const code = url.searchParams.get("code") ?? "";
    if (role !== "host" && role !== "guest") {
      rejectUpgrade(socket, 400, "Bad Request");
      return;
    }
    if (role === "guest" && !/^\d{6}$/.test(code)) {
      rejectUpgrade(socket, 400, "Invalid Room Code");
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      if (role === "host") {
        if (rooms.size >= MAX_ACTIVE_ROOMS) {
          sendJson(webSocket, { type: "error", message: "Derzeit sind zu viele Web-Welten aktiv. Bitte später erneut versuchen." });
          webSocket.close(1013, "Too many rooms");
          return;
        }
        const room = createRoom(webSocket);
        attachPeer(webSocket, room, room.host);
        return;
      }

      const room = rooms.get(code);
      if (!room || room.expiresAt <= Date.now() || room.host.socket.readyState !== WebSocket.OPEN) {
        sendJson(webSocket, { type: "error", message: "Diese Web-Welt wurde nicht gefunden oder ist nicht mehr verfügbar." });
        webSocket.close(1008, "Room not found");
        return;
      }
      if (room.peers.size - 1 >= MAX_GUESTS) {
        sendJson(webSocket, { type: "error", message: "Diese Web-Welt ist bereits voll." });
        webSocket.close(1008, "Room full");
        return;
      }

      const guest: RoomPeer = { id: randomUUID(), role: "guest", socket: webSocket };
      room.expiresAt = Date.now() + ROOM_TTL_MS;
      attachPeer(webSocket, room, guest);
      sendJson(webSocket, { type: "joined", peerId: guest.id, hostId: room.host.id });
      sendJson(room.host.socket, { type: "peer-joined", peerId: guest.id });
    });
  });

  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const room of rooms.values()) {
      if (room.expiresAt <= now) closeRoom(room, "Room expired");
    }
  }, 60_000);
  cleanupTimer.unref();

  webSocketServer.on("close", () => clearInterval(cleanupTimer));
  return webSocketServer;
}
