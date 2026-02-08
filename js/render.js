import { appData, viewMode } from './state.js';
import { escapeHtml, getPropertyInfo } from './utils.js';
import { activeLevelFilter, setActiveLevelFilter, applyFilters, clearAllFilters, isAnyFilterActive } from './filter.js';
import {
    handleCategoryDragStart,
    handleCategoryDragOver,
    handleCategoryDragEnter,
    handleCategoryDragLeave,
    handleCategoryDrop,
    handleCategoryDragEnd,
    handleCategoryBodyDragOver,
    handleCategoryBodyDragEnter,
    handleCategoryBodyDragLeave,
    handleCategoryBodyDrop,
    handleEntryDragStart,
    handleEntryDragOver,
    handleEntryDragEnter,
    handleEntryDragLeave,
    handleEntryDrop,
    handleEntryDragEnd
} from './dragdrop.js';
import { openCategoryModal, openEntryModal } from './modals.js';
import { handleBubbleClick, closeFastSelectPopup } from './fastselect.js';

// Render Levels Legend
export function renderLevelsLegend() {
    const legendContainer = document.getElementById('levelsLegend');
    if (!legendContainer) return;

    legendContainer.innerHTML = '';

    appData.levels.forEach(level => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.dataset.levelId = level.id;

        // Add active class if this level is the current filter
        if (activeLevelFilter === level.id) {
            legendItem.classList.add('legend-item-active');
        }

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

        // Add click handler for filtering
        legendItem.addEventListener('click', () => {
            handleLevelFilterClick(level.id);
        });
    });

    // Add clear filter button if filter is active
    if (activeLevelFilter) {
        const clearBtn = document.createElement('div');
        clearBtn.className = 'legend-item legend-clear-filter';
        clearBtn.innerHTML = '<span class="legend-name">✕ Clear</span>';
        clearBtn.addEventListener('click', () => {
            handleLevelFilterClick(null);
        });
        legendContainer.appendChild(clearBtn);
    }

    // Auto-scale text to fit on one line
    scaleLegendText();
}

// Handle level filter click - toggle filter on/off
function handleLevelFilterClick(levelId) {
    if (activeLevelFilter === levelId || levelId === null) {
        // Clicking same level or clear button clears the filter
        setActiveLevelFilter(null);
    } else {
        setActiveLevelFilter(levelId);
    }
    renderCategories(true); // Preserve scroll position
}

// Scale legend text to fit on one line
export function scaleLegendText() {
    const legendContainer = document.getElementById('levelsLegend');
    const parentContainer = legendContainer?.parentElement;
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
export function renderCategories(preserveScroll = false) {
    // Close any open fast select popup
    closeFastSelectPopup();

    // Apply view mode class for styling
    document.body.classList.toggle('view-quick-edit', viewMode === 'quick-edit');

    // Save scroll positions if requested
    const scrollY = preserveScroll ? window.scrollY : 0;
    const categoryScrollPositions = new Map();
    if (preserveScroll) {
        document.querySelectorAll('.category-card').forEach((card) => {
            const categoryId = card.dataset.categoryId;
            const body = card.querySelector('.category-body');
            if (categoryId && body) {
                categoryScrollPositions.set(categoryId, body.scrollTop);
            }
        });
    }

    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';

    // Update username input if it exists
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput && appData.username !== undefined) {
        usernameInput.value = appData.username || '';
    }

    // Render levels legend
    renderLevelsLegend();

    // Apply filters to categories
    const categoriesToRender = applyFilters(appData.categories);
    const isFiltered = isAnyFilterActive();

    if (categoriesToRender.length === 0) {
        if (isFiltered) {
            // No entries match the filter
            container.innerHTML = `
                <div class="empty-state">
                    <img src="img/nothing_found.gif" alt="Nothing found" class="empty-state-img">
                    <h2>Nothing to show here...</h2>
                    <p>No categories or entries match your filter.</p>
                    <button class="btn btn-secondary" id="clearFilterBtn" style="margin-top: 15px;">Clear Filters</button>
                </div>
            `;
            document.getElementById('clearFilterBtn')?.addEventListener('click', () => {
                clearAllFilters();
                // Clear search UI inputs if they exist
                const searchInput = document.getElementById('searchInput');
                const exactMatchCheckbox = document.getElementById('exactMatchCheckbox');
                if (searchInput) searchInput.value = '';
                if (exactMatchCheckbox) exactMatchCheckbox.checked = false;
                renderCategories(true);
            });
        } else {
            // No categories exist
            container.innerHTML = `
                <div class="empty-state">
                    <h2>No Categories Yet</h2>
                    <p>Click "Add Category" to get started!</p>
                </div>
            `;
        }
        return;
    }

    categoriesToRender.forEach((category) => {
        // Find original index for proper data binding (editing, drag-drop)
        const originalIndex = appData.categories.findIndex(c => c.id === category.id);
        const categoryCard = viewMode === 'quick-edit'
            ? createCategoryCardQuickEdit(category, originalIndex)
            : createCategoryCard(category, originalIndex);
        container.appendChild(categoryCard);
    });

    // Restore scroll positions if requested
    if (preserveScroll && scrollY > 0) {
        requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
        });
    }
    if (preserveScroll && categoryScrollPositions.size > 0) {
        requestAnimationFrame(() => {
            document.querySelectorAll('.category-card').forEach((card) => {
                const categoryId = card.dataset.categoryId;
                const body = card.querySelector('.category-body');
                if (!categoryId || !body) return;
                const savedScrollTop = categoryScrollPositions.get(categoryId);
                if (typeof savedScrollTop === 'number') {
                    body.scrollTop = savedScrollTop;
                }
            });
        });
    }
}

