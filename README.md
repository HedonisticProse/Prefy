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
2. The app will load with a default template
3. Start customizing your preferences!

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

1. Generate your template: `python genTemplate.py template.prefy`
2. Replace `template.json` with your generated file
3. Clear your browser's localStorage (or use incognito mode)
4. Reload the page to see your new default configuration

## File Structure

- `index.html` - Main application page
- `styles.css` - All styling and visual design
- `app.js` - Application logic and data management
- `template.json` - Default configuration loaded on first use
- `genTemplate.py` - Python script to generate templates from `.prefy` files
- `template.prefy` - Human-readable template source
- `example.prefy` - Example template with multiple categories

## Data Storage

Your configuration is automatically saved to browser localStorage. You can:

- **Export**: Download your configuration as JSON to back up or share
- **Import**: Load a JSON configuration file to restore or use someone else's setup
- **Reset**: Clear localStorage and reload to get the default template again

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
- Edit categories with the pencil icon
- Reorder by dragging category cards

### Entries

- Click "+" on any category to add entries
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
