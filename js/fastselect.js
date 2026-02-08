// Fast Select Level Picker Popup
import { appData } from './state.js';
import { escapeHtml } from './utils.js';

// State for tracking the active popup
let activeEntryId = null;
let activeCategoryId = null;
let activeProperty = null;
let activePropertyType = 'level';

// Callback for re-rendering after changes
let renderCallback = null;

export function setRenderCallback(callback) {
    renderCallback = callback;
}

/**
 * Initialize the fast select popup - call once on app load
 */
export function initFastSelect() {
    // Add click-outside handler to close popup (capture phase)
    document.addEventListener('click', handleDocumentClick, true);

    // Add escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFastSelectPopup();
        }
    });
}

/**
 * Handle document clicks to close popup when clicking outside
 */
function handleDocumentClick(e) {
    const popup = document.getElementById('fastSelectPopup');
    if (!popup || popup.style.display === 'none') return;

    // Check if click is inside popup
    if (popup.contains(e.target)) return;

    // Check if click is on a property display element (let the handler manage it)
    if (e.target.classList.contains('level-bubble') ||
        e.target.classList.contains('scale-display') ||
        e.target.classList.contains('binary-display')) return;

    closeFastSelectPopup();
}

/**
 * Open the fast select popup for a specific property display
 * @param {HTMLElement} bubbleEl - The clicked element
 * @param {string} categoryId - The category ID
 * @param {string} entryId - The entry ID
 * @param {string} property - The property name
 * @param {*} currentValue - The current value
 * @param {string} propertyType - The property type ('level', 'scale', or 'binary')
 */
export function openFastSelectPopup(bubbleEl, categoryId, entryId, property, currentValue, propertyType = 'level') {
    const popup = document.getElementById('fastSelectPopup');
    const optionsContainer = document.getElementById('fastSelectOptions');

    // Store active state
    activeEntryId = entryId;
    activeCategoryId = categoryId;
    activeProperty = property;
    activePropertyType = propertyType;

    // Build options HTML based on type
    let optionsHTML = '';

    switch (propertyType) {
        case 'scale':
            const scaleVal = typeof currentValue === 'number' ? currentValue : 0;
            optionsHTML = Array.from({ length: 11 }, (_, i) =>
                `<div class="fast-select-option fast-select-scale ${i === scaleVal ? 'current' : ''}"
                      data-value="${i}">${i}</div>`
            ).join('');
            break;

        case 'binary':
            const binaryVal = currentValue === true;
            optionsHTML = `
                <div class="fast-select-option fast-select-binary yes ${binaryVal ? 'current' : ''}"
                     data-value="true">&#10003;</div>
                <div class="fast-select-option fast-select-binary no ${!binaryVal ? 'current' : ''}"
                     data-value="false">&#10007;</div>
            `;
            break;

        default: // 'level'
            optionsHTML = appData.levels.map(level => {
                const isCurrent = level.id === currentValue;
                return `
                    <div class="fast-select-option fast-select-level ${isCurrent ? 'current' : ''}"
                         style="background-color: ${level.color}; border-color: ${level.color === '#ffffff' ? '#cbd5e0' : level.color}"
                         data-level-id="${level.id}"
                         title="${escapeHtml(level.name)}">
                    </div>
                `;
            }).join('');
    }

    optionsContainer.innerHTML = optionsHTML;

    // Add click handlers to options
    optionsContainer.querySelectorAll('.fast-select-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            if (propertyType === 'scale') {
                selectValue(parseInt(option.dataset.value, 10));
            } else if (propertyType === 'binary') {
                selectValue(option.dataset.value === 'true');
            } else {
                selectValue(option.dataset.levelId);
            }
        });
    });

    // Position the popup relative to the bubble
    positionPopup(popup, bubbleEl);

    // Show the popup
    popup.style.display = 'block';
}

/**
 * Position the popup relative to the clicked bubble
 */
function positionPopup(popup, bubbleEl) {
    const bubbleRect = bubbleEl.getBoundingClientRect();

    // Show popup temporarily to measure it
    popup.style.visibility = 'hidden';
    popup.style.display = 'block';
    const popupRect = popup.getBoundingClientRect();
    const popupWidth = popupRect.width;
    const popupHeight = popupRect.height;
    popup.style.visibility = '';

    // Calculate initial position (centered below the bubble)
    let left = bubbleRect.left + (bubbleRect.width / 2) - (popupWidth / 2);
    let top = bubbleRect.bottom + 10;

    // Adjust if popup would go off-screen horizontally
    const viewportWidth = window.innerWidth;
    if (left < 10) {
        left = 10;
    } else if (left + popupWidth > viewportWidth - 10) {
        left = viewportWidth - popupWidth - 10;
    }

    // Check if popup should appear above the bubble instead
    const viewportHeight = window.innerHeight;
    let showAbove = false;
    if (top + popupHeight > viewportHeight - 10) {
        top = bubbleRect.top - popupHeight - 10;
        showAbove = true;
    }

    // Apply position
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;

    // Toggle arrow direction class
    popup.classList.toggle('arrow-bottom', showAbove);
}

/**
 * Close the fast select popup
 */
export function closeFastSelectPopup() {
    const popup = document.getElementById('fastSelectPopup');
    if (popup) {
        popup.style.display = 'none';
        popup.classList.remove('arrow-bottom');
    }
    activeEntryId = null;
    activeCategoryId = null;
    activeProperty = null;
    activePropertyType = 'level';
}

/**
 * Handle value selection (works for all property types)
 */
function selectValue(value) {
    if (!activeCategoryId || !activeEntryId || !activeProperty) {
        closeFastSelectPopup();
        return;
    }

    // Find the category and entry
    const category = appData.categories.find(c => c.id === activeCategoryId);
    if (!category) {
        closeFastSelectPopup();
        return;
    }

    const entry = category.entries.find(e => e.id === activeEntryId);
    if (!entry) {
        closeFastSelectPopup();
        return;
    }

    // Update the value (works for all types)
    entry.levels[activeProperty] = value;

    // Close popup
    closeFastSelectPopup();

    // Re-render to reflect the change (preserving scroll position)
    if (renderCallback) {
        renderCallback(true);
    }
}

/**
 * Handle property display click - to be attached to level bubbles, scale/binary displays
 * @param {Event} e - Click event
 * @param {string} categoryId - The category ID
 * @param {string} entryId - The entry ID
 * @param {string} property - The property name
 * @param {*} currentValue - The current value
 * @param {string} propertyType - The property type ('level', 'scale', or 'binary')
 */
export function handleBubbleClick(e, categoryId, entryId, property, currentValue, propertyType = 'level') {
    e.stopPropagation(); // Prevent entry click handler from firing

    const bubbleEl = e.currentTarget;

    // If clicking the same element while popup is open, toggle it closed
    if (activeEntryId === entryId && activeProperty === property) {
        closeFastSelectPopup();
        return;
    }

    openFastSelectPopup(bubbleEl, categoryId, entryId, property, currentValue, propertyType);
}
