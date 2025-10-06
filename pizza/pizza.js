/* ---------- Core UI references ---------- */
const personalCountEl = document.getElementById('personalCount');
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

/* ---------- Blackjack UI ---------- */
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
const bjStatus = document.getElementById('bjStatus');

/* ---------- Game state ---------- */
const BAR_WIDTH = 400;
const IND_WIDTH = 20;
let pos = (BAR_WIDTH - IND_WIDTH) / 2;
let dir = 1;
let running = true;
let paused = false;
let speed = 5;
let reward = 1;
let targetWidth = 100;

let personalPizzas = 5;
let maxPizzasAchieved = personalPizzas;
let extremeUnlocked = false;
let blackjackUnlocked = false;

/* ---------- blackjack state ---------- */
let deck = [];
let playerHand = [];
let dealerHand = [];
let inRound = false;
let currentBet = 1;

/* ---------- initialize UI ---------- */
function updateCounters(){
    personalCountEl.textContent = `Pizzas: ${personalPizzas}`;
    updateExtremeUnlock();
    updateBlackjackUnlock();
}
updateCounters();

/* ---------- target centering ---------- */
function centerTarget(){
    const left = (BAR_WIDTH - targetWidth)/2;
    targetEl.style.left = left + 'px';
    targetEl.style.width = targetWidth + 'px';
}
centerTarget();

/* ---------- indicator ---------- */
function setIndicatorPos(x){
    indicatorEl.style.left = x + 'px';
}
setIndicatorPos(pos);

/* ---------- movement ---------- */
function move(){
    if(!running || paused) return;
    pos += dir*speed;
    if(pos <= 0 || pos >= BAR_WIDTH-IND_WIDTH) dir*=-1;
    setIndicatorPos(pos);
    requestAnimationFrame(move);
}
move();

/* ---------- floating text in pizza center ---------- */
function showFloatingText(txt,color='#ffd166'){
    const wrapper = pizzaImg.parentElement;

    const floatEl = document.createElement('div');
    floatEl.textContent = txt;
    floatEl.style.position = 'absolute';
    floatEl.style.color = color;
    floatEl.style.fontWeight = '700';
    floatEl.style.fontSize = '18px';
    floatEl.style.pointerEvents = 'none';
    floatEl.style.textShadow = '0 4px 12px rgba(0,0,0,0.5)';
    floatEl.style.zIndex = 3;

    // Pizza-Mitte relativ zum Wrapper
    const centerX = pizzaImg.offsetLeft + pizzaImg.offsetWidth / 2;
    const centerY = pizzaImg.offsetTop + pizzaImg.offsetHeight / 2;

    floatEl.style.left = centerX + 'px';
    floatEl.style.top = centerY + 'px';
    floatEl.style.transform = 'translate(-50%, -50%)';

    wrapper.appendChild(floatEl);

    setTimeout(()=>{
        floatEl.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
        floatEl.style.transform = 'translate(-50%, -110%)';
        floatEl.style.opacity = '0';
    },50);

    setTimeout(()=> floatEl.remove(),1050);
}

/* ---------- add pizzas helper ---------- */
function addPizzas(amount){
    personalPizzas += amount;
    if(personalPizzas > maxPizzasAchieved) maxPizzasAchieved = personalPizzas;
    updateCounters();
    showFloatingText(`+${amount} 🍕`);
}

/* ---------- game check ---------- */
function checkBar(){
    paused=true;
    const targetLeft = parseFloat(targetEl.style.left);
    const targetRight = targetLeft + targetWidth;
    const indicatorCenter = pos + IND_WIDTH/2;

    if(indicatorCenter >= targetLeft && indicatorCenter <= targetRight){
        resultEl.textContent='🔥 Perfect pizza!';
        indicatorEl.style.background='#4caf50';
        addPizzas(reward);
    } else {
        resultEl.textContent = indicatorCenter < targetLeft ? '🥶 Undercooked!' : '💀 Burnt!';
        indicatorEl.style.background='#f44336';
    }

    setTimeout(()=>{
        indicatorEl.style.background='#fff';
        resultEl.textContent='';
        paused=false;
        move();
    },1000);
}

