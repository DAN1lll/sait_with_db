
const CONFIG = {
    API_URL: 'https://crimson-mountain-ad6e.block-cot.workers.dev',
    DEFAULT_TRACKING: 'TRK001',
    DEBOUNCE_DELAY: 300,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};

const STATUS_CONFIG = {
    delivered: { name: 'Доставлено', icon: '🏠', chipClass: 'chip-delivered' },
    in_transit: { name: 'В пути', icon: '🚚', chipClass: 'chip-transit' },
    out_for_delivery: { name: 'Доставляется', icon: '🚲', chipClass: 'chip-transit' },
    sorting: { name: 'На сортировке', icon: '📦', chipClass: 'chip-sorting' },
    registered: { name: 'Зарегистрировано', icon: '📝', chipClass: 'chip-registered' },
    arrived: { name: 'Прибыло', icon: '🏢', chipClass: 'chip-transit' },
    accepted: { name: 'Принято', icon: '✅', chipClass: 'chip-registered' },
    failed_delivery: { name: 'Неудачная доставка', icon: '⚠️', chipClass: 'chip-registered' },
    returned: { name: 'Возвращено', icon: '🔄', chipClass: 'chip-registered' }
};

const TYPE_CONFIG = {
    letter: 'Письмо',
    parcel: 'Посылка',
    package: 'Бандероль',
    document: 'Документы',
    express: 'Экспресс'
};

const DOM = {
    trackingInput: null,
    trackBtn: null,
    resultContainer: null,
    apiStatus: null
};

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
    return STATUS_CONFIG[status] || {
        name: status || 'Неизвестно',
        icon: '📍',
        chipClass: 'chip-registered'
    };
}


function getTypeName(type) {
    return TYPE_CONFIG[type] || type || '—';
}


function showLoading() {
    if (!DOM.resultContainer) return;
    DOM.resultContainer.innerHTML = `
        <div class="loader">
            <div class="loader-spinner"></div>
            <div class="loader-text">Поиск отправления...</div>
        </div>
    `;
}


function showError(message, statusCode = null) {
    if (!DOM.resultContainer) return;
    let errorMessage = message || 'Произошла ошибка при поиске';
    if (statusCode === 404) {
        errorMessage = 'Посылка с таким трек-номером не найдена';
    }
    DOM.resultContainer.innerHTML = `
        <div class="error-box">
            <div class="error-icon">📭</div>
            <div class="error-title">Посылка не найдена</div>
            <div class="error-message">${escapeHtml(errorMessage)}</div>
        </div>
    `;
}


function updateApiStatus(isOnline) {
    if (!DOM.apiStatus) return;
    if (isOnline) {
        DOM.apiStatus.className = 'status-badge badge-online';
        DOM.apiStatus.innerHTML = '<span class="dot dot-green"></span> API активен';
    } else {
        DOM.apiStatus.className = 'status-badge badge-offline';
        DOM.apiStatus.innerHTML = '<span class="dot dot-red"></span> API недоступен';
    }
}


function renderResult(data) {
    if (!data || !data.shipment) {
        showError('Некорректные данные');
        return;
    }
    
    const statusInfo = getStatusInfo(data.currentStatus?.status);
    const currentStatus = data.currentStatus || {};
    
    const html = `
        <div class="result-card">
            <div class="shipment-header">
                <div class="tracking-number">📦 ${escapeHtml(data.shipment.tracking_number)}</div>
                <div class="status-chip ${statusInfo.chipClass}">
                    <span>${statusInfo.icon}</span> ${statusInfo.name}
                </div>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">📋 ПОЛУЧАТЕЛЬ</div>
                    <div class="info-value">${escapeHtml(data.shipment.recipient_name)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">📦 ТИП</div>
                    <div class="info-value">${getTypeName(data.shipment.type)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">⚖️ ВЕС</div>
                    <div class="info-value">${data.shipment.weight_kg} кг</div>
                </div>
                <div class="info-item">
                    <div class="info-label">📍 ТЕКУЩЕЕ МЕСТО</div>
                    <div class="info-value">${escapeHtml(currentStatus.location_index || '—')}</div>
                </div>
            </div>

            <div class="timeline-title">
                <span>📜</span> История перемещений
            </div>

            <div class="timeline">
                ${(data.history || []).map((item, index) => {
                    const itemStatus = getStatusInfo(item.status);
                    return `
                        <div class="timeline-item">
                            <div class="timeline-dot"></div>
                            <div class="timeline-date">${formatDate(item.status_date)}</div>
                            <div class="timeline-status">${itemStatus.icon} ${itemStatus.name}</div>
                            <div class="timeline-location">📍 Отделение: ${escapeHtml(item.location_index)}</div>
                            ${item.notes ? `<div class="timeline-notes">📝 ${escapeHtml(item.notes)}</div>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    if (DOM.resultContainer) {
        DOM.resultContainer.innerHTML = html;
    }
}


async function fetchTracking(tracking, retryCount = 0) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/postal/track/${tracking}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('NOT_FOUND');
            }
            if (response.status >= 500 && retryCount < CONFIG.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
                return fetchTracking(tracking, retryCount + 1);
            }
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        
        updateApiStatus(true);
        return data;
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            throw error;
        }
        updateApiStatus(false);
        throw error;
    }
}


async function trackShipment() {
    const tracking = DOM.trackingInput?.value.trim().toUpperCase();
    
    if (!tracking) {
        showError('Введите трек-номер');
        return;
    }
    
    // Basic validation
    if (!/^[A-Z0-9]{6,20}$/.test(tracking)) {
        showError('Неверный формат трек-номера. Допустимы буквы и цифры (6-20 символов)');
        return;
    }
    
    showLoading();
    
    try {
        const data = await fetchTracking(tracking);
        renderResult(data);
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            showError('Посылка с таким трек-номером не найдена', 404);
        } else {
            showError(error.message || 'Ошибка соединения с сервером');
        }
        console.error('Tracking error:', error);
    }
}


function initDomReferences() {
    DOM.trackingInput = document.getElementById('trackingInput');
    DOM.trackBtn = document.getElementById('trackBtn');
    DOM.resultContainer = document.getElementById('resultContainer');
    DOM.apiStatus = document.getElementById('apiStatus');
}


function setupEventListeners() {
    if (DOM.trackBtn) {
        DOM.trackBtn.addEventListener('click', trackShipment);
    }
    
    if (DOM.trackingInput) {
        DOM.trackingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                trackShipment();
            }
        });
    }
}


async function checkApiHealth() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/test`);
        updateApiStatus(response.ok);
    } catch {
        updateApiStatus(false);
    }
}

async function loadDefaultShipment() {
    if (CONFIG.DEFAULT_TRACKING) {
        try {
            const data = await fetchTracking(CONFIG.DEFAULT_TRACKING);
            renderResult(data);
        } catch (error) {
            console.log('Default shipment not found');
        }
    }
}


function init() {
    initDomReferences();
    setupEventListeners();
    checkApiHealth();
    loadDefaultShipment();
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
