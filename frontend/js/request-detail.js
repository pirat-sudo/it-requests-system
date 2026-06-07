let currentUser = null;
let currentRequest = null;
let requestId = null;
let itSpecialists = [];
let lastCommentIds = '';
let stopPolling = null;

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = App.requireAuth();
    if (!currentUser) return;

    App.initNavbar();

    const urlParams = new URLSearchParams(window.location.search);
    requestId = urlParams.get('id');

    if (!requestId) {
        window.location.replace('dashboard.html');
        return;
    }

    if (currentUser.role === 'it_specialist') {
        try {
            itSpecialists = await api.getITSpecialists();
        } catch {
            itSpecialists = [];
        }
    }

    initCommentForm();

    await loadRequestDetails();
    await loadComments(false);
    await loadStatusHistory();

    stopPolling = App.startPolling(async () => {
        await loadComments(true);
        await loadStatusHistory(true);
        await refreshRequestMeta();
    }, 4000);
});

window.addEventListener('beforeunload', () => {
    if (stopPolling) stopPolling();
});

function initCommentForm() {
    const input = document.getElementById('newComment');
    const btn = document.getElementById('btnAddComment');

    btn?.addEventListener('click', addComment);
    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addComment();
        }
    });
}

async function refreshRequestMeta() {
    try {
        const updated = await api.getRequest(requestId);
        if (updated.status !== currentRequest.status) {
            currentRequest = updated;
            displayRequestDetails();
        }
    } catch {
        /* ignore */
    }
}

async function loadRequestDetails() {
    const container = document.getElementById('requestDetails');
    App.setLoading(container, true);

    try {
        currentRequest = await api.getRequest(requestId);
        displayRequestDetails();
    } catch (error) {
        App.toast(error.message || 'Заявка не найдена', 'error');
        setTimeout(() => window.location.replace('dashboard.html'), 1200);
    }
}

function displayRequestDetails() {
    const container = document.getElementById('requestDetails');
    const isIt = currentUser.role === 'it_specialist';
    const canDelete =
        isIt || (currentRequest.created_by === currentUser.id && currentRequest.status === 'new');

    let actionsHtml = '';
    if (isIt) {
        const assigneeOptions = itSpecialists
            .map(
                (s) =>
                    `<option value="${s.id}" ${currentRequest.assigned_to == s.id ? 'selected' : ''}>${App.escapeHtml(s.full_name)}</option>`
            )
            .join('');

        actionsHtml = `
            <div class="request-actions">
                <div class="action-field">
                    <label for="statusSelect">Статус</label>
                    <select id="statusSelect" class="input">
                        <option value="new" ${currentRequest.status === 'new' ? 'selected' : ''}>Новая</option>
                        <option value="in_progress" ${currentRequest.status === 'in_progress' ? 'selected' : ''}>В работе</option>
                        <option value="resolved" ${currentRequest.status === 'resolved' ? 'selected' : ''}>Решена</option>
                        <option value="closed" ${currentRequest.status === 'closed' ? 'selected' : ''}>Закрыта</option>
                    </select>
                </div>
                <div class="action-field">
                    <label for="assigneeSelect">Исполнитель</label>
                    <select id="assigneeSelect" class="input">
                        <option value="">Не назначен</option>
                        ${assigneeOptions}
                    </select>
                </div>
                <button type="button" id="btnUpdateStatus" class="btn btn-primary">Сохранить</button>
            </div>`;
    }

    container.innerHTML = `
        <div class="request-header-details">
            <div>
                <span class="request-id-label">Заявка #${currentRequest.id}</span>
                <h2>${App.escapeHtml(currentRequest.title)}</h2>
            </div>
            <div class="detail-badges">
                ${App.statusBadge(currentRequest.status)}
                ${App.priorityBadge(currentRequest.priority)}
            </div>
        </div>

        <div class="request-body">
            <div class="label">Описание</div>
            <p class="text">${App.escapeHtml(currentRequest.description)}</p>
        </div>

        <div class="info-grid">
            <div class="info-item">
                <div class="label">Категория</div>
                <div class="value">${App.escapeHtml(currentRequest.category_name || '—')}</div>
            </div>
            <div class="info-item">
                <div class="label">Автор</div>
                <div class="value">${App.escapeHtml(currentRequest.created_by_name || '—')}</div>
            </div>
            <div class="info-item">
                <div class="label">Создана</div>
                <div class="value">${App.formatDate(currentRequest.created_at, true)}</div>
            </div>
            <div class="info-item">
                <div class="label">Исполнитель</div>
                <div class="value" id="assigneeDisplay">${App.escapeHtml(currentRequest.assigned_to_name || 'Не назначен')}</div>
            </div>
        </div>

        ${actionsHtml}

        ${canDelete ? `<div class="request-actions request-actions--danger">
            <button type="button" id="btnDeleteRequest" class="btn btn-danger">Удалить заявку</button>
        </div>` : ''}
    `;

    document.getElementById('btnUpdateStatus')?.addEventListener('click', updateRequestByIt);
    document.getElementById('btnDeleteRequest')?.addEventListener('click', deleteRequest);
}