pizzaImg.addEventListener('click',()=>{if(!paused) checkBar();});

/* ---------- modes ---------- */
easyBtn.addEventListener('click', ()=>{
    speed=4; reward=1; targetWidth=100; centerTarget();
    resultEl.textContent='🟢 Easy mode!';
    setTimeout(()=> resultEl.textContent='',700);
});
midBtn.addEventListener('click', ()=>{
    speed=6; reward=3; targetWidth=70; centerTarget();
    resultEl.textContent='🟠 Mid mode!';
    setTimeout(()=> resultEl.textContent='',700);
});
hardBtn.addEventListener('click', ()=>{
    speed=9; reward=10; targetWidth=40; centerTarget();
    resultEl.textContent='🔴 Hard mode!';
    setTimeout(()=> resultEl.textContent='',700);
});

/* ---------- extreme unlock ---------- */
function updateExtremeUnlock(){
    const remaining = Math.max(100-maxPizzasAchieved,0);
    if(maxPizzasAchieved>=100){
        extremeBtn.classList.add('unlocked');
        extremeBtn.textContent='Extreme 💀';
        extremeUnlocked=true;
    } else {
        extremeBtn.classList.remove('unlocked');
        extremeBtn.textContent=`Extreme 🔒 (${remaining} left)`;
        extremeUnlocked=false;
    }
}
extremeBtn.addEventListener('click',()=>{
    if(!extremeUnlocked) return;
    speed=13; reward=100; targetWidth=25; centerTarget();
    resultEl.textContent='💀 EXTREME MODE!!!';
    showFloatingText('⚡ Extreme unlocked! ⚡','#ff00ff');
    setTimeout(()=> resultEl.textContent='',1000);
});

/* ---------- Blackjack unlock ---------- */
function updateBlackjackUnlock(){
    const remaining = Math.max(10-maxPizzasAchieved,0);
    if(maxPizzasAchieved>=10){
        blackjackUnlocked=true;
        openBJBtn.disabled=false;
        openBJBtn.textContent='🎰 Open Blackjack';
    } else {
        blackjackUnlocked=false;
        openBJBtn.disabled=true;
        openBJBtn.textContent=`🎰 Blackjack 🔒 (${remaining} left)`;
    }
}

/* ---------- OPEN/CLOSE blackjack ---------- */
openBJBtn.addEventListener('click',()=>{
    if(!blackjackUnlocked) return;
    const isOpen = bjBox.classList.toggle('open');
    bjBox.setAttribute('aria-hidden', String(!isOpen));
    if(isOpen){
        betInput.value=Math.max(1,Math.floor(betInput.value)||1);
    }
});

/* ---------- betting controls ---------- */
function clampBetInput(){
    let v=Math.floor(Number(betInput.value)||0);
    if(v<1)v=1;
    betInput.value=v;
    currentBet=v;
}
betPlus.addEventListener('click',()=>{betInput.value=parseInt(betInput.value||'1')+1; clampBetInput();});
betMinus.addEventListener('click',()=>{betInput.value=Math.max(1,parseInt(betInput.value||'1')-1); clampBetInput();});
betInput.addEventListener('input', clampBetInput);
betInput.addEventListener('blur', clampBetInput);

