import http from 'http';
import { spawn } from 'child_process';

const PROXY_PORT = 5000;
const METRO_PORT = 8081;

const expo = spawn('npx', ['expo', 'start', '--web', '--port', String(METRO_PORT)], {
  env: { ...process.env, EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0' },
  stdio: ['pipe', 'pipe', 'pipe'],
});

expo.stdout.on('data', (d) => process.stdout.write(d));
expo.stderr.on('data', (d) => process.stderr.write(d));
expo.on('close', (code) => {
  console.log(`Expo exited with code ${code}`);
  process.exit(code);
});

function waitForMetro() {
  return new Promise((resolve) => {
    const check = () => {
      http.get(`http://localhost:${METRO_PORT}`, (res) => {
        resolve();
      }).on('error', () => {
        setTimeout(check, 1000);
      });
    };
    check();
  });
}

waitForMetro().then(() => {
  console.log(`\nMetro ready on port ${METRO_PORT}, starting proxy on 0.0.0.0:${PROXY_PORT}...`);

  const proxy = http.createServer((req, res) => {
    const options = {
      hostname: 'localhost',
      port: METRO_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502);
      res.end('Bad Gateway');
    });

    req.pipe(proxyReq, { end: true });
  });

  proxy.on('upgrade', (req, socket, head) => {
    const options = {
      hostname: 'localhost',
      port: METRO_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxyReq = http.request(options);

    proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
      socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
        Object.entries(proxyRes.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
        '\r\n\r\n'
      );
      if (proxyHead.length > 0) socket.write(proxyHead);
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });

    proxyReq.on('error', () => {
      socket.end();
    });

    proxyReq.end();
  });

  proxy.listen(PROXY_PORT, '0.0.0.0', () => {
    console.log(`Proxy listening on 0.0.0.0:${PROXY_PORT} -> localhost:${METRO_PORT}`);
  });
});

process.on('SIGTERM', () => {
  expo.kill('SIGTERM');
  process.exit(0);
});
process.on('SIGINT', () => {
  expo.kill('SIGTERM');
  process.exit(0);
});
