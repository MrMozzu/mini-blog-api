const API_URL = 'http://localhost:5000'; // Or your deployed URL

// --- State Management ---
let state = {
    token: localStorage.getItem('inkwell_token'),
    userId: null,
    userRole: null,
    users: [],
    allPosts: [],
    myPosts: []
};

// --- DOM Elements ---
const screens = {
    auth: document.getElementById('auth-screen'),
    app: document.getElementById('app-screen')
};

const cards = {
    login: document.getElementById('login-card'),
    register: document.getElementById('register-card')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();

    if (state.token) {
        extractUserId();
        checkAdminNav();
        showScreen('app');
        loadAppData();
    } else {
        showScreen('auth');
    }
});

function extractUserId() {
    try {
        const payload = JSON.parse(atob(state.token.split('.')[1]));
        state.userId = parseInt(payload.sub);
        state.userRole = payload.role || 'user';
    } catch (e) {
        logout();
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    // Auth Toggles
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        cards.login.classList.add('hidden');
        cards.register.classList.remove('hidden');
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        cards.register.classList.add('hidden');
        cards.login.classList.remove('hidden');
    });

    // Auth Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Nav Tabs
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            const tabId = e.currentTarget.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');

            if (tabId === 'feed') renderFeed();
            if (tabId === 'my-posts') renderMyPosts();
            if (tabId === 'users') renderUsers();
            if (tabId === 'admin') renderAdminPanel();
        });
    });

    // Modals
    document.getElementById('new-post-btn').addEventListener('click', () => openPostModal());
    document.getElementById('close-post-modal').addEventListener('click', closePostModal);
    document.getElementById('cancel-post-btn').addEventListener('click', closePostModal);
    document.getElementById('post-form').addEventListener('submit', handleSavePost);

    document.getElementById('close-delete-modal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDeletePost);

    // Delete Account Modals
    document.getElementById('delete-account-btn').addEventListener('click', openDeleteAccountModal);
    document.getElementById('close-delete-account-modal').addEventListener('click', closeDeleteAccountModal);
    document.getElementById('cancel-delete-account-btn').addEventListener('click', closeDeleteAccountModal);
    document.getElementById('confirm-delete-account-btn').addEventListener('click', confirmDeleteAccount);

    // Admin Delete User Modals
    document.getElementById('close-delete-user-modal').addEventListener('click', closeDeleteUserModal);
    document.getElementById('cancel-delete-user-btn').addEventListener('click', closeDeleteUserModal);
    document.getElementById('confirm-delete-user-btn').addEventListener('click', confirmDeleteUser);

    document.getElementById('close-view-modal').addEventListener('click', () => {
        document.getElementById('view-post-modal').classList.add('hidden');
    });

    document.getElementById('close-user-posts-modal').addEventListener('click', () => {
        document.getElementById('user-posts-modal').classList.add('hidden');
    });

    // Post Title Char Count
    const titleInput = document.getElementById('post-title');
    const titleCount = document.getElementById('title-count');
    titleInput.addEventListener('input', () => {
        titleCount.textContent = titleInput.value.length;
    });
}

