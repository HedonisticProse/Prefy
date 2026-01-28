// Global App State
let appData = {
    username: '',
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

// Current editing state
let currentEditingCategory = null;
let currentEditingEntry = null;
let currentCategoryForEntry = null;

// Drag and drop state
let draggedElement = null;
let draggedIndex = null;
let dragType = null; // 'level', 'category', or 'entry'
let dragCategoryId = null; // For entries

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    initializeEventListeners();
    await initializeAppData();
    renderCategories();

    // Add resize listener for legend scaling
    window.addEventListener('resize', () => {
        scaleLegendText();
    });
});

// Event Listeners
function initializeEventListeners() {
    // Username input
    const usernameInput = document.getElementById('usernameInput');
    usernameInput.addEventListener('input', (e) => {
        appData.username = e.target.value;
    });

    // Header buttons
    document.getElementById('manageLevelsBtn').addEventListener('click', openLevelsModal);
    document.getElementById('addCategoryBtn').addEventListener('click', () => openCategoryModal());
    document.getElementById('exportImageBtn').addEventListener('click', exportToImage);
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
    document.getElementById('loadConfigBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });

    // File input
    document.getElementById('fileInput').addEventListener('change', loadConfig);

    // Modal close buttons
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Levels Modal
    document.getElementById('addLevelBtn').addEventListener('click', addLevelRow);
    document.getElementById('saveLevelsBtn').addEventListener('click', saveLevels);

    // Category Modal
    document.getElementById('addPropertyBtn').addEventListener('click', addPropertyRow);
    document.getElementById('saveCategoryBtn').addEventListener('click', saveCategory);
    document.getElementById('cancelCategoryBtn').addEventListener('click', () => {
        document.getElementById('categoryModal').classList.remove('active');
    });
    document.getElementById('deleteCategoryBtn').addEventListener('click', () => {
        if (currentEditingCategory) {
            const category = appData.categories.find(c => c.id === currentEditingCategory);
            if (category && confirm(`Delete category "${category.name}"?`)) {
                deleteCategory(currentEditingCategory);
                document.getElementById('categoryModal').classList.remove('active');
            }
        }
    });

    // Entry Modal
    document.getElementById('saveEntryBtn').addEventListener('click', saveEntry);
    document.getElementById('cancelEntryBtn').addEventListener('click', () => {
        document.getElementById('entryModal').classList.remove('active');
    });
}

// Render Levels Legend
function renderLevelsLegend() {
    const legendContainer = document.getElementById('levelsLegend');
    if (!legendContainer) return;

    legendContainer.innerHTML = '';

    appData.levels.forEach(level => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';

        const bubble = document.createElement('div');
        bubble.className = 'legend-bubble';
        bubble.style.backgroundColor = level.color;
        bubble.style.borderColor = level.color === '#ffffff' ? '#cbd5e0' : level.color;

        const name = document.createElement('span');
        name.className = 'legend-name';
        name.textContent = level.name;

        legendItem.appendChild(bubble);
        legendItem.appendChild(name);
        legendContainer.appendChild(legendItem);
    });

    // Auto-scale text to fit on one line
    scaleLegendText();
}

// Scale legend text to fit on one line
function scaleLegendText() {
    const legendContainer = document.getElementById('levelsLegend');
    const parentContainer = legendContainer.parentElement;
    if (!legendContainer || !parentContainer) return;

    // Reset to default size
    legendContainer.style.fontSize = '14px';

    // Check if content overflows
    const containerWidth = parentContainer.clientWidth;
    const contentWidth = legendContainer.scrollWidth;

    if (contentWidth > containerWidth) {
        // Calculate scale factor
        const scaleFactor = containerWidth / contentWidth;
        const newFontSize = Math.max(10, 14 * scaleFactor); // Minimum 10px
        legendContainer.style.fontSize = `${newFontSize}px`;
    }
}

