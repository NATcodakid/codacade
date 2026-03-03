/* ============================================
   CODACADE — Neon Snake (Arcade Snake with a Twist)
   ============================================ */

let canvas, ctx;
let animFrame;
let gameActive = false;
let score = 0;
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = null;
let powerup = null;
let powerupTimer = 0;
let speedMultiplier = 1;
let scoreMultiplier = 1;
let particles = [];
let flashTimer = 0;
let moveTimer = 0;
let baseMoveInterval = 8;
let gridFlash = [];

const CELL = 20;
const COLS = 24;
const ROWS = 24;
const W = COLS * CELL;
const H = ROWS * CELL;

function renderTitleScreen() {
    return `
        <div class="title-screen">
            <h2 style="color: var(--success); text-shadow: 0 0 10px rgba(0,255,136,0.6), 0 0 20px rgba(0,255,136,0.3), 0 0 40px rgba(0,255,136,0.2);">NEON SNAKE</h2>
            <p class="game-subtitle">Arcade Serpent Action!</p>
            <div class="how-to-play">
                <h3>HOW TO PLAY</h3>
                <ul>
                    <li>Use <strong style="color:var(--blue);">Arrow Keys</strong> or <strong style="color:var(--blue);">W A S D</strong> to steer</li>
                    <li>Eat <strong style="color:var(--orange);">neon fruit</strong> to grow and score points</li>
                    <li>Grab <strong style="color:var(--purple);">power-ups</strong> for bonus effects:
                        <strong style="color:#ffe033;">⚡ Speed Boost</strong> (2x score),
                        <strong style="color:#00ff88;">🛡 Slow Mode</strong>,
                        <strong style="color:#ff3366;">💥 Mega Fruit</strong> (500 pts)</li>
                    <li><strong style="color:var(--blue);">Walls wrap around</strong> — exit one side, enter the other!</li>
                    <li>Don't eat yourself — that's <strong style="color:var(--danger);">Game Over</strong>!</li>
                </ul>
            </div>
            <div class="title-buttons">
                <button class="btn-retro btn-orange btn-lg" onclick="window.NeonSnakeGame.startGame()">▶ PLAY</button>
                <button class="btn-retro btn-purple" onclick="window.router.navigate('arcade')">← BACK TO ARCADE</button>
            </div>
            <div id="neonsnake-leaderboard"></div>
        </div>
    `;
}

