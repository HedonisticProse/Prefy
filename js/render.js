import { appData } from './state.js';
import { escapeHtml } from './utils.js';
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
        const categoryCard = createCategoryCard(category, originalIndex);
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
export function createCategoryCard(category, index) {
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

        // Click handler
        entryEl.addEventListener('click', () => {
            const entryId = entryEl.dataset.entryId;
            openEntryModal(category.id, entryId);
        });

        // Add click handlers for level bubbles (fast select)
        entryEl.querySelectorAll('.level-bubble').forEach(bubbleEl => {
            bubbleEl.addEventListener('click', (e) => {
                const entryId = entryEl.dataset.entryId;
                const property = bubbleEl.dataset.property;
                const currentLevelId = bubbleEl.dataset.levelId;
                handleBubbleClick(e, category.id, entryId, property, currentLevelId);
            });
        });
    });

    return card;
}

// Create Entry HTML
export function createEntryHTML(entry, category, entryIndex, isSearchMatch = false) {
    const bubblesHTML = category.properties.map(prop => {
        const levelId = entry.levels[prop] || 'none';
        const level = appData.levels.find(l => l.id === levelId) || appData.levels[0];
        return `<div class="level-bubble" style="background-color: ${level.color}; border-color: ${level.color === '#ffffff' ? '#cbd5e0' : level.color}" title="${escapeHtml(prop)}: ${escapeHtml(level.name)}" data-property="${escapeHtml(prop)}" data-level-id="${levelId}"></div>`;
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
