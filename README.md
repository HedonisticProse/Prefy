# Prefy - Your Preferences Organized

A customizable, portable web-based tool for curating and sharing your preferences in a visual, categorical format.

Hosted on GitHub Pages: [https://hedonisticprose.github.io/Prefy/](https://hedonisticprose.github.io/Prefy/)

**Disclaimer**: *Prefy is currently in Open Beta for evaluation. If you encounter any issues or have features you would like to request, please use the Issues Page here to communicate them to me.*

## Table of Contents
- [Prefy - Your Preferences Organized](#prefy---your-preferences-organized)
  - [Table of Contents](#table-of-contents)
  - [Background](#background)
  - [AI Disclosure](#ai-disclosure)
  - [Features](#features)
  - [Getting Started](#getting-started)
  - [Using the Template Generator](#using-the-template-generator)
    - [Format](#format)
    - [Example](#example)
    - [Comments](#comments)
    - [Generate Template (In-App)](#generate-template-in-app)
    - [Generate Template (Python Script)](#generate-template-python-script)
  - [File Structure](#file-structure)
  - [Data Storage](#data-storage)
  - [Settings](#settings)
    - [Username](#username)
    - [Export Title](#export-title)
  - [Configuration Menu](#configuration-menu)
    - [View Mode](#view-mode)
    - [Load Template](#load-template)
    - [Generate Template](#generate-template)
    - [Download Example](#download-example)
    - [Save Config](#save-config)
    - [Load Config](#load-config)
    - [Adding New Configurations](#adding-new-configurations)
  - [Customization](#customization)
    - [Levels](#levels)
    - [Categories](#categories)
    - [Entries](#entries)
  - [Filtering](#filtering)
    - [Level Filtering](#level-filtering)
    - [Search](#search)
  - [Export Options](#export-options)
    - [Image Export](#image-export)
    - [JSON Export/Import](#json-exportimport)
  - [Privacy](#privacy)
  - [License](#license)

## Background

This tool is inspired by [Goctionni's](https://github.com/Goctionni) [kinklistv2](https://github.com/Goctionni/kinklist-v2) which is a Vue.js web-app for categorizing kinks and sexual interests visually while communicating your personal preferences.

The original tool exported configurations using images which meant that you could not save the overall state of the app in such a way that if you made modifications you could recall them later. Additionally, features like "comments" did not display on the final image export which made them useless in practice.

I decided to take my won crack at this exercise and created Prefy.

Prefy is non-sexual by default, can be used for any type of preference communication, and is more publicly usable. However, for those still looking for the kinklistv2 functionality, a kinklistv2 configuration can be loaded through the Configuration menu (see the ["Load Template"](#load-template) section).

## AI Disclosure

Prefy was created using Claude Code. The project currently stands as a "scaffold" of AI-generated code I will be trimming, refactoring, and editing once I am finished with the Open Beta.

If you have any strong personal feelings about AI generated content and tools, please go support [kinklistv2](https://goctionni.github.io/kinklist-v2/). I will certainly not take it personally!

## Features

- **Customizable Levels**: Define your own preference levels with custom names and colors
- **Flexible Categories**: Create unlimited categories with custom properties
- **Visual Interface**: Color-coded bubbles for quick visual reference
- **Quick-Select Level Picker**: Click any level bubble on an entry to quickly change its level without opening the edit dialog
- **View Modes**: Switch between Grid View and Quick Edit for faster level changes
- **Level Filtering**: Click any level in the legend to filter and show only matching entries
- **Search**: Find categories and entries by name with optional exact match mode
- **Drag & Drop**: Reorder levels, categories, and entries
- **Export Options**:
  - Export as PNG/JPEG image for easy sharing
  - Save/load configuration as JSON
- **Template System**: Quickly generate configurations from human-readable `.prefy` files

## Getting Started

1. Open `index.html` in your web browser
2. The app will load the default configuration from `./configs/general_interests.json`
3. Start customizing your preferences!
4. Click **Settings** to set your username and switch between configurations

## Using the Template Generator

The template generator allows you to quickly create configurations from human-readable `.prefy` files without manually editing JSON.

### Format

Each line in a `.prefy` file follows this format:

```
Category Name (Property 1, Property 2, ...): Entry 1, Entry 2, ...
```

### Example

Create a file called `mylist.prefy`:

```
Social Activities (Interest, Frequency): Movies, Concerts, Museums, Hiking
Food Preferences (Like, Dislike): Italian, Japanese, Mexican, Thai
Hobbies (Skill Level, Interest): Photography, Cooking, Gaming, Reading
```

### Comments

Lines starting with `#` are treated as comments:

```text
# This is a comment
Social Activities (Interest, Frequency): Movies, Concerts, Museums
```

### Generate Template (In-App)

The easiest way to use `.prefy` files:

1. Click **Configuration** in the header
2. Click **Download Example** to get a sample `.prefy` file for reference
3. Create your own `.prefy` file following the format above
4. Click **Generate Template** and select your `.prefy` file
5. Your configuration will be loaded immediately

### Generate Template (Python Script)

Alternatively, use the Python script for offline generation:

```bash
python genTemplate.py mylist.prefy
```

This will create `mylist.json` with the proper structure.

To add the generated template to the Load Template dropdown:

1. Add a `"name"` field to the generated JSON (e.g., `"name": "My Template"`)
2. Move the JSON file to the `./configs/` folder
3. Add the filename to the `configFiles` array in `app.js`

To change the default configuration that loads on startup, edit the fetch path in `app.js` in the `loadTemplate()` function.

## File Structure

- `index.html` - Main application page
- `styles.css` - All styling and visual design
- `./js/` - Application logic and data management
  - `app.js` - Application logic entry point
  - `config.js` - Application configuration
  - `dragdrop.js` - Drag-and-drop logic
  - `export.js` - Image export logic
  - `fastselect.js` - Quick-select level picker popup
  - `filter.js` - Filtering logic (level filter, search)
  - `modals.js` - Modal logic
  - `render.js` - Rendering logic
  - `prefy.js` - Handling of `*.prefy` files
  - `state.js` - State handling
  - `utils.js` - Utilities relevant to the application
- `./configs/` - Configuration files directory
  - `general_interests.json` - Default configuration (General Interests)
  - `*.json` - Additional configuration files
- `genTemplate.py` - Python script to generate templates from `.prefy` files
- `template.prefy` - Human-readable template source
- `example.prefy` - Example template with multiple categories

## Data Storage

The app loads a fresh configuration from `./configs/` on each page load. Your changes are **not** automatically saved - make sure to export your configuration before closing the browser!

- **Export**: Download your configuration as JSON to back up or share
- **Import**: Load a JSON configuration file to restore or use someone else's setup
- **Switch Configs**: Use **Configuration > Load Template** to switch between configurations in the `./configs/` folder

## Settings

Click the **gear icon** (&#9881;) in the header to access settings:

### Username

Set your username (optional). This is used for:

- Naming exported files: `Prefy_YourUsername_2026-01-27_12-30-45.png`
- The subtitle on exported images: "Created by YourUsername at 12:30 PM on January 27, 2026"

### Export Title

Set a custom title for your exported images. This appears at the top of the exported image instead of the default "My Prefy List".

## Configuration Menu

Click the **Configuration** button in the header to access the configuration dropdown menu:

### View Mode

Switch between available layouts:

- **Grid View** (default): The classic multi-column card layout
- **Quick Edit**: Full-width categories with inline level bubbles under each property for faster selection

### Load Template

Select from available template configurations in the `./configs/` folder. The dropdown displays the configuration's **name** field (not the filename).

When switching configurations, you'll be prompted to save your current work:

- **SAVE**: Opens the standard save dialog, then loads the new configuration
- **DO NOT SAVE**: Loads the new configuration without saving

### Generate Template

Opens a file dialog to select a `.prefy` file. The file is parsed and loaded as a new configuration. See [Using the Template Generator](#using-the-template-generator) for the `.prefy` file format.

### Download Example

Downloads `example.prefy` as a reference file showing the correct format for `.prefy` template files.

### Save Config

Downloads your current configuration as a JSON file. Use this to back up your work or share with others.

### Load Config

Upload a previously saved JSON configuration file to restore your work or use someone else's configuration.

### Adding New Configurations

To add a new configuration to the template selector:

1. Place your `.json` file in the `./configs/` folder
2. Ensure the file has a `"name"` field at the top level (this is what appears in the dropdown)
3. Add the filename to the `configFiles` array in `app.js` (in the `loadAvailableConfigs` function)

## Customization

### Levels

Click "Manage Levels" to:
- Change level names and colors
- Add new levels
- Reorder levels (drag and drop)
- Delete unused levels

### Categories

- Click "+ Add Category" to create new categories
- Define properties specific to each category
- Click the category title to edit
- Reorder by dragging category cards

### Entries

- Click "Add entry..." at the bottom of any category to add entries
- Click any entry to edit it
- Set preference levels for each property
- Reorder entries within categories by dragging
- **Quick-Select**: Click directly on a level bubble to change that property's level without opening the full edit dialog. A small popup appears with all available levels for quick selection.
- **Delete**: Click the red "Delete" button in the entry edit modal to remove an entry (with confirmation)

## Filtering

### Level Filtering

Click any level in the **Levels Legend** (the colored bubbles at the top of the page) to filter your view:

- **Click a level**: Shows only categories and entries that have that level assigned to any property
- **Click the same level again**: Clears the filter and shows all entries
- **"Clear" button**: Appears when a filter is active; click to remove the filter

This is useful for quickly finding all entries with a specific preference level (e.g., "show me all my Favorites" or "show me all Hard Limits").

**Note**: Filtering only affects the display - your data is not modified. The filter is automatically cleared when loading a new configuration.

### Search

Click the **magnifying glass button** (🔍) in the header to toggle the search bar. The search bar appears between the header and the levels legend.

- **Live search**: Results filter as you type
- **Category match**: If a category name matches, the entire category is shown with all entries
- **Entry match**: If entry names match, only matching entries are shown and highlighted in yellow
- **Exact match**: Check the "Exact match" checkbox to search for exact matches only (instead of partial/contains matches)
- **Clear**: Click the "Clear" button to reset the search and show all entries

**Combining Filters**: Search works alongside level filtering. When both are active, an entry must match both the level filter AND the search term to appear.

## Export Options

### Image Export

Click "Export Image" to generate a PNG snapshot of your entire preferences list. Perfect for sharing on social media or with friends.

The exported image includes:

- **Title**: Your custom export title (set in Settings), or "My Prefy List" by default
- **Subtitle**: "Created by [Username] at [time] on [date]" (or just "Created at [time] on [date]" if no username is set)
- **Levels Legend**: Color-coded legend showing what each level means
- **All Categories**: Your complete preferences list
- **Footer**: Prefy branding with a link back to the project

### JSON Export/Import

- **Save Config**: Downloads a JSON file with your complete configuration
- **Load Config**: Upload a JSON file to restore or fork someone's configuration

## Privacy

All data is stored locally in your browser. Nothing is sent to any server. Your preferences remain completely private.

## License

Free to use and modify for personal use.
