// server.js
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
let globalPizzas = 0; // wird für alle geteilt

wss.on("connection", (ws) => {
  console.log("🟢 New player connected");
  ws.send(JSON.stringify({ type: "update", globalPizzas }));

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    if (data.type === "bake") {
      globalPizzas += data.amount;
      broadcast({ type: "update", globalPizzas });
    }
  });

  ws.on("close", () => console.log("🔴 Player disconnected"));
});

function broadcast(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(data);
  });
}

console.log("✅ Pizza Server running on ws://localhost:8080");
