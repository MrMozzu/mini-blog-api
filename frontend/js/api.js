/* =============================================
   API — Centralized fetch wrapper
   ============================================= */
const API_BASE = window.location.origin;

const api = {
    /* ---- helpers ---- */
    _headers(json = true) {
        const h = {};
        if (json) h['Content-Type'] = 'application/json';
        const token = localStorage.getItem('access_token');
        if (token) h['Authorization'] = `Bearer ${token}`;
        return h;
    },

    async _request(method, url, body = null) {
        const opts = {
            method,
            headers: this._headers(!!body),
        };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${API_BASE}${url}`, opts);
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
    },

    /* ---- Auth ---- */
    register(email, password) {
        return this._request('POST', '/auth/register', { email, password });
    },
    login(email, password) {
        return this._request('POST', '/auth/login', { email, password });
    },
    me() {
        return this._request('GET', '/auth/me');
    },
    forgotPassword(email) {
        return this._request('POST', '/auth/forgot_password', { email });
    },
    resetPassword(email, otp, new_password) {
        return this._request('POST', '/auth/reset-password', { email, otp, new_password });
    },
    verifyEmail(email, otp) {
        return this._request('POST', '/auth/verify-email', { email, otp });
    },
    resendVerification(email) {
        return this._request('POST', '/auth/resend-verification', { email });
    },
    googleLogin() {
        window.location.href = `${API_BASE}/auth/google/login`;
    },

    /* ---- Posts ---- */
    getPosts() {
        return this._request('GET', '/posts');
    },
    getUserPosts(userId) {
        return this._request('GET', `/users/${userId}/posts`);
    },
    createPost(title, content) {
        return this._request('POST', '/posts', { title, content });
    },
    updatePost(id, title, content) {
        return this._request('PUT', `/posts/${id}`, { title, content });
    },
    deletePost(id) {
        return this._request('DELETE', `/posts/${id}`);
    },

    /* ---- Users ---- */
    getUsers() {
        return this._request('GET', '/users/');
    },
    getUser(id) {
        return this._request('GET', `/users/${id}`);
    },
    deleteUser(id) {
        return this._request('DELETE', `/users/${id}`);
    },

    /* ---- Feedback ---- */
    sendFeedback(name, email, message) {
        return this._request('POST', '/api/feedback/', { name, email, message });
    }
};
