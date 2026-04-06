// ============================================
// КОНФИГУРАЦИЯ
// ============================================
const CONFIG = {
    API_URL: 'https://crimson-mountain-ad6e.block-cot.workers.dev',
    DEFAULT_TRACKING: 'TRK001'
};

const STATUS_MAP = {
    'registered': { name: 'Зарегистрировано', class: 'status-registered' },
    'accepted': { name: 'Принято', class: 'status-registered' },
    'in_transit': { name: 'В пути', class: 'status-transit' },
    'sorting': { name: 'На сортировке', class: 'status-sorting' },
    'arrived': { name: 'Прибыло', class: 'status-transit' },
    'out_for_delivery': { name: 'Доставляется', class: 'status-transit' },
    'delivered': { name: 'Доставлено', class: 'status-delivered' },
    'failed_delivery': { name: 'Неудачная доставка', class: 'status-registered' },
    'returned': { name: 'Возвращено', class: 'status-registered' }
};

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
}

function getStatusName(status) {
    return STATUS_MAP[status]?.name || status || 'Неизвестно';
}

function getStatusClass(status) {
    return STATUS_MAP[status]?.class || 'status-registered';
}

function showLoading(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '<div class="loader"><div class="loader-spinner"></div><div>Загрузка...</div></div>';
}

function showError(containerId, message) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `<div class="error">❌ ${escapeHtml(message)}</div>`;
}

function showSuccess(containerId, message) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `<div class="success">✅ ${escapeHtml(message)}</div>`;
}

// ============================================
// ОСНОВНЫЕ ФУНКЦИИ
// ============================================
async function loadTracking() {
    const tracking = document.getElementById('trackingInput')?.value.trim().toUpperCase();
    if (!tracking) { showError('trackResult', 'Введите трек-номер'); return; }
    
    showLoading('trackResult');
    try {
        const resp = await fetch(`${CONFIG.API_URL}/api/postal/track/${tracking}`);
        const data = await resp.json();
        
        if (!resp.ok || data.error) {
            throw new Error(data.error || 'Не найдено');
        }
        
        const statusClass = getStatusClass(data.currentStatus?.status);
        document.getElementById('trackResult').innerHTML = `
            <div><strong>📦 Трек-номер:</strong> ${escapeHtml(data.shipment.tracking_number)}</div>
            <div><strong>👤 Получатель:</strong> ${escapeHtml(data.shipment.recipient_name)}</div>
            <div><strong>📍 Место:</strong> ${escapeHtml(data.currentStatus?.location_index || '—')}</div>
            <div><strong>📊 Статус:</strong> <span class="status-badge ${statusClass}">${getStatusName(data.currentStatus?.status)}</span></div>
            <div><strong>🕐 Обновлено:</strong> ${formatDate(data.currentStatus?.status_date)}</div>
        `;
    } catch (e) {
        showError('trackResult', e.message);
    }
}

async function loadStuck() {
    showLoading('stuckResult');
    try {
        const resp = await fetch(`${CONFIG.API_URL}/api/postal/stuck`);
        const result = await resp.json();
        
        // Извлекаем массив данных
        const shipments = Array.isArray(result) ? result : (result.data || []);
        
        if (!shipments.length) {
            document.getElementById('stuckResult').innerHTML = '<div class="success">✅ Нет застрявших отправлений</div>';
            return;
        }
        
        document.getElementById('stuckResult').innerHTML = `
            <table style="width:100%">
                <thead><tr><th>Трек-номер</th><th>Получатель</th><th>Тип</th><th>Дней</th></tr></thead>
                <tbody>
                    ${shipments.map(s => `
                        <tr>
                            <td><strong>${escapeHtml(s.tracking_number)}</strong></td>
                            <td>${escapeHtml(s.recipient_name)}</td>
                            <td>${s.type}</td>
                            <td style="text-align:center">${Math.round(s.days_stuck)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) { showError('stuckResult', e.message); }
}

async function loadWorkload() {
    showLoading('workloadResult');
    try {
        const resp = await fetch(`${CONFIG.API_URL}/api/postal/office-workload`);
        const result = await resp.json();
        
        // Извлекаем массив данных
        let data = [];
        if (result.success && Array.isArray(result.data)) {
            data = result.data;
        } else if (Array.isArray(result)) {
            data = result;
        } else if (result.data && Array.isArray(result.data)) {
            data = result.data;
        }
        
        if (!data.length) {
            showError('workloadResult', 'Нет данных');
            return;
        }
        
        document.getElementById('workloadResult').innerHTML = `
            <table style="width:100%">
                <thead>
                    <tr><th>Индекс</th><th>Адрес</th><th>Телефон</th><th>Всего</th><th>Активных</th></tr>
                </thead>
                <tbody>
                    ${data.map(o => `
                        <tr>
                            <td><strong>${escapeHtml(o.index_code)}</strong></td>
                            <td>${escapeHtml(o.address)}</td>
                            <td>${escapeHtml(o.phone)}</td>
                            <td style="text-align:center">${o.total_shipments || 0}</td>
                            <td style="text-align:center">
                                <span class="status-badge ${(o.active_shipments || 0) > 0 ? 'status-transit' : 'status-delivered'}">
                                    ${o.active_shipments || 0}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) { showError('workloadResult', e.message); }
}

// ============================================
// ЗАПУСК
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadTracking();
    loadStuck();
    loadWorkload();
});

console.log('%c by Назаров Даниил from ИСП224/1 ', 'background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-family: monospace; font-size: 12px;');
