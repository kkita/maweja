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

/**
 * Envoie un message WebSocket à un utilisateur spécifique.
 *
 * Renvoie `true` si le message a effectivement été poussé sur le socket
 * (socket connecté & ouvert), `false` sinon (utilisateur hors-ligne, socket
 * fermé, etc.). Le caller peut alors logger / décider d'un fallback (push,
 * email, etc.).
 *
 * Loggue toujours une ligne au format :
 *   [ws] sendToUser userId=<id> type=<event-type> delivered=<true|false>
 */
export function sendToUser(userId: number, data: any): boolean {
  const ws = wsClients.get(userId);
  const evType = (data && typeof data === "object" && (data as any).type) || "unknown";
  let delivered = false;
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(data));
      delivered = true;
    } catch (e) {
      logger.warn?.(`[ws] sendToUser send failed userId=${userId} type=${evType}`, e);
      delivered = false;
    }
  }
  logger.info?.(`[ws] sendToUser userId=${userId} type=${evType} delivered=${delivered}`);
  return delivered;
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
