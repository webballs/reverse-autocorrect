// server.js
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
let globalPizzas = 0;

wss.on("connection", (ws) => {
  console.log("🟢 New player connected");

  // Sende aktuellen Stand direkt an neuen Client
  ws.send(JSON.stringify({ type: "update", globalPizzas }));

  // Wenn Client eine Nachricht sendet
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "bake") {
      // Füge die gebackenen Pizzen hinzu
      const amount = data.amount || 1;
      globalPizzas += amount;

      // Schicke aktualisierten Stand an alle
      broadcast({ type: "update", globalPizzas });
    }
  });

  ws.on("close", () => {
    console.log("🔴 Player disconnected");
  });
});

// Broadcast an alle verbundenen Clients
function broadcast(message) {
  const json = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(json);
    }
  });
}

console.log("✅ Pizza Server running at ws://localhost:8080");