// Create Category Card
export function createCategoryCard(category, index) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.draggable = true;
    card.dataset.categoryId = category.id;
    card.dataset.categoryIndex = index;

    // Create property headers
    const propertyHeadersHTML = category.properties.map(prop => {
        const { name: propName } = getPropertyInfo(prop);
        return `<span class="property-header">${escapeHtml(propName)}</span>`;
    }).join('');

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
            ${category.entries.map((entry, entryIndex) => {
                const isSearchMatch = category._matchedEntryIds?.includes(entry.id) || false;
                return createEntryHTML(entry, category, entryIndex, isSearchMatch);
            }).join('')}
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

        // Click handler (entry name only)
        const entryNameEl = entryEl.querySelector('.entry-name-text');
        if (entryNameEl) {
            entryNameEl.addEventListener('click', () => {
                const entryId = entryEl.dataset.entryId;
                openEntryModal(category.id, entryId);
            });
        }

        // Add click handlers for level bubbles (fast select)
        entryEl.querySelectorAll('.level-bubble').forEach(bubbleEl => {
            bubbleEl.addEventListener('click', (e) => {
                const entryId = entryEl.dataset.entryId;
                const property = bubbleEl.dataset.property;
                const currentLevelId = bubbleEl.dataset.levelId;
                handleBubbleClick(e, category.id, entryId, property, currentLevelId, 'level');
            });
        });

        // Add click handlers for scale displays (fast select)
        entryEl.querySelectorAll('.scale-display').forEach(displayEl => {
            displayEl.addEventListener('click', (e) => {
                const entryId = entryEl.dataset.entryId;
                const property = displayEl.dataset.property;
                const currentValue = parseInt(displayEl.dataset.value, 10);
                handleBubbleClick(e, category.id, entryId, property, currentValue, 'scale');
            });
        });

        // Add click handlers for binary displays (fast select)
        entryEl.querySelectorAll('.binary-display').forEach(displayEl => {
            displayEl.addEventListener('click', (e) => {
                const entryId = entryEl.dataset.entryId;
                const property = displayEl.dataset.property;
                const currentValue = displayEl.dataset.value === 'true';
                handleBubbleClick(e, category.id, entryId, property, currentValue, 'binary');
            });
        });
    });

    return card;
}

