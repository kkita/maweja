const WS_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "";

let ws: WebSocket | null = null;
const listeners: ((data: any) => void)[] = [];

export function connectWS(userId: number) {
  if (ws) ws.close();

  let wsUrl: string;
  if (WS_BASE) {
    wsUrl = WS_BASE.replace(/^https/, "wss").replace(/^http/, "ws") + `/ws?userId=${userId}`;
  } else {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;
  }

  ws = new WebSocket(wsUrl);
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      listeners.forEach((fn) => fn(data));
    } catch {}
  };
  ws.onclose = () => {
    setTimeout(() => connectWS(userId), 3000);
  };
}

export function onWSMessage(fn: (data: any) => void) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}
