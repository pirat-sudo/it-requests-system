document.addEventListener('DOMContentLoaded', () => {
    if (api.token && localStorage.getItem('user')) {
        window.location.replace('dashboard.html');
        return;
    }

    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement')?.addEventListener('submit', handleRegister);
    document.getElementById('linkShowRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        showRegister();
    });
    document.getElementById('linkHideRegister')?.addEventListener('click', showLogin);
});

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.textContent = '';

    try {
        const user = await api.login(username, password);
        localStorage.setItem('user', JSON.stringify(user));
        window.location.replace('dashboard.html');
    } catch (error) {
        errorMessage.textContent = error.message;
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('regUsername').value.trim();
    const fullName = document.getElementById('regFullName').value.trim();
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    const errorMessage = document.getElementById('regErrorMessage');

    errorMessage.textContent = '';

    try {
        await api.register(username, password, fullName, role);
        App.toast('Регистрация успешна! Войдите с новым логином.', 'success');
        showLogin();
        document.getElementById('username').value = username;
    } catch (error) {
        errorMessage.textContent = error.message;
    }
}

function showRegister() {
    document.getElementById('loginPanel')?.classList.add('hidden');
    document.getElementById('registerPanel')?.classList.remove('hidden');
}

function showLogin() {
    document.getElementById('registerPanel')?.classList.add('hidden');
    document.getElementById('loginPanel')?.classList.remove('hidden');
}
