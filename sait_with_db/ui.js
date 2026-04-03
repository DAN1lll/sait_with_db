
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loader">
                <div class="loader-spinner"></div>
                <div>Загрузка данных...</div>
            </div>
        `;
    }
}

function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="error">❌ ${escapeHtml(message)}</div>`;
    }
}

function showSuccess(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="success">✅ ${escapeHtml(message)}</div>`;
    }
}

function renderTrackingResult(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const statusInfo = getStatusInfo(data.currentStatus?.status);
    
    container.innerHTML = `
        <div class="card">
            <h3>📦 Отправление ${escapeHtml(data.shipment.tracking_number)}</h3>
            <div class="grid-2">
                <div><strong>Получатель:</strong> ${escapeHtml(data.shipment.recipient_name)}</div>
                <div><strong>Тип:</strong> ${data.shipment.type}</div>
                <div><strong>Вес:</strong> ${data.shipment.weight_kg} кг</div>
                <div><strong>Статус:</strong> <span class="status-badge ${statusInfo.class}">${statusInfo.name}</span></div>
                <div><strong>Местоположение:</strong> ${escapeHtml(data.currentStatus?.location_index || '—')}</div>
                <div><strong>Последнее обновление:</strong> ${formatDate(data.currentStatus?.status_date)}</div>
            </div>
        </div>
    `;
}

function renderStuckTable(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!data.length) {
        container.innerHTML = '<div class="success">✅ Нет отправлений, застрявших в сортировке более 2 дней</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr><th>Трек-номер</th><th>Получатель</th><th>Тип</th><th>Дней в сортировке</th></tr>
                </thead>
                <tbody>
                    ${data.map(s => `
                        <tr>
                            <td><strong>${escapeHtml(s.tracking_number)}</strong></td>
                            <td>${escapeHtml(s.recipient_name)}</td>
                            <td>${s.type}</td>
                            <td><span class="status-badge status-sorting">${Math.round(s.days_stuck)} дн.</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderWorkloadTable(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!data.length) {
        container.innerHTML = '<div class="error">Нет данных об отделениях</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr><th>Индекс</th><th>Адрес</th><th>Телефон</th><th>Всего</th><th>Активных</th></tr>
                </thead>
                <tbody>
                    ${data.map(office => `
                        <tr>
                            <td><strong>${escapeHtml(office.index_code)}</strong></td>
                            <td>${escapeHtml(office.address)}</td>
                            <td>${escapeHtml(office.phone)}</td>
                            <td style="text-align: center;">${office.total_shipments || 0}</td>
                            <td style="text-align: center;">
                                <span class="status-badge ${(office.active_shipments || 0) > 0 ? 'status-transit' : 'status-delivered'}">
                                    ${office.active_shipments || 0}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
