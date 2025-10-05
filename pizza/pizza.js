/* pizza.js
   Integrates:
   - WebSocket connection to ws://localhost:8080
   - personal + global counters
   - bar minigame (unchanged behavior)
   - Blackjack with emojis (bet + / - , Hit/Stand)
   - onbeforeunload sends remaining personal pizzas to server
*/

const WS_URL = "ws://localhost:8080";

// --- DOM refs
const personalCountEl = document.getElementById('personalCount');
const globalCountEl = document.getElementById('globalCount');
const pizzaImg = document.getElementById('pizza');
const indicatorEl = document.querySelector('.indicator');
const targetEl = document.querySelector('.target');
const resultEl = document.getElementById('result');

const easyBtn = document.querySelector('.easy');
const midBtn = document.querySelector('.mid');
const hardBtn = document.querySelector('.hard');
const extremeBtn = document.querySelector('.extreme');

const openBJBtn = document.querySelector('.open-blackjack');
const bjBox = document.getElementById('blackjackBox');

// Blackjack UI
const betInput = document.getElementById('betInput');
const betPlus = document.getElementById('betPlus');
const betMinus = document.getElementById('betMinus');
const playBtn = document.getElementById('playBtn');
const dealerCardsEl = document.getElementById('dealerCards');
const playerCardsEl = document.getElementById('playerCards');
const dealerValueEl = document.getElementById('dealerValue');
const playerValueEl = document.getElementById('playerValue');
const hitBtn = document.getElementById('hitBtn');
const standBtn = document.getElementById('standBtn');
const quitBtn = document.getElementById('quitRound');
const bjStatus = document.getElementById('bjStatus');

// --- Game constants / state
const BAR_WIDTH = 400;
const IND_WIDTH = 20;
let pos = (BAR_WIDTH - IND_WIDTH) / 2; // center correctly
let dir = 1;
let running = true;
let paused = false;
let speed = 5;
let reward = 1;
let targetWidth = 100;

let personalPizzas = 5; // give player some to start
let globalPizzas = 0;   // will be set by server

// blackjack state
let deck = [];
let playerHand = [];
let dealerHand = [];
let inRound = false;
let currentBet = 1;

// --- WebSocket
let socket;
function connectWS(){
  socket = new WebSocket(WS_URL);
  socket.addEventListener('open', ()=> console.log("WS connected"));
  socket.addEventListener('message', (ev)=>{
    try {
      const data = JSON.parse(ev.data);
      if(data.type === 'update' && typeof data.totalPizzas === 'number'){
        globalPizzas = data.totalPizzas;
        updateCounters();
      }
    } catch(e){}
  });
  socket.addEventListener('close', ()=> {
    console.log("WS closed, retry in 1s");
    setTimeout(connectWS,1000);
  });
}
connectWS();

// send delta to server to change global counter
function sendDeltaToServer(amount){
  if(!socket || socket.readyState !== 1) return;
  socket.send(JSON.stringify({ type: 'delta', amount }));
}

// --- UI helpers
function updateCounters(){
  personalCountEl.textContent = `Your Pizzas: ${personalPizzas}`;
  globalCountEl.textContent = `Global Pizzas: ${globalPizzas}`;
}

// --- bar / target
const barWidth = BAR_WIDTH;
function centerTarget(){
  const left = (barWidth - targetWidth) / 2;
  targetEl.style.left = left + 'px';
  targetEl.style.width = targetWidth + 'px';
}
centerTarget();

function setIndicatorPos(x){
  indicatorEl.style.left = x + 'px';
}
setIndicatorPos(pos);

function move(){
  if(!running || paused) return;
  pos += dir * speed;
  if(pos <= 0 || pos >= barWidth - IND_WIDTH) dir *= -1;
  setIndicatorPos(pos);
  requestAnimationFrame(move);
}
move();

function showFloatingText(txt, color='#fff'){
  const el = document.createElement('div');
  el.className = 'floating-text';
  el.style.color = color;
  el.textContent = txt;
  document.querySelector('.game-container').appendChild(el);
  setTimeout(()=>el.remove(),1000);
}

function checkBar(){
  paused = true;
  const targetLeft = parseFloat(targetEl.style.left);
  const targetRight = targetLeft + targetWidth;
  const indicatorCenter = pos + IND_WIDTH/2;

  if(indicatorCenter >= targetLeft && indicatorCenter <= targetRight){
    resultEl.textContent = '🔥 Perfect pizza!';
    indicatorEl.style.background = '#4caf50';
    personalPizzas += reward;
    sendDeltaToServer(reward);   // ONLY update server
    updateCounters();
    showFloatingText('+'+reward+' 🍕','#8ef58e');
    updateExtremeUnlock();
  } else {
    resultEl.textContent = indicatorCenter < targetLeft ? '🥶 Undercooked!' : '💀 Burnt!';
    indicatorEl.style.background = '#f44336';
  }

  setTimeout(()=>{
    indicatorEl.style.background = '#fff';
    resultEl.textContent = '';
    paused = false;
    move();
  },1000);
}

