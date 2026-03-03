/* ============================================
   CODACADE — Auth Module (ES Module)
   ============================================ */

const USERS_KEY = 'codacade_users';
const TOKEN_KEY = 'codacade_token';

async function hashPassword(pw) {
    const enc = new TextEncoder().encode(pw);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function createToken(username) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: username, iat: Date.now() }));
    const sig = btoa('codacade_secret_sig');
    return `${header}.${payload}.${sig}`;
}

function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
    catch { return {}; }
}

function getCurrentUser() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub;
    } catch { return null; }
}

async function signup(username, password) {
    const users = getUsers();
    if (users[username]) return { ok: false, msg: 'Username taken.' };
    users[username] = await hashPassword(password);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(TOKEN_KEY, createToken(username));
    return { ok: true };
}

async function login(username, password) {
    const users = getUsers();
    const hash = await hashPassword(password);
    if (!users[username] || users[username] !== hash) return { ok: false, msg: 'Invalid credentials.' };
    localStorage.setItem(TOKEN_KEY, createToken(username));
    return { ok: true };
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
}

function updateHeaderUI() {
    const right = document.getElementById('header-right');
    if (!right) return;
    const user = getCurrentUser();
    if (user) {
        right.innerHTML = `
            <span class="user-display">▸ ${user}</span>
            <button class="btn-retro btn-sm btn-orange" onclick="window.auth.logout(); window.auth.updateHeaderUI();">LOGOUT</button>
        `;
    } else {
        right.innerHTML = `<button class="btn-retro btn-sm" id="auth-btn" onclick="window.auth.showModal()">LOGIN</button>`;
    }
}

let currentTab = 'login';

function showModal() {
    document.getElementById('auth-modal').style.display = 'flex';
    switchTab('login');
}

function hideModal() {
    document.getElementById('auth-modal').style.display = 'none';
    document.getElementById('auth-error').textContent = '';
}

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
    document.getElementById('auth-submit').textContent = tab === 'login' ? 'LOGIN' : 'SIGN UP';
}

async function handleSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const errEl = document.getElementById('auth-error');

    const result = currentTab === 'login'
        ? await login(username, password)
        : await signup(username, password);

    if (result.ok) {
        hideModal();
        updateHeaderUI();
    } else {
        errEl.textContent = result.msg;
    }
    return false;
}

const auth = { getCurrentUser, signup, login, logout, updateHeaderUI, showModal, hideModal, switchTab, handleSubmit };
window.auth = auth;
export default auth;
