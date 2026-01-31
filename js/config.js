import {
    appData,
    availableConfigs,
    pendingConfigLoad,
    pendingPrefyData,
    setAppData,
    setAvailableConfigs,
    setPendingConfigLoad,
    setPendingPrefyData
} from './state.js';
import { generateFilename } from './utils.js';

// We'll set this via a setter to avoid circular import issues
let renderCategoriesCallback = null;

export function setRenderCallback(callback) {
    renderCategoriesCallback = callback;
}

// Setter for pendingPrefyData (used by prefy.js)
export function setConfigPendingPrefyData(data) {
    setPendingPrefyData(data);
}

// ===== SAVE CONFIGURATION =====

export function saveConfig() {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = generateFilename('Prefy_Config', 'json');
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

// ===== LOAD CONFIGURATION =====

export function loadConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // Validate data structure
            if (!data.levels || !data.categories) {
                throw new Error('Invalid configuration file');
            }

            // Ensure fields exist for backward compatibility
            if (!data.username) {
                data.username = '';
            }
            if (!data.exportTitle) {
                data.exportTitle = 'My Prefy List';
            }

            if (confirm('Load this configuration? This will replace your current data.')) {
                setAppData(data);
                if (renderCategoriesCallback) {
                    renderCategoriesCallback();
                }
                alert('Configuration loaded successfully!');
            }
        } catch (error) {
            console.error('Load failed:', error);
            alert('Failed to load configuration. Please check the file format.');
        }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
}

// ===== CONFIGURATION DROPDOWN =====

export async function toggleConfigDropdown() {
    const dropdownMenu = document.getElementById('configDropdownMenu');
    const isActive = dropdownMenu.classList.contains('active');

    if (isActive) {
        dropdownMenu.classList.remove('active');
    } else {
        // Load configs and populate dropdown
        await loadAvailableConfigs();
        const configSelect = document.getElementById('configSelect');
        configSelect.innerHTML = '<option value="">-- Select --</option>';
        availableConfigs.forEach(config => {
            const option = document.createElement('option');
            option.value = config.filename;
            option.textContent = config.name || config.filename;
            configSelect.appendChild(option);
        });
        dropdownMenu.classList.add('active');
    }
}

export async function loadAvailableConfigs() {
    setAvailableConfigs([]);

    // List of known config files in ./configs folder
    // Since we can't list directories in browser, we'll try to fetch a manifest or known files
    const configFiles = [
        'general_interests.json',
        'kinklistv2_modified.json'
    ];

    const configs = [];
    for (const filename of configFiles) {
        try {
            const response = await fetch(`./configs/${filename}`);
            if (response.ok) {
                const data = await response.json();
                configs.push({
                    filename: filename,
                    name: data.name || filename.replace('.json', '')
                });
            }
        } catch (error) {
            console.warn(`Could not load config: ${filename}`, error);
        }
    }
    setAvailableConfigs(configs);
}

export function handleConfigSelect(e) {
    const selectedFile = e.target.value;
    if (!selectedFile) return;

    // Store the pending config and show save prompt
    setPendingConfigLoad(selectedFile);

    // Reset the select to prevent confusion
    e.target.value = '';

    // Close dropdown and open save prompt
    document.getElementById('configDropdownMenu').classList.remove('active');
    document.getElementById('savePromptModal').classList.add('active');
}

export function handleDoNotSave() {
    // Close save prompt modal
    document.getElementById('savePromptModal').classList.remove('active');

    // Load the pending config without saving
    if (pendingConfigLoad) {
        loadConfigFromFile(pendingConfigLoad);
        setPendingConfigLoad(null);
    }

    // Load the pending prefy data without saving
    if (pendingPrefyData) {
        loadPrefyData(pendingPrefyData);
        setPendingPrefyData(null);
    }
}

export function handleSaveFirst() {
    // Close save prompt modal
    document.getElementById('savePromptModal').classList.remove('active');

    // Trigger save config (this downloads the file)
    saveConfig();

    // Load the pending config after a brief delay to allow save dialog
    if (pendingConfigLoad) {
        setTimeout(() => {
            loadConfigFromFile(pendingConfigLoad);
            setPendingConfigLoad(null);
        }, 500);
    }

    // Load the pending prefy data after a brief delay to allow save dialog
    if (pendingPrefyData) {
        setTimeout(() => {
            loadPrefyData(pendingPrefyData);
            setPendingPrefyData(null);
        }, 500);
    }
}

export async function loadConfigFromFile(filename) {
    try {
        const response = await fetch(`./configs/${filename}`);
        if (!response.ok) {
            throw new Error('Failed to fetch configuration');
        }
        const data = await response.json();

        // Validate data structure
        if (!data.levels || !data.categories) {
            throw new Error('Invalid configuration file');
        }

        // Ensure fields exist for backward compatibility
        if (!data.username) {
            data.username = '';
        }
        if (!data.exportTitle) {
            data.exportTitle = 'My Prefy List';
        }

        setAppData(data);
        if (renderCategoriesCallback) {
            renderCategoriesCallback();
        }
        alert('Configuration loaded successfully!');
    } catch (error) {
        console.error('Load failed:', error);
        alert('Failed to load configuration. Please check the file.');
    }
}

// Load prefy data (used by save prompt handlers)
export function loadPrefyData(data) {
    setAppData(data);
    if (renderCategoriesCallback) {
        renderCategoriesCallback();
    }

    const totalEntries = data.categories.reduce((sum, cat) => sum + cat.entries.length, 0);
    alert(`Template generated successfully!\n${data.categories.length} categories with ${totalEntries} total entries.`);
}

// ===== INITIALIZATION =====

export async function initializeAppData() {
    // Always load fresh template from template.json
    await loadTemplate();
}

export async function loadTemplate() {
    try {
        const response = await fetch('./configs/general_interests.json');
        if (!response.ok) {
            throw new Error('Failed to fetch template');
        }
        const templateData = await response.json();

        // Ensure fields exist for backward compatibility
        if (!templateData.username) {
            templateData.username = '';
        }
        if (!templateData.exportTitle) {
            templateData.exportTitle = 'My Prefy List';
        }

        setAppData(templateData);
    } catch (error) {
        console.error('Failed to load template:', error);
        // Keep the hardcoded default if template fails to load
    }
}