// Create Category Card (Quick Edit)
export function createCategoryCardQuickEdit(category, index) {
    const card = document.createElement('div');
    card.className = 'category-card quick-edit-category-card';
    card.draggable = true;
    card.dataset.categoryId = category.id;
    card.dataset.categoryIndex = index;

    const propertyHeadersHTML = category.properties.map(prop => {
        const { name: propName } = getPropertyInfo(prop);
        return `<span class="property-header">${escapeHtml(propName)}</span>`;
    }).join('');

    const gridColumns = `minmax(200px, 1fr) repeat(${category.properties.length}, minmax(160px, 1fr))`;
    const propertyHeaderRow = `
        <div class="quick-edit-header-row" style="grid-template-columns: ${gridColumns};">
            <div class="quick-edit-header-cell quick-edit-header-name"></div>
            ${category.properties.map(prop => {
                const { name: propName } = getPropertyInfo(prop);
                return `<div class="quick-edit-header-cell">${escapeHtml(propName)}</div>`;
            }).join('')}
        </div>
    `;

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
            ${propertyHeaderRow}
            ${category.entries.map((entry, entryIndex) => {
                const isSearchMatch = category._matchedEntryIds?.includes(entry.id) || false;
                return createEntryHTMLQuickEdit(entry, category, entryIndex, isSearchMatch, gridColumns);
            }).join('')}
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

    // Click category title to edit
    card.querySelector('.category-title').addEventListener('click', (e) => {
        if (!e.target.classList.contains('drag-indicator')) {
            openCategoryModal(category.id);
        }
    });

    // Add entry item at bottom
    card.querySelector('.add-entry-item').addEventListener('click', () => {
        openEntryModal(category.id);
    });

    // Entry drag and drop handlers + click handlers
    card.querySelectorAll('.entry-item').forEach(entryEl => {
        entryEl.addEventListener('dragstart', (e) => handleEntryDragStart(e, category.id));
        entryEl.addEventListener('dragover', handleEntryDragOver);
        entryEl.addEventListener('dragenter', handleEntryDragEnter);
        entryEl.addEventListener('dragleave', handleEntryDragLeave);
        entryEl.addEventListener('drop', (e) => handleEntryDrop(e, category.id));
        entryEl.addEventListener('dragend', handleEntryDragEnd);

        const entryNameEl = entryEl.querySelector('.quick-edit-entry-name-text');
        if (entryNameEl) {
            entryNameEl.addEventListener('click', () => {
                const entryId = entryEl.dataset.entryId;
                openEntryModal(category.id, entryId);
            });
        }

        // Add click handlers for level bubbles (fast select-like direct set)
        entryEl.querySelectorAll('.quick-edit-level').forEach(bubbleEl => {
            bubbleEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = entryEl.dataset.entryId;
                const property = bubbleEl.dataset.property;
                const levelId = bubbleEl.dataset.levelId;
                const categoryRef = appData.categories.find(c => c.id === category.id);
                const entryRef = categoryRef?.entries.find(en => en.id === entryId);
                if (!entryRef) return;
                entryRef.levels[property] = levelId;
                renderCategories(true);
            });
        });

        // Add click handlers for scale numbers
        entryEl.querySelectorAll('.quick-edit-scale-num').forEach(numEl => {
            numEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = entryEl.dataset.entryId;
                const property = numEl.dataset.property;
                const value = parseInt(numEl.dataset.value, 10);
                const categoryRef = appData.categories.find(c => c.id === category.id);
                const entryRef = categoryRef?.entries.find(en => en.id === entryId);
                if (!entryRef) return;
                entryRef.levels[property] = value;
                renderCategories(true);
            });
        });

        // Add click handlers for binary options
        entryEl.querySelectorAll('.quick-edit-binary-option').forEach(optEl => {
            optEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = entryEl.dataset.entryId;
                const property = optEl.dataset.property;
                const value = optEl.dataset.value === 'true';
                const categoryRef = appData.categories.find(c => c.id === category.id);
                const entryRef = categoryRef?.entries.find(en => en.id === entryId);
                if (!entryRef) return;
                entryRef.levels[property] = value;
                renderCategories(true);
            });
        });
    });

    return card;
}

