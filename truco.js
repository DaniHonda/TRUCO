// DOM Elements
const playerScoreEl = document.getElementById('player-score');
const botScoreEl = document.getElementById('bot-score');
const playerHandEl = document.getElementById('player-hand');
const botHandEl = document.querySelector('.bot-hand');
const playerCardPlayedEl = document.getElementById('player-card-played');
const botCardPlayedEl = document.getElementById('bot-card-played');
const viraCardEl = document.getElementById('vira-card');
const messageAreaEl = document.getElementById('message-area');
const newHandButton = document.getElementById('new-hand-button');
const trucoButton = document.getElementById('truco-button');
const seisButton = document.getElementById('seis-button');
const noveButton = document.getElementById('nove-button');
const dozeButton = document.getElementById('doze-button');
const runButton = document.getElementById('run-button');
const difficultySelection = document.getElementById('difficulty-selection');
const gameContainer = document.getElementById('game-container');
const showRankingButton = document.getElementById('show-ranking-button');
const pauseButton = document.getElementById('pause-button');

// Game Constants
const naipes = ['♦️', '♠️', '♥️', '♣️'];
const valores = ['Q', 'J', 'K', 'A', '2', '3'];
const trucoValues = { 'Q': 1, 'J': 2, 'K': 3, 'A': 4, '2': 5, '3': 6 };
const pointsWhenRunning = { 3: 1, 6: 3, 9: 6, 12: 9 };

// Game State
let deck = [], playerHand = [], botHand = [];
let playerScore = 0, botScore = 0;
let vira = null, points = 1, trucoState = 0, trucoRequester = null;
let gameActive = false, playerTurn = true;
let playerRoundWins = 0, botRoundWins = 0, roundCounter = 0;
let playerPlayedCard = null, botPlayedCard = null;
let difficulty = 'easy';
let gameStartTime = null;
let timerInterval = null;
let isPaused = false;
let pausedTime = 0;

// Core Game Flow
function setDifficulty(level) {
    difficulty = level;
    gameStartTime = new Date();
    
    document.querySelector('.title-sign').style.display = 'none';
    document.getElementById('difficulty-selection').style.display = 'none';
    showRankingButton.style.display = 'none'; // Esconde o botão de ranking

    const gameWrapper = document.querySelector('.container');
    gameWrapper.style.background = '#0b6623';
    gameWrapper.style.border = '4px solid #C4A484';
    gameWrapper.style.boxShadow = '8px 8px 0px #000000c0';

    gameContainer.style.display = 'block';
    pauseButton.style.display = 'inline-block';
    startTimer();
    dealCards();
}

// Função centralizada para atualizar placar e checar vitória
function updateScore(player, pointsToAdd) {
    if (!gameActive) return true; // Previne múltiplas chamadas de fim de jogo

    if (player === 'player') {
        playerScore += pointsToAdd;
    } else {
        botScore += pointsToAdd;
    }
    updateMainScore();

    // Checa se o jogo acabou toda vez que a pontuação é atualizada
    if (playerScore >= 12 || botScore >= 12) {
        gameActive = false; // Impede outras ações
        setTimeout(endGame, 500); // Usa timeout para a mensagem da mão aparecer
        return true; // Retorna true para indicar que o jogo acabou
    }
    return false; // Retorna false se o jogo continua
}

function dealCards() {
    gameActive = true;
    roundCounter = 0;
    playerRoundWins = 0;
    botRoundWins = 0;
    points = 1;
    trucoState = 0;
    trucoRequester = null;
    playerPlayedCard = null;
    botPlayedCard = null;

    deck = [];
    for (const naipe of naipes) for (const valor of valores) deck.push({ valor, naipe, id: `${valor}-${naipe}` });
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[deck[i], deck[j]] = [deck[j], deck[i]]; }

    playerHand = deck.splice(0, 3);
    botHand = deck.splice(0, 3);
    vira = deck.splice(0, 1)[0];
    
    updateManilhas();
    renderHands();
    renderViraCard();
    clearPlayedCards();
    updateMainScore();
    resetActionButtons();
    
    playerTurn = Math.random() > 0.5;
    if (!playerTurn) {
        setMessage('O bot começa...');
        disablePlayerHand();
        setTimeout(botPlays, 1000); 
    } else {
        setMessage('Sua vez de jogar!');
        enablePlayerHand();
    }
}