pizzaImg.addEventListener('click', ()=>{ if(!paused) checkBar(); });

// modes
easyBtn.addEventListener('click', ()=>{
  speed = 4; reward = 1; targetWidth = 100; centerTarget();
  resultEl.textContent = '🟢 Easy mode!';
  setTimeout(()=> resultEl.textContent = '',700);
});
midBtn.addEventListener('click', ()=>{
  speed = 6; reward = 2; targetWidth = 70; centerTarget();
  resultEl.textContent = '🟠 Mid mode!';
  setTimeout(()=> resultEl.textContent = '',700);
});
hardBtn.addEventListener('click', ()=>{
  speed = 9; reward = 4; targetWidth = 40; centerTarget();
  resultEl.textContent = '🔴 Hard mode!';
  setTimeout(()=> resultEl.textContent = '',700);
});

// extreme unlock
function updateExtremeUnlock(){
  const remaining = Math.max(100 - personalPizzas, 0);
  if(personalPizzas >= 100){
    extremeBtn.classList.add('unlocked');
    extremeBtn.textContent = 'Extreme 💀';
  } else {
    extremeBtn.classList.remove('unlocked');
    extremeBtn.textContent = `Extreme 🔒 (${remaining} left)`;
  }
}
updateExtremeUnlock();
extremeBtn.addEventListener('click', ()=>{
  if(!extremeBtn.classList.contains('unlocked')) return;
  speed = 13; reward = 8; targetWidth = 25; centerTarget();
  resultEl.textContent = '💀 EXTREME MODE!!!';
  showFloatingText('⚡ Extreme unlocked! ⚡','#ff00ff');
  setTimeout(()=> resultEl.textContent = '',1000);
});

// --- Blackjack open/close
openBJBtn.addEventListener('click', ()=>{
  const isOpen = bjBox.classList.toggle('open');
  bjBox.setAttribute('aria-hidden', String(!isOpen));
  if(isOpen){
    betInput.value = Math.max(1, Math.floor(betInput.value)||1);
  }
});

// betting controls
function clampBetInput(){
  let v = Math.floor(Number(betInput.value) || 0);
  if(v < 1) v = 1;
  betInput.value = v;
  currentBet = v;
}
betPlus.addEventListener('click', ()=>{ betInput.value = Math.max(1, parseInt(betInput.value||'1')+1); clampBetInput(); });
betMinus.addEventListener('click', ()=>{ betInput.value = Math.max(1, parseInt(betInput.value||'1')-1); clampBetInput(); });
betInput.addEventListener('input', clampBetInput);

