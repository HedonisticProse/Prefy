import {
    appData,
    currentEditingCategory,
    currentEditingEntry,
    currentCategoryForEntry,
    setCurrentEditingCategory,
    setCurrentEditingEntry,
    setCurrentCategoryForEntry
} from './state.js';
import { escapeHtml } from './utils.js';
import {
    handleLevelDragStart,
    handleLevelDragOver,
    handleLevelDragEnter,
    handleLevelDragLeave,
    handleLevelDrop,
    handleLevelDragEnd
} from './dragdrop.js';

// We'll set this via a setter to avoid circular import issues
let renderCategoriesCallback = null;

export function setRenderCallback(callback) {
    renderCategoriesCallback = callback;
}

// ===== SETTINGS MODAL =====

export function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const usernameInput = document.getElementById('usernameInput');
    const exportTitleInput = document.getElementById('exportTitleInput');

    // Set current values
    usernameInput.value = appData.username || '';
    exportTitleInput.value = appData.exportTitle || 'My Prefy List';

    modal.classList.add('active');
}

// ===== LEVELS MODAL =====

export function openLevelsModal() {
    const modal = document.getElementById('levelsModal');
    const container = document.getElementById('levelsContainer');
    container.innerHTML = '';

    appData.levels.forEach((level, index) => {
        const row = createLevelRow(level, index);
        container.appendChild(row);
    });

    modal.classList.add('active');
}

export function createLevelRow(level, index) {
    const row = document.createElement('div');
    row.className = 'level-item';
    row.draggable = true;
    row.dataset.levelIndex = index;
    row.innerHTML = `
        <span class="drag-indicator">⋮⋮</span>
        <div class="level-preview" style="background-color: ${level.color}"></div>
        <input type="text" value="${escapeHtml(level.name)}" placeholder="Level name" data-index="${index}">
        <input type="color" value="${level.color}" data-index="${index}">
        <button class="delete-level-btn" data-index="${index}">Delete</button>
    `;

    // Add drag handlers
    row.addEventListener('dragstart', handleLevelDragStart);
    row.addEventListener('dragover', handleLevelDragOver);
    row.addEventListener('dragenter', handleLevelDragEnter);
    row.addEventListener('dragleave', handleLevelDragLeave);
    row.addEventListener('drop', handleLevelDrop);
    row.addEventListener('dragend', handleLevelDragEnd);

    // Update preview on color change
    const colorInput = row.querySelector('input[type="color"]');
    const preview = row.querySelector('.level-preview');
    colorInput.addEventListener('input', (e) => {
        preview.style.backgroundColor = e.target.value;
    });

    // Delete button
    row.querySelector('.delete-level-btn').addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        if (confirm(`Delete level "${appData.levels[idx].name}"?`)) {
            appData.levels.splice(idx, 1);
            openLevelsModal(); // Refresh
        }
    });

    return row;
}

export function addLevelRow() {
    const newLevel = {
        id: 'level_' + Date.now(),
        name: 'New Level',
        color: '#cccccc'
    };
    appData.levels.push(newLevel);
    openLevelsModal(); // Refresh
}

export function saveLevels() {
    const container = document.getElementById('levelsContainer');
    const items = container.querySelectorAll('.level-item');

    items.forEach((item, index) => {
        const nameInput = item.querySelector('input[type="text"]');
        const colorInput = item.querySelector('input[type="color"]');

        if (appData.levels[index]) {
            appData.levels[index].name = nameInput.value;
            appData.levels[index].color = colorInput.value;
        }
    });

    if (renderCategoriesCallback) {
        renderCategoriesCallback(true);
    }
    document.getElementById('levelsModal').classList.remove('active');
}

// ===== CATEGORY MODAL =====

export function openCategoryModal(categoryId = null) {
    const modal = document.getElementById('categoryModal');
    const titleEl = document.getElementById('categoryModalTitle');
    const nameInput = document.getElementById('categoryName');
    const propertiesContainer = document.getElementById('propertiesContainer');
    const deleteBtn = document.getElementById('deleteCategoryBtn');

    setCurrentEditingCategory(categoryId);

    if (categoryId) {
        const category = appData.categories.find(c => c.id === categoryId);
        titleEl.textContent = 'Edit Category';
        nameInput.value = category.name;
        propertiesContainer.innerHTML = '';
        category.properties.forEach(prop => {
            const row = createPropertyRow(prop);
            propertiesContainer.appendChild(row);
        });
        deleteBtn.style.display = 'inline-block'; // Show delete button when editing
    } else {
        titleEl.textContent = 'Add Category';
        nameInput.value = '';
        propertiesContainer.innerHTML = '';
        addPropertyRow(); // Add one default property
        deleteBtn.style.display = 'none'; // Hide delete button when adding
    }

    modal.classList.add('active');
}

export function createPropertyRow(value = '') {
    const row = document.createElement('div');
    row.className = 'property-item';
    row.innerHTML = `
        <input type="text" value="${escapeHtml(value)}" placeholder="Property name (e.g., Self, Partner, Giving, Receiving)">
        <button class="delete-property-btn">Delete</button>
    `;

    row.querySelector('.delete-property-btn').addEventListener('click', () => {
        row.remove();
    });

    return row;
}

export function addPropertyRow() {
    const container = document.getElementById('propertiesContainer');
    const row = createPropertyRow();
    container.appendChild(row);
}

