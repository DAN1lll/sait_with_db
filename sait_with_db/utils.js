

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateStr;
    }
}

function getStatusInfo(status) {
    return STATUS_MAP[status] || { name: status || 'Неизвестно', class: 'status-registered' };
}

function getStatusName(status) {
    return STATUS_MAP[status]?.name || status || 'Неизвестно';
}

function getStatusClass(status) {
    return STATUS_MAP[status]?.class || 'status-registered';
}
