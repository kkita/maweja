let ws = null;
const listeners = [];
export function connectWS(userId) {
    if (ws)
        ws.close();
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${protocol}//${window.location.host}/ws?userId=${userId}`);
    ws.onmessage = (e) => {
        try {
            const data = JSON.parse(e.data);
            listeners.forEach((fn) => fn(data));
        }
        catch { }
    };
    ws.onclose = () => {
        setTimeout(() => connectWS(userId), 3000);
    };
}
export function onWSMessage(fn) {
    listeners.push(fn);
    return () => {
        const idx = listeners.indexOf(fn);
        if (idx >= 0)
            listeners.splice(idx, 1);
    };
}
//# sourceMappingURL=websocket.js.map