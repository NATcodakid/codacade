/* ============================================
   CODACADE — Auth Module (Client-side JWT prototype)
   ============================================ */
window.auth = (() => {
    const USERS_KEY = 'codacade_users';
    const TOKEN_KEY = 'codacade_token';
    let currentMode = 'login';

    // Simple hash using SubtleCrypto
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'codacade_salt_80s');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Simple JWT-like token (base64 encoded JSON — prototype only)
    function createToken(username) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            sub: username,
            iat: Date.now(),
            exp: Date.now() + 24 * 60 * 60 * 1000 // 24h
        }));
        const signature = btoa(username + '_codacade_secret');
        return `${header}.${payload}.${signature}`;
    }

    function parseToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp < Date.now()) {
                localStorage.removeItem(TOKEN_KEY);
                return null;
            }
            return payload;
        } catch {
            return null;
        }
    }

    function getUsers() {
        try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
        catch { return {}; }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function getCurrentUser() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return null;
        const payload = parseToken(token);
        return payload ? payload.sub : null;
    }

    function isLoggedIn() {
        return getCurrentUser() !== null;
    }

    async function signup(username, password) {
        const users = getUsers();
        const lowerUser = username.toLowerCase();
        if (users[lowerUser]) {
            throw new Error('Username already taken');
        }
        const hash = await hashPassword(password);
        users[lowerUser] = { username: username, hash: hash };
        saveUsers(users);
        const token = createToken(username);
        localStorage.setItem(TOKEN_KEY, token);
        return username;
    }

    async function login(username, password) {
        const users = getUsers();
        const lowerUser = username.toLowerCase();
        const user = users[lowerUser];
        if (!user) {
            throw new Error('Invalid username or password');
        }
        const hash = await hashPassword(password);
        if (user.hash !== hash) {
            throw new Error('Invalid username or password');
        }
        const token = createToken(user.username);
        localStorage.setItem(TOKEN_KEY, token);
        return user.username;
    }

    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        updateHeaderUI();
    }

    function updateHeaderUI() {
        const headerRight = document.getElementById('header-right');
        const user = getCurrentUser();
        if (user) {
            headerRight.innerHTML = `
                <span class="user-display">⚡ ${user.toUpperCase()}</span>
                <button class="btn-retro btn-sm btn-orange" onclick="window.auth.logout()">LOGOUT</button>
            `;
        } else {
            headerRight.innerHTML = `
                <button class="btn-retro btn-sm" id="auth-btn" onclick="window.auth.showModal()">LOGIN</button>
            `;
        }
    }

    function showModal() {
        document.getElementById('auth-modal').style.display = 'flex';
        document.getElementById('auth-error').textContent = '';
        document.getElementById('auth-username').value = '';
        document.getElementById('auth-password').value = '';
        switchTab('login');
    }

    function hideModal() {
        document.getElementById('auth-modal').style.display = 'none';
    }

    function switchTab(mode) {
        currentMode = mode;
        document.getElementById('tab-login').classList.toggle('active', mode === 'login');
        document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
        document.getElementById('auth-submit').textContent = mode === 'login' ? 'LOGIN' : 'SIGN UP';
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const username = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value;
        const errorEl = document.getElementById('auth-error');
        errorEl.textContent = '';

        try {
            if (currentMode === 'signup') {
                await signup(username, password);
            } else {
                await login(username, password);
            }
            hideModal();
            updateHeaderUI();
        } catch (err) {
            errorEl.textContent = err.message;
        }
        return false;
    }

    return {
        getCurrentUser,
        isLoggedIn,
        signup,
        login,
        logout,
        updateHeaderUI,
        showModal,
        hideModal,
        switchTab,
        handleSubmit
    };
})();