function playCard(card, player, isHidden = false) {
    if (isPaused || !gameActive || (player === 'player' && !playerTurn)) return;
    
    const handEl = player === 'player' ? playerHandEl : botHandEl;
    const cardEl = player === 'player' ? handEl.querySelector(`[data-card-id="${card.id}"]`) : handEl.querySelector('.card');

    if (!cardEl) return;

    cardEl.style.opacity = '0';
    cardEl.style.transform = 'scale(0.5)';

    setTimeout(() => {
        if (!gameActive) return;
        cardEl.remove();
        const playedCardObject = { ...card, wasHidden: isHidden };

        if (player === 'player') {
            playerPlayedCard = playedCardObject;
            playerHand = playerHand.filter(c => c.id !== card.id);
        } else {
            botPlayedCard = playedCardObject;
            botHand = botHand.filter(c => c.id !== card.id);
        }

        renderPlayedCard(playedCardObject);
        playerTurn = !playerTurn;

        if (playerPlayedCard && botPlayedCard) {
            setTimeout(checkRoundWinner, 1200);
        } else if (playerTurn) {
            setMessage('Sua vez de jogar.');
            enablePlayerHand();
        } else {
            disablePlayerHand();
            setMessage('Bot jogando...');
            setTimeout(botPlays, 1000);
        }
    }, 300);
}

function checkRoundWinner() {
    if (!gameActive) return;
    roundCounter++;
    const pValue = getCardValue(playerPlayedCard);
    const bValue = getCardValue(botPlayedCard);
    let winner;

    if (pValue > bValue) { winner = 'player'; playerRoundWins++; } 
    else if (bValue > pValue) { winner = 'bot'; botRoundWins++; } 
    else { winner = 'empate'; playerRoundWins++; botRoundWins++; }
    
    setMessage(winner === 'player' ? 'Você venceu a rodada!' : winner === 'bot' ? 'O Bot venceu a rodada!' : 'Rodada Empatada!');

    setTimeout(() => {
        if (!gameActive) return;
        clearPlayedCards();
        playerPlayedCard = null;
        botPlayedCard = null;
        
        const handWinner = playerRoundWins >= 2 ? 'player' : botRoundWins >= 2 ? 'bot' : null;
        if (handWinner || roundCounter === 3) {
            endHand(playerRoundWins >= botRoundWins ? 'player' : 'bot');
            return;
        }
        
        playerTurn = (winner === 'player' || winner === 'empate');
        renderHands(); 
        if (playerTurn) {
            setMessage('Sua vez de jogar.');
            enablePlayerHand();
        } else {
            setMessage('O bot joga...');
            disablePlayerHand();
            botPlays();
        }
    }, 1500);
}

function endHand(winner) {
    if (!gameActive) return;
    points = trucoState > 1 ? trucoState : 1;
    let finalMessage;

    if (winner === 'player') {
        finalMessage = `Você venceu a mão! (+${points} pts)`;
        if (updateScore('player', points)) return;
    } else {
        finalMessage = `O bot venceu a mão. (+${points} pts)`;
        if (updateScore('bot', points)) return;
    }
    
    setMessage(finalMessage);
    setTimeout(dealCards, 2500);
}

