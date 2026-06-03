let currentUser = null;
let currentRequest = null;
let requestId = null;

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

    document.getElementById('btnAddComment')?.addEventListener('click', addComment);
    document.getElementById('newComment')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addComment();
    });

    await loadRequestDetails();
    await loadComments();
    await loadStatusHistory();
});

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
        actionsHtml = `
            <div class="request-actions">
                <select id="statusSelect" class="select" aria-label="Статус">
                    <option value="new" ${currentRequest.status === 'new' ? 'selected' : ''}>Новая</option>
                    <option value="in_progress" ${currentRequest.status === 'in_progress' ? 'selected' : ''}>В работе</option>
                    <option value="resolved" ${currentRequest.status === 'resolved' ? 'selected' : ''}>Решена</option>
                    <option value="closed" ${currentRequest.status === 'closed' ? 'selected' : ''}>Закрыта</option>
                </select>
                <button type="button" id="btnUpdateStatus" class="btn btn-primary">Сохранить статус</button>
            </div>`;
    }

    container.innerHTML = `
        <div class="request-header-details">
            <h2>${App.escapeHtml(currentRequest.title)}</h2>
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
                <div class="value">${App.escapeHtml(currentRequest.assigned_to_name || 'Не назначен')}</div>
            </div>
        </div>

        ${actionsHtml}

        ${canDelete ? `<div class="request-actions" style="border-top:none;padding-top:0">
            <button type="button" id="btnDeleteRequest" class="btn btn-danger">Удалить заявку</button>
        </div>` : ''}
    `;

    document.getElementById('btnUpdateStatus')?.addEventListener('click', updateStatus);
    document.getElementById('btnDeleteRequest')?.addEventListener('click', deleteRequest);
}

async function updateStatus() {
    const newStatus = document.getElementById('statusSelect').value;

    try {
        await api.updateRequest(requestId, { status: newStatus });
        App.toast('Статус обновлён', 'success');
        await loadRequestDetails();
        await loadStatusHistory();
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

async function loadComments() {
    try {
        const comments = await api.getComments(requestId);
        displayComments(comments);
    } catch (error) {
        console.error(error);
    }
}

function displayComments(comments) {
    const container = document.getElementById('commentsList');

    if (comments.length === 0) {
        container.innerHTML = '<div class="no-data">Комментариев пока нет — будьте первым</div>';
        return;
    }

    container.innerHTML = comments
        .map(
            (comment) => `
        <div class="comment-item">
            <div class="comment-header">
                <strong>${App.escapeHtml(comment.user_name)}</strong>
                <span>${App.formatDate(comment.created_at, true)}</span>
            </div>
            <div class="comment-text">${App.escapeHtml(comment.comment)}</div>
        </div>`
        )
        .join('');
}

async function addComment() {
    const input = document.getElementById('newComment');
    const comment = input.value.trim();

    if (!comment) {
        App.toast('Введите текст комментария', 'error');
        return;
    }

    try {
        await api.addComment(requestId, comment);
        input.value = '';
        await loadComments();
        App.toast('Комментарий добавлен', 'success');
    } catch (error) {
        App.toast(error.message, 'error');
    }
}

async function loadStatusHistory() {
    try {
        const history = await api.getStatusHistory(requestId);
        displayStatusHistory(history);
    } catch (error) {
        console.error(error);
    }
}

function displayStatusHistory(history) {
    const container = document.getElementById('statusHistory');

    if (history.length === 0) {
        container.innerHTML = '<div class="no-data">История пуста</div>';
        return;
    }

    container.innerHTML = history
        .map((item) => {
            const from = item.old_status
                ? App.getStatusText(item.old_status)
                : '—';
            const to = App.getStatusText(item.new_status);
            return `
        <div class="history-item">
            <div class="history-header">
                <strong>${App.escapeHtml(item.changed_by_name)}</strong>
                <span>${App.formatDate(item.changed_at, true)}</span>
            </div>
            <div class="history-text">${App.escapeHtml(from)} → ${App.escapeHtml(to)}</div>
        </div>`;
        })
        .join('');
}
