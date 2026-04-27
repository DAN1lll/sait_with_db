
const CONFIG = {
    API_URL: 'https://crimson-mountain-ad6e.cloudkot.workers.dev',
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


class RequestLock {
    constructor() {
        this.activeRequests = new Map();
    }
    
    async execute(buttonId, requestFn, ...args) {
        const button = document.getElementById(buttonId);
        if (this.activeRequests.get(buttonId)) {
            this.showButtonFeedback(button, '⏳ Подождите...', true);
            return null;
        }
        this.activeRequests.set(buttonId, true);
        const originalText = button?.textContent;
        this.showButtonFeedback(button, '⏳ Отправка...', true);
        try {
            return await requestFn(...args);
        } finally {
            this.activeRequests.delete(buttonId);
            this.showButtonFeedback(button, originalText, false);
        }
    }
    
    showButtonFeedback(button, text, disabled) {
        if (!button) return;
        button.textContent = text;
        button.disabled = disabled;
        button.style.opacity = disabled ? '0.6' : '1';
        button.style.cursor = disabled ? 'wait' : 'pointer';
    }
}

const requestLock = new RequestLock();


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


async function trackShipment(tracking) {
    const resp = await fetch(`${CONFIG.API_URL}/api/postal/track/${tracking}`);
    if (!resp.ok) throw new Error(resp.status === 404 ? 'NOT_FOUND' : 'API Error');
    return resp.json();
}

async function getStuck() {
    const resp = await fetch(`${CONFIG.API_URL}/api/postal/stuck`);
    return resp.json();
}

async function getWorkload() {
    const resp = await fetch(`${CONFIG.API_URL}/api/postal/office-workload`);
    const result = await resp.json();
    return result.success ? result.data : [];
}

async function createShipment(data) {
    const resp = await fetch(`${CONFIG.API_URL}/api/admin/shipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return resp.json();
}

async function updateStatus(data) {
    const resp = await fetch(`${CONFIG.API_URL}/api/admin/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return resp.json();
}

async function closeOffice(indexCode) {
    const resp = await fetch(`${CONFIG.API_URL}/api/admin/close-office`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index_code: indexCode })
    });
    return resp.json();
}


async function loadTracking() {
    const tracking = document.getElementById('trackingInput')?.value.trim().toUpperCase();
    if (!tracking) { showError('trackResult', 'Введите трек-номер'); return; }
    
    showLoading('trackResult');
    try {
        const data = await trackShipment(tracking);
        const statusClass = getStatusClass(data.currentStatus?.status);
        document.getElementById('trackResult').innerHTML = `
            <div><strong>📦 Трек-номер:</strong> ${escapeHtml(data.shipment.tracking_number)}</div>
            <div><strong>👤 Получатель:</strong> ${escapeHtml(data.shipment.recipient_name)}</div>
            <div><strong>📍 Место:</strong> ${escapeHtml(data.currentStatus?.location_index || '—')}</div>
            <div><strong>📊 Статус:</strong> <span class="status-badge ${statusClass}">${getStatusName(data.currentStatus?.status)}</span></div>
            <div><strong>🕐 Обновлено:</strong> ${formatDate(data.currentStatus?.status_date)}</div>
        `;
    } catch (e) {
        showError('trackResult', e.message === 'NOT_FOUND' ? 'Отправление не найдено' : e.message);
    }
}

