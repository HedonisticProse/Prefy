import {
    appData,
    draggedElement,
    draggedIndex,
    dragType,
    dragCategoryId,
    setDraggedElement,
    setDraggedIndex,
    setDragType,
    setDragCategoryId
} from './state.js';
import { openLevelsModal } from './modals.js';
import { getPropertyInfo, getDefaultValue } from './utils.js';

// We'll set this via a setter to avoid circular import issues
let renderCategoriesCallback = null;

export function setRenderCallback(callback) {
    renderCategoriesCallback = callback;
}

// ===== CATEGORY DRAG HANDLERS =====

export function handleCategoryDragStart(e) {
    setDraggedElement(e.currentTarget);
    setDraggedIndex(parseInt(e.currentTarget.dataset.categoryIndex));
    setDragType('category');
    e.currentTarget.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
}

export function handleCategoryDragOver(e) {
    if (dragType !== 'category') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

export function handleCategoryDragEnter(e) {
    if (dragType !== 'category') return;
    if (e.currentTarget.classList.contains('category-card')) {
        e.currentTarget.classList.add('drag-over');
    }
}

export function handleCategoryDragLeave(e) {
    if (dragType !== 'category') return;
    if (e.currentTarget.classList.contains('category-card')) {
        e.currentTarget.classList.remove('drag-over');
    }
}

export function handleCategoryDrop(e) {
    if (dragType !== 'category') return;
    e.stopPropagation();
    e.preventDefault();

    const dropIndex = parseInt(e.currentTarget.dataset.categoryIndex);

    if (draggedIndex !== dropIndex) {
        // Reorder categories
        const draggedCategory = appData.categories[draggedIndex];
        appData.categories.splice(draggedIndex, 1);
        appData.categories.splice(dropIndex, 0, draggedCategory);

        if (renderCategoriesCallback) {
            renderCategoriesCallback(true);
        }
    }

    e.currentTarget.classList.remove('drag-over');
    return false;
}

export function handleCategoryDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    setDraggedElement(null);
    setDraggedIndex(null);
    setDragType(null);
}

// ===== ENTRY DRAG HANDLERS =====

export function handleEntryDragStart(e, categoryId) {
    setDraggedElement(e.currentTarget);
    setDraggedIndex(parseInt(e.currentTarget.dataset.entryIndex));
    setDragType('entry');
    setDragCategoryId(categoryId);
    e.currentTarget.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation(); // Prevent category drag
}

export function handleEntryDragOver(e) {
    if (dragType !== 'entry') return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

export function handleEntryDragEnter(e) {
    if (dragType !== 'entry') return;
    if (e.currentTarget.classList.contains('entry-item')) {
        e.currentTarget.classList.add('drag-over');
    }
}

export function handleEntryDragLeave(e) {
    if (dragType !== 'entry') return;
    if (e.currentTarget.classList.contains('entry-item')) {
        e.currentTarget.classList.remove('drag-over');
    }
}

export function handleEntryDrop(e, categoryId) {
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

        if (renderCategoriesCallback) {
            renderCategoriesCallback(true);
        }
    }

    e.currentTarget.classList.remove('drag-over');
    return false;
}

export function handleEntryDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    document.querySelectorAll('.entry-item').forEach(entry => {
        entry.classList.remove('drag-over');
    });
    document.querySelectorAll('.category-body').forEach(body => {
        body.classList.remove('drag-over');
    });
    setDraggedElement(null);
    setDraggedIndex(null);
    setDragType(null);
    setDragCategoryId(null);
}

// ===== CROSS-CATEGORY ENTRY DROP HANDLERS =====

export function handleCategoryBodyDragOver(e, targetCategoryId) {
    if (dragType !== 'entry') return;
    // Don't allow drag over if it's the same category
    if (dragCategoryId === targetCategoryId) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

export function handleCategoryBodyDragEnter(e, targetCategoryId) {
    if (dragType !== 'entry') return;
    // Don't highlight if it's the same category
    if (dragCategoryId === targetCategoryId) return;
    if (e.currentTarget.classList.contains('category-body')) {
        e.currentTarget.classList.add('drag-over');
    }
}

export function handleCategoryBodyDragLeave(e) {
    if (dragType !== 'entry') return;
    if (e.currentTarget.classList.contains('category-body')) {
        e.currentTarget.classList.remove('drag-over');
    }
}

export function handleCategoryBodyDrop(e, targetCategoryId) {
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
        const { name: propName, type: propType } = getPropertyInfo(prop);
        // If the property exists in the source, keep its value
        const existingValue = draggedEntry.levels[propName];
        if (existingValue !== undefined) {
            newLevels[propName] = existingValue;
        } else {
            newLevels[propName] = getDefaultValue(propType);
        }
    });
    draggedEntry.levels = newLevels;

    // Add entry to end of target category
    targetCategory.entries.push(draggedEntry);

    if (renderCategoriesCallback) {
        renderCategoriesCallback(true);
    }
}

// ===== LEVEL DRAG HANDLERS =====

export function handleLevelDragStart(e) {
    setDraggedElement(e.currentTarget);
    setDraggedIndex(parseInt(e.currentTarget.dataset.levelIndex));
    setDragType('level');
    e.currentTarget.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
}

export function handleLevelDragOver(e) {
    if (dragType !== 'level') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

export function handleLevelDragEnter(e) {
    if (dragType !== 'level') return;
    if (e.currentTarget.classList.contains('level-item')) {
        e.currentTarget.classList.add('drag-over');
    }
}

export function handleLevelDragLeave(e) {
    if (dragType !== 'level') return;
    if (e.currentTarget.classList.contains('level-item')) {
        e.currentTarget.classList.remove('drag-over');
    }
}

export function handleLevelDrop(e) {
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

export function handleLevelDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    document.querySelectorAll('.level-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    setDraggedElement(null);
    setDraggedIndex(null);
    setDragType(null);
}
