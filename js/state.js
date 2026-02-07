// Global App State
export let appData = {
    username: '',
    exportTitle: 'My Prefy List',
    levels: [
        { id: 'none', name: 'None', color: '#ffffff' },
        { id: 'favorite', name: 'Favorite', color: '#90cdf4' },
        { id: 'liked', name: 'Liked', color: '#48bb78' },
        { id: 'neutral', name: 'Neutral', color: '#fbd38d' },
        { id: 'will-try', name: 'Will Try', color: '#f6ad55' },
        { id: 'disliked', name: 'Disliked', color: '#fc8181' },
        { id: 'hard-limit', name: 'Hard Limit', color: '#f56565' }
    ],
    categories: []
};

// View mode state
export let viewMode = 'grid'; // 'grid' | 'quick-edit'

// Current editing state
export let currentEditingCategory = null;
export let currentEditingEntry = null;
export let currentCategoryForEntry = null;

// Drag and drop state
export let draggedElement = null;
export let draggedIndex = null;
export let dragType = null; // 'level', 'category', or 'entry'
export let dragCategoryId = null; // For entries

// Settings state
export let availableConfigs = []; // Array of {filename, name} objects
export let pendingConfigLoad = null; // Config filename to load after save prompt
export let pendingPrefyData = null; // Parsed prefy data to load after save prompt

// State setters (needed because we can't reassign imported bindings)
export function setAppData(data) {
    appData = data;
}

export function setViewMode(mode) {
    viewMode = mode;
}

export function setCurrentEditingCategory(id) {
    currentEditingCategory = id;
}

export function setCurrentEditingEntry(id) {
    currentEditingEntry = id;
}

export function setCurrentCategoryForEntry(id) {
    currentCategoryForEntry = id;
}

export function setDraggedElement(el) {
    draggedElement = el;
}

export function setDraggedIndex(idx) {
    draggedIndex = idx;
}

export function setDragType(type) {
    dragType = type;
}

export function setDragCategoryId(id) {
    dragCategoryId = id;
}

export function setAvailableConfigs(configs) {
    availableConfigs = configs;
}

export function setPendingConfigLoad(config) {
    pendingConfigLoad = config;
}

export function setPendingPrefyData(data) {
    pendingPrefyData = data;
}
