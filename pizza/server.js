// server.js
// Node.js server: HTTP (for /sync) + WebSocket server for real-time global counter
import http from 'http';
import { WebSocketServer } from 'ws';
import { parse } from 'url';

// current global total
let totalPizzas = 0;

// create HTTP server to accept sendBeacon POSTs to /sync
const server = http.createServer((req, res) => {
  const { pathname } = parse(req.url || '', true);
  if (req.method === 'POST' && pathname === '/sync') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        if (typeof data.delta === 'number') {
          totalPizzas += data.delta;
          broadcast({ type: 'update', totalPizzas });
          console.log('📥 /sync received delta', data.delta, '-> total', totalPizzas);
        }
      } catch (e) {
        // ignore
      }
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ ok:true, totalPizzas }));
    });
    return;
  }

  // basic health endpoint
  if (req.method === 'GET' && pathname === '/health') {
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ ok:true, totalPizzas }));
    return;
  }

  // default 404
  res.writeHead(404);
  res.end();
});

// attach WebSocketServer to same HTTP server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('🟢 New client connected');
  // send current total
  ws.send(JSON.stringify({ type: 'update', totalPizzas }));

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'delta' && typeof data.amount === 'number') {
        totalPizzas += data.amount;
        broadcast({ type: 'update', totalPizzas });
        console.log('🔁 delta', data.amount, '-> total', totalPizzas);
      } else if (data.type === 'click') {
        totalPizzas += 1;
        broadcast({ type: 'update', totalPizzas });
      }
    } catch (e) {
      // ignore malformed
    }
  });

  ws.on('close', () => {
    console.log('🔴 Client disconnected');
  });
});

// broadcast helper
function broadcast(message){
  const data = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(data);
  });
}

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`✅ Pizza server running on http://localhost:${PORT} and ws://localhost:${PORT}`);
});