export function saveCategory() {
    const nameInput = document.getElementById('categoryName');
    const propertiesContainer = document.getElementById('propertiesContainer');

    const name = nameInput.value.trim();
    if (!name) {
        alert('Please enter a category name');
        return;
    }

    const propertyInputs = propertiesContainer.querySelectorAll('input[type="text"]');
    const properties = Array.from(propertyInputs)
        .map(input => input.value.trim())
        .filter(prop => prop !== '');

    if (properties.length === 0) {
        alert('Please add at least one property');
        return;
    }

    if (currentEditingCategory) {
        // Edit existing
        const category = appData.categories.find(c => c.id === currentEditingCategory);
        category.name = name;
        category.properties = properties;

        // Update entries to match new properties
        category.entries.forEach(entry => {
            const newLevels = {};
            properties.forEach(prop => {
                newLevels[prop] = entry.levels[prop] || 'none';
            });
            entry.levels = newLevels;
        });
    } else {
        // Create new
        const newCategory = {
            id: 'cat_' + Date.now(),
            name: name,
            properties: properties,
            entries: []
        };
        appData.categories.push(newCategory);
    }

    if (renderCategoriesCallback) {
        renderCategoriesCallback(true);
    }
    document.getElementById('categoryModal').classList.remove('active');
}

export function deleteCategory(categoryId) {
    const index = appData.categories.findIndex(c => c.id === categoryId);
    if (index !== -1) {
        appData.categories.splice(index, 1);
        if (renderCategoriesCallback) {
            renderCategoriesCallback(true);
        }
    }
}

// ===== ENTRY MODAL =====

export function openEntryModal(categoryId, entryId = null) {
    const modal = document.getElementById('entryModal');
    const titleEl = document.getElementById('entryModalTitle');
    const nameInput = document.getElementById('entryName');
    const commentInput = document.getElementById('entryComment');
    const levelsContainer = document.getElementById('entryLevelsContainer');
    const deleteBtn = document.getElementById('deleteEntryBtn');

    const category = appData.categories.find(c => c.id === categoryId);
    setCurrentCategoryForEntry(categoryId);
    setCurrentEditingEntry(entryId);

    // Show delete button only when editing existing entry
    deleteBtn.style.display = entryId ? 'block' : 'none';

    if (entryId) {
        const entry = category.entries.find(e => e.id === entryId);
        titleEl.textContent = 'Edit Entry';
        nameInput.value = entry.name;
        commentInput.value = entry.comment || '';

        levelsContainer.innerHTML = '';
        category.properties.forEach(prop => {
            const row = createEntryLevelRow(prop, entry.levels[prop] || 'none');
            levelsContainer.appendChild(row);
        });
    } else {
        titleEl.textContent = 'Add Entry';
        nameInput.value = '';
        commentInput.value = '';

        levelsContainer.innerHTML = '';
        category.properties.forEach(prop => {
            const row = createEntryLevelRow(prop, 'none');
            levelsContainer.appendChild(row);
        });
    }

    modal.classList.add('active');
}

export function createEntryLevelRow(propertyName, selectedLevelId) {
    const row = document.createElement('div');
    row.className = 'entry-level-row';

    const levelsHTML = appData.levels.map(level => {
        const isSelected = level.id === selectedLevelId;
        return `
            <div class="level-option ${isSelected ? 'selected' : ''}"
                 style="background-color: ${level.color}; border-color: ${level.color === '#ffffff' ? '#cbd5e0' : level.color}"
                 data-level-id="${level.id}"
                 title="${escapeHtml(level.name)}">
            </div>
        `;
    }).join('');

    row.innerHTML = `
        <label>${escapeHtml(propertyName)}:</label>
        <div class="level-options" data-property="${escapeHtml(propertyName)}">
            ${levelsHTML}
        </div>
    `;

    // Add click handlers
    row.querySelectorAll('.level-option').forEach(option => {
        option.addEventListener('click', (e) => {
            // Remove selected from siblings
            row.querySelectorAll('.level-option').forEach(opt => opt.classList.remove('selected'));
            // Add selected to clicked
            e.currentTarget.classList.add('selected');
        });
    });

    return row;
}

export function saveEntry() {
    const nameInput = document.getElementById('entryName');
    const commentInput = document.getElementById('entryComment');
    const levelsContainer = document.getElementById('entryLevelsContainer');

    const name = nameInput.value.trim();
    if (!name) {
        alert('Please enter an entry name');
        return;
    }

    const comment = commentInput.value.trim();

    const levels = {};
    levelsContainer.querySelectorAll('.level-options').forEach(optionsContainer => {
        const property = optionsContainer.dataset.property;
        const selected = optionsContainer.querySelector('.level-option.selected');
        levels[property] = selected ? selected.dataset.levelId : 'none';
    });

    const category = appData.categories.find(c => c.id === currentCategoryForEntry);

    if (currentEditingEntry) {
        // Edit existing
        const entry = category.entries.find(e => e.id === currentEditingEntry);
        entry.name = name;
        entry.levels = levels;
        entry.comment = comment;
    } else {
        // Create new
        const newEntry = {
            id: 'entry_' + Date.now(),
            name: name,
            levels: levels,
            comment: comment
        };
        category.entries.push(newEntry);
    }

    if (renderCategoriesCallback) {
        renderCategoriesCallback(true);
    }
    document.getElementById('entryModal').classList.remove('active');
}

// Export getCurrentEditingCategory for use in delete handler
export function getCurrentEditingCategory() {
    return currentEditingCategory;
}

// Export getCurrentEditingEntry for use in delete handler
export function getCurrentEditingEntry() {
    return currentEditingEntry;
}

// Export currentCategoryForEntry getter
export function getCurrentCategoryForEntry() {
    return currentCategoryForEntry;
}

export function deleteEntry(categoryId, entryId) {
    const category = appData.categories.find(c => c.id === categoryId);
    if (!category) return;

    const entryIndex = category.entries.findIndex(e => e.id === entryId);
    if (entryIndex === -1) return;

    category.entries.splice(entryIndex, 1);

    if (renderCategoriesCallback) {
        renderCategoriesCallback(true);
    }
}
