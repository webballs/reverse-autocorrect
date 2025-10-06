// server.js
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: process.env.PORT || 8080 });
let totalPizzas = 0;

wss.on("connection", (ws) => {
  console.log("🟢 New player connected!");
  ws.send(JSON.stringify({ type: "update", totalPizzas }));

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    if (data.type === "click") {
      totalPizzas += data.amount;
      broadcast({ type: "update", totalPizzas });
    }
  });

  ws.on("close", () => {
    console.log("🔴 Player disconnected");
  });
});

function broadcast(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(data);
  });
}

console.log("✅ Pizza server running!");
