# Changelog

All notable changes to Prefy will be documented in this file.

## Version 0.2.3 "Simple Search"

**Change Date**: *February 1st, 2026 (2026-02-01)*

### Added

- **Search Feature**: Click the magnifying glass (🔍) button in the header to toggle a search bar
- Search input field with live filtering as you type
- "Exact match" checkbox to toggle between contains/exact matching
- Search matches against both category names and entry names
- Category name match shows entire category; entry match shows category with only matching entries highlighted
- Yellow highlighting for matched entries when searching by entry name
- "Clear" button to reset search and show all entries

### Changed

- Extended `./js/filter.js` module with search state (`searchTerm`, `exactMatch`) and `filterBySearch()` function
- Updated `./js/render.js` to support entry highlighting via `isSearchMatch` parameter
- Search and level filters work together (both must pass for entry to appear)
- Empty state message now covers both level filter and search scenarios

## Version 0.2.2 "Basic Level Filtering"

**Change Date**: *January 31st, 2026 (2026-01-31)*

### Added

- **Level Filtering**: Click any level in the legend to filter and show only entries with that level
- New `./js/filter.js` module for centralized filtering logic
- Visual feedback showing which level filter is active (highlighted in legend)
- "Clear" button in legend when a filter is active
- Empty state with GIF when no entries match the filter

### Changed

- Legend items are now clickable for filtering
- Filtering automatically clears when loading a new configuration

## Version 0.2.1 "Modularization of the JS"

**Change Date**: *January 31st, 2026 (2026-01-31)*

### Added

- Created new `./js/` folder which houses all the JS modules
- Entry point is still `./js/app.js`
- All other modules are now within the JS folder and get called and pulled in as-needed

### Changed

- `app.js` is not longer in root folder `./` and is now in `./js/`
- Logic that used to be all in `app.js` is now broken up across the JS files in `./js/`

## Version 0.2.0 "In-App Template Generator"

**Change Date**: *January 30th, 2026 (2026-01-30)*

### Added

- **Generate Template** button in Configuration menu to create configurations from `.prefy` files directly in the browser
- **Download Example** button to download `example.prefy` as a reference for the `.prefy` file format
- In-app `.prefy` file parsing (no longer requires Python script for basic usage)

### Changed

- Template generation now available both in-app and via Python script (`genTemplate.py`)

## Version 0.1.1 "UI Cleanup"

**Change Date**: *January 30th, 2026 (2026-01-30)*

### Changed

- Moved **Settings** button to the end of the header and replaced with a gear icon
- Created new **Configuration** dropdown menu containing:
  - Load Template selector (previously in Settings modal)
  - Save Config button
  - Load Config button
- Settings modal now contains only Username and Export Title fields

### Added

- Custom **Export Title** setting to personalize exported images
- **Subtitle** on exported images showing creator and timestamp
- **Levels legend** included in exported images
- **Footer branding** on exported images with link to project
- Page footer with GitHub and Issues links
- "Open Beta" designation in page title

## Version 0.1.0 "Open Beta Released"

**Change Date**: *January 27th, 2026 (2026-01-27)*

### Added

- Initial open beta of Prefy
- **Customizable preference levels** with drag-and-drop reordering and color selection
- **Flexible category system** with custom properties and entries
- **Image export** for sharing preferences as PNG snapshots
- **JSON configuration** save/load for backing up and restoring data
- **Template generator** (Python script) for creating configurations from `.prefy` files
