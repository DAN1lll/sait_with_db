
const API = {
    async track(tracking) {
        const resp = await fetch(`${CONFIG.API_URL}/api/postal/track/${tracking}`);
        if (!resp.ok) throw new Error(resp.status === 404 ? 'NOT_FOUND' : 'API Error');
        return resp.json();
    },
    
    async getStuck() {
        const resp = await fetch(`${CONFIG.API_URL}/api/postal/stuck`);
        return resp.json();
    },
    
    async getWorkload() {
        const resp = await fetch(`${CONFIG.API_URL}/api/postal/office-workload`);
        const result = await resp.json();
        return result.success ? result.data : [];
    },
    
    async getOffices() {
        const resp = await fetch(`${CONFIG.API_URL}/api/postal/offices`);
        return resp.json();
    },
    
    async createShipment(data) {
        const resp = await fetch(`${CONFIG.API_URL}/api/admin/shipment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return resp.json();
    },
    
    async updateStatus(data) {
        const resp = await fetch(`${CONFIG.API_URL}/api/admin/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return resp.json();
    },
    
    async closeOffice(indexCode) {
        const resp = await fetch(`${CONFIG.API_URL}/api/admin/close-office`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index_code: indexCode })
        });
        return resp.json();
    }
};
