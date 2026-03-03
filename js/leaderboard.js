/* ============================================
   CODACADE — Leaderboard Module
   ============================================ */
window.leaderboard = (() => {
    const SCORES_KEY = 'codacade_scores';

    function getScores() {
        try { return JSON.parse(localStorage.getItem(SCORES_KEY) || '[]'); }
        catch { return []; }
    }

    function saveScores(scores) {
        localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
    }

    function addScore(gameId, username, score) {
        const scores = getScores();
        scores.push({
            gameId,
            username,
            score,
            date: new Date().toISOString().split('T')[0]
        });
        saveScores(scores);
    }

    function getTopScores(gameId, limit = 10) {
        const scores = getScores();
        return scores
            .filter(s => s.gameId === gameId)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    function renderLeaderboard(gameId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const top = getTopScores(gameId);

        if (top.length === 0) {
            container.innerHTML = `
                <div class="leaderboard-section">
                    <h3>🏆 HIGH SCORES</h3>
                    <p class="lb-empty">No scores yet. Be the first!</p>
                </div>
            `;
            return;
        }

        let rows = top.map((s, i) => {
            const rankClass = i < 3 ? ` class="rank-${i + 1}"` : '';
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
            return `<tr${rankClass}><td>${medal}</td><td>${s.username}</td><td>${s.score.toLocaleString()}</td><td>${s.date}</td></tr>`;
        }).join('');

        const title = gameId.toUpperCase().replace('-', ' ');
        container.innerHTML = `
            <div class="leaderboard-section">
                <h3>🏆 ${title} HIGH SCORES</h3>
                <table class="leaderboard-table">
                    <thead><tr><th>#</th><th>Player</th><th>Score</th><th>Date</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    return { addScore, getTopScores, renderLeaderboard };
})();
