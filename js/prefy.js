import { setPendingPrefyData } from './state.js';

// Default levels configuration (matches genTemplate.py)
const DEFAULT_PREFY_LEVELS = [
    { id: 'none', name: 'None', color: '#ffffff' },
    { id: 'favorite', name: 'Favorite', color: '#90cdf4' },
    { id: 'liked', name: 'Liked', color: '#48bb78' },
    { id: 'neutral', name: 'Neutral', color: '#fbd38d' },
    { id: 'will-try', name: 'Will Try', color: '#f6ad55' },
    { id: 'disliked', name: 'Disliked', color: '#fc8181' },
    { id: 'hard-limit', name: 'Hard Limit', color: '#f56565' }
];

// Generate a sanitized ID for prefy categories/entries
export function generatePrefyId(prefix, name, index) {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (index !== undefined) {
        return `${prefix}_${sanitized}_${index}`;
    }
    return `${prefix}_${sanitized}_default`;
}

// Parse a single line from a .prefy file
export function parsePrefyLine(line) {
    line = line.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
        return null;
    }

    // Match pattern: Category (prop1, prop2): entry1, entry2
    const match = line.match(/^([^(]+)\(([^)]+)\):\s*(.+)$/);

    if (!match) {
        console.warn(`Skipping invalid line: ${line}`);
        return null;
    }

    const categoryName = match[1].trim();
    const propertiesStr = match[2].trim();
    const entriesStr = match[3].trim();

    // Parse properties
    const properties = propertiesStr.split(',').map(p => p.trim()).filter(p => p);

    // Parse entries
    const entries = entriesStr.split(',').map(e => e.trim()).filter(e => e);

    if (!categoryName || properties.length === 0 || entries.length === 0) {
        console.warn(`Skipping incomplete line: ${line}`);
        return null;
    }

    return { categoryName, properties, entries };
}

// Create a category object from parsed data
export function createPrefyCategory(categoryName, properties, entries, catIndex) {
    const categoryId = generatePrefyId('cat', categoryName, catIndex);

    const entryObjects = entries.map((entryName, entryIndex) => {
        const entryId = generatePrefyId('entry', entryName, entryIndex);

        // Create levels dict with all properties set to "none"
        const levels = {};
        properties.forEach(prop => {
            levels[prop] = 'none';
        });

        return {
            id: entryId,
            name: entryName,
            levels: levels
        };
    });

    return {
        id: categoryId,
        name: categoryName,
        properties: properties,
        entries: entryObjects
    };
}

// Parse the entire .prefy file content
export function parsePrefyContent(content) {
    const lines = content.split('\n');
    const categories = [];

    lines.forEach((line, lineNum) => {
        const result = parsePrefyLine(line);
        if (result) {
            const category = createPrefyCategory(
                result.categoryName,
                result.properties,
                result.entries,
                categories.length
            );
            categories.push(category);
            console.log(`Parsed category '${result.categoryName}' with ${result.entries.length} entries`);
        }
    });

    return {
        username: '',
        exportTitle: 'My Prefy List',
        levels: DEFAULT_PREFY_LEVELS,
        categories: categories
    };
}

// Handle Generate Template button click
export function handleGenerateTemplateClick(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    console.log('handleGenerateTemplateClick called');
    document.getElementById('configDropdownMenu').classList.remove('active');
    const fileInput = document.getElementById('prefyFileInput');
    if (fileInput) {
        fileInput.click();
    } else {
        console.error('prefyFileInput not found');
        alert('Error: File input not found');
    }
}

// Handle Download Example button click
export function handleDownloadExampleClick(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    console.log('handleDownloadExampleClick called');
    downloadExamplePrefy();
}

// Handle .prefy file selection
export function handlePrefyFileSelect(event) {
    console.log('handlePrefyFileSelect called');
    const file = event.target.files[0];
    if (!file) {
        console.log('No file selected');
        return;
    }
    console.log('File selected:', file.name, file.size, 'bytes');

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            const parsedData = parsePrefyContent(content);

            if (parsedData.categories.length === 0) {
                alert('No valid categories found in the .prefy file. Please check the file format.');
                return;
            }

            // Store the parsed data and show save prompt
            setPendingPrefyData(parsedData);
            document.getElementById('savePromptModal').classList.add('active');

        } catch (error) {
            console.error('Failed to parse .prefy file:', error);
            alert('Failed to parse .prefy file. Please check the file format.');
        }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
}

// Download the example.prefy file
export async function downloadExamplePrefy() {
    console.log('downloadExamplePrefy called');

    // Close the dropdown
    document.getElementById('configDropdownMenu').classList.remove('active');

    try {
        console.log('Fetching example.prefy...');
        const response = await fetch('./example.prefy');
        console.log('Fetch response:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const content = await response.text();
        console.log('Content length:', content.length);

        // Create a blob and download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'example.prefy';
        link.href = url;
        document.body.appendChild(link);
        console.log('Triggering download...');
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('Download complete');
    } catch (error) {
        console.error('Failed to download example:', error);
        alert('Failed to download example file. Error: ' + error.message);
    }
}
