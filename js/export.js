import { appData } from './state.js';
import { escapeHtml, generateFilename, getPropertyInfo } from './utils.js';

// Create Entry HTML for Export (compact format)
export function createExportEntryHTML(entry, category) {
    const bubblesHTML = category.properties.map(prop => {
        const { name: propName, type: propType } = getPropertyInfo(prop);
        const value = entry.levels[propName];

        switch (propType) {
            case 'scale':
                const scaleVal = typeof value === 'number' ? value : 0;
                return `<div class="scale-display export-scale" title="${escapeHtml(propName)}: ${scaleVal}/10">${scaleVal}</div>`;

            case 'binary':
                const binaryVal = value === true;
                return `<div class="binary-display export-binary ${binaryVal ? 'yes' : 'no'}" title="${escapeHtml(propName)}: ${binaryVal ? 'Yes' : 'No'}">${binaryVal ? '&#10003;' : '&#10007;'}</div>`;

            default: // 'level'
                const levelId = value || 'none';
                const level = appData.levels.find(l => l.id === levelId) || appData.levels[0];
                return `<div class="level-bubble" style="background-color: ${level.color}; border-color: ${level.color === '#ffffff' ? '#cbd5e0' : level.color}" title="${escapeHtml(propName)}: ${escapeHtml(level.name)}"></div>`;
        }
    }).join('');

    const commentHTML = entry.comment ? `
        <div class="entry-comment">💬 Note: ${escapeHtml(entry.comment)}</div>
    ` : '';

    return `
        <div class="entry-wrapper">
            <div class="entry-item export-entry-item">
                <span class="entry-name export-entry-name">${escapeHtml(entry.name)}</span>
                <div class="entry-bubbles export-entry-bubbles">${bubblesHTML}</div>
            </div>
            ${commentHTML}
        </div>
    `;
}

// Export to Image
export async function exportToImage() {
    const preview = document.getElementById('exportPreview');
    const content = document.getElementById('exportCategoriesContainer');
    const exportContentDiv = document.querySelector('.export-content');

    // Calculate optimal columns for 16:9 ratio
    const categoryCount = appData.categories.length;
    let columns;

    if (categoryCount <= 3) {
        columns = categoryCount;
    } else if (categoryCount <= 6) {
        columns = 3;
    } else if (categoryCount <= 12) {
        columns = 4;
    } else if (categoryCount <= 20) {
        columns = 5;
    } else {
        columns = 6;
    }

    // Calculate width based on columns for 16:9 ratio
    const columnWidth = 300;
    const gap = 20;
    const padding = 80; // 40px on each side
    const baseWidth = (columnWidth * columns) + (gap * (columns - 1)) + padding;

    // Set the width and column count
    content.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    exportContentDiv.style.width = `${baseWidth}px`;

    // Set export title
    const exportTitle = document.getElementById('exportTitle');
    exportTitle.textContent = appData.exportTitle || 'My Prefy List';

    // Set export subtitle with date/time
    const exportSubtitle = document.getElementById('exportSubtitle');
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
    if (appData.username && appData.username.trim()) {
        exportSubtitle.textContent = `Created by ${appData.username} at ${timeStr} on ${dateStr}`;
    } else {
        exportSubtitle.textContent = `Created at ${timeStr} on ${dateStr}`;
    }

    // Prepare export levels legend
    const exportLegend = document.getElementById('exportLevelsLegend');
    exportLegend.innerHTML = appData.levels.map(level => `
        <div class="legend-item">
            <div class="legend-bubble" style="background-color: ${level.color}"></div>
            <span class="legend-name">${escapeHtml(level.name)}</span>
        </div>
    `).join('');

    // Prepare export content
    content.innerHTML = '';
    appData.categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-card export-category';

        // Create property headers
        const propertyHeadersHTML = category.properties.map(prop => {
            const { name: propName } = getPropertyInfo(prop);
            return `<span class="property-header">${escapeHtml(propName)}</span>`;
        }).join('');

        categoryDiv.innerHTML = `
            <div class="category-header">
                <div class="category-title">${escapeHtml(category.name)}</div>
                <div class="property-headers">${propertyHeadersHTML}</div>
            </div>
            <div class="category-body">
                ${category.entries.map(entry => createExportEntryHTML(entry, category)).join('')}
            </div>
        `;
        content.appendChild(categoryDiv);
    });

    // Show preview temporarily
    preview.style.display = 'block';
    preview.style.left = '0';

    try {
        const canvas = await html2canvas(document.querySelector('.export-content'), {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
        });

        // Convert to image and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = generateFilename('Prefy', 'png');
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }, 'image/png');

    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export image. Please try again.');
    } finally {
        // Hide preview
        preview.style.left = '-9999px';
        preview.style.display = 'none';
    }
}