// Render Categories
function renderCategories(preserveScroll = false) {
    // Save scroll position if requested
    const scrollY = preserveScroll ? window.scrollY : 0;

    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';

    // Update username input if it exists
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput && appData.username !== undefined) {
        usernameInput.value = appData.username || '';
    }

    // Render levels legend
    renderLevelsLegend();

    if (appData.categories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>No Categories Yet</h2>
                <p>Click "Add Category" to get started!</p>
            </div>
        `;
        return;
    }

    appData.categories.forEach((category, index) => {
        const categoryCard = createCategoryCard(category, index);
        container.appendChild(categoryCard);
    });

    // Restore scroll position if requested
    if (preserveScroll && scrollY > 0) {
        requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
        });
    }
}

// Create Category Card
function createCategoryCard(category, index) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.draggable = true;
    card.dataset.categoryId = category.id;
    card.dataset.categoryIndex = index;

    // Create property headers
    const propertyHeadersHTML = category.properties.map(prop =>
        `<span class="property-header">${escapeHtml(prop)}</span>`
    ).join('');

    card.innerHTML = `
        <div class="category-header drag-handle">
            <div class="category-title-row">
                <div class="category-title" data-category-id="${category.id}">
                    <span class="drag-indicator">⋮⋮</span>
                    ${escapeHtml(category.name)}
                </div>
            </div>
            <div class="property-headers">${propertyHeadersHTML}</div>
        </div>
        <div class="category-body">
            ${category.entries.map((entry, entryIndex) => createEntryHTML(entry, category, entryIndex)).join('')}
            <div class="add-entry-item" data-category-id="${category.id}">
                <span class="add-entry-text">Add entry...</span>
            </div>
        </div>
    `;

    // Add drag and drop event listeners for category
    card.addEventListener('dragstart', handleCategoryDragStart);
    card.addEventListener('dragover', handleCategoryDragOver);
    card.addEventListener('dragenter', handleCategoryDragEnter);
    card.addEventListener('dragleave', handleCategoryDragLeave);
    card.addEventListener('drop', handleCategoryDrop);
    card.addEventListener('dragend', handleCategoryDragEnd);

    // Allow dropping entries on category body (for cross-category moves)
    const categoryBody = card.querySelector('.category-body');
    categoryBody.addEventListener('dragover', (e) => handleCategoryBodyDragOver(e, category.id));
    categoryBody.addEventListener('dragenter', (e) => handleCategoryBodyDragEnter(e, category.id));
    categoryBody.addEventListener('dragleave', handleCategoryBodyDragLeave);
    categoryBody.addEventListener('drop', (e) => handleCategoryBodyDrop(e, category.id));

    // Add event listeners
    // Click category title to edit
    card.querySelector('.category-title').addEventListener('click', (e) => {
        // Don't trigger if clicking drag indicator
        if (!e.target.classList.contains('drag-indicator')) {
            openCategoryModal(category.id);
        }
    });

    // Add entry item at bottom
    card.querySelector('.add-entry-item').addEventListener('click', () => {
        openEntryModal(category.id);
    });

    // Entry drag and drop handlers
    card.querySelectorAll('.entry-item').forEach(entryEl => {
        // Drag handlers
        entryEl.addEventListener('dragstart', (e) => handleEntryDragStart(e, category.id));
        entryEl.addEventListener('dragover', handleEntryDragOver);
        entryEl.addEventListener('dragenter', handleEntryDragEnter);
        entryEl.addEventListener('dragleave', handleEntryDragLeave);
        entryEl.addEventListener('drop', (e) => handleEntryDrop(e, category.id));
        entryEl.addEventListener('dragend', handleEntryDragEnd);

        // Click handler
        entryEl.addEventListener('click', () => {
            const entryId = entryEl.dataset.entryId;
            openEntryModal(category.id, entryId);
        });
    });

    return card;
}

// Create Entry HTML
function createEntryHTML(entry, category, entryIndex) {
    const bubblesHTML = category.properties.map(prop => {
        const levelId = entry.levels[prop] || 'none';
        const level = appData.levels.find(l => l.id === levelId) || appData.levels[0];
        return `<div class="level-bubble" style="background-color: ${level.color}; border-color: ${level.color === '#ffffff' ? '#cbd5e0' : level.color}" title="${escapeHtml(prop)}: ${escapeHtml(level.name)}"></div>`;
    }).join('');

    const commentHTML = entry.comment ? `
        <div class="entry-comment">💬 Note: ${escapeHtml(entry.comment)}</div>
    ` : '';

    return `
        <div class="entry-wrapper">
            <div class="entry-item" draggable="true" data-entry-id="${entry.id}" data-entry-index="${entryIndex}">
                <div class="entry-name">
                    <span class="drag-indicator">⋮⋮</span>
                    ${escapeHtml(entry.name)}
                </div>
                <div class="entry-bubbles">
                    ${bubblesHTML}
                </div>
            </div>
            ${commentHTML}
        </div>
    `;
}

// Levels Modal
function openLevelsModal() {
    const modal = document.getElementById('levelsModal');
    const container = document.getElementById('levelsContainer');
    container.innerHTML = '';

    appData.levels.forEach((level, index) => {
        const row = createLevelRow(level, index);
        container.appendChild(row);
    });

    modal.classList.add('active');
}

function createLevelRow(level, index) {
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

function addLevelRow() {
    const newLevel = {
        id: 'level_' + Date.now(),
        name: 'New Level',
        color: '#cccccc'
    };
    appData.levels.push(newLevel);
    openLevelsModal(); // Refresh
}

function saveLevels() {
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

    renderCategories(true);
    document.getElementById('levelsModal').classList.remove('active');
}

// Category Modal
function openCategoryModal(categoryId = null) {
    const modal = document.getElementById('categoryModal');
    const titleEl = document.getElementById('categoryModalTitle');
    const nameInput = document.getElementById('categoryName');
    const propertiesContainer = document.getElementById('propertiesContainer');
    const deleteBtn = document.getElementById('deleteCategoryBtn');

    currentEditingCategory = categoryId;

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

function createPropertyRow(value = '') {
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

function addPropertyRow() {
    const container = document.getElementById('propertiesContainer');
    const row = createPropertyRow();
    container.appendChild(row);
}

function saveCategory() {
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
        const oldProperties = [...category.properties];
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

    renderCategories(true);
    document.getElementById('categoryModal').classList.remove('active');
}

function deleteCategory(categoryId) {
    const index = appData.categories.findIndex(c => c.id === categoryId);
    if (index !== -1) {
        appData.categories.splice(index, 1);
        renderCategories(true);
    }
}

// ===== DRAG AND DROP HANDLERS =====

// Category Drag Handlers
function handleCategoryDragStart(e) {
    draggedElement = e.currentTarget;
    draggedIndex = parseInt(e.currentTarget.dataset.categoryIndex);
    dragType = 'category';
    e.currentTarget.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
}

function handleCategoryDragOver(e) {
    if (dragType !== 'category') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleCategoryDragEnter(e) {
    if (dragType !== 'category') return;
    if (e.currentTarget.classList.contains('category-card')) {
        e.currentTarget.classList.add('drag-over');
    }
}

function handleCategoryDragLeave(e) {
    if (dragType !== 'category') return;
    if (e.currentTarget.classList.contains('category-card')) {
        e.currentTarget.classList.remove('drag-over');
    }
}

function handleCategoryDrop(e) {
    if (dragType !== 'category') return;
    e.stopPropagation();
    e.preventDefault();

    const dropIndex = parseInt(e.currentTarget.dataset.categoryIndex);

    if (draggedIndex !== dropIndex) {
        // Reorder categories
        const draggedCategory = appData.categories[draggedIndex];
        appData.categories.splice(draggedIndex, 1);
        appData.categories.splice(dropIndex, 0, draggedCategory);

        renderCategories(true);
    }

    e.currentTarget.classList.remove('drag-over');
    return false;
}

function handleCategoryDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    draggedElement = null;
    draggedIndex = null;
    dragType = null;
}

// Entry Drag Handlers
function handleEntryDragStart(e, categoryId) {
    draggedElement = e.currentTarget;
    draggedIndex = parseInt(e.currentTarget.dataset.entryIndex);
    dragType = 'entry';
    dragCategoryId = categoryId;
    e.currentTarget.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation(); // Prevent category drag
}

function handleEntryDragOver(e) {
    if (dragType !== 'entry') return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleEntryDragEnter(e) {
    if (dragType !== 'entry') return;
    if (e.currentTarget.classList.contains('entry-item')) {
        e.currentTarget.classList.add('drag-over');
    }
}

function handleEntryDragLeave(e) {
    if (dragType !== 'entry') return;
    if (e.currentTarget.classList.contains('entry-item')) {
        e.currentTarget.classList.remove('drag-over');
    }
}

function handleEntryDrop(e, categoryId) {
    if (dragType !== 'entry' || dragCategoryId !== categoryId) return;
    e.stopPropagation();
    e.preventDefault();

    const dropIndex = parseInt(e.currentTarget.dataset.entryIndex);

    if (draggedIndex !== dropIndex) {
        // Reorder entries
        const category = appData.categories.find(c => c.id === categoryId);
        const draggedEntry = category.entries[draggedIndex];
        category.entries.splice(draggedIndex, 1);
        category.entries.splice(dropIndex, 0, draggedEntry);

        renderCategories(true);
    }

    e.currentTarget.classList.remove('drag-over');
    return false;
}

function handleEntryDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    document.querySelectorAll('.entry-item').forEach(entry => {
        entry.classList.remove('drag-over');
    });
    document.querySelectorAll('.category-body').forEach(body => {
        body.classList.remove('drag-over');
    });
    draggedElement = null;
    draggedIndex = null;
    dragType = null;
    dragCategoryId = null;
}

// Cross-Category Entry Drop Handlers
function handleCategoryBodyDragOver(e, targetCategoryId) {
    if (dragType !== 'entry') return;
    // Don't allow drag over if it's the same category
    if (dragCategoryId === targetCategoryId) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleCategoryBodyDragEnter(e, targetCategoryId) {
    if (dragType !== 'entry') return;
    // Don't highlight if it's the same category
    if (dragCategoryId === targetCategoryId) return;
    if (e.currentTarget.classList.contains('category-body')) {
        e.currentTarget.classList.add('drag-over');
    }
}

function handleCategoryBodyDragLeave(e) {
    if (dragType !== 'entry') return;
    if (e.currentTarget.classList.contains('category-body')) {
        e.currentTarget.classList.remove('drag-over');
    }
}

function handleCategoryBodyDrop(e, targetCategoryId) {
    if (dragType !== 'entry') return;
    e.stopPropagation();
    e.preventDefault();

    // Remove drag-over class
    e.currentTarget.classList.remove('drag-over');

    // If dropping in the same category, do nothing (handled by entry-to-entry drop)
    if (dragCategoryId === targetCategoryId) {
        return;
    }

    // Find source and target categories
    const sourceCategory = appData.categories.find(c => c.id === dragCategoryId);
    const targetCategory = appData.categories.find(c => c.id === targetCategoryId);

    if (!sourceCategory || !targetCategory) return;

    // Get the dragged entry
    const draggedEntry = sourceCategory.entries[draggedIndex];
    if (!draggedEntry) return;

    // Remove entry from source category
    sourceCategory.entries.splice(draggedIndex, 1);

    // Map levels to target category properties
    const newLevels = {};
    targetCategory.properties.forEach(prop => {
        // If the property exists in the source, keep its level
        newLevels[prop] = draggedEntry.levels[prop] || 'none';
    });
    draggedEntry.levels = newLevels;

    // Add entry to end of target category
    targetCategory.entries.push(draggedEntry);

    renderCategories(true);
}

// Level Drag Handlers
function handleLevelDragStart(e) {
    draggedElement = e.currentTarget;
    draggedIndex = parseInt(e.currentTarget.dataset.levelIndex);
    dragType = 'level';
    e.currentTarget.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
}

function handleLevelDragOver(e) {
    if (dragType !== 'level') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleLevelDragEnter(e) {
    if (dragType !== 'level') return;
    if (e.currentTarget.classList.contains('level-item')) {
        e.currentTarget.classList.add('drag-over');
    }
}

function handleLevelDragLeave(e) {
    if (dragType !== 'level') return;
    if (e.currentTarget.classList.contains('level-item')) {
        e.currentTarget.classList.remove('drag-over');
    }
}

function handleLevelDrop(e) {
    if (dragType !== 'level') return;
    e.stopPropagation();
    e.preventDefault();

    const dropIndex = parseInt(e.currentTarget.dataset.levelIndex);

    if (draggedIndex !== dropIndex) {
        // Reorder levels
        const draggedLevel = appData.levels[draggedIndex];
        appData.levels.splice(draggedIndex, 1);
        appData.levels.splice(dropIndex, 0, draggedLevel);

        openLevelsModal(); // Refresh the modal
    }

    e.currentTarget.classList.remove('drag-over');
    return false;
}

function handleLevelDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    document.querySelectorAll('.level-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    draggedElement = null;
    draggedIndex = null;
    dragType = null;
}

// Entry Modal
function openEntryModal(categoryId, entryId = null) {
    const modal = document.getElementById('entryModal');
    const titleEl = document.getElementById('entryModalTitle');
    const nameInput = document.getElementById('entryName');
    const commentInput = document.getElementById('entryComment');
    const levelsContainer = document.getElementById('entryLevelsContainer');

    const category = appData.categories.find(c => c.id === categoryId);
    currentCategoryForEntry = categoryId;
    currentEditingEntry = entryId;

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

function createEntryLevelRow(propertyName, selectedLevelId) {
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

function saveEntry() {
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

    renderCategories(true);
    document.getElementById('entryModal').classList.remove('active');
}

// Generate filename with timestamp
function generateFilename(prefix, extension) {
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

// Create Entry HTML for Export (compact format)
function createExportEntryHTML(entry, category) {
    const bubblesHTML = category.properties.map(prop => {
        const levelId = entry.levels[prop] || 'none';
        const level = appData.levels.find(l => l.id === levelId) || appData.levels[0];
        return `<div class="level-bubble" style="background-color: ${level.color}; border-color: ${level.color === '#ffffff' ? '#cbd5e0' : level.color}" title="${escapeHtml(prop)}: ${escapeHtml(level.name)}"></div>`;
    }).join('');

    const commentHTML = entry.comment ? `
        <div class="entry-comment">💬 Note: ${escapeHtml(entry.comment)}</div>
    ` : '';

    return `
        <div class="entry-wrapper">
            <div class="entry-item export-entry-item">
                <span class="entry-name export-entry-name">${escapeHtml(entry.name)}</span>
                <div class="entry-bubbles export-entry-bubbles">${bubblesHTML}</div>
            </div>
            ${commentHTML}
        </div>
    `;
}

// Export to Image
async function exportToImage() {
    const preview = document.getElementById('exportPreview');
    const content = document.getElementById('exportCategoriesContainer');
    const exportContentDiv = document.querySelector('.export-content');

    // Calculate optimal columns for 16:9 ratio
    const categoryCount = appData.categories.length;
    let columns;

    if (categoryCount <= 3) {
        columns = categoryCount;
    } else if (categoryCount <= 6) {
        columns = 3;
    } else if (categoryCount <= 12) {
        columns = 4;
    } else if (categoryCount <= 20) {
        columns = 5;
    } else {
        columns = 6;
    }

    // Calculate width based on columns for 16:9 ratio
    const columnWidth = 300;
    const gap = 20;
    const padding = 80; // 40px on each side
    const baseWidth = (columnWidth * columns) + (gap * (columns - 1)) + padding;

    // Set the width and column count
    content.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    exportContentDiv.style.width = `${baseWidth}px`;

    // Prepare export content
    content.innerHTML = '';
    appData.categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-card export-category';

        // Create property headers
        const propertyHeadersHTML = category.properties.map(prop =>
            `<span class="property-header">${escapeHtml(prop)}</span>`
        ).join('');

        categoryDiv.innerHTML = `
            <div class="category-header">
                <div class="category-title">${escapeHtml(category.name)}</div>
                <div class="property-headers">${propertyHeadersHTML}</div>
            </div>
            <div class="category-body">
                ${category.entries.map(entry => createExportEntryHTML(entry, category)).join('')}
            </div>
        `;
        content.appendChild(categoryDiv);
    });

    // Show preview temporarily
    preview.style.display = 'block';
    preview.style.left = '0';

    try {
        const canvas = await html2canvas(document.querySelector('.export-content'), {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
        });

        // Convert to image and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = generateFilename('Prefy', 'png');
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }, 'image/png');

    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export image. Please try again.');
    } finally {
        // Hide preview
        preview.style.left = '-9999px';
        preview.style.display = 'none';
    }
}

// Save Configuration
function saveConfig() {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = generateFilename('Prefy_Config', 'json');
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

// Load Configuration
function loadConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // Validate data structure
            if (!data.levels || !data.categories) {
                throw new Error('Invalid configuration file');
            }

            // Ensure username field exists for backward compatibility
            if (!data.username) {
                data.username = '';
            }

            if (confirm('Load this configuration? This will replace your current data.')) {
                appData = data;
                renderCategories();
                alert('Configuration loaded successfully!');
            }
        } catch (error) {
            console.error('Load failed:', error);
            alert('Failed to load configuration. Please check the file format.');
        }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
}

// Data initialization - always load fresh template
async function initializeAppData() {
    // Always load fresh template from template.json
    await loadTemplate();
}

async function loadTemplate() {
    try {
        const response = await fetch('general_interests.json');
        if (!response.ok) {
            throw new Error('Failed to fetch template');
        }
        const templateData = await response.json();

        // Ensure username field exists for backward compatibility
        if (!templateData.username) {
            templateData.username = '';
        }

        appData = templateData;
    } catch (error) {
        console.error('Failed to load template:', error);
        // Keep the hardcoded default if template fails to load
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Generate unique ID
function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
