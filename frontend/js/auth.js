/* =============================================
   AUTH — Login, Register, Forgot/Reset Password
   ============================================= */

function initAuth() {
    /* ---- Login ---- */
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('loginSubmitBtn');
        setLoading(btn, true);

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        const res = await api.login(email, password);
        setLoading(btn, false);

        if (res.ok) {
            localStorage.setItem('access_token', res.data.access_token);
            if (res.data.refresh_token) {
                localStorage.setItem('refresh_token', res.data.refresh_token);
            }
            localStorage.setItem('user', JSON.stringify(res.data.user));
            showToast('Welcome back!', 'success');
            updateAuthUI();
            window.location.hash = '#home';
        } else {
            showToast(res.data.error || 'Login failed', 'error');
        }
    });

    /* ---- Register ---- */
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('registerSubmitBtn');
        
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerConfirm').value;

        if (password !== confirm) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setLoading(btn, true);
        const res = await api.register(email, password);
        setLoading(btn, false);

        if (res.ok) {
            showToast('Account created! Please verify your email.', 'success');
            document.getElementById('verifyEmail').value = email;
            window.location.hash = '#verify-email';
        } else {
            showToast(res.data.error || 'Registration failed', 'error');
        }
    });

    /* ---- Verify Email ---- */
    const verifyForm = document.getElementById('verifyForm');
    if (verifyForm) {
        verifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('verifySubmitBtn');
            setLoading(btn, true);
            
            const email = document.getElementById('verifyEmail').value.trim();
            const otp = document.getElementById('verifyOTP').value.trim();
            
            const res = await api.verifyEmail(email, otp);
            setLoading(btn, false);
            
            if (res.ok) {
                showToast('Email verified! You can now log in.', 'success');
                window.location.hash = '#login';
            } else {
                showToast(res.data.error || 'Verification failed', 'error');
            }
        });
    }

    const resendBtn = document.getElementById('resendVerifyBtn');
    if (resendBtn) {
        resendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('verifyEmail').value.trim();
            if (!email) {
                showToast('Please enter your email first', 'error');
                return;
            }
            
            const res = await api.resendVerification(email);
            showToast(res.data?.message || 'Verification email resent if account exists', 'info');
        });
    }

    /* ---- Forgot Password ---- */
    const forgotForm = document.getElementById('forgotForm');
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('forgotSubmitBtn');
        setLoading(btn, true);

        const email = document.getElementById('forgotEmail').value.trim();
        const res = await api.forgotPassword(email);
        setLoading(btn, false);

        showToast(res.data.message || 'If account exists, reset email sent', 'info');
        document.getElementById('resetEmail').value = email;
        forgotForm.reset();
        window.location.hash = '#reset-password';
    });

    /* ---- Reset Password ---- */
    const resetForm = document.getElementById('resetForm');
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('resetSubmitBtn');

        const email = document.getElementById('resetEmail').value.trim();
        const otp = document.getElementById('resetOTP').value.trim();
        const password = document.getElementById('resetPassword').value;
        const confirm = document.getElementById('resetConfirm').value;

        if (password !== confirm) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (!email || !otp) {
            showToast('Email and OTP are required', 'error');
            return;
        }

        setLoading(btn, true);
        const res = await api.resetPassword(email, otp, password);
        setLoading(btn, false);

        if (res.ok) {
            showToast('Password reset successful! Please sign in.', 'success');
            window.location.hash = '#login';
        } else {
            showToast(res.data.error || 'Reset failed', 'error');
        }
    });

    /* ---- Google Login ---- */
    const googleBtn = document.getElementById('googleLoginBtn');
    googleBtn.addEventListener('click', () => {
        api.googleLogin();
    });
}

/* ---- Helpers ---- */
function setLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (loading) {
        text.style.display = 'none';
        loader.style.display = 'block';
        btn.disabled = true;
    } else {
        text.style.display = 'inline';
        loader.style.display = 'none';
        btn.disabled = false;
    }
}

function isLoggedIn() {
    return !!localStorage.getItem('access_token');
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
}

function isAdmin() {
    const user = getUser();
    return user && user.role === 'admin';
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    updateAuthUI();
    showToast('Logged out', 'info');
    window.location.hash = '#home';
}
