/* ============================================
   CODACADE — Hangman Game Module
   ============================================ */
window.HangmanGame = (() => {
    let word = '';
    let guessed = [];
    let wrongCount = 0;
    let score = 0;
    let streak = 0;
    let timerInterval = null;
    let timeLeft = 15;
    let gameActive = false;
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
                        <li>Guess the hidden 80s word one letter at a time</li>
                        <li>You have <strong style="color:var(--danger);">15 seconds</strong> per guess before you lose a life</li>
                        <li>6 wrong guesses and it's game over</li>
                        <li>Score points for correct letters — faster = more points</li>
                        <li>Build streaks for bonus multipliers!</li>
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
        word = window.hangmanWords[Math.floor(Math.random() * window.hangmanWords.length)];
        guessed = [];
        wrongCount = 0;
        score = 0;
        streak = 0;
        timeLeft = TIMER_MAX;
        gameActive = true;
        renderGameplay();
        startTimer();
    }

    function renderGameplay() {
        const main = document.getElementById('main-content');
        const wordDisplay = word.split('').map(letter => {
            const revealed = guessed.includes(letter);
            return `<div class="letter-slot ${revealed ? 'revealed' : ''}">${revealed ? letter : ''}</div>`;
        }).join('');

        const keyboard = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
            const isGuessed = guessed.includes(letter);
            const isCorrect = isGuessed && word.includes(letter);
            const isWrong = isGuessed && !word.includes(letter);
            let cls = 'key-btn';
            if (isCorrect) cls += ' correct used';
            else if (isWrong) cls += ' wrong used';
            return `<button class="${cls}" ${isGuessed ? 'disabled' : ''} onclick="window.HangmanGame.guess('${letter}')">${letter}</button>`;
        }).join('');

        const livesDisplay = '❤️'.repeat(MAX_WRONG - wrongCount) + '🖤'.repeat(wrongCount);
        const timerPercent = (timeLeft / TIMER_MAX) * 100;
        const timerClass = timeLeft <= 5 ? 'low' : '';

        main.innerHTML = `
            <div class="game-area">
                <div class="game-hud">
                    <div class="hud-item"><span class="hud-label">SCORE </span><span class="hud-value">${score.toLocaleString()}</span></div>
                    <div class="hud-item"><span class="hud-label">STREAK </span><span class="hud-value${streak >= 3 ? ' success' : ''}">${streak}x</span></div>
                    <div class="hud-item"><span class="hud-label">LIVES </span><span class="hud-value">${livesDisplay}</span></div>
                    <button class="btn-retro btn-sm" onclick="window.router.navigate('arcade')">← ARCADE</button>
                </div>
                <div class="hangman-container">
                    <div class="hangman-canvas-wrap">
                        <canvas id="hangman-canvas" width="220" height="220"></canvas>
                    </div>
                    <div class="timer-bar">
                        <div class="timer-fill ${timerClass}" style="width: ${timerPercent}%"></div>
                    </div>
                    <div class="hangman-word">${wordDisplay}</div>
                    <div class="keyboard">${keyboard}</div>
                </div>
            </div>
        `;
        drawHangman();
    }

    function drawHangman() {
        const canvas = document.getElementById('hangman-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 220, 220);
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(0, 212, 255, 0.6)';
        ctx.shadowBlur = 8;

        // Base
        if (wrongCount >= 0) {
            ctx.beginPath(); ctx.moveTo(20, 200); ctx.lineTo(100, 200); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(60, 200); ctx.lineTo(60, 30); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(60, 30); ctx.lineTo(150, 30); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(150, 30); ctx.lineTo(150, 50); ctx.stroke();
        }

        ctx.strokeStyle = '#ff6b35';
        ctx.shadowColor = 'rgba(255, 107, 53, 0.6)';

        // Head
        if (wrongCount >= 1) {
            ctx.beginPath(); ctx.arc(150, 70, 20, 0, Math.PI * 2); ctx.stroke();
        }
        // Body
        if (wrongCount >= 2) {
            ctx.beginPath(); ctx.moveTo(150, 90); ctx.lineTo(150, 145); ctx.stroke();
        }
        // Left arm
        if (wrongCount >= 3) {
            ctx.beginPath(); ctx.moveTo(150, 105); ctx.lineTo(120, 130); ctx.stroke();
        }
        // Right arm
        if (wrongCount >= 4) {
            ctx.beginPath(); ctx.moveTo(150, 105); ctx.lineTo(180, 130); ctx.stroke();
        }
        // Left leg
        if (wrongCount >= 5) {
            ctx.beginPath(); ctx.moveTo(150, 145); ctx.lineTo(125, 185); ctx.stroke();
        }
        // Right leg
        if (wrongCount >= 6) {
            ctx.beginPath(); ctx.moveTo(150, 145); ctx.lineTo(175, 185); ctx.stroke();
        }
    }

    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = TIMER_MAX;
        timerInterval = setInterval(() => {
            timeLeft -= 0.1;
            const fill = document.querySelector('.timer-fill');
            if (fill) {
                const pct = Math.max(0, (timeLeft / TIMER_MAX) * 100);
                fill.style.width = pct + '%';
                fill.classList.toggle('low', timeLeft <= 5);
            }
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                wrongCount++;
                streak = 0;
                if (wrongCount >= MAX_WRONG) {
                    endGame(false);
                } else {
                    timeLeft = TIMER_MAX;
                    renderGameplay();
                    startTimer();
                }
            }
        }, 100);
    }

    function guess(letter) {
        if (!gameActive || guessed.includes(letter)) return;
        guessed.push(letter);
        clearInterval(timerInterval);

        if (word.includes(letter)) {
            const timeBonus = Math.floor(timeLeft * 10);
            const multiplier = Math.max(1, streak);
            const letterCount = word.split('').filter(l => l === letter).length;
            score += (100 * letterCount + timeBonus) * multiplier;
            streak++;
            // Check win
            if (word.split('').every(l => guessed.includes(l))) {
                score += 500; // completion bonus
                endGame(true);
                return;
            }
        } else {
            wrongCount++;
            streak = 0;
            if (wrongCount >= MAX_WRONG) {
                endGame(false);
                return;
            }
        }

        renderGameplay();
        startTimer();
    }

    function endGame(won) {
        gameActive = false;
        clearInterval(timerInterval);
        const user = window.auth.getCurrentUser();
        if (user && score > 0) {
            window.leaderboard.addScore('hangman', user, score);
        }

        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <div class="game-over-box">
                <h2 class="${won ? 'result-win' : 'result-lose'}">${won ? 'YOU WIN!' : 'GAME OVER'}</h2>
                <p class="final-score">SCORE: ${score.toLocaleString()}</p>
                <p class="final-word">The word was: <strong style="color:var(--blue);text-shadow:var(--glow-blue);">${word}</strong></p>
                ${!user ? '<p style="color:var(--white-dim);font-size:12px;margin-bottom:16px;">Log in to save your score!</p>' : ''}
                <div class="go-buttons">
                    <button class="btn-retro btn-orange" onclick="window.HangmanGame.startGame(); this.closest('.game-over-overlay').remove();">▶ PLAY AGAIN</button>
                    <button class="btn-retro btn-purple" onclick="this.closest('.game-over-overlay').remove(); window.router.navigate('hangman');">TITLE</button>
                    <button class="btn-retro" onclick="this.closest('.game-over-overlay').remove(); window.router.navigate('arcade');">← ARCADE</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    function cleanup() {
        clearInterval(timerInterval);
        gameActive = false;
    }

    return { renderTitleScreen, startGame, guess, cleanup };
})();
