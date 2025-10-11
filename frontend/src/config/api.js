// API Configuration
const API_BASE_URL = 'http://localhost:3001';

export const API_ENDPOINTS = {
    USERS: `${API_BASE_URL}/api/users`,
    CARDS: {
        START_SCAN: `${API_BASE_URL}/api/cards/start-scan`,
        CANCEL_SCAN: `${API_BASE_URL}/api/cards/cancel-scan`,
        SCAN_STATUS: (userId) => `${API_BASE_URL}/api/cards/scan-status/${userId}`,
        LIST: `${API_BASE_URL}/api/cards`,
        DELETE: (userId) => `${API_BASE_URL}/api/cards/${userId}`
    }
};

export default API_BASE_URL;
