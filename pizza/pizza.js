const socket = io(); // works both locally & on Render

const pizza = document.getElementById("pizza");
const globalCount = document.getElementById("globalCount");
const personalCountEl = document.getElementById("personalCount");
const slider = document.getElementById("slider");
const targetZone = document.getElementById("target-zone");
const extremeBtn = document.getElementById("extremeBtn");

let personalCount = 0;
let totalPizzas = 0;
let speed = 2;
let mode = "easy";
let direction = 1;
let sliderPos = 50;
let gameActive = true;

const modeSettings = {
  easy: { winRange: 20, speed: 2, reward: 1 },
  mid: { winRange: 10, speed: 3, reward: 2 },
  hard: { winRange: 5, speed: 4, reward: 3 },
  extreme: { winRange: 3, speed: 5, reward: 5 }
};

// Slider animation
function animateSlider() {
  if (!gameActive) return;
  sliderPos += direction * speed;
  if (sliderPos <= 0 || sliderPos >= 100) direction *= -1;
  slider.style.left = `${sliderPos}%`;
  requestAnimationFrame(animateSlider);
}

// Mode selection
document.querySelectorAll(".mode").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.id === "extremeBtn" && totalPizzas < 100) return;
    mode = btn.dataset.mode;
    const { winRange } = modeSettings[mode];
    targetZone.style.width = `${winRange}%`;
    speed = modeSettings[mode].speed;
  });
});

animateSlider();

pizza.addEventListener("click", () => {
  const center = parseFloat(targetZone.style.left || "40") + parseFloat(targetZone.style.width) / 2;
  const hit = Math.abs(sliderPos - center) <= modeSettings[mode].winRange / 2;
  if (hit) {
    const reward = modeSettings[mode].reward;
    personalCount += reward;
    totalPizzas += reward;
    personalCountEl.textContent = `Your Pizzas: ${personalCount}`;
    socket.emit("bake", reward);
    targetZone.style.background = "#4caf50";
  } else {
    targetZone.style.background = "#f44336";
  }
  gameActive = false;
  setTimeout(() => {
    targetZone.style.background = "rgba(255,255,255,0.3)";
    gameActive = true;
    animateSlider();
  }, 1000);
});

// WebSocket updates
socket.on("update", (count) => {
  totalPizzas = count;
  globalCount.textContent = `Global Pizzas: ${count}`;
  if (count >= 100) {
    extremeBtn.textContent = "Extreme 🔥";
    extremeBtn.classList.remove("locked");
  } else {
    extremeBtn.textContent = `Extreme 🔒 (${100 - count} more)`;
  }
});
