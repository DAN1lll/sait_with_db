
const CONFIG = {
    API_URL: 'https://crimson-mountain-ad6e.block-cot.workers.dev',
    CACHE_TTL: 3600, // 1 час
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
