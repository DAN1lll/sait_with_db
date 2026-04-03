
async function loadStuckData() {
    showLoading('stuckResult');
    try {
        const data = await API.getStuck();
        renderStuckTable(data, 'stuckResult');
    } catch (error) {
        showError('stuckResult', error.message);
    }
}

async function loadWorkloadData() {
    showLoading('workloadResult');
    try {
        const data = await API.getWorkload();
        renderWorkloadTable(data, 'workloadResult');
    } catch (error) {
        showError('workloadResult', error.message);
    }
}

async function loadInitialTracking() {
    showLoading('trackResult');
    try {
        const data = await API.track(CONFIG.DEFAULT_TRACKING);
        renderTrackingResult(data, 'trackResult');
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            showError('trackResult', 'Отправление не найдено');
        } else {
            showError('trackResult', error.message);
        }
    }
}

// Обработчики форм
function initFormHandlers() {
    // Отслеживание
    document.getElementById('trackBtn')?.addEventListener('click', async () => {
        const tracking = document.getElementById('trackingInput')?.value.trim().toUpperCase();
        if (!tracking) { showError('trackResult', 'Введите трек-номер'); return; }
        showLoading('trackResult');
        try {
            const data = await API.track(tracking);
            renderTrackingResult(data, 'trackResult');
        } catch (error) {
            showError('trackResult', error.message === 'NOT_FOUND' ? 'Отправление не найдено' : error.message);
        }
    });
    
    // Регистрация
    document.getElementById('registerBtn')?.addEventListener('click', async () => {
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
            const result = await API.createShipment(data);
            if (result.success) {
                showSuccess('registerResult', `Отправление зарегистрировано! Трек: ${result.tracking_number}`);
                document.getElementById('regRecipient').value = '';
                document.getElementById('regAddress').value = '';
            } else {
                showError('registerResult', result.error || 'Ошибка');
            }
        } catch (error) {
            showError('registerResult', error.message);
        }
    });
}

// Пасхалка
function initEasterEgg() {
    let clickCount = 0;
    const logo = document.querySelector('.logo');
    if (!logo) return;
    
    logo.addEventListener('click', () => {
        clickCount++;
        setTimeout(() => { clickCount = 0; }, 1000);
        if (clickCount === 3) {
            const egg = document.createElement('div');
            egg.textContent = 'by Назаров Даниил from ИСП224/1';
            egg.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#1e293b; color:#a5b4fc; padding:8px 16px; border-radius:40px; font-size:12px; z-index:9999; font-family:monospace;';
            document.body.appendChild(egg);
            setTimeout(() => egg.remove(), 5000);
            clickCount = 0;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initFormHandlers();
    initEasterEgg();
    loadInitialTracking();
    loadStuckData();
    loadWorkloadData();
});

console.log('%c by Назаров Даниил from ИСП224/1 ', 'background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-family: monospace; font-size: 12px;');
