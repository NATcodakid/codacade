/* ============================================
   CODACADE — App Router & Game Registry
   ============================================ */
window.router = (() => {
    // Game registry — add new games here
    const games = [
        {
            id: 'hangman',
            title: 'HANGMAN',
            subtitle: '80s Edition',
            description: 'Guess the 80s word before time runs out! Timed rounds add arcade pressure to this classic.',
            icon: '💀',
            image: 'assets/hangman_cover.png',
            bannerClass: 'hangman-banner',
            module: window.HangmanGame
        },
        {
            id: 'star-blaster',
            title: 'STAR BLASTER',
            subtitle: 'Galaga-style Shooter',
            description: 'Defend the galaxy! Blast through waves of enemies and grab power-ups to survive.',
            icon: '🚀',
            image: 'assets/star_blaster_cover.png',
            bannerClass: 'starblaster-banner',
            module: window.StarBlasterGame
        }
    ];

    function navigate(view) {
        // Cleanup any active games
        games.forEach(g => {
            if (g.module.cleanup) g.module.cleanup();
        });

        // Remove any game-over overlays
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
        const cards = games.map(game => `
            <div class="game-card slide-up" onclick="window.router.navigate('${game.id}')" style="animation-delay: ${games.indexOf(game) * 0.1}s">
                <div class="game-card-banner ${game.bannerClass}" style="background-image: url('${game.image}')">
                    <span class="card-icon">${game.image ? '' : game.icon}</span>
                </div>
                <div class="game-card-body">
                    <h3>${game.title}</h3>
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
            </div>
        `;

        // Render leaderboards on homepage
        setTimeout(() => {
            window.leaderboard.renderLeaderboard('hangman', 'arcade-leaderboard-hangman');
            window.leaderboard.renderLeaderboard('star-blaster', 'arcade-leaderboard-starblaster');
        }, 50);
    }

    function renderGameTitle(main, game) {
        main.innerHTML = game.module.renderTitleScreen();
        // Render leaderboard on title screen
        setTimeout(() => {
            const lbId = game.id === 'hangman' ? 'hangman-leaderboard' : 'starblaster-leaderboard';
            window.leaderboard.renderLeaderboard(game.id, lbId);
        }, 50);
    }

    // Generate stars on load
    function generateStars() {
        const container = document.getElementById('stars');
        if (!container) return;
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.setProperty('--dur', (2 + Math.random() * 4) + 's');
            star.style.animationDelay = Math.random() * 4 + 's';
            container.appendChild(star);
        }
    }

    // Init
    function init() {
        generateStars();
        window.auth.updateHeaderUI();
        navigate('arcade');
    }

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { navigate, games };
})();
