const WS_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "";

let ws: WebSocket | null = null;
let wsUserId: number | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
const listeners: ((data: any) => void)[] = [];

function clearTimers() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

function startHeartbeat() {
  clearInterval(heartbeatTimer!);
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ type: "ping" })); } catch {}
    }
  }, 25000);
}

export function connectWS(userId: number) {
  // Prevent duplicate connections for the same user
  if (ws && ws.readyState === WebSocket.OPEN && wsUserId === userId) return;

  wsUserId = userId;
  clearTimers();
  if (ws) {
    ws.onclose = null; // Prevent old close handler from firing
    ws.close();
  }

  let wsUrl: string;
  if (WS_BASE) {
    wsUrl = WS_BASE.replace(/^https/, "wss").replace(/^http/, "ws") + `/ws?userId=${userId}`;
  } else {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;
  }

  const socket = new WebSocket(wsUrl);
  ws = socket;

  socket.onopen = () => {
    startHeartbeat();
  };

  socket.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.type === "pong") return;
      listeners.forEach((fn) => fn(data));
    } catch {}
  };

  socket.onclose = () => {
    if (ws !== socket) return; // Another connection already replaced this one
    clearTimers();
    reconnectTimer = setTimeout(() => {
      if (wsUserId !== null) connectWS(wsUserId);
    }, 3000);
  };

  socket.onerror = () => {
    // Let onclose handle reconnect
  };
}

export function disconnectWS() {
  wsUserId = null;
  clearTimers();
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
}

export function onWSMessage(fn: (data: any) => void) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}