async function loadStuck() {
    showLoading('stuckResult');
    try {
        const data = await getStuck();
        const shipments = Array.isArray(data) ? data : (data.data || []);
        if (!shipments.length) {
            document.getElementById('stuckResult').innerHTML = '<div class="success">✅ Нет отправлений, застрявших в сортировке более 2 дней</div>';
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
        const data = await getWorkload();
        if (!data.length) { showError('workloadResult', 'Нет данных'); return; }
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

async function registerShipment() {
    const data = {
        recipient_name: document.getElementById('regRecipient')?.value,
        recipient_address: document.getElementById('regAddress')?.value,
        sender_name: document.getElementById('regSender')?.value,
        weight_kg: parseFloat(document.getElementById('regWeight')?.value || 0),
        type: document.getElementById('regType')?.value,
        location_index: document.getElementById('regOffice')?.value
    };
    if (!data.recipient_name || !data.recipient_address) {
        showError('registerResult', 'Заполните получателя и адрес');
        return;
    }
    showLoading('registerResult');
    try {
        const result = await createShipment(data);
        if (result.success) {
            showSuccess('registerResult', `Отправление зарегистрировано! Трек: ${result.tracking_number}`);
            document.getElementById('regRecipient').value = '';
            document.getElementById('regAddress').value = '';
        } else {
            showError('registerResult', result.error || 'Ошибка');
        }
    } catch (e) { showError('registerResult', e.message); }
}

async function updateShipmentStatus() {
    const data = {
        tracking_number: document.getElementById('updateTracking')?.value.trim().toUpperCase(),
        status: document.getElementById('updateStatus')?.value,
        location_index: document.getElementById('updateOffice')?.value,
        notes: document.getElementById('updateNotes')?.value
    };
    if (!data.tracking_number) { showError('updateResult', 'Введите трек-номер'); return; }
    showLoading('updateResult');
    try {
        const result = await updateStatus(data);
        if (result.success) {
            showSuccess('updateResult', 'Статус обновлён!');
            document.getElementById('updateTracking').value = '';
            document.getElementById('updateNotes').value = '';
        } else {
            showError('updateResult', result.error || 'Ошибка');
        }
    } catch (e) { showError('updateResult', e.message); }
}

async function closeOfficeAction() {
    const office = document.getElementById('closeOffice')?.value.trim();
    if (!office) { showError('closeResult', 'Введите индекс отделения'); return; }
    showLoading('closeResult');
    try {
        const result = await closeOffice(office);
        if (result.success) {
            showSuccess('closeResult', result.message || 'Отделение закрыто');
        } else {
            showError('closeResult', result.error || result.message || 'Ошибка');
        }
    } catch (e) { showError('closeResult', e.message); }
}


function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            tabs.forEach(b => b.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${tabId}`)?.classList.add('active');
            if (tabId === 'stuck') loadStuck();
            if (tabId === 'workload') loadWorkload();
        });
    });
}


function initHandlers() {
    // Отслеживание
    const trackBtn = document.getElementById('trackBtn');
    if (trackBtn) {
        trackBtn.addEventListener('click', () => requestLock.execute('trackBtn', loadTracking));
    }
    const trackingInput = document.getElementById('trackingInput');
    if (trackingInput) {
        trackingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') requestLock.execute('trackBtn', loadTracking);
        });
    }
    
    // Регистрация
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', () => requestLock.execute('registerBtn', registerShipment));
    }
    
    // Обновление статуса
    const updateStatusBtn = document.getElementById('updateStatusBtn');
    if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', () => requestLock.execute('updateStatusBtn', updateShipmentStatus));
    }
    
    // Закрытие отделения
    const closeOfficeBtn = document.getElementById('closeOfficeBtn');
    if (closeOfficeBtn) {
        closeOfficeBtn.addEventListener('click', () => requestLock.execute('closeOfficeBtn', closeOfficeAction));
    }
}

function initEasterEgg() {
    let clickCount = 0;
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', () => {
            clickCount++;
            setTimeout(() => clickCount = 0, 1000);
            if (clickCount === 3) {
                const egg = document.createElement('div');
                egg.textContent = 'by Назаров Даниил from ИСП224/1';
                egg.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#1e293b; color:#a5b4fc; padding:8px 16px; border-radius:40px; font-size:12px; z-index:9999;';
                document.body.appendChild(egg);
                setTimeout(() => egg.remove(), 5000);
                clickCount = 0;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initHandlers();
    initEasterEgg();
    loadTracking();
    loadStuck();
    loadWorkload();
});

console.log('%c by Назаров Даниил from ИСП224/1 ', 'background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-family: monospace; font-size: 12px;');
