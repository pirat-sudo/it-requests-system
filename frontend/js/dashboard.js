let currentUser = null;
let categories = [];
let stopListPolling = null;

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = App.requireAuth();
    if (!currentUser) return;

    App.initNavbar();

    const isIt = currentUser.role === 'it_specialist';
    document.getElementById('pageTitle').textContent = isIt ? 'Все заявки' : 'Мои заявки';
    document.getElementById('pageSubtitle').textContent = isIt
        ? '18+ демо-заявок — все статусы, приоритеты и категории'
        : 'Создавайте обращения и отслеживайте их статус';

    initTabs();
    initModal();
    initFilters();
    initQuickFilters();

    await loadCategories();
    await loadRequests();
    await loadStatistics();

    stopListPolling = App.startPolling(() => {
        const tabVisible = !document.getElementById('requestsTab').classList.contains('hidden');
        if (tabVisible) return loadRequests(true);
    }, 15000);
});

window.addEventListener('beforeunload', () => {
    if (stopListPolling) stopListPolling();
});

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

            const requestsTab = document.getElementById('requestsTab');
            const statisticsTab = document.getElementById('statisticsTab');

            if (tab === 'requests') {
                requestsTab.classList.remove('hidden');
                statisticsTab.classList.add('hidden');
            } else {
                requestsTab.classList.add('hidden');
                statisticsTab.classList.remove('hidden');
                loadStatistics();
            }
        });
    });
}

function initQuickFilters() {
    document.querySelectorAll('#quickFilters .chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#quickFilters .chip').forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            const status = chip.dataset.status;
            document.getElementById('statusFilter').value = status;
            loadRequests();
        });
    });

    document.getElementById('statusFilter')?.addEventListener('change', () => {
        const val = document.getElementById('statusFilter').value;
        document.querySelectorAll('#quickFilters .chip').forEach((c) => {
            c.classList.toggle('active', c.dataset.status === val);
        });
    });
}

function initModal() {
    const modal = document.getElementById('createRequestModal');

    window.openCreateRequestModal = () => {
        modal.classList.add('open');
        document.getElementById('requestTitle')?.focus();
    };

    const close = () => {
        modal.classList.remove('open');
        document.getElementById('createRequestForm')?.reset();
    };

    document.getElementById('btnCloseModal')?.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });
}

function initFilters() {
    let searchTimeout;
    document.getElementById('searchInput')?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => loadRequests(), 300);
    });
    ['categoryFilter', 'statusFilter', 'priorityFilter'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', () => loadRequests());
    });
}

async function loadCategories() {
    try {
        categories = await api.getCategories();
        const select = document.getElementById('categoryFilter');
        const createSelect = document.getElementById('requestCategory');
        const options = categories
            .map((c) => `<option value="${c.id}">${App.escapeHtml(c.name)}</option>`)
            .join('');

        if (select) {
            select.innerHTML = '<option value="all">Все категории</option>' + options;
        }
        if (createSelect) {
            createSelect.innerHTML = '<option value="">Без категории</option>' + options;
        }
    } catch {
        App.toast('Не удалось загрузить категории', 'error');
    }
}

function getFilters() {
    return {
        status: document.getElementById('statusFilter')?.value,
        priority: document.getElementById('priorityFilter')?.value,
        category_id: document.getElementById('categoryFilter')?.value,
        search: document.getElementById('searchInput')?.value.trim()
    };
}

async function loadRequests(silent = false) {
    const container = document.getElementById('requestsList');
    if (!silent) App.setLoading(container, true);

    try {
        const requests = await api.getRequests(getFilters());
        displayRequests(requests);
        updateQuickStats(requests);
    } catch (error) {
        if (!silent) {
            container.innerHTML = `<div class="empty-state"><p>${App.escapeHtml(error.message)}</p></div>`;
            App.toast(error.message, 'error');
        }
    }
}

