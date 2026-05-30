/* =============================================
   APP — SPA Router, Auth State, Toast, Modal
   ============================================= */

/* ---- Page routing ---- */
const PAGES = [
    'home', 'login', 'register', 'forgot-password', 'reset-password',
    'verify-email', 'create-post', 'edit-post', 'my-posts', 'profile', 'admin'
];

function navigateTo(page) {
    // Strip query params for page matching
    const pageName = page.split('?')[0];

    // Hide all pages
    PAGES.forEach(p => {
        const el = document.getElementById(`page-${p}`);
        if (el) el.style.display = 'none';
    });

    // Show target page
    const target = document.getElementById(`page-${pageName}`);
    if (target) {
        target.style.display = 'block';
        // Re-trigger animation
        target.style.animation = 'none';
        target.offsetHeight; // reflow
        target.style.animation = '';
    }

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageName);
    });

    // Close mobile nav
    document.getElementById('navLinks').classList.remove('open');
    document.getElementById('hamburger').classList.remove('active');

    // Page-specific data loading
    switch (pageName) {
        case 'home':
            loadAllPosts();
            break;
        case 'my-posts':
            if (!isLoggedIn()) { window.location.hash = '#login'; return; }
            loadMyPosts();
            break;
        case 'create-post':
            if (!isLoggedIn()) { window.location.hash = '#login'; return; }
            break;
        case 'edit-post':
            if (!isLoggedIn()) { window.location.hash = '#login'; return; }
            break;
        case 'profile':
            if (!isLoggedIn()) { window.location.hash = '#login'; return; }
            loadProfile();
            break;
        case 'admin':
            if (!isAdmin()) {
                showToast('Admin access required', 'error');
                window.location.hash = '#home';
                return;
            }
            loadAdminPanel();
            break;
        case 'login':
        case 'register':
            if (isLoggedIn()) { window.location.hash = '#home'; return; }
            break;
    }
}

/* ---- Profile ---- */
async function loadProfile() {
    const user = getUser();
    if (!user) return;

    document.getElementById('profileName').textContent = user.name || 'User';
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('avatarLetter').textContent = (user.name || user.email || '?').charAt(0).toUpperCase();

    const badge = document.getElementById('profileBadge');
    badge.textContent = user.role;
    badge.className = 'profile-badge' + (user.role === 'admin' ? ' admin' : '');

    // Load post count
    const res = await api.getUserPosts(user.id);
    if (res.ok) {
        document.getElementById('profilePostCount').textContent = res.data.length;
    }
}

/* ---- Auth UI visibility ---- */
function updateAuthUI() {
    const loggedIn = isLoggedIn();
    const admin = isAdmin();

    document.querySelectorAll('.auth-only').forEach(el => {
        el.style.display = loggedIn ? '' : 'none';
    });
    document.querySelectorAll('.guest-only').forEach(el => {
        el.style.display = loggedIn ? 'none' : '';
    });
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = admin ? '' : 'none';
    });
}

/* ---- Toast ---- */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '', error: '', info: '', warning: '' };
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;

    container.appendChild(toast);

    // Swipe to dismiss gesture
    let startX = 0;
    let currentX = 0;

    toast.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        toast.style.transition = 'none';
    }, { passive: true });

    toast.addEventListener('touchmove', e => {
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        if (diff > 0) {
            toast.style.transform = `translateX(${diff}px)`;
            toast.style.opacity = Math.max(0, 1 - (diff / 100));
        }
    }, { passive: true });

    toast.addEventListener('touchend', e => {
        toast.style.transition = '';
        if (currentX - startX > 50) {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        } else {
            toast.style.transform = '';
            toast.style.opacity = '';
        }
    });

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-exit');
            toast.addEventListener('animationend', () => toast.remove());
        }
    }, 4000);
}

/* ---- Confirm Modal ---- */
let _modalCallback = null;

function showConfirmModal(title, message, onConfirm) {
    _modalCallback = onConfirm;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'flex';
}

function hideModal() {
    document.getElementById('confirmModal').style.display = 'none';
    _modalCallback = null;
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initPosts();
    initAdmin();

    // Hamburger toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Modal buttons
    document.getElementById('modalCancelBtn').addEventListener('click', hideModal);
    document.getElementById('modalConfirmBtn').addEventListener('click', async () => {
        if (_modalCallback) await _modalCallback();
        hideModal();
    });

    // Close modal on overlay click
    document.getElementById('confirmModal').addEventListener('click', (e) => {
        if (e.target.id === 'confirmModal') hideModal();
    });

    // Delete account
    document.getElementById('deleteAccountBtn').addEventListener('click', () => {
        const user = getUser();
        if (!user) return;
        showConfirmModal(
            'Delete Account',
            'This will permanently delete your account and all your posts. This cannot be undone.',
            async () => {
                const res = await api.deleteUser(user.id);
                if (res.ok) {
                    logout();
                    showToast('Account deleted', 'info');
                } else {
                    showToast(res.data.error || 'Failed to delete account', 'error');
                }
            }
        );
    });

    // Feedback form
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('feedbackSubmitBtn');
            const loader = btn.querySelector('.btn-loader');
            const text = btn.querySelector('.btn-text');
            const name = document.getElementById('fbName').value;
            const email = document.getElementById('fbEmail').value;
            const message = document.getElementById('fbMessage').value;

            text.style.display = 'none';
            loader.style.display = 'inline-block';
            btn.disabled = true;

            const res = await api.sendFeedback(name, email, message);

            text.style.display = '';
            loader.style.display = 'none';
            btn.disabled = false;

            if (res.ok) {
                showToast(res.data.message || 'Feedback sent!', 'success');
                feedbackForm.reset();
            } else {
                showToast(res.data?.error || 'Failed to send feedback', 'error');
            }
        });
    }

    // Check for Google OAuth callback tokens in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('access_token')) {
        localStorage.setItem('access_token', urlParams.get('access_token'));
        const userData = urlParams.get('user');
        if (userData) localStorage.setItem('user', userData);
        window.history.replaceState({}, '', window.location.pathname);
        updateAuthUI();
    }

    // Auth UI
    updateAuthUI();

    // Router
    function handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        navigateTo(hash);
    }

    window.addEventListener('hashchange', handleRoute);
    handleRoute();

    // Navbar scroll effect
    let lastScrollY = 0;
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(0, 0, 0, 0.8)';
            navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.5)';
        } else {
            navbar.style.background = 'rgba(0, 0, 0, 0.6)';
            navbar.style.boxShadow = 'none';
        }
        lastScrollY = window.scrollY;
    });

    // 3D Tilt Gesture on Header
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
        pageHeader.addEventListener('mousemove', (e) => {
            const rect = pageHeader.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top;  // y position within the element

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calculate rotation (max 10 degrees)
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;

            pageHeader.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        pageHeader.addEventListener('mouseleave', () => {
            pageHeader.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            pageHeader.style.transition = 'transform 0.5s ease-out';
        });

        pageHeader.addEventListener('mouseenter', () => {
            pageHeader.style.transition = 'transform 0.1s ease-out';
        });
    }
});
