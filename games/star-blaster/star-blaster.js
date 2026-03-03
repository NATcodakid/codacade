/* ============================================
   CODACADE — Star Blaster (Galaga-style Shooter)
   ============================================ */
window.StarBlasterGame = (() => {
    let canvas, ctx;
    let animFrame;
    let gameActive = false;
    let score = 0;
    let lives = 3;
    let wave = 1;
    let player, bullets, enemies, enemyBullets, powerups, particles, stars;
    let keys = {};
    let shootCooldown = 0;
    let waveDelay = 0;
    let rapidFire = 0;
    let shield = 0;
    let doubleDamage = 0;

    const W = 480;
    const H = 640;

    function renderTitleScreen() {
        return `
            <div class="title-screen">
                <h2 style="color: var(--blue); text-shadow: var(--glow-blue);">STAR BLASTER</h2>
                <p class="game-subtitle">Defend the Galaxy!</p>
                <div class="how-to-play">
                    <h3>HOW TO PLAY</h3>
                    <ul>
                        <li>Use <strong style="color:var(--blue);">← → Arrow Keys</strong> or <strong style="color:var(--blue);">A / D</strong> to move</li>
                        <li>Press <strong style="color:var(--orange);">SPACE</strong> to shoot</li>
                        <li>Destroy enemy waves to progress</li>
                        <li>Collect <strong style="color:var(--success);">power-ups</strong> dropped by enemies: rapid fire, shields, double damage</li>
                        <li>Survive as long as you can!</li>
                    </ul>
                </div>
                <div class="title-buttons">
                    <button class="btn-retro btn-orange btn-lg" onclick="window.StarBlasterGame.startGame()">▶ PLAY</button>
                    <button class="btn-retro btn-purple" onclick="window.router.navigate('arcade')">← BACK TO ARCADE</button>
                </div>
                <div id="starblaster-leaderboard"></div>
            </div>
        `;
    }

    function startGame() {
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <div class="game-area">
                <div class="game-hud" id="sb-hud">
                    <div class="hud-item"><span class="hud-label">SCORE </span><span class="hud-value" id="sb-score">0</span></div>
                    <div class="hud-item"><span class="hud-label">WAVE </span><span class="hud-value" id="sb-wave">1</span></div>
                    <div class="hud-item"><span class="hud-label">LIVES </span><span class="hud-value" id="sb-lives">❤️❤️❤️</span></div>
                    <div class="hud-item" id="sb-powerup-display"></div>
                    <button class="btn-retro btn-sm" onclick="window.StarBlasterGame.cleanup(); window.router.navigate('arcade');">← ARCADE</button>
                </div>
                <div class="canvas-container">
                    <canvas id="sb-canvas" width="${W}" height="${H}"></canvas>
                </div>
            </div>
        `;

        canvas = document.getElementById('sb-canvas');
        ctx = canvas.getContext('2d');
        score = 0;
        lives = 3;
        wave = 1;
        rapidFire = 0;
        shield = 0;
        doubleDamage = 0;
        shootCooldown = 0;
        waveDelay = 0;
        gameActive = true;

        player = { x: W / 2, y: H - 60, w: 32, h: 32, speed: 5 };
        bullets = [];
        enemies = [];
        enemyBullets = [];
        powerups = [];
        particles = [];
        stars = [];

        // Create starfield
        for (let i = 0; i < 80; i++) {
            stars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                speed: 0.5 + Math.random() * 2,
                size: Math.random() * 2 + 0.5
            });
        }

        spawnWave();

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        animFrame = requestAnimationFrame(loop);
    }

    function onKeyDown(e) {
        keys[e.key] = true;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
            e.preventDefault();
        }
    }
    function onKeyUp(e) { keys[e.key] = false; }

    function spawnWave() {
        const rows = Math.min(3 + Math.floor(wave / 2), 6);
        const cols = Math.min(5 + Math.floor(wave / 3), 9);
        const spacing = 48;
        const startX = (W - cols * spacing) / 2 + spacing / 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const type = row < 1 ? 2 : row < 2 ? 1 : 0;
                enemies.push({
                    x: startX + col * spacing,
                    y: -40 - row * 50,
                    targetY: 60 + row * 44,
                    w: 28,
                    h: 28,
                    type: type,
                    hp: type + 1,
                    entering: true,
                    shootTimer: 150 + Math.random() * 300, // Slower fire rate
                    wobble: Math.random() * Math.PI * 2,
                    wobbleSpeed: 0.01 + Math.random() * 0.01 // Slower horizontal wobble
                });
            }
        }
    }

    function loop() {
        if (!gameActive) return;
        update();
        render();
        animFrame = requestAnimationFrame(loop);
    }

    function update() {
        // Player movement
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= player.speed;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += player.speed;
        player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x));

        // Shooting
        shootCooldown = Math.max(0, shootCooldown - 1);
        if (keys[' '] && shootCooldown <= 0) {
            const dmg = doubleDamage > 0 ? 2 : 1;
            bullets.push({ x: player.x, y: player.y - player.h / 2, speed: 8, dmg });
            shootCooldown = rapidFire > 0 ? 5 : 12;
        }

        // Update power-up timers
        if (rapidFire > 0) rapidFire--;
        if (shield > 0) shield--;
        if (doubleDamage > 0) doubleDamage--;

        // Bullets
        bullets = bullets.filter(b => {
            b.y -= b.speed;
            return b.y > -10;
        });

        // Enemy bullets
        enemyBullets = enemyBullets.filter(b => {
            b.y += b.speed;
            return b.y < H + 10;
        });

        // Enemies
        enemies.forEach(e => {
            if (e.entering) {
                e.y += (e.targetY - e.y) * 0.04;
                if (Math.abs(e.y - e.targetY) < 1) {
                    e.y = e.targetY;
                    e.entering = false;
                }
            } else {
                e.wobble += e.wobbleSpeed;
                e.x += Math.sin(e.wobble) * 0.8;
            }

            // Enemy shooting
            e.shootTimer--;
            if (e.shootTimer <= 0 && !e.entering) {
                e.shootTimer = 180 + Math.random() * (250 - wave * 10);
                enemyBullets.push({ x: e.x, y: e.y + e.h / 2, speed: 1.5 + wave * 0.2 }); // Slower bullets
            }
        });

        // Bullet-enemy collision
        bullets = bullets.filter(b => {
            let hit = false;
            enemies = enemies.filter(e => {
                if (Math.abs(b.x - e.x) < (e.w / 2 + 4) && Math.abs(b.y - e.y) < (e.h / 2 + 4)) {
                    e.hp -= b.dmg;
                    hit = true;
                    if (e.hp <= 0) {
                        const points = (e.type + 1) * 100 * wave;
                        score += points;
                        spawnParticles(e.x, e.y, e.type);
                        // Power-up drop
                        if (Math.random() < 0.12) {
                            const types = ['rapid', 'shield', 'double'];
                            powerups.push({
                                x: e.x, y: e.y,
                                type: types[Math.floor(Math.random() * types.length)],
                                speed: 1.5
                            });
                        }
                        return false;
                    }
                    spawnParticles(e.x, e.y, -1, 3);
                }
                return true;
            });
            return !hit;
        });

        // Enemy bullet - player collision
        if (shield <= 0) {
            enemyBullets = enemyBullets.filter(b => {
                if (Math.abs(b.x - player.x) < (player.w / 2 + 3) && Math.abs(b.y - player.y) < (player.h / 2 + 3)) {
                    lives--;
                    spawnParticles(player.x, player.y, 3, 8);
                    if (lives <= 0) { endGame(); }
                    return false;
                }
                return true;
            });
        }

        // Enemy - player collision
        enemies.forEach(e => {
            if (Math.abs(e.x - player.x) < (e.w / 2 + player.w / 2) && Math.abs(e.y - player.y) < (e.h / 2 + player.h / 2)) {
                if (shield <= 0) {
                    lives--;
                    spawnParticles(player.x, player.y, 3, 8);
                    if (lives <= 0) { endGame(); }
                }
            }
        });

        // Power-ups
        powerups = powerups.filter(p => {
            p.y += p.speed;
            if (Math.abs(p.x - player.x) < 24 && Math.abs(p.y - player.y) < 24) {
                if (p.type === 'rapid') rapidFire = 300;
                else if (p.type === 'shield') shield = 300;
                else if (p.type === 'double') doubleDamage = 300;
                return false;
            }
            return p.y < H + 20;
        });

        // Particles
        particles = particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });

        // Stars
        stars.forEach(s => {
            s.y += s.speed;
            if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
        });

        // Wave complete
        if (enemies.length === 0 && gameActive) {
            waveDelay++;
            if (waveDelay > 60) {
                wave++;
                score += 250 * wave;
                waveDelay = 0;
                spawnWave();
            }
        }

        // Update HUD
        const scoreEl = document.getElementById('sb-score');
        const waveEl = document.getElementById('sb-wave');
        const livesEl = document.getElementById('sb-lives');
        const puEl = document.getElementById('sb-powerup-display');
        if (scoreEl) scoreEl.textContent = score.toLocaleString();
        if (waveEl) waveEl.textContent = wave;
        if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
        if (puEl) {
            let puText = '';
            if (rapidFire > 0) puText += '⚡RAPID ';
            if (shield > 0) puText += '🛡️SHIELD ';
            if (doubleDamage > 0) puText += '💥DOUBLE ';
            puEl.innerHTML = puText ? `<span class="hud-value success">${puText}</span>` : '';
        }
    }

    function spawnParticles(x, y, type, count = 6) {
        const colors = ['#00d4ff', '#ff6b35', '#b44aff', '#ff3366'];
        const color = type >= 0 && type < colors.length ? colors[type] : colors[Math.floor(Math.random() * colors.length)];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20 + Math.random() * 20,
                color,
                size: 2 + Math.random() * 3
            });
        }
    }

    function render() {
        ctx.fillStyle = '#020210';
        ctx.fillRect(0, 0, W, H);

        // Stars
        stars.forEach(s => {
            ctx.fillStyle = `rgba(255,255,255,${0.3 + s.speed * 0.2})`;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        // Player
        ctx.save();
        ctx.translate(player.x, player.y);
        // Ship body
        ctx.fillStyle = '#00d4ff';
        ctx.shadowColor = 'rgba(0, 212, 255, 0.8)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(-14, 14);
        ctx.lineTo(-6, 8);
        ctx.lineTo(0, 12);
        ctx.lineTo(6, 8);
        ctx.lineTo(14, 14);
        ctx.closePath();
        ctx.fill();
        // Engine glow
        ctx.fillStyle = '#ff6b35';
        ctx.shadowColor = 'rgba(255, 107, 53, 0.8)';
        ctx.beginPath();
        ctx.moveTo(-5, 12);
        ctx.lineTo(0, 18 + Math.random() * 4);
        ctx.lineTo(5, 12);
        ctx.closePath();
        ctx.fill();
        // Shield effect
        if (shield > 0) {
            ctx.strokeStyle = `rgba(0, 255, 136, ${0.4 + Math.sin(Date.now() * 0.01) * 0.2})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();

        // Bullets
        bullets.forEach(b => {
            ctx.fillStyle = b.dmg > 1 ? '#ff6b35' : '#00d4ff';
            ctx.shadowColor = b.dmg > 1 ? 'rgba(255,107,53,0.8)' : 'rgba(0,212,255,0.8)';
            ctx.shadowBlur = 8;
            ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
        });

        // Enemy bullets
        ctx.shadowBlur = 6;
        enemyBullets.forEach(b => {
            ctx.fillStyle = '#ff3366';
            ctx.shadowColor = 'rgba(255,51,102,0.6)';
            ctx.beginPath();
            ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Enemies
        enemies.forEach(e => {
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.shadowBlur = 10;

            if (e.type === 0) {
                // Basic enemy (green)
                ctx.fillStyle = '#00ff88';
                ctx.shadowColor = 'rgba(0,255,136,0.6)';
                ctx.fillRect(-12, -10, 24, 20);
                ctx.fillStyle = '#020210';
                ctx.fillRect(-8, -4, 6, 6);
                ctx.fillRect(2, -4, 6, 6);
            } else if (e.type === 1) {
                // Medium enemy (purple)
                ctx.fillStyle = '#b44aff';
                ctx.shadowColor = 'rgba(180,74,255,0.6)';
                ctx.beginPath();
                ctx.moveTo(0, -14);
                ctx.lineTo(16, 6);
                ctx.lineTo(10, 14);
                ctx.lineTo(-10, 14);
                ctx.lineTo(-16, 6);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#020210';
                ctx.fillRect(-5, -2, 4, 4);
                ctx.fillRect(1, -2, 4, 4);
            } else {
                // Boss enemy (orange)
                ctx.fillStyle = '#ff6b35';
                ctx.shadowColor = 'rgba(255,107,53,0.6)';
                ctx.beginPath();
                ctx.arc(0, 0, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#020210';
                ctx.fillRect(-8, -4, 6, 6);
                ctx.fillRect(2, -4, 6, 6);
                ctx.fillStyle = '#ff3366';
                ctx.fillRect(-6, 4, 12, 3);
            }
            ctx.restore();
        });

        // Power-ups
        ctx.shadowBlur = 12;
        powerups.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            const pulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
            ctx.scale(pulse, pulse);
            if (p.type === 'rapid') {
                ctx.fillStyle = '#ffe033';
                ctx.shadowColor = 'rgba(255,224,51,0.8)';
                ctx.fillRect(-8, -8, 16, 16);
                ctx.fillStyle = '#020210';
                ctx.font = '10px sans-serif';
                ctx.fillText('⚡', -6, 5);
            } else if (p.type === 'shield') {
                ctx.fillStyle = '#00ff88';
                ctx.shadowColor = 'rgba(0,255,136,0.8)';
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#020210';
                ctx.font = '10px sans-serif';
                ctx.fillText('🛡', -7, 5);
            } else {
                ctx.fillStyle = '#ff3366';
                ctx.shadowColor = 'rgba(255,51,102,0.8)';
                ctx.fillRect(-8, -8, 16, 16);
                ctx.fillStyle = '#020210';
                ctx.font = '10px sans-serif';
                ctx.fillText('💥', -7, 5);
            }
            ctx.restore();
        });

        // Particles
        ctx.shadowBlur = 0;
        particles.forEach(p => {
            const alpha = p.life / 40;
            ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });

        // Wave announcement
        if (enemies.length === 0 && waveDelay > 0 && waveDelay < 60) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(255,255,255,0.8)';
            ctx.shadowBlur = 20;
            ctx.font = '24px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`WAVE ${wave + 1}`, W / 2, H / 2);
        }

        ctx.shadowBlur = 0;
    }

    function endGame() {
        gameActive = false;
        cancelAnimationFrame(animFrame);
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);

        const user = window.auth.getCurrentUser();
        if (user && score > 0) {
            window.leaderboard.addScore('star-blaster', user, score);
        }

        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <div class="game-over-box">
                <h2 class="result-lose">GAME OVER</h2>
                <p class="final-score">SCORE: ${score.toLocaleString()}</p>
                <p class="final-word">You reached <strong style="color:var(--blue);text-shadow:var(--glow-blue);">Wave ${wave}</strong></p>
                ${!user ? '<p style="color:var(--white-dim);font-size:12px;margin-bottom:16px;">Log in to save your score!</p>' : ''}
                <div class="go-buttons">
                    <button class="btn-retro btn-orange" onclick="this.closest('.game-over-overlay').remove(); window.StarBlasterGame.startGame();">▶ PLAY AGAIN</button>
                    <button class="btn-retro btn-purple" onclick="this.closest('.game-over-overlay').remove(); window.router.navigate('star-blaster');">TITLE</button>
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
        document.removeEventListener('keyup', onKeyUp);
        keys = {};
    }

    return { renderTitleScreen, startGame, cleanup };
})();
