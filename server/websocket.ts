import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "./storage";
import { logger } from "./lib/logger";

export const wsClients = new Map<number, WebSocket>();

export function broadcast(data: any): void {
  const msg = JSON.stringify(data);
  wsClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

export function sendToUser(userId: number, data: any): void {
  const ws = wsClients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

export function setupWebSocket(httpServer: Server): void {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Periodic cleanup + observability of WebSocket clients (every 60s).
  // - Removes sockets whose readyState is no longer OPEN/CONNECTING
  //   (prevents wsClients map growing unbounded after silent network drops).
  // - Always logs the active connection count so we have steady visibility,
  //   not only when removals happen.
  setInterval(() => {
    let removed = 0;
    for (const [userId, ws] of wsClients.entries()) {
      if (ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CONNECTING) {
        wsClients.delete(userId);
        removed++;
      }
    }
    logger.info(
      `[ws] heartbeat: ${wsClients.size} active connection(s)` +
        (removed > 0 ? `, removed ${removed} dead socket(s)` : ""),
    );
  }, 60 * 1000);

  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(1008, "Token requis");
      return;
    }

    let resolvedUserId: number | null = null;
    try {
      const tokenUser = await storage.getUserByToken(token);
      if (tokenUser) resolvedUserId = tokenUser.id;
    } catch {}

    if (!resolvedUserId) {
      ws.close(1008, "Token invalide");
      return;
    }

    wsClients.set(resolvedUserId, ws);

    ws.on("close", () => {
      if (wsClients.get(resolvedUserId!) === ws) wsClients.delete(resolvedUserId!);
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "ping") ws.send(JSON.stringify({ type: "pong" }));
      } catch {}
    });
  });
}
