/**
 * Общие утилиты UI и авторизации для всех страниц.
 */
const App = {
    getUser() {
        const raw = localStorage.getItem('user');
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    },

    requireAuth() {
        const user = this.getUser();
        if (!user || !localStorage.getItem('token')) {
            window.location.replace('login.html');
            return null;
        }
        return user;
    },

    logout() {
        api.logout();
        localStorage.removeItem('user');
        window.location.replace('login.html');
    },

    initNavbar() {
        const user = this.getUser();
        const nameEl = document.getElementById('userName');
        const roleEl = document.getElementById('userRole');

        if (user && nameEl) {
            nameEl.textContent = user.fullName || user.username;
        }

        if (user && roleEl) {
            const isIt = user.role === 'it_specialist';
            roleEl.textContent = isIt ? 'IT-специалист' : 'Сотрудник';
            roleEl.className = `role-badge ${isIt ? 'role-it' : 'role-employee'}`;
        }

        document.getElementById('btnLogout')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        document.getElementById('btnCreateRequest')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.openCreateRequestModal === 'function') {
                window.openCreateRequestModal();
            }
        });

        document.getElementById('btnBack')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'dashboard.html';
        });
    },

    toast(message, type = 'success') {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    },

    escapeHtml(text) {
        if (text == null) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },

    formatDate(dateStr, withTime = false) {
        const date = new Date(dateStr);
        return withTime
            ? date.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
            : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    getStatusText(status) {
        return (
            {
                new: 'Новая',
                in_progress: 'В работе',
                resolved: 'Решена',
                closed: 'Закрыта'
            }[status] || status
        );
    },

    getPriorityText(priority) {
        return (
            {
                low: 'Низкий',
                medium: 'Средний',
                high: 'Высокий',
                critical: 'Критический'
            }[priority] || priority
        );
    },

    statusBadge(status) {
        return `<span class="badge status-${status}">${this.escapeHtml(this.getStatusText(status))}</span>`;
    },

    priorityBadge(priority) {
        return `<span class="badge priority-${priority}">${this.escapeHtml(this.getPriorityText(priority))}</span>`;
    },

    setLoading(container, loading = true) {
        if (!container) return;
        if (loading) {
            container.dataset.prevHtml = container.innerHTML;
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Загрузка...</p>
                </div>`;
        } else if (container.dataset.prevHtml !== undefined) {
            container.innerHTML = container.dataset.prevHtml;
            delete container.dataset.prevHtml;
        }
    }
};

window.App = App;
window.logout = () => App.logout();
