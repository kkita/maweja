let ws: WebSocket | null = null;
const listeners: ((data: any) => void)[] = [];

export function connectWS(userId: number) {
  if (ws) ws.close();
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${protocol}//${window.location.host}/ws?userId=${userId}`);
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
