/**
 * Main Application Module
 * Orchestrates all functionality: navigation, events, UI updates, etc.
 */

const App = {
    currentView: 'wheel',
    selectedColor: null,
    editingUser: null,
    editingUserColor: null,

    /**
     * Initialize the application
     */
    init() {
        // Check for shareable link
        this.checkShareableLink();

        // Apply theme
        this.applyTheme();

        // Check first visit
        if (Storage.isFirstVisit()) {
            this.showView('welcome');
        } else {
            const lastView = Storage.getLastView();
            this.showView(lastView);
        }

        // Setup navigation
        this.setupNavigation();

        // Setup event listeners
        this.setupWheelEvents();
        this.setupUserEvents();
        this.setupHistoryEvents();
        this.setupSettingsEvents();
        this.setupKeyboardShortcuts();
        this.setupModalEvents();

        // Initial render
        this.renderUsersList();
        this.updateWheelState();
    },

    // ==================== NAVIGATION ====================

    /**
     * Show a specific view
     */
    showView(viewName) {
        if (viewName === 'welcome' && !Storage.isFirstVisit()) {
            viewName = 'wheel';
        }

        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        const viewElement = document.getElementById(`${viewName}-view`);
        if (viewElement) {
            viewElement.classList.add('active');
        }

        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.view === viewName) {
                tab.classList.add('active');
            }
        });

        this.currentView = viewName;

        // Save view preference
        if (viewName !== 'welcome') {
            Storage.setLastView(viewName);
        }

        // Render content when switching views
        if (viewName === 'history') {
            this.renderHistoryList();
            this.renderStatistics();
        }
    },

    /**
     * Setup navigation event listeners
     */
    setupNavigation() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const viewName = tab.dataset.view;
                this.showView(viewName);
            });
        });

        // Welcome button
        document.getElementById('welcome-go-to-users')?.addEventListener('click', () => {
            Storage.markFirstVisitDone();
            this.showView('users');
        });
    },

    // ==================== WHEEL VIEW ====================

    /**
     * Setup wheel events
     */
    setupWheelEvents() {
        const spinButton = document.getElementById('spin-button');
        spinButton.addEventListener('click', () => this.spin());

        // Touch swipe support
        let touchStartX = 0;
        let touchStartY = 0;
        const wheelElement = document.getElementById('wheel');

        wheelElement.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        wheelElement.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // Detect swipe (minimum 30px)
            if (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30) {
                this.spin();
            }
        });
    },

    /**
     * Spin the wheel
     */
    spin() {
        if (!Wheel.canSpin()) {
            alert('Add at least 2 users before spinning!');
            return;
        }

        Wheel.spin((result) => {
            this.displayResult(result);
        });
    },

    /**
     * Display result
     */
    displayResult(user) {
        const resultDisplay = document.getElementById('result-display');
        const resultName = document.getElementById('result-name');

        resultName.textContent = user.name;
        resultDisplay.classList.remove('hidden');

        // Trigger winner effect
        Effects.triggerWinnerEffect(user.name);

        // Setup result buttons
        document.getElementById('copy-result').onclick = () => {
            navigator.clipboard.writeText(user.name);
            alert('Copied to clipboard!');
        };

        document.getElementById('share-result').onclick = () => {
            const link = Storage.generateShareableLink();
            navigator.clipboard.writeText(link);
            alert('Shareable link copied to clipboard!');
        };
    },

    /**
     * Update wheel state (disable/enable spin button)
     */
    updateWheelState() {
        const spinButton = document.getElementById('spin-button');
        const users = Storage.getUsers();

        if (users.length < 2) {
            spinButton.disabled = true;
            spinButton.title = 'Add at least 2 users to spin';
        } else {
            spinButton.disabled = false;
            spinButton.title = 'Spin the wheel (Enter or Space)';
        }
    },

    // ==================== USERS VIEW ====================

    /**
     * Setup user management events
     */
    setupUserEvents() {
        const nameInput = document.getElementById('user-name-input');
        const addBtn = document.getElementById('add-user-btn');
        const colorPalette = document.getElementById('color-palette');
        const customColor = document.getElementById('custom-color');
        const colorPreview = document.getElementById('color-preview');

        // Render color palette
        Storage.COLOR_PALETTE.forEach(color => {
            const option = document.createElement('div');
            option.className = 'color-option';
            option.style.backgroundColor = color;
            option.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(o => {
                    o.classList.remove('selected');
                });
                option.classList.add('selected');
                this.selectedColor = color;
                colorPreview.style.backgroundColor = color;
            });
            colorPalette.appendChild(option);
        });

        // Select first color by default
        const firstOption = colorPalette.firstChild;
        if (firstOption) {
            firstOption.classList.add('selected');
            this.selectedColor = Storage.COLOR_PALETTE[0];
            colorPreview.style.backgroundColor = this.selectedColor;
        }

        // Custom color picker
        customColor.addEventListener('input', (e) => {
            this.selectedColor = e.target.value;
            colorPreview.style.backgroundColor = this.selectedColor;
            document.querySelectorAll('.color-option').forEach(o => {
                o.classList.remove('selected');
            });
        });

        // Add user
        addBtn.addEventListener('click', () => {
            this.addUser(nameInput.value);
            nameInput.value = '';
            nameInput.focus();
        });

        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addUser(nameInput.value);
                nameInput.value = '';
            }
        });

        // Validate on input
        nameInput.addEventListener('input', () => {
            this.validateUserName(nameInput.value);
        });
    },

    /**
     * Validate user name
     */
    validateUserName(name) {
        const errorDiv = document.getElementById('name-error');
        const addBtn = document.getElementById('add-user-btn');

        if (!name) {
            errorDiv.textContent = '';
            addBtn.disabled = false;
            return true;
        }

        if (name.length < 2) {
            errorDiv.textContent = 'Name must be at least 2 characters';
            addBtn.disabled = true;
            return false;
        }

        if (name.length > 15) {
            errorDiv.textContent = 'Name cannot exceed 15 characters';
            addBtn.disabled = true;
            return false;
        }

        if (Storage.userExists(name)) {
            errorDiv.textContent = 'This name already exists';
            addBtn.disabled = true;
            return false;
        }

        if (Storage.getUsers().length >= 20) {
            errorDiv.textContent = 'Maximum 20 users reached';
            addBtn.disabled = true;
            return false;
        }

        errorDiv.textContent = '';
        addBtn.disabled = false;
        return true;
    },

    /**
     * Add a user
     */
    addUser(name) {
        if (!this.validateUserName(name)) {
            return;
        }

        Storage.addUser(name, this.selectedColor);
        this.renderUsersList();
        this.updateWheelState();
        Wheel.render();

        // Auto-dismiss welcome on first user
        if (Storage.isFirstVisit()) {
            Storage.markFirstVisitDone();
            this.showView('wheel');
        }
    },

    /**
     * Render users list
     */
    renderUsersList() {
        const users = Storage.getUsers();
        const usersGrid = document.getElementById('users-grid');
        const userCount = document.getElementById('user-count');

        userCount.textContent = users.length;
        usersGrid.innerHTML = '';

        users.forEach(user => {
            const card = document.createElement('div');
            card.className = 'user-card';

            const colorDiv = document.createElement('div');
            colorDiv.className = 'user-color';
            colorDiv.style.backgroundColor = user.color;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'user-info';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'user-name';
            nameDiv.textContent = user.name;

            infoDiv.appendChild(nameDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'user-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-secondary';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => {
                this.editUser(user);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                this.confirmDeleteUser(user);
            });

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);

            card.appendChild(colorDiv);
            card.appendChild(infoDiv);
            card.appendChild(actionsDiv);

            usersGrid.appendChild(card);
        });
    },

    /**
     * Edit user (modal form)
     */
    editUser(user) {
        this.editingUser = user;
        this.editingUserColor = user.color;

        // Populate modal with current values
        document.getElementById('edit-user-name').value = user.name;

        // Setup color palette in edit modal
        const editColorPalette = document.getElementById('edit-color-palette');
        editColorPalette.innerHTML = '';
        Storage.COLOR_PALETTE.forEach(color => {
            const option = document.createElement('div');
            option.className = 'color-option';
            option.style.backgroundColor = color;
            if (color === user.color) {
                option.classList.add('selected');
            }
            option.addEventListener('click', () => {
                document.querySelectorAll('#edit-color-palette .color-option').forEach(o => {
                    o.classList.remove('selected');
                });
                option.classList.add('selected');
                this.editingUserColor = color;
                document.getElementById('edit-color-preview').style.backgroundColor = color;
            });
            editColorPalette.appendChild(option);
        });

        // Setup custom color input
        const customColor = document.getElementById('edit-custom-color');
        customColor.value = user.color;
        document.getElementById('edit-color-preview').style.backgroundColor = user.color;

        customColor.addEventListener('input', (e) => {
            this.editingUserColor = e.target.value;
            document.getElementById('edit-color-preview').style.backgroundColor = this.editingUserColor;
            document.querySelectorAll('#edit-color-palette .color-option').forEach(o => {
                o.classList.remove('selected');
            });
        });

        // Clear validation errors
        document.getElementById('edit-name-error').textContent = '';

        // Add real-time validation
        const editNameInput = document.getElementById('edit-user-name');
        editNameInput.addEventListener('input', () => {
            this.validateEditUserName(editNameInput.value);
        });

        // Show modal
        document.getElementById('edit-user-modal').classList.remove('hidden');
        editNameInput.focus();
        editNameInput.select();
    },

    /**
     * Validate edited user name
     */
    validateEditUserName(name) {
        const errorDiv = document.getElementById('edit-name-error');
        const saveBtn = document.getElementById('edit-user-save');

        if (!name) {
            errorDiv.textContent = 'Name is required';
            saveBtn.disabled = true;
            return false;
        }

        if (name.length < 2) {
            errorDiv.textContent = 'Name must be at least 2 characters';
            saveBtn.disabled = true;
            return false;
        }

        if (name.length > 15) {
            errorDiv.textContent = 'Name cannot exceed 15 characters';
            saveBtn.disabled = true;
            return false;
        }

        // Check for duplicates (excluding current user)
        const users = Storage.getUsers();
        const isDuplicate = users.some(u => u.id !== this.editingUser.id && u.name.toLowerCase() === name.toLowerCase());
        if (isDuplicate) {
            errorDiv.textContent = 'This name already exists';
            saveBtn.disabled = true;
            return false;
        }

        errorDiv.textContent = '';
        saveBtn.disabled = false;
        return true;
    },

    /**
     * Save edited user
     */
    saveEditedUser() {
        const nameInput = document.getElementById('edit-user-name');
        const newName = nameInput.value.trim();

        // Validate using the same validation function
        if (!this.validateEditUserName(newName)) {
            return;
        }

        // Update user
        Storage.updateUser(this.editingUser.id, {
            name: newName,
            color: this.editingUserColor
        });

        this.closeEditUserModal();
        this.renderUsersList();
        Wheel.render();
    },

    /**
     * Close edit user modal
     */
    closeEditUserModal() {
        document.getElementById('edit-user-modal').classList.add('hidden');
        this.editingUser = null;
        this.editingUserColor = null;
    },

    /**
     * Confirm delete user
     */
    confirmDeleteUser(user) {
        this.showConfirmDialog(
            `Delete "${user.name}"?`,
            `This user will be removed from the wheel. Spin history will be preserved.`,
            () => {
                Storage.deleteUser(user.id);
                this.renderUsersList();
                this.updateWheelState();
                Wheel.render();
            }
        );
    },

    // ==================== HISTORY VIEW ====================

    /**
     * Setup history events
     */
    setupHistoryEvents() {
        // History tab switching
        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.history-tab').forEach(t => {
                    t.classList.remove('active');
                });
                document.querySelectorAll('.history-tab-content').forEach(c => {
                    c.classList.remove('active');
                });

                tab.classList.add('active');
                const tabName = tab.dataset.tab;
                document.getElementById(tabName).classList.add('active');
            });
        });

        // Export button
        document.getElementById('export-csv').addEventListener('click', () => {
            Storage.exportHistoryAsCSV();
        });

        // Clear history button
        document.getElementById('clear-history').addEventListener('click', () => {
            this.showConfirmDialog(
                'Clear History?',
                'All spin history will be deleted. This cannot be undone.',
                () => {
                    Storage.clearHistory();
                    this.renderHistoryList();
                    this.renderStatistics();
                }
            );
        });
    },

    /**
     * Render history list
     */
    renderHistoryList() {
        const history = Storage.getHistory();
        const entriesContainer = document.getElementById('history-entries');

        if (history.length === 0) {
            entriesContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No spins yet. Go spin the wheel!</p>';
            return;
        }

        entriesContainer.innerHTML = '';

        // Show most recent first
        [...history].reverse().forEach(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString();

            const entryDiv = document.createElement('div');
            entryDiv.className = 'history-entry';

            entryDiv.innerHTML = `
                <div>
                    <div class="history-entry-time">${dateStr} ${timeStr}</div>
                    <div class="history-entry-name">${entry.userName}</div>
                    <div class="history-entry-number">Spin #${entry.spinNumber}</div>
                </div>
            `;

            entriesContainer.appendChild(entryDiv);
        });
    },

    /**
     * Render statistics
     */
    renderStatistics() {
        const stats = Storage.calculateStatistics();
        const statsContent = document.getElementById('statistics-content');

        if (Object.keys(stats).length === 0) {
            statsContent.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No statistics yet.</p>';
            return;
        }

        statsContent.innerHTML = '';

        // Sort by win count
        const sorted = Object.values(stats).sort((a, b) => b.winCount - a.winCount);

        sorted.forEach(stat => {
            const card = document.createElement('div');
            card.className = 'stat-card';

            card.innerHTML = `
                <div class="stat-card-header">
                    <div class="stat-color" style="background-color: ${stat.user.color};"></div>
                    <div class="stat-name">${stat.user.name}</div>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Total Wins</span>
                    <span class="stat-value">${stat.winCount}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Percentage</span>
                    <span class="stat-value">${stat.percentage}%</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Current Streak</span>
                    <span class="stat-value">${stat.currentStreak}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Longest Streak</span>
                    <span class="stat-value">${stat.longestStreak}</span>
                </div>
            `;

            statsContent.appendChild(card);
        });
    },

    // ==================== SETTINGS VIEW ====================

    /**
     * Setup settings events
     */
    setupSettingsEvents() {
        const spinDurationSlider = document.getElementById('spin-duration-slider');
        const durationDisplay = document.getElementById('duration-display');
        const animationSpeed = document.getElementById('animation-speed');
        const rotationDirection = document.getElementById('rotation-direction');
        const wheelTitle = document.getElementById('wheel-title');
        const sliceAnimation = document.getElementById('slice-animation');
        const winnerEffect = document.getElementById('winner-effect');
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        const soundToggle = document.getElementById('sound-toggle');
        const generateLink = document.getElementById('generate-link');
        const resetApp = document.getElementById('reset-app');

        // Load current settings
        const settings = Storage.getSettings();
        spinDurationSlider.value = settings.spinDuration;
        animationSpeed.value = settings.animationSpeed;
        rotationDirection.value = settings.rotationDirection;
        wheelTitle.value = settings.wheelTitle;
        sliceAnimation.value = settings.sliceAnimation;
        winnerEffect.value = settings.winnerEffect;
        darkModeToggle.checked = settings.darkMode;
        soundToggle.checked = settings.soundEnabled;

        // Spin duration
        spinDurationSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            durationDisplay.textContent = value;
            Storage.setSetting('spinDuration', parseInt(value));
        });

        // Animation speed
        animationSpeed.addEventListener('input', (e) => {
            Storage.setSetting('animationSpeed', parseFloat(e.target.value));
        });

        // Rotation direction
        rotationDirection.addEventListener('change', (e) => {
            Storage.setSetting('rotationDirection', e.target.value);
        });

        // Wheel title
        wheelTitle.addEventListener('change', (e) => {
            const title = e.target.value || 'Pick a Winner';
            Storage.setSetting('wheelTitle', title);
            Wheel.updateTitle(title);
        });

        // Slice animation
        sliceAnimation.addEventListener('change', (e) => {
            Storage.setSetting('sliceAnimation', e.target.value);
            Wheel.updateSliceAnimation(e.target.value);
        });

        // Dark mode
        darkModeToggle.addEventListener('change', (e) => {
            Storage.setSetting('darkMode', e.target.checked);
            this.applyTheme();
        });

        // Sound
        soundToggle.addEventListener('change', (e) => {
            Sounds.setEnabled(e.target.checked);
        });

        // Winner effect
        winnerEffect.addEventListener('change', (e) => {
            Storage.setSetting('winnerEffect', e.target.value);
        });

        // Generate shareable link
        generateLink.addEventListener('click', () => {
            const link = Storage.generateShareableLink();
            const display = document.getElementById('shared-link-display');
            const input = document.getElementById('shared-link-input');

            display.classList.remove('hidden');
            input.value = link;
            input.select();
        });

        // Copy link
        document.getElementById('copy-link').addEventListener('click', () => {
            const input = document.getElementById('shared-link-input');
            navigator.clipboard.writeText(input.value);
            alert('Link copied to clipboard!');
        });

        // Reset app
        resetApp.addEventListener('click', () => {
            this.showConfirmDialog(
                'Reset Everything?',
                'All users, history, and settings will be deleted. This cannot be undone.',
                () => {
                    Storage.resetAll();
                    location.reload();
                }
            );
        });
    },

    /**
     * Apply theme
     */
    applyTheme() {
        const darkMode = Storage.getSetting('darkMode');
        const html = document.documentElement;

        if (darkMode) {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }
    },

    // ==================== KEYBOARD SHORTCUTS ====================

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Number keys for navigation
            const number = parseInt(e.key);
            if (number >= 1 && number <= 4) {
                const views = ['wheel', 'users', 'history', 'settings'];
                this.showView(views[number - 1]);
                return;
            }

            // Arrow keys for tab switching
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const tabs = Array.from(document.querySelectorAll('.nav-tab'));
                const activeTab = document.querySelector('.nav-tab.active');
                const activeIndex = tabs.indexOf(activeTab);

                let nextIndex;
                if (e.key === 'ArrowLeft') {
                    nextIndex = (activeIndex - 1 + tabs.length) % tabs.length;
                } else {
                    nextIndex = (activeIndex + 1) % tabs.length;
                }

                const nextView = tabs[nextIndex].dataset.view;
                this.showView(nextView);
                return;
            }

            // Alt+H for help
            if (e.altKey && (e.key === 'h' || e.key === 'H')) {
                e.preventDefault();
                this.showHelpModal();
                return;
            }

            // Enter/Space to spin (when on wheel view and focused on button)
            if ((e.key === 'Enter' || e.key === ' ') && this.currentView === 'wheel') {
                const spinButton = document.getElementById('spin-button');
                if (document.activeElement === spinButton || document.activeElement === document.body) {
                    e.preventDefault();
                    this.spin();
                }
            }
        });
    },

    // ==================== MODALS ====================

    /**
     * Setup modal events
     */
    setupModalEvents() {
        // Edit user modal
        document.getElementById('close-edit-user')?.addEventListener('click', () => {
            this.closeEditUserModal();
        });

        document.getElementById('edit-user-cancel')?.addEventListener('click', () => {
            this.closeEditUserModal();
        });

        document.getElementById('edit-user-save')?.addEventListener('click', () => {
            this.saveEditedUser();
        });

        document.getElementById('edit-user-name')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveEditedUser();
            }
        });

        document.getElementById('edit-user-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'edit-user-modal') {
                this.closeEditUserModal();
            }
        });

        // Help modal
        document.getElementById('close-help')?.addEventListener('click', () => {
            this.closeHelpModal();
        });

        document.getElementById('help-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'help-modal') {
                this.closeHelpModal();
            }
        });

        // Confirm dialog
        document.getElementById('close-confirm')?.addEventListener('click', () => {
            this.closeConfirmDialog();
        });

        document.getElementById('confirm-cancel')?.addEventListener('click', () => {
            this.closeConfirmDialog();
        });

        document.getElementById('confirm-ok')?.addEventListener('click', () => {
            if (this.confirmCallback) {
                this.confirmCallback();
            }
            this.closeConfirmDialog();
        });

        document.getElementById('confirm-dialog')?.addEventListener('click', (e) => {
            if (e.target.id === 'confirm-dialog') {
                this.closeConfirmDialog();
            }
        });
    },

    confirmCallback: null,

    /**
     * Show confirm dialog
     */
    showConfirmDialog(title, message, onConfirm) {
        const dialog = document.getElementById('confirm-dialog');
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        this.confirmCallback = onConfirm;
        dialog.classList.remove('hidden');
    },

    /**
     * Close confirm dialog
     */
    closeConfirmDialog() {
        document.getElementById('confirm-dialog').classList.add('hidden');
        this.confirmCallback = null;
    },

    /**
     * Show help modal
     */
    showHelpModal() {
        document.getElementById('help-modal').classList.remove('hidden');
    },

    /**
     * Close help modal
     */
    closeHelpModal() {
        document.getElementById('help-modal').classList.add('hidden');
    },

    // ==================== SHAREABLE LINK ====================

    /**
     * Check for shareable link in URL
     */
    checkShareableLink() {
        const params = new URLSearchParams(window.location.search);
        const shareParam = params.get('share');

        if (shareParam) {
            const state = Storage.loadFromShareableLink(shareParam);
            if (state) {
                // Show confirmation before loading
                setTimeout(() => {
                    if (confirm('Load this shared wheel configuration?')) {
                        Storage.applySharedState(state);
                        // Reload to apply changes
                        window.location.href = window.location.pathname;
                    }
                }, 100);
            }
        }
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
} else {
    App.init();
}