function endGame() {
    gameActive = false; // Garante que o estado final é 'não ativo'
    stopTimer();
    const finalWinner = playerScore >= 12 ? 'Você' : 'Bot';
    const duration = new Date() - gameStartTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(0);
    const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    document.querySelector('.container').style.display = 'none';
    document.querySelector('.top-buttons').style.display = 'none';

    const modal = document.getElementById('end-game-modal');
    document.getElementById('end-game-title').textContent = finalWinner === 'Você' ? 'Você Venceu!' : 'Você Perdeu!';
    document.getElementById('game-duration').textContent = formattedDuration;
    document.getElementById('ranking-difficulty').textContent = difficulty;
    
    const rankingSubmissionEl = document.querySelector('.ranking-submission');
    if (finalWinner === 'Você') {
        rankingSubmissionEl.style.display = 'flex';
    } else {
        rankingSubmissionEl.style.display = 'none';
    }
    
    modal.style.display = 'flex';
    fetchRanking();
}

function getCardValue(card) {
    if (!card) return 0;
    if (card.wasHidden) return 0;
    return card.isManilha ? 100 + card.manilhaValue : trucoValues[card.valor];
}

function botPlays() {
    if (isPaused || !gameActive || playerTurn) return;
    if (trucoState === 0 && playerHand.length > 0 && playerScore < 11 && botScore < 11) {
        let bluffChance = 0;
        if (difficulty === 'easy') bluffChance = 0.05;
        if (difficulty === 'medium') bluffChance = 0.20;
        if (difficulty === 'hard') bluffChance = 0.35;
        const shouldConsiderTruco = botHasGoodHand(botHand) || Math.random() < bluffChance;
        if (shouldConsiderTruco && Math.random() < 0.5) {
            handleTrucoRequest('bot', 3);
            return;
        }
    }
    let cardToPlay;
    const sortedHand = [...botHand].sort((a, b) => getCardValue(a) - getCardValue(b));
    if (playerPlayedCard) {
        const winningCard = sortedHand.find(c => getCardValue(c) > getCardValue(playerPlayedCard));
        cardToPlay = winningCard || sortedHand[0];
    } else {
        cardToPlay = sortedHand[sortedHand.length - 1];
    }
    playCard(cardToPlay, 'bot', Math.random() < 0.1 && roundCounter > 0);
}

function handleTrucoRequest(requester, level) {
    if (isPaused || !gameActive) return;
    trucoRequester = requester;
    trucoState = level;
    const valueMap = { 3: 'TRUCO', 6: 'SEIS', 9: 'NOVE', 12: 'DOZE' };
    const raisedValue = valueMap[level];
    
    disablePlayerHand();
    hideAllButtons();

    if (requester === 'bot') {
        setMessage(`O BOT PEDIU ${raisedValue}!`);
        showPlayerResponseButtons(level);
    } else {
        setMessage(`Você pediu ${raisedValue}! Esperando o bot...`);
        setTimeout(() => {
            if (!gameActive) return;
            const hasGoodHand = botHasGoodHand(botHand);
            const hasVeryGoodHand = botHasVeryGoodHand(botHand);
            const pointsAwarded = pointsWhenRunning[level];
            const wantsToRaiseAsBluff = !hasVeryGoodHand && Math.random() < 0.10;
            const wantsToRaiseWithGoodHand = hasVeryGoodHand && Math.random() < 0.40;

            if (level === 3 && (wantsToRaiseWithGoodHand || wantsToRaiseAsBluff)) {
                handleTrucoRequest('bot', 6);
            } else if (hasGoodHand) {
                setMessage(`Bot aceitou! Vale ${level} Pts.`);
                hideAllButtons();
                if (playerTurn) {
                    setMessage("Bot aceitou. Sua vez de jogar.");
                    enablePlayerHand();
                } else {
                    setMessage("Bot aceitou. Vez dele jogar.");
                    setTimeout(botPlays, 1000);
                }
            } else {
                setMessage(`O bot correu! Você ganha ${pointsAwarded} pts.`);
                if (updateScore('player', pointsAwarded)) return;
                setTimeout(dealCards, 2000);
            }
        }, 1500);
    }
}

