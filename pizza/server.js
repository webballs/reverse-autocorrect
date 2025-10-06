import express from "express";
import http from "http";
import { Server } from "socket.io";
import Redis from "ioredis";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Redis setup (Render provides REDIS_HOST etc. in environment variables)
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  password: process.env.REDIS_PASSWORD || undefined
});

const GLOBAL_PIZZA_KEY = "global_pizza_count";

// Serve static frontend (pizza.html etc.)
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pizza.html"));
});

async function getGlobalCount() {
  const count = await redis.get(GLOBAL_PIZZA_KEY);
  return parseInt(count || "0", 10);
}

async function addPizzas(amount) {
  return await redis.incrby(GLOBAL_PIZZA_KEY, amount);
}

io.on("connection", async (socket) => {
  console.log("🟢 New player connected");

  // send initial count
  socket.emit("update", await getGlobalCount());

  socket.on("bake", async (amount) => {
    const newTotal = await addPizzas(amount);
    io.emit("update", newTotal);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Player disconnected");
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, async () => {
  console.log(`✅ Pizza Server running on port ${PORT}`);
  if (!(await redis.exists(GLOBAL_PIZZA_KEY))) {
    await redis.set(GLOBAL_PIZZA_KEY, 0);
  }
});
