// POSTAL TRACKING SYSTEM
// Version 1.0

const CONFIG = {
    API_URL: 'https://crimson-mountain-ad6e.block-cot.workers.dev',
    DEFAULT_TRACKING: 'TRK001'
};

const STATUS_MAP = {
    'registered': { name: 'Зарегистрировано', class: 'chip-registered' },
    'accepted': { name: 'Принято', class: 'chip-registered' },
    'in_transit': { name: 'В пути', class: 'chip-transit' },
    'sorting': { name: 'На сортировке', class: 'chip-sorting' },
    'arrived': { name: 'Прибыло', class: 'chip-transit' },
    'out_for_delivery': { name: 'Доставляется', class: 'chip-transit' },
    'delivered': { name: 'Доставлено', class: 'chip-delivered' },
    'failed_delivery': { name: 'Неудачная доставка', class: 'chip-registered' },
    'returned': { name: 'Возвращено', class: 'chip-registered' }
};

const TYPE_MAP = {
    'letter': 'Письмо',
    'parcel': 'Посылка',
    'package': 'Бандероль',
    'document': 'Документы',
    'express': 'Экспресс'
};

let DOM = {};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return dateStr; }
}

function getStatusInfo(status) {
    return STATUS_MAP[status] || { name: status || 'Неизвестно', class: 'chip-registered' };
}

function getTypeName(type) {
    return TYPE_MAP[type] || type || '—';
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

function showError(message) {
    if (!DOM.resultContainer) return;
    DOM.resultContainer.innerHTML = `
        <div class="error-card">
            <div class="error-icon">⚠</div>
            <div class="error-title">Отправление не найдено</div>
            <div class="error-message">${escapeHtml(message)}</div>
        </div>
    `;
}

function renderResult(data) {
    if (!data?.shipment) {
        showError('Некорректные данные');
        return;
    }
    
    const statusInfo = getStatusInfo(data.currentStatus?.status);
    const currentStatus = data.currentStatus || {};
    
    const html = `
        <div class="result-card">
            <div class="shipment-card">
                <div class="shipment-header">
                    <div class="tracking-number">${escapeHtml(data.shipment.tracking_number)}</div>
                    <div class="status-chip ${statusInfo.class}">${statusInfo.name}</div>
                </div>
                <div class="shipment-body">
                    <div class="info-grid">
                        <div class="info-card">
                            <div class="info-label">ПОЛУЧАТЕЛЬ</div>
                            <div class="info-value">${escapeHtml(data.shipment.recipient_name)}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">ТИП ОТПРАВЛЕНИЯ</div>
                            <div class="info-value">${getTypeName(data.shipment.type)}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">ВЕС</div>
                            <div class="info-value">${data.shipment.weight_kg} кг</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">ТЕКУЩЕЕ МЕСТОПОЛОЖЕНИЕ</div>
                            <div class="info-value">${escapeHtml(currentStatus.location_index || '—')}</div>
                        </div>
                    </div>
                    <div class="timeline-title">История перемещений</div>
                    <div class="timeline">
                        ${(data.history || []).map(item => {
                            const itemStatus = getStatusInfo(item.status);
                            return `
                                <div class="timeline-item">
                                    <div class="timeline-dot"></div>
                                    <div class="timeline-date">${formatDate(item.status_date)}</div>
                                    <div class="timeline-status">${itemStatus.name}</div>
                                    <div class="timeline-location">Отделение: ${escapeHtml(item.location_index)}</div>
                                    ${item.notes ? `<div class="timeline-notes">${escapeHtml(item.notes)}</div>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    DOM.resultContainer.innerHTML = html;
}

async function trackShipment() {
    const tracking = DOM.trackingInput?.value.trim().toUpperCase();
    if (!tracking) {
        showError('Введите трек-номер');
        return;
    }
    
    if (!/^[A-Z0-9]{6,20}$/.test(tracking)) {
        showError('Неверный формат трек-номера');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/postal/track/${tracking}`);
        if (!response.ok) {
            if (response.status === 404) throw new Error('NOT_FOUND');
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        renderResult(data);
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            showError('Отправление с указанным трек-номером не найдено');
        } else {
            showError(error.message || 'Ошибка соединения с сервером');
        }
    }
}


(function() {
    let clickCount = 0;
    let easterEggShown = false;
    
    function showEasterEgg() {
        if (easterEggShown) return;
        easterEggShown = true;
        
        const eggDiv = document.createElement('div');
        eggDiv.innerHTML = 'by Назаров Даниил from ИСП224/1';
        eggDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1e293b;
            color: #a5b4fc;
            padding: 8px 16px;
            border-radius: 40px;
            font-size: 12px;
            font-family: monospace;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            border: 1px solid #334155;
        `;
        document.body.appendChild(eggDiv);
        
        setTimeout(() => {
            eggDiv.remove();
            easterEggShown = false;
        }, 5000);
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.style.cursor = 'pointer';
            logo.addEventListener('click', function() {
                clickCount++;
                setTimeout(() => { clickCount = 0; }, 1000);
                if (clickCount === 3) {
                    showEasterEgg();
                    clickCount = 0;
                }
            });
        } else {
            console.log('Логотип не найден');
        }
    });
})();

console.log('%c by Назаров Даниил from ИСП224/1 ', 
    'background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-family: monospace; font-size: 12px;'
);

// Initialization
function init() {
    DOM = {
        trackingInput: document.getElementById('trackingInput'),
        trackBtn: document.getElementById('trackBtn'),
        resultContainer: document.getElementById('resultContainer'),
        apiStatus: document.getElementById('apiStatus')
    };
    
    if (DOM.trackBtn) DOM.trackBtn.addEventListener('click', trackShipment);
    if (DOM.trackingInput) {
        DOM.trackingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') trackShipment();
        });
    }
    
    document.querySelectorAll('.example-badge').forEach(badge => {
        badge.addEventListener('click', () => {
            if (DOM.trackingInput) {
                DOM.trackingInput.value = badge.dataset.tracking;
                trackShipment();
            }
        });
    });
    
    trackShipment();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
