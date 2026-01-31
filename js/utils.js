import { appData } from './state.js';

// Escape HTML to prevent XSS
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Generate unique ID
export function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate filename with timestamp
export function generateFilename(prefix, extension) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const datePart = `${year}-${month}-${day}`;
    const timePart = `${hours}-${minutes}-${seconds}`;

    const username = appData.username ? appData.username.trim() : '';
    const usernamePart = username ? `_${username}` : '';

    return `${prefix}${usernamePart}_${datePart}_${timePart}.${extension}`;
}