// --- Auth Functions ---
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    setLoading(btn, true);
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok) {
            state.token = data.access_token;
            localStorage.setItem('inkwell_token', state.token);
            extractUserId();
            checkAdminNav();
            showToast('Signed in successfully', 'success');
            showScreen('app');
            loadAppData();
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (err) {
        showToast('Network error. Is the server running?', 'error');
    } finally {
        setLoading(btn, false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('register-btn');
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;

    if (password !== confirm) {
        return showToast('Passwords do not match', 'error');
    }

    setLoading(btn, true);
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok || res.status === 201) {
            showToast('Account created! Please sign in.', 'success');
            document.getElementById('show-login').click();
            document.getElementById('login-email').value = email;
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (err) {
        showToast('Network error. Is the server running?', 'error');
    } finally {
        setLoading(btn, false);
    }
}

function logout() {
    state.token = null;
    state.userId = null;
    state.userRole = null;
    localStorage.removeItem('inkwell_token');
    
    const adminBtn = document.getElementById('nav-admin-btn');
    if (adminBtn) adminBtn.classList.add('hidden');
    
    // Reset tabs to feed tab
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    const feedBtn = document.getElementById('nav-feed-btn');
    if (feedBtn) feedBtn.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const feedTab = document.getElementById('feed-tab');
    if (feedTab) feedTab.classList.add('active');

    showScreen('auth');
}

// --- Data Fetching ---
async function loadAppData() {
    try {
        // Fetch users
        const usersRes = await fetch(`${API_URL}/users/`);
        if (usersRes.ok) {
            state.users = await usersRes.json();
        }

        // Fetch all posts (by fetching each user's posts)
        state.allPosts = [];
        for (const user of state.users) {
            const postsRes = await fetch(`${API_URL}/users/${user.id}/posts`);
            if (postsRes.ok) {
                const posts = await postsRes.json();
                const postsWithUser = posts.map(p => ({ ...p, user: user }));
                state.allPosts.push(...postsWithUser);
            }
        }

        // Sort newest first
        state.allPosts.sort((a, b) => b.id - a.id);

        // Filter my posts
        state.myPosts = state.allPosts.filter(p => p.user_id === state.userId);

        renderFeed();
        renderMyPosts();
        renderUsers();

    } catch (err) {
        showToast('Error loading data', 'error');
    }
}

// --- Rendering ---
function renderFeed() {
    const container = document.getElementById('feed-posts');
    const empty = document.getElementById('feed-empty');

    container.innerHTML = '';
    if (state.allPosts.length === 0) {
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        state.allPosts.forEach(post => {
            container.appendChild(createPostCard(post));
        });
    }
}

function renderMyPosts() {
    const container = document.getElementById('my-posts-list');
    const empty = document.getElementById('my-posts-empty');

    container.innerHTML = '';
    if (state.myPosts.length === 0) {
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        state.myPosts.forEach(post => {
            container.appendChild(createPostCard(post, true));
        });
    }
}

function renderUsers() {
    const container = document.getElementById('users-list');
    const empty = document.getElementById('users-empty');

    container.innerHTML = '';
    if (state.users.length <= 1) {
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        state.users.forEach(user => {
            if (user.id !== state.userId) {
                const card = document.createElement('div');
                card.className = 'user-card';
                
                let adminActionHtml = '';
                if (state.userRole === 'admin') {
                    adminActionHtml = `
                        <button class="action-btn delete-user-btn" style="color: var(--danger); border-color: var(--danger-light); margin-left: auto;" onclick="event.stopPropagation(); openDeleteUserModal(${user.id})">
                            Delete User
                        </button>
                    `;
                }

                card.innerHTML = `
                    <div class="user-avatar-lg">${user.name.charAt(0).toUpperCase()}</div>
                    <div class="user-info" style="flex: 1;">
                        <h3>${escapeHTML(user.name)}</h3>
                        <p>${escapeHTML(user.email)}</p>
                    </div>
                    ${adminActionHtml}
                `;
                
                card.addEventListener('click', (e) => {
                    if (e.target.classList.contains('delete-user-btn')) return;
                    openUserPostsModal(user);
                });
                container.appendChild(card);
            }
        });
    }
}

function createPostCard(post, isOwner = false) {
    const div = document.createElement('div');
    div.className = 'post-card';

    const isMe = post.user_id === state.userId;
    const authorName = post.user ? post.user.name : 'Unknown';
    const initial = authorName.charAt(0).toUpperCase();

    let actionsHtml = '';
    if (isOwner || isMe) {
        actionsHtml = `
            <div class="post-actions">
                <button class="action-btn" onclick="event.stopPropagation(); openPostModal(${post.id})">Edit</button>
                <button class="action-btn" style="color: var(--danger); border-color: var(--danger-light)" onclick="event.stopPropagation(); openDeleteModal(${post.id})">Delete</button>
            </div>
        `;
    }

    div.innerHTML = `
        <h3 class="post-title">${escapeHTML(post.title)}</h3>
        <div class="post-preview">${escapeHTML(post.content)}</div>
        <div class="post-meta">
            <div class="post-author">
                <div class="author-avatar">${initial}</div>
                <span>${escapeHTML(authorName)}</span>
            </div>
            ${actionsHtml}
        </div>
    `;

    div.addEventListener('click', () => viewPost(post));
    return div;
}

// --- Post Actions ---
let currentDeleteId = null;

function openPostModal(postId = null) {
    const modal = document.getElementById('post-modal');
    const title = document.getElementById('post-modal-title');
    const form = document.getElementById('post-form');

    form.reset();
    document.getElementById('title-count').textContent = '0';
    document.getElementById('edit-post-id').value = '';

    if (postId) {
        title.textContent = 'Edit Story';
        const post = state.allPosts.find(p => p.id === postId);
        if (post) {
            document.getElementById('post-title').value = post.title;
            document.getElementById('post-content').value = post.content;
            document.getElementById('edit-post-id').value = post.id;
            document.getElementById('title-count').textContent = post.title.length;
        }
    } else {
        title.textContent = 'Create New Story';
    }

    modal.classList.remove('hidden');
}

function closePostModal() {
    document.getElementById('post-modal').classList.add('hidden');
}

async function handleSavePost(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-post-btn');
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const postId = document.getElementById('edit-post-id').value;

    setLoading(btn, true);

    const method = postId ? 'PUT' : 'POST';
    const url = postId ? `${API_URL}/posts/${postId}` : `${API_URL}/posts`;
    const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
    };

    try {
        const res = await fetch(url, {
            method,
            headers,
            body: JSON.stringify({ title, content })
        });

        if (res.ok) {
            showToast(postId ? 'Story updated!' : 'Story published!', 'success');
            closePostModal();
            loadAppData();
        } else {
            showToast('Failed to save story', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    } finally {
        setLoading(btn, false);
    }
}

function openDeleteModal(postId) {
    currentDeleteId = postId;
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    currentDeleteId = null;
    document.getElementById('delete-modal').classList.add('hidden');
}

async function confirmDeletePost() {
    if (!currentDeleteId) return;

    const btn = document.getElementById('confirm-delete-btn');
    setLoading(btn, true);

    try {
        const res = await fetch(`${API_URL}/posts/${currentDeleteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (res.ok) {
            showToast('Story deleted', 'success');
            closeDeleteModal();
            loadAppData();
        } else {
            showToast('Failed to delete', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    } finally {
        setLoading(btn, false);
    }
}

function viewPost(post) {
    document.getElementById('view-post-title').textContent = post.title;
    document.getElementById('view-post-author').textContent = `Written by ${post.user ? post.user.name : 'Unknown'}`;
    document.getElementById('view-post-body').textContent = post.content;
    document.getElementById('view-post-modal').classList.remove('hidden');
}

async function openUserPostsModal(user) {
    const modal = document.getElementById('user-posts-modal');
    document.getElementById('user-posts-modal-title').textContent = `Stories by ${escapeHTML(user.name)}`;
    const container = document.getElementById('user-posts-list-modal');
    const empty = document.getElementById('user-posts-modal-empty');

    container.innerHTML = '';

    try {
        const res = await fetch(`${API_URL}/users/${user.id}/posts`);
        if (res.ok) {
            const posts = await res.json();
            if (posts.length === 0) {
                empty.classList.remove('hidden');
            } else {
                empty.classList.add('hidden');
                posts.sort((a, b) => b.id - a.id).forEach(post => {
                    const postWithUser = { ...post, user: user };
                    container.appendChild(createPostCard(postWithUser, false));
                });
            }
        }
    } catch (e) {
        showToast('Error loading posts', 'error');
    }

    modal.classList.remove('hidden');
}

// --- Utils ---
function showScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenId].classList.add('active');
}

function setLoading(btn, isLoading) {
    if (isLoading) {
        btn.classList.add('loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// --- Account Deletion ---
function openDeleteAccountModal() {
    document.getElementById('delete-account-modal').classList.remove('hidden');
}

function closeDeleteAccountModal() {
    document.getElementById('delete-account-modal').classList.add('hidden');
}

async function confirmDeleteAccount() {
    const btn = document.getElementById('confirm-delete-account-btn');
    setLoading(btn, true);

    try {
        const res = await fetch(`${API_URL}/users/me`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (res.ok) {
            showToast('Account deleted successfully!', 'success');
            closeDeleteAccountModal();
            logout();
        } else {
            const data = await res.json();
            showToast(data.error || 'Failed to delete account', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    } finally {
        setLoading(btn, false);
    }
}

// --- Admin User Deletion ---
let currentDeleteUserId = null;

function openDeleteUserModal(userId) {
    currentDeleteUserId = userId;
    document.getElementById('delete-user-modal').classList.remove('hidden');
}

function closeDeleteUserModal() {
    currentDeleteUserId = null;
    document.getElementById('delete-user-modal').classList.add('hidden');
}

async function confirmDeleteUser() {
    if (!currentDeleteUserId) return;

    const btn = document.getElementById('confirm-delete-user-btn');
    setLoading(btn, true);

    try {
        const res = await fetch(`${API_URL}/users/${currentDeleteUserId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (res.ok) {
            showToast('User deleted successfully!', 'success');
            closeDeleteUserModal();
            loadAppData();
            
            // If we are currently looking at the admin panel tab, re-render it
            const adminTab = document.getElementById('admin-tab');
            if (adminTab && adminTab.classList.contains('active')) {
                renderAdminPanel();
            }
        } else {
            const data = await res.json();
            showToast(data.error || 'Failed to delete user', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    } finally {
        setLoading(btn, false);
    }
}

// --- Admin Panel Navigation & Rendering ---
function checkAdminNav() {
    const adminBtn = document.getElementById('nav-admin-btn');
    if (!adminBtn) return;
    
    if (state.userRole === 'admin') {
        adminBtn.classList.remove('hidden');
    } else {
        adminBtn.classList.add('hidden');
    }
}

function renderAdminPanel() {
    const statUsers = document.getElementById('admin-stat-users');
    const statPosts = document.getElementById('admin-stat-posts');
    if (statUsers) statUsers.textContent = state.users.length;
    if (statPosts) statPosts.textContent = state.allPosts.length;

    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    state.users.forEach(user => {
        const row = document.createElement('tr');
        
        const isMe = user.id === state.userId;
        const roleText = user.role || 'user';
        const roleClass = roleText === 'admin' ? 'badge badge-admin' : 'badge badge-user';
        
        let actionBtnHtml = '';
        if (!isMe) {
            actionBtnHtml = `
                <button class="action-btn" style="color: var(--danger); border-color: var(--danger-light);" onclick="openDeleteUserModal(${user.id})">
                    Delete Account
                </button>
            `;
        } else {
            actionBtnHtml = `<span style="color: var(--text-tertiary); font-size: 0.75rem;">Current Session</span>`;
        }

        row.innerHTML = `
            <td><strong>#${user.id}</strong></td>
            <td>${escapeHTML(user.name)}</td>
            <td>${escapeHTML(user.email)}</td>
            <td><span class="${roleClass}">${roleText}</span></td>
            <td>${actionBtnHtml}</td>
        `;
        tbody.appendChild(row);
    });
}