// deck & blackjack helpers
const SUITS = ['♠️','♥️','♦️','♣️'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function buildDeck(){ const d = []; for(const s of SUITS){ for(const r of RANKS){ d.push({suit:s, rank:r}); } } return d; }
function shuffle(d){ for(let i=d.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [d[i], d[j]] = [d[j], d[i]]; } }
function handValue(hand){ let total=0, aces=0; for(const c of hand){ if(c.rank==='A'){ aces++; total+=11; } else if(['J','Q','K'].includes(c.rank)) total+=10; else total+=parseInt(c.rank,10); } while(total>21 && aces>0){ total-=10; aces--; } return total; }
function renderCards(el, hand, hideFirst=false){ el.innerHTML=''; for(let i=0;i<hand.length;i++){ const c=hand[i]; const cardDiv=document.createElement('div'); cardDiv.className='card'; if(hideFirst && i===0){ cardDiv.innerHTML='<div style="font-size:18px;opacity:0.25">🂠</div><div class="val" style="opacity:0.35">?</div>'; } else { cardDiv.innerHTML=`<div class="suit">${c.suit}</div><div class="val">${c.rank}</div>`; } el.appendChild(cardDiv); } }
function resetRoundUI(){ playerCardsEl.innerHTML=''; dealerCardsEl.innerHTML=''; playerValueEl.textContent=''; dealerValueEl.textContent=''; bjStatus.textContent=''; hitBtn.disabled=true; standBtn.disabled=true; quitBtn.disabled=true; }

// --- Round logic
function canAfford(bet){ return personalPizzas >= bet && bet >= 1; }

function startRound(){
  currentBet = Math.max(1, Math.floor(Number(betInput.value) || 1));
  if(!canAfford(currentBet)){ bjStatus.textContent='Not enough personal pizzas to place that bet.'; return; }

  personalPizzas -= currentBet;
  updateCounters();
  sendDeltaToServer(-currentBet); // global only via server

  deck = buildDeck(); shuffle(deck);
  playerHand=[]; dealerHand=[]; inRound=true;
  bjStatus.textContent=''; resetRoundUI();

  playerHand.push(deck.pop());
  dealerHand.push(deck.pop());
  playerHand.push(deck.pop());
  dealerHand.push(deck.pop());

  renderCards(playerCardsEl, playerHand);
  renderCards(dealerCardsEl, dealerHand, true);

  const pVal = handValue(playerHand);
  const pBlack = (pVal===21);
  const dVal = handValue(dealerHand);
  const dBlack = (dVal===21);

  hitBtn.disabled=false; standBtn.disabled=false; quitBtn.disabled=false;

  if(pBlack || dBlack){
    renderCards(dealerCardsEl,dealerHand);
    dealerValueEl.textContent=`Value: ${dVal}`;
    if(pBlack && !dBlack){
      const payout=Math.floor(currentBet*2.5);
      personalPizzas+=payout;
      sendDeltaToServer(payout);
      bjStatus.textContent='Blackjack! You win!';
      showFloatingText(`+${payout} 🍕`, '#ffd166');
    } else if(!pBlack && dBlack){
      bjStatus.textContent='Dealer has Blackjack. You lose.';
    } else {
      bjStatus.textContent='Push (both Blackjack). Bet returned.';
      personalPizzas+=currentBet;
      sendDeltaToServer(currentBet);
    }
    updateCounters(); inRound=false;
    hitBtn.disabled=true; standBtn.disabled=true; quitBtn.disabled=true;
    updateExtremeUnlock();
    return;
  }

  dealerValueEl.textContent='Value: ?';
}

// player actions
hitBtn.addEventListener('click', ()=>{
  if(!inRound) return;
  playerHand.push(deck.pop());
  renderCards(playerCardsEl, playerHand);
  const pv=handValue(playerHand);
  playerValueEl.textContent=`Value: ${pv}`;
  if(pv>21){
    inRound=false;
    bjStatus.textContent='Bust! You lose.';
    hitBtn.disabled=true; standBtn.disabled=true; quitBtn.disabled=true;
    updateExtremeUnlock();
  }
});

standBtn.addEventListener('click', ()=>{
  if(!inRound) return;
  renderCards(dealerCardsEl,dealerHand);
  let dv=handValue(dealerHand);
  dealerValueEl.textContent=`Value: ${dv}`;
  while(dv<17){
    dealerHand.push(deck.pop());
    renderCards(dealerCardsEl,dealerHand);
    dv=handValue(dealerHand);
    dealerValueEl.textContent=`Value: ${dv}`;
  }
  const pv=handValue(playerHand);

  if(dv>21){
    const payout=currentBet*2;
    personalPizzas+=payout;
    sendDeltaToServer(payout);
    bjStatus.textContent='Dealer busts! You win!';
    showFloatingText(`+${payout} 🍕`, '#8ef58e');
  } else if(dv===pv){
    personalPizzas+=currentBet;
    sendDeltaToServer(currentBet);
    bjStatus.textContent='Push. Bet returned.';
  } else if(pv>dv){
    const payout=currentBet*2;
    personalPizzas+=payout;
    sendDeltaToServer(payout);
    bjStatus.textContent='You win!';
    showFloatingText(`+${payout} 🍕`, '#8ef58e');
  } else {
    bjStatus.textContent='You lose.';
  }

  updateCounters();
  inRound=false;
  hitBtn.disabled=true; standBtn.disabled=true; quitBtn.disabled=true;
  updateExtremeUnlock();
});

quitBtn.addEventListener('click', ()=>{
  if(!inRound) return;
  inRound=false;
  personalPizzas+=currentBet;
  sendDeltaToServer(currentBet);
  bjStatus.textContent='Round aborted. Bet returned.';
  updateCounters();
  renderCards(dealerCardsEl,dealerHand);
  renderCards(playerCardsEl,playerHand);
  hitBtn.disabled=true; standBtn.disabled=true; quitBtn.disabled=true;
  updateExtremeUnlock();
});

// play button
playBtn.addEventListener('click', ()=>{
  if(inRound){ bjStatus.textContent='Round already running.'; return; }
  const bet=Math.max(1, Math.floor(Number(betInput.value) || 1));
  if(personalPizzas<1){ bjStatus.textContent='You need at least 1 pizza to play.'; return; }
  if(!canAfford(bet)){ bjStatus.textContent='Not enough personal pizzas to place that bet.'; return; }
  startRound();
});

setInterval(()=>{ playBtn.disabled=!(personalPizzas>=1 && !inRound); },200);
betInput.addEventListener('blur', clampBetInput);

function trySendPersonalOnExit(){
  if(personalPizzas<=0) return;
  const payload=JSON.stringify({ delta: personalPizzas });
  try { if(navigator.sendBeacon){ const blob=new Blob([payload], {type:'application/json'}); navigator.sendBeacon('http://localhost:8080/sync', blob); } } catch(e){}
  try { if(socket && socket.readyState===1){ socket.send(JSON.stringify({ type:'delta', amount: personalPizzas })); } } catch(e){}
  personalPizzas=0; updateCounters();
}
window.addEventListener('beforeunload', trySendPersonalOnExit);

// init UI
updateCounters();
centerTarget();
setIndicatorPos(pos);
move();
updateExtremeUnlock();