function showPlayerResponseButtons(level) {
    trucoButton.textContent = 'Aceitar';
    trucoButton.onclick = () => {
        setMessage(`Você aceitou! Vale ${level} pts.`);
        hideAllButtons();
        if (playerTurn) {
            setMessage("Você aceitou. Sua vez de jogar.");
            enablePlayerHand();
        } else {
            setMessage("Você aceitou. O bot vai jogar...");
            disablePlayerHand();
            setTimeout(botPlays, 1000);
        }
    };
    showButton('truco-button');

    runButton.onclick = () => {
        const pointsAwarded = pointsWhenRunning[level];
        setMessage(`Você correu! O bot ganha ${pointsAwarded} pts.`);
        if (updateScore('bot', pointsAwarded)) return;
        setTimeout(dealCards, 2000);
    };
    showButton('run-button');

    const raiseMap = { 3: 'seis-button', 6: 'nove-button', 9: 'doze-button' };
    const nextLevel = { 3: 6, 6: 9, 9: 12 };
    const raiseButtonId = raiseMap[level];
    if (raiseButtonId) {
        const raiseButton = document.getElementById(raiseButtonId);
        raiseButton.onclick = () => handleTrucoRequest('player', nextLevel[level]);
        showButton(raiseButtonId);
    }
}

function resetActionButtons() {
    hideAllButtons();
    const isMaoDeOnze = playerScore >= 11 || botScore >= 11;

    trucoButton.textContent = 'Truco';
    trucoButton.onclick = () => handleTrucoRequest('player', 3);
    if (isMaoDeOnze) {
        trucoButton.classList.add('disabled');
        trucoButton.onclick = () => {};
    } else {
        trucoButton.classList.remove('disabled');
    }
    showButton('truco-button');

    runButton.onclick = () => { 
        setMessage("Você correu. Bot ganha 1 pt.");
        if (updateScore('bot', 1)) return;
        setTimeout(dealCards, 2000);
    };
    showButton('run-button');
}

function updateManilhas() {
    const viraIndex = valores.indexOf(vira.valor);
    const manilhaValor = valores[(viraIndex + 1) % valores.length];
    const manilhaOrder = { '♣️': 4, '♥️': 3, '♠️': 2, '♦️': 1 };
    [playerHand, botHand].forEach(hand => hand.forEach(c => {
        c.isManilha = (c.valor === manilhaValor);
        c.manilhaValue = c.isManilha ? manilhaOrder[c.naipe] : 0;
    }));
}

function botHasGoodHand(hand) {
    const manilhas = hand.filter(c => c.isManilha).length;
    const strongCards = hand.filter(c => getCardValue({ ...c, wasHidden: false }) >= trucoValues['2']).length;
    return manilhas >= 1 || strongCards >= 2;
}

function botHasVeryGoodHand(hand) {
    const manilhas = hand.filter(c => c.isManilha);
    return manilhas.length >= 2 || manilhas.find(c => c.manilhaValue === 4);
}

function setMessage(message) { messageAreaEl.textContent = message; }
function updateMainScore() { playerScoreEl.textContent = playerScore; botScoreEl.textContent = botScore; }
function renderHands() {
    playerHandEl.innerHTML = '';
    botHandEl.innerHTML = '';
    playerHand.forEach(card => playerHandEl.appendChild(createCardElement(card, 'player')));
    botHand.forEach(() => botHandEl.appendChild(createCardElement({}, 'bot')));
}
function createCardElement(card, player) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    if (player === 'bot') {
        cardEl.classList.add('back');
    } else {
        cardEl.dataset.cardId = card.id;
        const suitClass = ['♦️', '♥️'].includes(card.naipe) ? 'suit-red' : 'suit-black';
        cardEl.innerHTML = `<div class="card-value-top">${card.valor}</div><div class="card-value-bottom ${suitClass}">${card.naipe}</div><button class="hide-button">?</button>`;
        cardEl.addEventListener('click', () => playCard(card, 'player', false));
        cardEl.querySelector('.hide-button').addEventListener('click', (e) => {
            e.stopPropagation();
            playCard(card, 'player', true);
        });
    }
    return cardEl;
}

