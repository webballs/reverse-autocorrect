const pizza = document.getElementById('pizza');
const personalCount = document.getElementById('personalCount');
const globalCount = document.getElementById('globalCount');
const indicator = document.querySelector('.indicator');
const target = document.querySelector('.target');
const result = document.getElementById('result');
const easyBtn = document.querySelector('.easy');
const midBtn = document.querySelector('.mid');
const hardBtn = document.querySelector('.hard');
const extremeBtn = document.querySelector('.extreme');
const gameContainer = document.querySelector('.game-container');

const socket = new WebSocket("ws://localhost:8080");

let barWidth = 400;
let indicatorWidth = 20;
let pos = barWidth / 2 - indicatorWidth / 2;
let dir = 1;
let speed = 5;
let reward = 1;
let targetWidth = 100;
let paused = false;

let personalPizzas = 0;
let globalPizzas = 0;

// 🧠 WebSocket Handling
socket.onopen = () => console.log("✅ Connected to Pizza Server");
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "update") {
    globalPizzas = data.globalPizzas;
    globalCount.textContent = `Global Pizzas: ${globalPizzas}`;
  }
};

// 🔓 Extreme Unlock Check
function updateExtremeUnlock() {
  const remaining = Math.max(100 - personalPizzas, 0);
  if (personalPizzas >= 100) {
    extremeBtn.classList.add("unlocked");
    extremeBtn.textContent = "Extreme 💀";
  } else {
    extremeBtn.classList.remove("unlocked");
    extremeBtn.textContent = `Extreme 🔒 (${remaining} left)`;
  }
}

// 🎯 Center target each mode
function centerTarget() {
  const left = (barWidth - targetWidth) / 2;
  target.style.left = left + "px";
  target.style.width = targetWidth + "px";
}

// 💨 Move function (runs forever)
function move() {
  if (!paused) {
    pos += dir * speed;
    if (pos <= 0 || pos >= barWidth - indicatorWidth) dir *= -1;
    indicator.style.left = pos + 'px';
  }
  requestAnimationFrame(move); // 🔁 never stops
}

// 💬 Floating text effect
function showFloatingText(text, color = "#fff") {
  const float = document.createElement("div");
  float.className = "floating-text";
  float.textContent = text;
  float.style.color = color;
  gameContainer.appendChild(float);
  float.style.top = (pizza.offsetTop - 30) + "px";
  setTimeout(() => float.remove(), 1000);
}

// 🍕 Check click accuracy
function check() {
  paused = true;
  const targetLeft = parseFloat(target.style.left);
  const targetRight = targetLeft + targetWidth;
  const indicatorCenter = pos + indicatorWidth / 2;

  if (indicatorCenter >= targetLeft && indicatorCenter <= targetRight) {
    result.textContent = "🔥 Perfect pizza!";
    indicator.style.background = "#4caf50";
    personalPizzas += reward;
    personalCount.textContent = `Your Pizzas: ${personalPizzas}`;
    showFloatingText(`+${reward} 🍕`, "#8ef58e");
    socket.send(JSON.stringify({ type: "bake", amount: reward }));
    updateExtremeUnlock();
  } else {
    result.textContent = indicatorCenter < targetLeft ? "🥶 Undercooked!" : "💀 Burnt!";
    indicator.style.background = "#f44336";
  }

  // ⏳ Resume automatically after 1s
  setTimeout(() => {
    indicator.style.background = "#fff";
    result.textContent = "";
    paused = false;
  }, 1000);
}

// 🍕 Click handler
pizza.addEventListener('click', () => {
  if (!paused) check();
});

// 🟢 Mode Buttons
easyBtn.addEventListener('click', () => {
  speed = 4;
  reward = 1;
  targetWidth = 100;
  centerTarget();
  result.textContent = "🟢 Easy mode!";
});

midBtn.addEventListener('click', () => {
  speed = 6;
  reward = 2;
  targetWidth = 70;
  centerTarget();
  result.textContent = "🟠 Mid mode!";
});

hardBtn.addEventListener('click', () => {
  speed = 9;
  reward = 4;
  targetWidth = 40;
  centerTarget();
  result.textContent = "🔴 Hard mode!";
});

extremeBtn.addEventListener('click', () => {
  if (!extremeBtn.classList.contains("unlocked")) return;
  speed = 13;
  reward = 8;
  targetWidth = 25;
  centerTarget();
  result.textContent = "💀 EXTREME MODE!!!";
  showFloatingText("⚡ Extreme unlocked! ⚡", "#ff00ff");
});

// Start setup
centerTarget();
updateExtremeUnlock();
move(); // 🌀 start animation loop
