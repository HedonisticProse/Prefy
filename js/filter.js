// Filter state
export let activeLevelFilter = null;

export function setActiveLevelFilter(levelId) {
    activeLevelFilter = levelId;
}

export function clearAllFilters() {
    activeLevelFilter = null;
    // Future: searchTerm = null;
}

// Check if entry has a specific level in any property
export function entryHasLevel(entry, levelId) {
    return Object.values(entry.levels).includes(levelId);
}

// Apply all active filters to categories
// Returns filtered categories with filtered entries
export function applyFilters(categories) {
    let result = categories;

    if (activeLevelFilter) {
        result = filterByLevel(result, activeLevelFilter);
    }

    // Future: if (searchTerm) { result = filterBySearch(result, searchTerm); }

    return result;
}

// Filter categories/entries by level
function filterByLevel(categories, levelId) {
    return categories
        .map(category => {
            const filteredEntries = category.entries.filter(
                entry => entryHasLevel(entry, levelId)
            );
            if (filteredEntries.length === 0) return null;
            return { ...category, entries: filteredEntries };
        })
        .filter(Boolean);
}