function getRandomTransform() {
    const maxRotation = 8;
    const maxOffset = 5;
    const rot = Math.floor(Math.random() * (maxRotation * 2 + 1)) - maxRotation;
    const x = Math.floor(Math.random() * (maxOffset * 2 + 1)) - maxOffset;
    const y = Math.floor(Math.random() * (maxOffset * 2 + 1)) - maxOffset;
    return `rotate(${rot}deg) translate(${x}px, ${y}px)`;
}

function renderViraCard() {
    viraCardEl.innerHTML = '';
    const suitClass = ['♦️', '♥️'].includes(vira.naipe) ? 'suit-red' : 'suit-black';
    viraCardEl.innerHTML = `
        <div class="card-value-top">${vira.valor}</div>
        <div class="card-value-bottom ${suitClass}">${vira.naipe}</div>`;
    viraCardEl.style.transform = getRandomTransform();
}

function renderPlayedCard(card) {
    const targetEl = playerTurn ? botCardPlayedEl : playerCardPlayedEl;
    targetEl.innerHTML = ''; 
    const cardEl = document.createElement('div');
    cardEl.className = 'card';

    if(card.wasHidden) {
        cardEl.classList.add('back');
    } else {
        const suitClass = ['♦️', '♥️'].includes(card.naipe) ? 'suit-red' : 'suit-black';
        cardEl.innerHTML = `<div class="card-value-top">${card.valor}</div><div class="card-value-bottom ${suitClass}">${card.naipe}</div>`;
    }
    cardEl.style.transform = getRandomTransform();
    targetEl.appendChild(cardEl);
}
function clearPlayedCards() { playerCardPlayedEl.innerHTML = ''; botCardPlayedEl.innerHTML = ''; }
function disablePlayerHand() { playerHandEl.classList.add('disabled'); }
function enablePlayerHand() { playerHandEl.classList.remove('disabled'); }
function hideAllButtons() { [trucoButton, seisButton, noveButton, dozeButton, runButton].forEach(b => b.style.display = 'none'); }
function showButton(id) { document.getElementById(id).style.display = 'inline-block'; }

async function fetchRanking() { /* ... (função como antes) ... */ }
async function saveScore() { /* ... (função como antes) ... */ }

function startTimer() {
    stopTimer();
    const timerEl = document.getElementById('in-game-timer');
    timerInterval = setInterval(() => {
        const duration = new Date() - gameStartTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = ((duration % 60000) / 1000).toFixed(0);
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function pauseGame() {
    if (!gameActive) return;
    isPaused = true;
    pausedTime = new Date();
    stopTimer();
    document.getElementById('pause-overlay').style.display = 'flex';
}

function resumeGame() {
    if (!isPaused) return;
    const pauseDuration = new Date() - pausedTime;
    gameStartTime.setTime(gameStartTime.getTime() + pauseDuration);
    isPaused = false;
    document.getElementById('pause-overlay').style.display = 'none';
    startTimer();
    
    if (!playerTurn) {
        setMessage('Bot jogando...');
        setTimeout(botPlays, 500);
    }
}

// Event Listeners
document.getElementById('easy-mode').addEventListener('click', () => setDifficulty('easy'));
document.getElementById('medium-mode').addEventListener('click', () => setDifficulty('medium'));
document.getElementById('hard-mode').addEventListener('click', () => setDifficulty('hard'));
document.getElementById('save-score-button').addEventListener('click', saveScore);
document.getElementById('new-game-button').addEventListener('click', () => location.reload());
document.getElementById('menu-button').addEventListener('click', () => location.reload());
document.getElementById('pause-button').addEventListener('click', pauseGame);
document.getElementById('resume-button').addEventListener('click', resumeGame);
document.getElementById('menu-button-pause').addEventListener('click', () => location.reload());
showRankingButton.addEventListener('click', () => {
    window.location.href = 'ranking.html';
});
