# Prefy - Your Preferences Organized

A customizable, portable web-based tool for curating and sharing your preferences in a visual, categorical format.

## Features

- **Customizable Levels**: Define your own preference levels with custom names and colors
- **Flexible Categories**: Create unlimited categories with custom properties
- **Visual Interface**: Color-coded bubbles for quick visual reference
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

The template generator allows you to quickly create default configurations without manually editing JSON.

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

### Generate JSON Template

Run the Python script:

```bash
python genTemplate.py mylist.prefy
```

This will create `mylist.json` with the proper structure.

### Comments

Lines starting with `#` are treated as comments:

```
# This is a comment
Social Activities (Interest, Frequency): Movies, Concerts, Museums
```

### Using Your Generated Template

1. Generate your template: `python genTemplate.py mytemplate.prefy`
2. Add a `"name"` field to the generated JSON (e.g., `"name": "My Template"`)
3. Move the JSON file to the `./configs/` folder
4. Add the filename to the `configFiles` array in `app.js`
5. The configuration will now appear in **Settings > Load Configuration**

To change the default configuration that loads on startup, edit the fetch path in `app.js` in the `loadTemplate()` function.

## File Structure

- `index.html` - Main application page
- `styles.css` - All styling and visual design
- `app.js` - Application logic and data management
- `configs/` - Configuration files directory
  - `general_interests.json` - Default configuration (General Interests)
  - `*.json` - Additional configuration files
- `genTemplate.py` - Python script to generate templates from `.prefy` files
- `template.prefy` - Human-readable template source
- `example.prefy` - Example template with multiple categories

## Data Storage

The app loads a fresh configuration from `./configs/` on each page load. Your changes are **not** automatically saved - make sure to export your configuration before closing the browser!

- **Export**: Download your configuration as JSON to back up or share
- **Import**: Load a JSON configuration file to restore or use someone else's setup
- **Switch Configs**: Use **Settings > Load Configuration** to switch between configurations in the `./configs/` folder

## Settings

Click the **Settings** button in the header to access:

### Username

Set your username (optional). This is used for naming exported files:
- Image exports: `Prefy_YourUsername_2026-01-27_12-30-45.png`
- Config exports: `Prefy_Config_YourUsername_2026-01-27_12-30-45.json`

### Load Configuration

Select from available configurations in the `./configs/` folder. The dropdown displays the configuration's **name** field (not the filename).

When switching configurations, you'll be prompted to save your current work:
- **SAVE**: Opens the standard save dialog, then loads the new configuration
- **DO NOT SAVE**: Loads the new configuration without saving

### Adding New Configurations

To add a new configuration to the selector:

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

## Export Options

### Image Export

Click "Export Image" to generate a PNG snapshot of your entire preferences list. Perfect for sharing on social media or with friends.

### JSON Export/Import

- **Save Config**: Downloads a JSON file with your complete configuration
- **Load Config**: Upload a JSON file to restore or fork someone's configuration

## Privacy

All data is stored locally in your browser. Nothing is sent to any server. Your preferences remain completely private.

## License

Free to use and modify for personal use.