function updateQuickStats(requests) {
    const el = document.getElementById('quickStats');
    if (!el) return;

    const counts = { new: 0, in_progress: 0, resolved: 0, closed: 0 };
    requests.forEach((r) => {
        if (counts[r.status] !== undefined) counts[r.status]++;
    });

    el.innerHTML = `
        <div class="quick-stat"><span class="quick-stat-value">${requests.length}</span><span class="quick-stat-label">в выборке</span></div>
        <div class="quick-stat quick-stat--new"><span class="quick-stat-value">${counts.new}</span><span class="quick-stat-label">новых</span></div>
        <div class="quick-stat quick-stat--progress"><span class="quick-stat-value">${counts.in_progress}</span><span class="quick-stat-label">в работе</span></div>
        <div class="quick-stat quick-stat--done"><span class="quick-stat-value">${counts.resolved}</span><span class="quick-stat-label">решено</span></div>
    `;

    const info = document.getElementById('resultsInfo');
    if (info) {
        const filters = getFilters();
        const parts = [];
        if (filters.search) parts.push(`поиск: «${filters.search}»`);
        if (filters.status && filters.status !== 'all') parts.push(App.getStatusText(filters.status));
        if (filters.priority && filters.priority !== 'all') parts.push(App.getPriorityText(filters.priority));
        info.textContent = parts.length
            ? `Найдено ${requests.length} · ${parts.join(' · ')}`
            : `Показано заявок: ${requests.length}`;
    }
}

function displayRequests(requests) {
    const container = document.getElementById('requestsList');

    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>Заявок не найдено</h3>
                <p>Измените фильтры или создайте новую заявку</p>
            </div>`;
        return;
    }

    container.innerHTML = requests
        .map((request) => {
            const desc =
                request.description.length > 140
                    ? `${App.escapeHtml(request.description.substring(0, 140))}…`
                    : App.escapeHtml(request.description);

            return `
            <article class="request-card priority-${request.priority}" data-id="${request.id}" tabindex="0" role="button">
                <div class="request-header">
                    <h3 class="request-title">#${request.id} · ${App.escapeHtml(request.title)}</h3>
                    <div class="card-badges">
                        ${App.statusBadge(request.status)}
                        ${App.priorityBadge(request.priority)}
                    </div>
                </div>
                <p class="request-description">${desc}</p>
                <div class="request-meta">
                    <span class="meta-tag">${App.escapeHtml(request.category_name || 'Без категории')}</span>
                    <span class="meta-tag">${App.formatDate(request.created_at)}</span>
                    <span class="meta-tag">${App.escapeHtml(request.created_by_name || '')}</span>
                    ${request.assigned_to_name ? `<span class="meta-tag meta-tag--assignee">→ ${App.escapeHtml(request.assigned_to_name)}</span>` : ''}
                </div>
            </article>`;
        })
        .join('');

    container.querySelectorAll('.request-card').forEach((card) => {
        const go = () => {
            window.location.href = `request-detail.html?id=${card.dataset.id}`;
        };
        card.addEventListener('click', go);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                go();
            }
        });
    });
}

document.getElementById('createRequestForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('requestTitle').value.trim();
    const description = document.getElementById('requestDescription').value.trim();
    const priority = document.getElementById('requestPriority').value;
    const categoryId = document.getElementById('requestCategory').value;

    try {
        await api.createRequest(title, description, priority, categoryId || null);
        document.getElementById('createRequestModal').classList.remove('open');
        document.getElementById('createRequestForm').reset();
        await loadRequests();
        App.toast('Заявка создана', 'success');
    } catch (error) {
        App.toast(error.message, 'error');
    }
});

async function loadStatistics() {
    try {
        const stats = await api.getStatistics();

        document.getElementById('totalRequests').textContent = stats.general.total_requests || 0;
        document.getElementById('newRequests').textContent = stats.general.new_requests || 0;
        document.getElementById('inProgressRequests').textContent =
            stats.general.in_progress_requests || 0;
        document.getElementById('resolvedRequests').textContent =
            stats.general.resolved_requests || 0;

        document.getElementById('priorityStats').innerHTML = renderStatsRows(
            stats.byPriority,
            (p) => App.getPriorityText(p.priority),
            (p) => p.count
        );

        document.getElementById('userStats').innerHTML = renderStatsRows(
            stats.byUser,
            (u) => u.full_name,
            (u) => u.request_count
        );

        document.getElementById('categoryStats').innerHTML = renderStatsRows(
            stats.byCategory || [],
            (c) => c.name,
            (c) => c.count
        );
    } catch (error) {
        console.error('Ошибка статистики:', error);
    }
}

function renderStatsRows(items, labelFn, valueFn) {
    if (!items?.length) {
        return '<p class="panel-empty">Нет данных</p>';
    }
    return items
        .map(
            (item) => `
        <div class="stats-row">
            <span>${App.escapeHtml(labelFn(item))}</span>
            <strong>${valueFn(item)}</strong>
        </div>`
        )
        .join('');
}