// Create Entry HTML
export function createEntryHTML(entry, category, entryIndex, isSearchMatch = false) {
    const bubblesHTML = category.properties.map(prop => {
        const { name: propName, type: propType } = getPropertyInfo(prop);
        const value = entry.levels[propName];

        switch (propType) {
            case 'scale':
                const scaleVal = typeof value === 'number' ? value : 0;
                return `<div class="scale-display" data-property="${escapeHtml(propName)}" data-property-type="scale" data-value="${scaleVal}" title="${escapeHtml(propName)}: ${scaleVal}/10">${scaleVal}</div>`;

            case 'binary':
                const binaryVal = value === true;
                return `<div class="binary-display ${binaryVal ? 'yes' : 'no'}" data-property="${escapeHtml(propName)}" data-property-type="binary" data-value="${binaryVal}" title="${escapeHtml(propName)}: ${binaryVal ? 'Yes' : 'No'}">${binaryVal ? '&#10003;' : '&#10007;'}</div>`;

            default: // 'level'
                const levelId = value || 'none';
                const level = appData.levels.find(l => l.id === levelId) || appData.levels[0];
                return `<div class="level-bubble" style="background-color: ${level.color}; border-color: ${level.color === '#ffffff' ? '#cbd5e0' : level.color}" title="${escapeHtml(propName)}: ${escapeHtml(level.name)}" data-property="${escapeHtml(propName)}" data-property-type="level" data-level-id="${levelId}"></div>`;
        }
    }).join('');

    const commentHTML = entry.comment ? `
        <div class="entry-comment">💬 Note: ${escapeHtml(entry.comment)}</div>
    ` : '';

    const highlightClass = isSearchMatch ? ' entry-search-match' : '';

    return `
        <div class="entry-wrapper">
            <div class="entry-item${highlightClass}" draggable="true" data-entry-id="${entry.id}" data-entry-index="${entryIndex}">
                <div class="entry-name">
                    <span class="drag-indicator">⋮⋮</span>
                    <span class="entry-name-text">${escapeHtml(entry.name)}</span>
                </div>
                <div class="entry-bubbles">
                    ${bubblesHTML}
                </div>
            </div>
            ${commentHTML}
        </div>
    `;
}

// Create Entry HTML (Quick Edit)
export function createEntryHTMLQuickEdit(entry, category, entryIndex, isSearchMatch = false, gridColumns = '') {
    const propertyOptionsHTML = category.properties.map(prop => {
        const { name: propName, type: propType } = getPropertyInfo(prop);
        const currentValue = entry.levels[propName];

        let controlsHTML = '';

        switch (propType) {
            case 'scale':
                const scaleVal = typeof currentValue === 'number' ? currentValue : 0;
                const numbersHTML = Array.from({ length: 11 }, (_, i) =>
                    `<span class="quick-edit-scale-num ${i === scaleVal ? 'current' : ''}"
                           data-property="${escapeHtml(propName)}"
                           data-value="${i}">${i}</span>`
                ).join('');
                controlsHTML = `<div class="quick-edit-scale">${numbersHTML}</div>`;
                break;

            case 'binary':
                const binaryVal = currentValue === true;
                controlsHTML = `
                    <div class="quick-edit-binary">
                        <span class="quick-edit-binary-option ${binaryVal ? 'current' : ''}"
                              data-property="${escapeHtml(propName)}"
                              data-value="true">Yes</span>
                        <span class="quick-edit-binary-option ${!binaryVal ? 'current' : ''}"
                              data-property="${escapeHtml(propName)}"
                              data-value="false">No</span>
                    </div>
                `;
                break;

            default: // 'level'
                const currentLevelId = currentValue || 'none';
                const levelsHTML = appData.levels.map(level => {
                    const isCurrent = level.id === currentLevelId;
                    const borderColor = level.color === '#ffffff' ? '#cbd5e0' : level.color;
                    return `
                        <div class="quick-edit-level ${isCurrent ? 'current' : ''}"
                             style="background-color: ${level.color}; border-color: ${borderColor}"
                             data-property="${escapeHtml(propName)}"
                             data-level-id="${level.id}"
                             title="${escapeHtml(propName)}: ${escapeHtml(level.name)}">
                        </div>
                    `;
                }).join('');
                controlsHTML = `<div class="quick-edit-levels">${levelsHTML}</div>`;
        }

        return `
            <div class="quick-edit-property-block" data-property-type="${propType}">
                <div class="quick-edit-property-label">${escapeHtml(propName)}</div>
                ${controlsHTML}
            </div>
        `;
    }).join('');

    const commentHTML = entry.comment ? `
        <div class="entry-comment">💬 Note: ${escapeHtml(entry.comment)}</div>
    ` : '';

    const highlightClass = isSearchMatch ? ' entry-search-match' : '';
    const gridStyle = gridColumns ? ` style="grid-template-columns: ${gridColumns};"` : '';

    return `
        <div class="entry-wrapper">
            <div class="entry-item quick-edit-entry-row${highlightClass}" draggable="true" data-entry-id="${entry.id}" data-entry-index="${entryIndex}"${gridStyle}>
                <div class="quick-edit-entry-name">
                    <span class="drag-indicator">⋮⋮</span>
                    <span class="quick-edit-entry-name-text">${escapeHtml(entry.name)}</span>
                </div>
                ${propertyOptionsHTML}
            </div>
            ${commentHTML}
        </div>
    `;
}

