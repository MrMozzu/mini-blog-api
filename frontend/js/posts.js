/* =============================================
   POSTS — CRUD operations for blog posts
   ============================================= */

async function loadAllPosts() {
    const grid = document.getElementById('postsGrid');
    const empty = document.getElementById('emptyPosts');

    grid.innerHTML = renderSkeletons(6);
    const res = await api.getPosts();

    if (!res.ok) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    const posts = res.data;
    if (!posts.length) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    grid.innerHTML = posts.map(p => postCardHTML(p, false)).join('');
}

async function loadMyPosts() {
    const user = getUser();
    if (!user) return;

    const grid = document.getElementById('myPostsGrid');
    const empty = document.getElementById('emptyMyPosts');

    grid.innerHTML = renderSkeletons(3);
    const res = await api.getUserPosts(user.id);

    if (!res.ok) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    const posts = res.data;
    if (!posts.length) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    grid.innerHTML = posts.map(p => postCardHTML(p, true)).join('');
}

function postCardHTML(post, isOwner) {
    const authorName = post.user ? post.user.name : 'Unknown';
    const initial = authorName.charAt(0).toUpperCase();
    const currentUser = getUser();
    const canEdit = currentUser && post.user_id === currentUser.id;
    const canDelete = currentUser && (post.user_id === currentUser.id || currentUser.role === 'admin');

    let actions = '';
    if (canEdit || canDelete) {
        actions = `<div class="post-actions" style="border-top:none; padding-top:0;">`;
        if (canEdit) {
            actions += `<button class="post-action-btn" onclick="event.stopPropagation(); editPost(${post.id}, '${escapeAttr(post.title)}', \`${escapeTemplate(post.content)}\`)">Edit</button>`;
        }
        if (canDelete) {
            actions += `<button class="post-action-btn danger" onclick="event.stopPropagation(); confirmDeletePost(${post.id})">Delete</button>`;
        }
        actions += `</div>`;
    }

    return `
        <article class="post-card glass-card" style="display:flex; flex-direction:column;">
            <div class="post-card-header">
                <div class="post-author-avatar">${escapeHTML(initial)}</div>
                <div class="post-author-info">
                    <div class="post-author-name">${escapeHTML(authorName)}</div>
                </div>
            </div>
            <h2 class="post-title"><a href="#view-post?id=${post.id}" style="color:inherit; text-decoration:none;">${escapeHTML(post.title)}</a></h2>
            <p class="post-content-preview">${escapeHTML(post.content)}</p>
            <div class="post-card-footer" style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:14px; border-top:1px solid var(--glass-border);">
                <a href="#view-post?id=${post.id}" class="read-more-link" style="color:var(--accent-light); font-size:0.85rem; font-weight:600; transition:color 0.2s;">Read Story →</a>
                ${actions}
            </div>
        </article>
    `;
}

function renderSkeletons(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="post-card glass-card">
                <div class="post-card-header">
                    <div class="skeleton" style="width:40px;height:40px;border-radius:50%;"></div>
                    <div style="flex:1">
                        <div class="skeleton" style="width:60%;height:14px;margin-bottom:6px;"></div>
                        <div class="skeleton" style="width:40%;height:10px;"></div>
                    </div>
                </div>
                <div class="skeleton" style="width:80%;height:20px;margin-bottom:10px;"></div>
                <div class="skeleton" style="width:100%;height:12px;margin-bottom:6px;"></div>
                <div class="skeleton" style="width:90%;height:12px;margin-bottom:6px;"></div>
                <div class="skeleton" style="width:70%;height:12px;"></div>
            </div>
        `;
    }
    return html;
}

/* ---- Create Post ---- */
function initPosts() {
    const form = document.getElementById('createPostForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('createPostBtn');
        setLoading(btn, true);

        const title = document.getElementById('postTitle').value.trim();
        const content = document.getElementById('postContent').value.trim();

        const res = await api.createPost(title, content);
        setLoading(btn, false);

        if (res.ok) {
            showToast('Post published!', 'success');
            form.reset();
            window.location.hash = '#home';
        } else {
            showToast(res.data.error || 'Failed to create post', 'error');
        }
    });

    /* ---- Edit Post ---- */
    const editForm = document.getElementById('editPostForm');
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('editPostBtn');
        setLoading(btn, true);

        const id = document.getElementById('editPostId').value;
        const title = document.getElementById('editPostTitle').value.trim();
        const content = document.getElementById('editPostContent').value.trim();

        const res = await api.updatePost(id, title, content);
        setLoading(btn, false);

        if (res.ok) {
            showToast('Post updated!', 'success');
            window.location.hash = '#my-posts';
        } else {
            showToast(res.data.error || 'Failed to update post', 'error');
        }
    });
}

function editPost(id, title, content) {
    document.getElementById('editPostId').value = id;
    document.getElementById('editPostTitle').value = title;
    document.getElementById('editPostContent').value = content;
    window.location.hash = '#edit-post';
}

function confirmDeletePost(postId) {
    showConfirmModal(
        'Delete Post',
        'Are you sure you want to delete this post? This cannot be undone.',
        async () => {
            const res = await api.deletePost(postId);
            if (res.ok) {
                showToast('Post deleted', 'success');
                // Reload current page
                const hash = window.location.hash.slice(1) || 'home';
                navigateTo(hash);
            } else {
                showToast(res.data.error || 'Failed to delete', 'error');
            }
        }
    );
}

/* ---- Escape helpers ---- */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function escapeAttr(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function escapeTemplate(str) {
    return (str || '').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

async function loadFullPost(postId) {
    const card = document.getElementById('postDetailCard');
    
    // Show a premium skeleton loader while fetching
    card.innerHTML = `
        <div class="skeleton" style="width:200px; height:20px; margin-bottom:24px;"></div>
        <div class="skeleton" style="width:100%; height:48px; margin-bottom:32px;"></div>
        <div class="skeleton" style="width:100%; height:12px; margin-bottom:8px;"></div>
        <div class="skeleton" style="width:100%; height:12px; margin-bottom:8px;"></div>
        <div class="skeleton" style="width:80%; height:12px; margin-bottom:8px;"></div>
    `;

    const res = await api.getPost(postId);
    if (!res.ok) {
        card.innerHTML = `
            <div style="text-align:center; padding: 40px 0;">
                <h3 style="color:var(--danger); margin-bottom:12px;">Failed to load story</h3>
                <p style="color:var(--text-secondary);">The story you are looking for may have been deleted or is currently unavailable.</p>
                <a href="#home" class="btn btn-outline" style="margin-top:16px;">Back to Home</a>
            </div>
        `;
        return;
    }

    const post = res.data;
    const authorName = post.user ? post.user.name : 'Unknown';
    const initial = authorName.charAt(0).toUpperCase();

    // Render the beautiful full post details
    card.innerHTML = `
        <header class="post-detail-header">
            <div class="post-detail-meta">
                <div class="post-detail-author-avatar">${escapeHTML(initial)}</div>
                <div class="post-detail-author-info">
                    <div class="post-detail-author-name">By ${escapeHTML(authorName)}</div>
                </div>
            </div>
            <h1 class="post-detail-title">${escapeHTML(post.title)}</h1>
        </header>
        <section class="post-detail-body">${escapeHTML(post.content)}</section>
    `;
}