/* ---------- deck & helpers ---------- */
const SUITS=['♠️','♥️','♦️','♣️'];
const RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function buildDeck(){ const d=[]; for(const s of SUITS) for(const r of RANKS) d.push({suit:s,rank:r}); return d; }
function shuffle(d){for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}}
function handValue(hand){
    let total=0,aces=0;
    for(const c of hand){
        if(c.rank==='A'){aces++; total+=11;}
        else if(['J','Q','K'].includes(c.rank)) total+=10;
        else total+=parseInt(c.rank,10);
    }
    while(total>21 && aces>0){total-=10; aces--;}
    return total;
}
function renderCards(el,hand,hideFirst=false){
    el.innerHTML='';
    for(let i=0;i<hand.length;i++){
        const c=hand[i];
        const cardDiv=document.createElement('div');
        cardDiv.className='card';
        if(hideFirst && i===0){
            cardDiv.innerHTML='<div style="font-size:18px;opacity:0.25">🂠</div><div class="val" style="opacity:0.35">?</div>';
        } else cardDiv.innerHTML=`<div class="suit">${c.suit}</div><div class="val">${c.rank}</div>`;
        el.appendChild(cardDiv);
    }
}

function resetRoundUI(){
    playerCardsEl.innerHTML='';
    dealerCardsEl.innerHTML='';
    playerValueEl.textContent='';
    dealerValueEl.textContent='';
    bjStatus.textContent='';
    hitBtn.disabled=true;
    standBtn.disabled=true;
}

function canAfford(bet){ return personalPizzas>=bet; }

function startRound(){
    currentBet=Math.max(1,Math.floor(Number(betInput.value)||1));
    if(!canAfford(currentBet)){
        bjStatus.textContent='Not enough pizzas.';
        return;
    }

    personalPizzas-=currentBet;
    updateCounters();

    deck=buildDeck(); shuffle(deck);
    playerHand=[]; dealerHand=[]; inRound=true;
    resetRoundUI();

    playerHand.push(deck.pop());
    dealerHand.push(deck.pop());
    playerHand.push(deck.pop());
    dealerHand.push(deck.pop());

    renderCards(playerCardsEl,playerHand);
    renderCards(dealerCardsEl,dealerHand,true);
    playerValueEl.textContent=`Value: ${handValue(playerHand)}`;
    dealerValueEl.textContent='Value: ?';

    hitBtn.disabled=false; standBtn.disabled=false;

    const pVal=handValue(playerHand), dVal=handValue(dealerHand);
    const pBlack=pVal===21, dBlack=dVal===21;
    if(pBlack||dBlack){
        renderCards(dealerCardsEl,dealerHand);
        dealerValueEl.textContent=`Value: ${dVal}`;
        if(pBlack && !dBlack){
            addPizzas(Math.floor(currentBet*2.5));
            bjStatus.textContent='Blackjack! You win!';
        } else if(!pBlack && dBlack){ bjStatus.textContent='Dealer has Blackjack. You lose.'; }
        else { personalPizzas+=currentBet; bjStatus.textContent='Push (both Blackjack).'; updateCounters(); }
        inRound=false;
        hitBtn.disabled=true; standBtn.disabled=true;
        return;
    }
}

hitBtn.addEventListener('click',()=>{
    if(!inRound) return;
    playerHand.push(deck.pop());
    renderCards(playerCardsEl,playerHand);
    const pv=handValue(playerHand);
    playerValueEl.textContent=`Value: ${pv}`;
    if(pv>21){ inRound=false; bjStatus.textContent='Bust! You lose.'; hitBtn.disabled=true; standBtn.disabled=true; }
});

standBtn.addEventListener('click',()=>{
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
    if(dv>21){ addPizzas(currentBet*2); bjStatus.textContent='Dealer busts! You win!'; }
    else if(dv===pv){ personalPizzas+=currentBet; bjStatus.textContent='Push. Bet returned.'; updateCounters();}
    else if(pv>dv){ addPizzas(currentBet*2); bjStatus.textContent='You win!'; }
    else { bjStatus.textContent='You lose.'; }

    inRound=false;
    hitBtn.disabled=true; standBtn.disabled=true;
});

playBtn.addEventListener('click',()=>{
    if(!inRound){
        const bet=Math.max(1, Math.floor(Number(betInput.value)||1));
        if(!canAfford(bet)){ bjStatus.textContent='Not enough pizzas.'; return; }
        startRound();
    } else bjStatus.textContent='Round already running.';
});
