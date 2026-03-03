/* ============================================
   CODACADE — Hangman (80s Edition) ES Module
   ============================================ */
import WORDS from './words.js';

let word, guessed, wrongCount, score, streak, timerInterval, timeLeft;
const MAX_WRONG = 6;
const TIMER_MAX = 15;

function renderTitleScreen() {
    return `
        <div class="title-screen">
            <h2 style="color: var(--orange); text-shadow: var(--glow-orange);">HANGMAN</h2>
            <p class="game-subtitle">80s Edition — Beat the Clock!</p>
            <div class="how-to-play">
                <h3>HOW TO PLAY</h3>
                <ul>
                    <li>A mystery <strong style="color:var(--orange);">80s word</strong> appears as blank slots</li>
                    <li>Click letters to guess — <strong style="color:var(--success);">correct</strong> reveals, <strong style="color:var(--danger);">wrong</strong> draws the hangman</li>
                    <li>You have <strong style="color:var(--blue);">15 seconds</strong> per guess — too slow and you lose a round!</li>
                    <li>Build <strong style="color:var(--purple);">streaks</strong> for bonus points</li>
                    <li>6 wrong guesses = <strong style="color:var(--danger);">Game Over</strong></li>
                </ul>
            </div>
            <div class="title-buttons">
                <button class="btn-retro btn-orange btn-lg" onclick="window.HangmanGame.startGame()">▶ PLAY</button>
                <button class="btn-retro btn-purple" onclick="window.router.navigate('arcade')">← BACK TO ARCADE</button>
            </div>
            <div id="hangman-leaderboard"></div>
        </div>
    `;
}

