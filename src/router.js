/* ============================================
   CODACADE — App Router & Game Registry (ES Module)
   ============================================ */
import auth from './auth.js';
import leaderboard from './leaderboard.js';
import HangmanGame from './games/hangman/hangman.js';
import StarBlasterGame from './games/star-blaster/star-blaster.js';
import NeonSnakeGame from './games/neon-snake/neon-snake.js';

const games = [
    {
        id: 'hangman',
        title: 'HANGMAN',
        subtitle: '80s Edition',
        description: 'Guess the 80s word before time runs out! Timed rounds add arcade pressure to this classic.',
        icon: '💀',
        image: 'hangman_cover.png',
        bannerClass: 'hangman-banner',
        module: HangmanGame
    },
    {
        id: 'star-blaster',
        title: 'STAR BLASTER',
        subtitle: 'Galaga-style Shooter',
        description: 'Defend the galaxy! Blast through waves of enemies and grab power-ups to survive.',
        icon: '🚀',
        image: 'star_blaster_cover.png',
        bannerClass: 'starblaster-banner',
        module: StarBlasterGame
    },
    {
        id: 'neon-snake',
        title: 'NEON SNAKE',
        subtitle: 'Arcade Serpent',
        description: 'Eat neon fruit, grow your glowing snake, and grab power-ups. Walls wrap around!',
        icon: '🐍',
        image: 'neon_snake_cover.png',
        bannerClass: 'neonsnake-banner',
        module: NeonSnakeGame
    }
];

function navigate(view) {
    games.forEach(g => { if (g.module.cleanup) g.module.cleanup(); });
    document.querySelectorAll('.game-over-overlay').forEach(el => el.remove());

    const main = document.getElementById('main-content');
    window.scrollTo(0, 0);

    if (view === 'arcade' || !view) {
        renderArcade(main);
    } else {
        const game = games.find(g => g.id === view);
        if (game) {
            renderGameTitle(main, game);
        } else {
            renderArcade(main);
        }
    }
}

function renderArcade(main) {
    const cards = games.map((game, idx) => `
        <div class="game-card slide-up" onclick="window.router.navigate('${game.id}')" style="animation-delay: ${idx * 0.1}s">
            <div class="game-card-banner ${game.bannerClass}" style="background-image: url('${game.image}')">
                <span class="card-icon">${game.image ? '' : game.icon}</span>
            </div>
            <div class="game-card-body">
                <h3>${game.title}</h3>
                <p class="card-subtitle">${game.subtitle}</p>
                <p>${game.description}</p>
                <button class="btn-retro btn-orange btn-sm" onclick="event.stopPropagation(); window.router.navigate('${game.id}');">▶ PLAY</button>
            </div>
        </div>
    `).join('');

    main.innerHTML = `
        <div class="fade-in">
            <div class="arcade-title">
                <h2>SELECT YOUR GAME</h2>
            </div>
            <p class="arcade-subtitle">Choose a game and show us what you've got, player.</p>
            <div class="game-grid">${cards}</div>
            <div id="arcade-leaderboard-hangman"></div>
            <div id="arcade-leaderboard-starblaster" style="margin-top:12px;"></div>
            <div id="arcade-leaderboard-neonsnake" style="margin-top:12px;"></div>
        </div>
    `;

    setTimeout(() => {
        leaderboard.renderLeaderboard('hangman', 'arcade-leaderboard-hangman');
        leaderboard.renderLeaderboard('star-blaster', 'arcade-leaderboard-starblaster');
        leaderboard.renderLeaderboard('neon-snake', 'arcade-leaderboard-neonsnake');
    }, 50);
}

function renderGameTitle(main, game) {
    main.innerHTML = game.module.renderTitleScreen();
    setTimeout(() => {
        const lbMap = {
            'hangman': 'hangman-leaderboard',
            'star-blaster': 'starblaster-leaderboard',
            'neon-snake': 'neonsnake-leaderboard'
        };
        leaderboard.renderLeaderboard(game.id, lbMap[game.id] || `${game.id}-leaderboard`);
    }, 50);
}

function generateStars() {
    const container = document.getElementById('stars');
    if (!container) return;
    for (let i = 0; i < 120; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.setProperty('--dur', (2 + Math.random() * 4) + 's');
        star.style.animationDelay = Math.random() * 4 + 's';
        container.appendChild(star);
    }
}

function init() {
    generateStars();
    auth.updateHeaderUI();
    navigate('arcade');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

const router = { navigate, games };
window.router = router;
export default router;