function startGame() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="game-area">
            <div class="game-hud" id="ns-hud">
                <div class="hud-item"><span class="hud-label">SCORE </span><span class="hud-value" id="ns-score">0</span></div>
                <div class="hud-item"><span class="hud-label">LENGTH </span><span class="hud-value" id="ns-length">3</span></div>
                <div class="hud-item" id="ns-powerup-display"></div>
                <button class="btn-retro btn-sm" onclick="window.NeonSnakeGame.cleanup(); window.router.navigate('arcade');">← ARCADE</button>
            </div>
            <div class="canvas-container">
                <canvas id="ns-canvas" width="${W}" height="${H}"></canvas>
            </div>
        </div>
    `;

    canvas = document.getElementById('ns-canvas');
    ctx = canvas.getContext('2d');

    // Init state
    score = 0;
    speedMultiplier = 1;
    scoreMultiplier = 1;
    powerupTimer = 0;
    moveTimer = 0;
    baseMoveInterval = 8;
    flashTimer = 0;
    particles = [];
    gridFlash = [];
    gameActive = true;

    // Start snake in center
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };

    spawnFood();
    powerup = null;

    document.addEventListener('keydown', onKeyDown);
    animFrame = requestAnimationFrame(loop);
}

function onKeyDown(e) {
    const key = e.key;
    if ((key === 'ArrowUp' || key === 'w' || key === 'W') && direction.y === 0) {
        nextDirection = { x: 0, y: -1 };
    } else if ((key === 'ArrowDown' || key === 's' || key === 'S') && direction.y === 0) {
        nextDirection = { x: 0, y: 1 };
    } else if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && direction.x === 0) {
        nextDirection = { x: -1, y: 0 };
    } else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && direction.x === 0) {
        nextDirection = { x: 1, y: 0 };
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) e.preventDefault();
}

function spawnFood() {
    let pos;
    do {
        pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
}

function spawnPowerup() {
    if (powerup) return;
    let pos;
    do {
        pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y) || (food && food.x === pos.x && food.y === pos.y));
    const types = ['speed', 'slow', 'mega'];
    powerup = { ...pos, type: types[Math.floor(Math.random() * types.length)], life: 400 };
}

function loop() {
    if (!gameActive) return;
    update();
    render();
    animFrame = requestAnimationFrame(loop);
}

function update() {
    moveTimer++;
    const interval = Math.max(3, baseMoveInterval * speedMultiplier);

    // Powerup timer countdown
    if (powerupTimer > 0) {
        powerupTimer--;
        if (powerupTimer <= 0) {
            speedMultiplier = 1;
            scoreMultiplier = 1;
        }
    }

    // Powerup item lifetime
    if (powerup) {
        powerup.life--;
        if (powerup.life <= 0) powerup = null;
    }

    // Random powerup spawn
    if (!powerup && Math.random() < 0.003) spawnPowerup();

    // Flash timer
    if (flashTimer > 0) flashTimer--;

    // Move snake
    if (moveTimer >= interval) {
        moveTimer = 0;
        direction = { ...nextDirection };

        const head = snake[0];
        let newHead = { x: head.x + direction.x, y: head.y + direction.y };

        // Wrap-around walls
        if (newHead.x < 0) newHead.x = COLS - 1;
        if (newHead.x >= COLS) newHead.x = 0;
        if (newHead.y < 0) newHead.y = ROWS - 1;
        if (newHead.y >= ROWS) newHead.y = 0;

        // Self-collision
        if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
            endGame();
            return;
        }

        snake.unshift(newHead);

        // Check food
        let ate = false;
        if (food && newHead.x === food.x && newHead.y === food.y) {
            const pts = 100 * scoreMultiplier;
            score += pts;
            flashTimer = 8;
            spawnParticles(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, '#ff6b35', 8);
            gridFlash.push({ x: food.x, y: food.y, life: 15 });
            spawnFood();
            ate = true;

            // Gradually speed up
            if (snake.length % 5 === 0 && baseMoveInterval > 4) {
                baseMoveInterval -= 0.3;
            }
        }

        // Check powerup
        if (powerup && newHead.x === powerup.x && newHead.y === powerup.y) {
            if (powerup.type === 'speed') {
                scoreMultiplier = 2;
                powerupTimer = 300;
            } else if (powerup.type === 'slow') {
                speedMultiplier = 1.5;
                powerupTimer = 300;
            } else if (powerup.type === 'mega') {
                score += 500;
                flashTimer = 15;
            }
            spawnParticles(powerup.x * CELL + CELL / 2, powerup.y * CELL + CELL / 2, '#b44aff', 12);
            powerup = null;
            ate = true;
        }

        if (!ate) snake.pop();
    }

    // Update particles
    particles = particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; p.vy += 0.05; return p.life > 0; });

    // Grid flash decay
    gridFlash = gridFlash.filter(g => { g.life--; return g.life > 0; });

    // Update HUD
    const scoreEl = document.getElementById('ns-score');
    const lenEl = document.getElementById('ns-length');
    const puEl = document.getElementById('ns-powerup-display');
    if (scoreEl) scoreEl.textContent = score.toLocaleString();
    if (lenEl) lenEl.textContent = snake.length;
    if (puEl) {
        let puText = '';
        if (scoreMultiplier > 1) puText += '⚡2x SCORE ';
        if (speedMultiplier > 1) puText += '🐌 SLOW MODE ';
        puEl.innerHTML = puText ? `<span class="hud-value success">${puText}</span>` : '';
    }
}

function spawnParticles(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            life: 20 + Math.random() * 15,
            color,
            size: 2 + Math.random() * 3
        });
    }
}

function render() {
    // Background
    ctx.fillStyle = '#020210';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL, 0);
        ctx.lineTo(x * CELL, H);
        ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL);
        ctx.lineTo(W, y * CELL);
        ctx.stroke();
    }

    // Grid flash effects
    gridFlash.forEach(g => {
        const alpha = g.life / 15 * 0.3;
        ctx.fillStyle = `rgba(255, 107, 53, ${alpha})`;
        ctx.fillRect(g.x * CELL, g.y * CELL, CELL, CELL);
    });

    // Screen flash on eat
    if (flashTimer > 0) {
        ctx.fillStyle = `rgba(0, 212, 255, ${flashTimer / 30})`;
        ctx.fillRect(0, 0, W, H);
    }

    // Snake body
    snake.forEach((seg, i) => {
        const t = i / snake.length;
        const hue = (120 + i * 3) % 360;
        const brightness = i === 0 ? 100 : 70 - t * 30;

        ctx.fillStyle = `hsl(${hue}, 100%, ${brightness}%)`;
        if (i === 0) {
            ctx.shadowColor = 'rgba(0, 255, 136, 0.8)';
            ctx.shadowBlur = 15;
        } else {
            ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.3)`;
            ctx.shadowBlur = 6;
        }

        const padding = i === 0 ? 1 : 2;
        ctx.beginPath();
        ctx.roundRect(seg.x * CELL + padding, seg.y * CELL + padding, CELL - padding * 2, CELL - padding * 2, 4);
        ctx.fill();

        // Eyes on head
        if (i === 0) {
            ctx.fillStyle = '#020210';
            ctx.shadowBlur = 0;
            const eyeSize = 3;
            const eyeOffX = direction.x * 3;
            const eyeOffY = direction.y * 3;
            ctx.beginPath();
            ctx.arc(seg.x * CELL + CELL / 2 - 4 + eyeOffX, seg.y * CELL + CELL / 2 - 2 + eyeOffY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(seg.x * CELL + CELL / 2 + 4 + eyeOffX, seg.y * CELL + CELL / 2 - 2 + eyeOffY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Food
    if (food) {
        const pulse = 0.85 + Math.sin(Date.now() * 0.006) * 0.15;
        ctx.save();
        ctx.translate(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#ff6b35';
        ctx.shadowColor = 'rgba(255, 107, 53, 0.8)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, CELL / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        // Inner glow
        ctx.fillStyle = '#ffe033';
        ctx.beginPath();
        ctx.arc(-2, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Powerup
    if (powerup) {
        const pulse = 0.8 + Math.sin(Date.now() * 0.008) * 0.2;
        const blink = powerup.life < 100 ? Math.sin(Date.now() * 0.02) > 0 : true;
        if (blink) {
            ctx.save();
            ctx.translate(powerup.x * CELL + CELL / 2, powerup.y * CELL + CELL / 2);
            ctx.scale(pulse, pulse);
            if (powerup.type === 'speed') {
                ctx.fillStyle = '#ffe033';
                ctx.shadowColor = 'rgba(255, 224, 51, 0.8)';
            } else if (powerup.type === 'slow') {
                ctx.fillStyle = '#00ff88';
                ctx.shadowColor = 'rgba(0, 255, 136, 0.8)';
            } else {
                ctx.fillStyle = '#ff3366';
                ctx.shadowColor = 'rgba(255, 51, 102, 0.8)';
            }
            ctx.shadowBlur = 14;
            ctx.fillRect(-CELL / 2 + 2, -CELL / 2 + 2, CELL - 4, CELL - 4);
            ctx.fillStyle = '#020210';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const icon = powerup.type === 'speed' ? '⚡' : powerup.type === 'slow' ? '🐌' : '💎';
            ctx.fillText(icon, 0, 1);
            ctx.restore();
        }
    }

    // Particles
    ctx.shadowBlur = 0;
    particles.forEach(p => {
        const alpha = p.life / 35;
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
}

function endGame() {
    gameActive = false;
    cancelAnimationFrame(animFrame);
    document.removeEventListener('keydown', onKeyDown);

    const user = window.auth.getCurrentUser();
    if (user && score > 0) window.leaderboard.addScore('neon-snake', user, score);

    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.innerHTML = `
        <div class="game-over-box">
            <h2 class="result-lose">GAME OVER</h2>
            <p class="final-score">SCORE: ${score.toLocaleString()}</p>
            <p class="final-word">Snake length: <strong style="color:var(--success);text-shadow:0 0 8px rgba(0,255,136,0.6);">${snake.length}</strong></p>
            ${!user ? '<p style="color:var(--white-dim);font-size:12px;margin-bottom:16px;">Log in to save your score!</p>' : ''}
            <div class="go-buttons">
                <button class="btn-retro btn-orange" onclick="this.closest('.game-over-overlay').remove(); window.NeonSnakeGame.startGame();">▶ PLAY AGAIN</button>
                <button class="btn-retro btn-purple" onclick="this.closest('.game-over-overlay').remove(); window.router.navigate('neon-snake');">TITLE</button>
                <button class="btn-retro" onclick="this.closest('.game-over-overlay').remove(); window.router.navigate('arcade');">← ARCADE</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function cleanup() {
    gameActive = false;
    cancelAnimationFrame(animFrame);
    document.removeEventListener('keydown', onKeyDown);
}

const NeonSnakeGame = { renderTitleScreen, startGame, cleanup };
window.NeonSnakeGame = NeonSnakeGame;
export default NeonSnakeGame;