function startGame() {
    word = WORDS[Math.floor(Math.random() * WORDS.length)];
    guessed = new Set();
    wrongCount = 0;
    score = 0;
    streak = 0;
    timeLeft = TIMER_MAX;

    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="game-area">
            <div class="game-hud" id="hm-hud">
                <div class="hud-item"><span class="hud-label">SCORE </span><span class="hud-value" id="hm-score">0</span></div>
                <div class="hud-item"><span class="hud-label">STREAK </span><span class="hud-value" id="hm-streak">0</span></div>
                <div class="hud-item"><span class="hud-label">LIVES </span><span class="hud-value" id="hm-lives">${'❤️'.repeat(MAX_WRONG - wrongCount)}</span></div>
                <button class="btn-retro btn-sm" onclick="window.HangmanGame.cleanup(); window.router.navigate('arcade');">← ARCADE</button>
            </div>
            <div class="hangman-container">
                <div class="hangman-canvas-wrap">
                    <canvas id="hm-canvas" width="200" height="220"></canvas>
                </div>
                <div class="timer-bar"><div class="timer-fill" id="hm-timer" style="width:100%"></div></div>
                <div class="hangman-word" id="hm-word"></div>
                <div class="keyboard" id="hm-keyboard"></div>
            </div>
        </div>
    `;

    renderWord();
    renderKeyboard();
    drawHangman();
    startTimer();
}

function renderWord() {
    const el = document.getElementById('hm-word');
    if (!el) return;
    el.innerHTML = word.split('').map(letter => {
        const revealed = guessed.has(letter);
        return `<div class="letter-slot ${revealed ? 'revealed' : ''}">${revealed ? letter : ''}</div>`;
    }).join('');
}

function renderKeyboard() {
    const el = document.getElementById('hm-keyboard');
    if (!el) return;
    el.innerHTML = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
        let cls = 'key-btn';
        if (guessed.has(letter)) {
            cls += word.includes(letter) ? ' correct used' : ' wrong used';
        }
        return `<button class="${cls}" ${guessed.has(letter) ? 'disabled' : ''} onclick="window.HangmanGame.guess('${letter}')">${letter}</button>`;
    }).join('');
}

function guess(letter) {
    if (guessed.has(letter)) return;
    guessed.add(letter);
    resetTimer();

    if (word.includes(letter)) {
        streak++;
        score += 100 * streak;
    } else {
        streak = 0;
        wrongCount++;
        drawHangman();
    }

    renderWord();
    renderKeyboard();
    updateHUD();

    if (wrongCount >= MAX_WRONG) {
        endGame(false);
    } else if (word.split('').every(l => guessed.has(l))) {
        score += 500 + timeLeft * 50;
        endGame(true);
    }
}

function drawHangman() {
    const canvas = document.getElementById('hm-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 200, 220);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.lineWidth = 3;

    // Base structure
    const parts = [
        () => { ctx.strokeStyle = '#00d4ff'; ctx.beginPath(); ctx.moveTo(20, 200); ctx.lineTo(80, 200); ctx.stroke(); ctx.beginPath(); ctx.moveTo(50, 200); ctx.lineTo(50, 30); ctx.stroke(); ctx.beginPath(); ctx.moveTo(50, 30); ctx.lineTo(130, 30); ctx.stroke(); ctx.beginPath(); ctx.moveTo(130, 30); ctx.lineTo(130, 50); ctx.stroke(); },
        () => { ctx.strokeStyle = '#ff6b35'; ctx.beginPath(); ctx.arc(130, 65, 15, 0, Math.PI * 2); ctx.stroke(); },
        () => { ctx.strokeStyle = '#b44aff'; ctx.beginPath(); ctx.moveTo(130, 80); ctx.lineTo(130, 140); ctx.stroke(); },
        () => { ctx.strokeStyle = '#ff3366'; ctx.beginPath(); ctx.moveTo(130, 95); ctx.lineTo(105, 120); ctx.stroke(); },
        () => { ctx.beginPath(); ctx.moveTo(130, 95); ctx.lineTo(155, 120); ctx.stroke(); },
        () => { ctx.strokeStyle = '#ff6b35'; ctx.beginPath(); ctx.moveTo(130, 140); ctx.lineTo(110, 175); ctx.stroke(); },
        () => { ctx.beginPath(); ctx.moveTo(130, 140); ctx.lineTo(150, 175); ctx.stroke(); }
    ];

    for (let i = 0; i < Math.min(wrongCount, parts.length); i++) {
        parts[i]();
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = TIMER_MAX;
    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        const pct = Math.max(0, (timeLeft / TIMER_MAX) * 100);
        const fill = document.getElementById('hm-timer');
        if (fill) {
            fill.style.width = pct + '%';
            fill.classList.toggle('low', pct < 30);
        }
        if (timeLeft <= 0) {
            wrongCount++;
            streak = 0;
            drawHangman();
            updateHUD();
            if (wrongCount >= MAX_WRONG) { endGame(false); } else { resetTimer(); }
        }
    }, 100);
}

function resetTimer() {
    timeLeft = TIMER_MAX;
    const fill = document.getElementById('hm-timer');
    if (fill) { fill.style.width = '100%'; fill.classList.remove('low'); }
}

function updateHUD() {
    const s = document.getElementById('hm-score');
    const st = document.getElementById('hm-streak');
    const l = document.getElementById('hm-lives');
    if (s) s.textContent = score.toLocaleString();
    if (st) st.textContent = streak;
    if (l) l.textContent = '❤️'.repeat(Math.max(0, MAX_WRONG - wrongCount));
}

function endGame(won) {
    clearInterval(timerInterval);
    if (won) score += 1000;

    const user = window.auth.getCurrentUser();
    if (user && score > 0) window.leaderboard.addScore('hangman', user, score);

    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.innerHTML = `
        <div class="game-over-box">
            <h2 class="${won ? 'result-win' : 'result-lose'}">${won ? 'YOU WON!' : 'GAME OVER'}</h2>
            <p class="final-score">SCORE: ${score.toLocaleString()}</p>
            <p class="final-word">The word was <strong style="color:var(--blue);text-shadow:var(--glow-blue);">${word}</strong></p>
            ${!user ? '<p style="color:var(--white-dim);font-size:12px;margin-bottom:16px;">Log in to save your score!</p>' : ''}
            <div class="go-buttons">
                <button class="btn-retro btn-orange" onclick="this.closest('.game-over-overlay').remove(); window.HangmanGame.startGame();">▶ PLAY AGAIN</button>
                <button class="btn-retro btn-purple" onclick="this.closest('.game-over-overlay').remove(); window.router.navigate('hangman');">TITLE</button>
                <button class="btn-retro" onclick="this.closest('.game-over-overlay').remove(); window.router.navigate('arcade');">← ARCADE</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function cleanup() {
    clearInterval(timerInterval);
}

const HangmanGame = { renderTitleScreen, startGame, guess, cleanup };
window.HangmanGame = HangmanGame;
export default HangmanGame;
