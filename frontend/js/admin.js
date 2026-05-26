/* =============================================
   ADMIN — Dashboard, User & Post management
   ============================================= */

async function loadAdminPanel() {
    if (!isAdmin()) return;

    // Load stats & data in parallel
    const [usersRes, postsRes] = await Promise.all([
        api.getUsers(),
        api.getPosts(),
    ]);

    const users = usersRes.ok ? usersRes.data : [];
    const posts = postsRes.ok ? postsRes.data : [];

    // Stats
    document.getElementById('statTotalUsers').textContent = users.length;
    document.getElementById('statTotalPosts').textContent = posts.length;
    document.getElementById('statAdminCount').textContent = users.filter(u => u.role === 'admin').length;

    // Users table
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${escapeHTML(u.name)}</td>
            <td>${escapeHTML(u.email)}</td>
            <td><span class="role-badge ${u.role}">${u.role}</span></td>
            <td>${u.auth_provider || 'local'}</td>
            <td>
                <button class="table-action-btn" onclick="confirmDeleteUser(${u.id}, '${escapeAttr(u.email)}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');

    // Posts table
    const ptbody = document.getElementById('adminPostsTableBody');
    ptbody.innerHTML = posts.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${escapeHTML(p.title)}</td>
            <td>${p.user ? escapeHTML(p.user.name) : 'Unknown'}</td>
            <td>
                <button class="table-action-btn" onclick="confirmDeletePost(${p.id})">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function initAdmin() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(tc => {
                tc.style.display = 'none';
                tc.classList.remove('active');
            });

            const target = document.getElementById(btn.dataset.tab);
            target.style.display = 'block';
            target.classList.add('active');
        });
    });
}

function confirmDeleteUser(userId, email) {
    const currentUser = getUser();
    if (currentUser && currentUser.id === userId) {
        showToast('Cannot delete your own account from admin panel', 'error');
        return;
    }

    showConfirmModal(
        'Delete User',
        `Are you sure you want to delete user "${email}"? All their posts will also be deleted.`,
        async () => {
            const res = await api.deleteUser(userId);
            if (res.ok) {
                showToast('User deleted', 'success');
                loadAdminPanel();
            } else {
                showToast(res.data.error || 'Failed to delete user', 'error');
            }
        }
    );
}
