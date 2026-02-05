// Main App Entry Point
import { appData, currentEditingCategory } from './state.js';
import { renderCategories, scaleLegendText } from './render.js';
import { setRenderCallback as setModalsRenderCallback } from './modals.js';
import { setRenderCallback as setDragDropRenderCallback } from './dragdrop.js';
import { setRenderCallback as setConfigRenderCallback } from './config.js';
import {
    openSettingsModal,
    openLevelsModal,
    openCategoryModal,
    addLevelRow,
    saveLevels,
    addPropertyRow,
    saveCategory,
    deleteCategory,
    saveEntry,
    getCurrentEditingCategory
} from './modals.js';
import { exportToImage } from './export.js';
import {
    saveConfig,
    loadConfig,
    toggleConfigDropdown,
    handleConfigSelect,
    handleDoNotSave,
    handleSaveFirst,
    initializeAppData
} from './config.js';
import {
    handleGenerateTemplateClick,
    handleDownloadExampleClick,
    handlePrefyFileSelect
} from './prefy.js';
import { setSearchTerm, setExactMatch } from './filter.js';
import { initFastSelect, setRenderCallback as setFastSelectRenderCallback } from './fastselect.js';

// Set up render callbacks to avoid circular dependencies
setModalsRenderCallback(renderCategories);
setDragDropRenderCallback(renderCategories);
setConfigRenderCallback(renderCategories);
setFastSelectRenderCallback(renderCategories);

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    initializeEventListeners();
    initFastSelect();
    await initializeAppData();
    renderCategories();

    // Add resize listener for legend scaling
    window.addEventListener('resize', () => {
        scaleLegendText();
    });
});

// Event Listeners
function initializeEventListeners() {
    // Username input
    const usernameInput = document.getElementById('usernameInput');
    usernameInput.addEventListener('input', (e) => {
        appData.username = e.target.value;
    });

    // Export title input
    const exportTitleInput = document.getElementById('exportTitleInput');
    exportTitleInput.addEventListener('input', (e) => {
        appData.exportTitle = e.target.value;
    });

    // Header buttons
    document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);
    document.getElementById('manageLevelsBtn').addEventListener('click', openLevelsModal);
    document.getElementById('addCategoryBtn').addEventListener('click', () => openCategoryModal());
    document.getElementById('exportImageBtn').addEventListener('click', exportToImage);
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
    document.getElementById('loadConfigBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', () => {
        const container = document.getElementById('searchContainer');
        const isVisible = container.style.display !== 'none';
        container.style.display = isVisible ? 'none' : 'flex';

        if (!isVisible) {
            document.getElementById('searchInput').focus();
        }
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        setSearchTerm(e.target.value);
        renderCategories(true);
    });

    document.getElementById('exactMatchCheckbox').addEventListener('change', (e) => {
        setExactMatch(e.target.checked);
        renderCategories(true);
    });

    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('exactMatchCheckbox').checked = false;
        setSearchTerm(null);
        setExactMatch(false);
        renderCategories(true);
    });

    // Configuration Dropdown
    document.getElementById('configMenuBtn').addEventListener('click', toggleConfigDropdown);
    document.getElementById('configSelect').addEventListener('change', handleConfigSelect);
    document.getElementById('generateTemplateBtn').addEventListener('click', handleGenerateTemplateClick);
    document.getElementById('downloadExampleBtn').addEventListener('click', handleDownloadExampleClick);
    document.getElementById('prefyFileInput').addEventListener('change', handlePrefyFileSelect);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.querySelector('.dropdown');
        if (!dropdown.contains(e.target)) {
            document.getElementById('configDropdownMenu').classList.remove('active');
        }
    });

    // Settings Modal
    document.getElementById('closeSettingsBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('active');
    });

    // Save Prompt Modal
    document.getElementById('doNotSaveBtn').addEventListener('click', handleDoNotSave);
    document.getElementById('saveFirstBtn').addEventListener('click', handleSaveFirst);

    // File input
    document.getElementById('fileInput').addEventListener('change', loadConfig);

    // Modal close buttons
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Levels Modal
    document.getElementById('addLevelBtn').addEventListener('click', addLevelRow);
    document.getElementById('saveLevelsBtn').addEventListener('click', saveLevels);

    // Category Modal
    document.getElementById('addPropertyBtn').addEventListener('click', addPropertyRow);
    document.getElementById('saveCategoryBtn').addEventListener('click', saveCategory);
    document.getElementById('cancelCategoryBtn').addEventListener('click', () => {
        document.getElementById('categoryModal').classList.remove('active');
    });
    document.getElementById('deleteCategoryBtn').addEventListener('click', () => {
        const editingCategory = getCurrentEditingCategory();
        if (editingCategory) {
            const category = appData.categories.find(c => c.id === editingCategory);
            if (category && confirm(`Delete category "${category.name}"?`)) {
                deleteCategory(editingCategory);
                document.getElementById('categoryModal').classList.remove('active');
            }
        }
    });

    // Entry Modal
    document.getElementById('saveEntryBtn').addEventListener('click', saveEntry);
    document.getElementById('cancelEntryBtn').addEventListener('click', () => {
        document.getElementById('entryModal').classList.remove('active');
    });
}
