// Filter state
export let activeLevelFilter = null;

// Search state
export let searchTerm = null;
export let exactMatch = false;

export function setActiveLevelFilter(levelId) {
    activeLevelFilter = levelId;
}

export function setSearchTerm(term) {
    searchTerm = term?.trim() || null;
}

export function setExactMatch(isExact) {
    exactMatch = isExact;
}

export function clearAllFilters() {
    activeLevelFilter = null;
    searchTerm = null;
    exactMatch = false;
}

// Check if any filter is active
export function isAnyFilterActive() {
    return activeLevelFilter !== null || (searchTerm !== null && searchTerm !== '');
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

    if (searchTerm) {
        result = filterBySearch(result, searchTerm);
    }

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

// Filter categories/entries by search term
function filterBySearch(categories, term) {
    const searchLower = term.toLowerCase();

    return categories
        .map(category => {
            const categoryNameLower = category.name.toLowerCase();

            // Check if category name matches
            const categoryMatches = exactMatch
                ? categoryNameLower === searchLower
                : categoryNameLower.includes(searchLower);

            if (categoryMatches) {
                // Return entire category, mark as category match
                return { ...category, _searchMatchType: 'category' };
            }

            // Check entries for matches
            const matchingEntries = category.entries.filter(entry => {
                const entryNameLower = entry.name.toLowerCase();
                return exactMatch
                    ? entryNameLower === searchLower
                    : entryNameLower.includes(searchLower);
            });

            if (matchingEntries.length > 0) {
                // Return category with only matching entries, mark matched entry IDs
                return {
                    ...category,
                    entries: matchingEntries,
                    _searchMatchType: 'entries',
                    _matchedEntryIds: matchingEntries.map(e => e.id)
                };
            }

            return null;
        })
        .filter(Boolean);
}