async function updateRequestByIt() {
    const status = document.getElementById('statusSelect').value;
    const assigneeVal = document.getElementById('assigneeSelect').value;
    const payload = { status };
    payload.assigned_to = assigneeVal ? Number(assigneeVal) : null;

    try {
        await api.updateRequest(requestId, payload);
        App.toast('Изменения сохранены', 'success');
        await loadRequestDetails();
        await loadStatusHistory(false);
    } catch (error) {
        App.toast(error.message, 'error');
    }
}

async function deleteRequest() {
    if (!confirm('Удалить эту заявку?')) return;

    try {
        await api.deleteRequest(requestId);
        App.toast('Заявка удалена', 'success');
        setTimeout(() => window.location.replace('dashboard.html'), 800);
    } catch (error) {
        App.toast(error.message, 'error');
    }
}

async function loadComments(silent = false) {
    try {
        const comments = await api.getComments(requestId);
        const ids = comments.map((c) => c.id).join(',');
        if (silent && ids === lastCommentIds) return;
        lastCommentIds = ids;
        displayComments(comments, silent);
    } catch (error) {
        if (!silent) console.error(error);
    }
}

function displayComments(comments, silent = false) {
    const container = document.getElementById('commentsList');
    const listWrap = document.getElementById('commentsListWrap');
    const countEl = document.getElementById('commentsCount');

    if (countEl) countEl.textContent = comments.length;

    if (comments.length === 0) {
        container.innerHTML = '<div class="panel-empty">Комментариев пока нет — напишите первым</div>';
        return;
    }

    const wasAtBottom =
        listWrap &&
        listWrap.scrollHeight - listWrap.scrollTop - listWrap.clientHeight < 80;

    container.innerHTML = comments
        .map((comment) => {
            const isMine = comment.user_id === currentUser.id;
            const initials = (comment.user_name || '?')
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

            return `
            <div class="comment-bubble ${isMine ? 'comment-mine' : 'comment-theirs'}">
                <div class="comment-avatar" aria-hidden="true">${App.escapeHtml(initials)}</div>
                <div class="comment-body">
                    <div class="comment-header">
                        <strong>${App.escapeHtml(comment.user_name)}</strong>
                        <span>${App.formatDate(comment.created_at, true)}</span>
                    </div>
                    <div class="comment-text">${App.escapeHtml(comment.comment)}</div>
                </div>
            </div>`;
        })
        .join('');

    if (!silent || wasAtBottom) {
        requestAnimationFrame(() => {
            if (listWrap) listWrap.scrollTop = listWrap.scrollHeight;
        });
    }
}

async function addComment() {
    const input = document.getElementById('newComment');
    const comment = input.value.trim();

    if (!comment) {
        App.toast('Введите текст комментария', 'error');
        return;
    }

    const btn = document.getElementById('btnAddComment');
    btn.disabled = true;

    try {
        await api.addComment(requestId, comment);
        input.value = '';
        await loadComments(false);
        App.toast('Сообщение отправлено', 'success');
    } catch (error) {
        App.toast(error.message, 'error');
    } finally {
        btn.disabled = false;
        input.focus();
    }
}

async function loadStatusHistory(silent = false) {
    try {
        const history = await api.getStatusHistory(requestId);
        displayStatusHistory(history);
    } catch (error) {
        if (!silent) console.error(error);
    }
}

function displayStatusHistory(history) {
    const container = document.getElementById('statusHistory');

    if (history.length === 0) {
        container.innerHTML = '<div class="panel-empty">История изменений пуста</div>';
        return;
    }

    container.innerHTML = history
        .map((item) => {
            const from = item.old_status ? App.getStatusText(item.old_status) : 'создание';
            const to = App.getStatusText(item.new_status);
            return `
        <div class="history-item">
            <div class="history-dot"></div>
            <div class="history-content">
                <div class="history-header">
                    <strong>${App.escapeHtml(item.changed_by_name)}</strong>
                    <span>${App.formatDate(item.changed_at, true)}</span>
                </div>
                <div class="history-text">${App.escapeHtml(from)} → <strong>${App.escapeHtml(to)}</strong></div>
            </div>
        </div>`;
        })
        .join('');
}
