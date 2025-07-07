/**
 * Profile UI Management
 * Handles user interface for profile settings, preferences, and personalization
 */

class ProfileUI {
    constructor(userProfile, app) {
        this.userProfile = userProfile;
        this.app = app;
        this.currentModal = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.updateProfileDisplay();
        console.log('✅ Profile UI initialized');
    }

    setupEventListeners() {
        // Profile button click
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openProfileSettings();
            });
        }

        // Profile header click (if exists)
        const profileHeader = document.querySelector('.profile-header');
        if (profileHeader) {
            profileHeader.addEventListener('click', () => {
                this.openProfileSettings();
            });
        }

        // Listen for profile updates
        this.userProfile.addEventListener('profileUpdated', () => {
            this.updateProfileDisplay();
        });

        this.userProfile.addEventListener('preferencesUpdated', () => {
            this.updateProfileDisplay();
        });

        this.userProfile.addEventListener('themeApplied', () => {
            this.updateThemeDisplay();
        });
    }

    async updateProfileDisplay() {
        try {
            const profile = this.userProfile.getProfile();
            const preferences = this.userProfile.getPreferences();

            // Update profile name and avatar in header
            this.updateHeaderProfile(profile);
            
            // Update any profile info in the profile tab
            this.updateProfileTab(profile, preferences);
            
        } catch (error) {
            console.error('Error updating profile display:', error);
        }
    }

    updateHeaderProfile(profile) {
        // Update profile name if displayed in header
        const profileName = document.querySelector('.profile-name');
        if (profileName && profile.name) {
            profileName.textContent = profile.name;
        }

        // Update avatar in header
        const profileAvatar = document.querySelector('.profile-avatar');
        if (profileAvatar) {
            profileAvatar.innerHTML = this.userProfile.generateAvatarHTML(profile.avatar, 40);
        }
    }

    updateProfileTab(profile, preferences) {
        // Update profile section in the profile tab
        const profileSection = document.querySelector('.profile-header');
        if (!profileSection) return;

        const avatarSection = profileSection.querySelector('.profile-avatar-section');
        const nameElement = profileSection.querySelector('.profile-name');
        const subtitleElement = profileSection.querySelector('.profile-subtitle');
        const bioElement = profileSection.querySelector('.profile-bio');

        if (avatarSection) {
            const avatarContainer = avatarSection.querySelector('.avatar') || 
                                  avatarSection.querySelector('.avatar-placeholder');
            if (avatarContainer) {
                avatarContainer.outerHTML = this.userProfile.generateAvatarHTML(profile.avatar, 80);
            }
        }

        if (nameElement) {
            nameElement.textContent = profile.name || 'Set Your Name';
        }

        if (subtitleElement) {
            let subtitle = '';
            if (profile.fitnessLevel) {
                subtitle = profile.fitnessLevel.charAt(0).toUpperCase() + profile.fitnessLevel.slice(1);
            }
            if (profile.age) {
                subtitle += subtitle ? `, ${profile.age} years old` : `${profile.age} years old`;
            }
            subtitleElement.textContent = subtitle || 'Customize your profile';
        }

        if (bioElement && profile.bio) {
            bioElement.textContent = profile.bio;
            bioElement.style.display = 'block';
        } else if (bioElement) {
            bioElement.style.display = 'none';
        }
    }

    updateThemeDisplay() {
        // Update any theme-related UI elements
        const root = document.documentElement;
        const currentScheme = root.style.getPropertyValue('--user-primary-color');
        
        // Update theme indicators
        const themeIndicators = document.querySelectorAll('.current-theme-indicator');
        themeIndicators.forEach(indicator => {
            indicator.style.backgroundColor = currentScheme;
        });
    }

    openProfileSettings() {
        this.createProfileModal();
    }

    createProfileModal() {
        const modal = document.createElement('div');
        modal.className = 'modal profile-modal';
        modal.id = 'profile-settings-modal';
        
        modal.innerHTML = `
            <div class="modal-content profile-modal-content">
                <div class="modal-header">
                    <h2>Profile & Settings</h2>
                    <button class="modal-close" id="close-profile-modal">&times;</button>
                </div>
                <div class="modal-body profile-modal-body">
                    ${this.generateProfileModalContent()}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.currentModal = modal;

        // Setup modal event listeners
        this.setupProfileModalListeners(modal);
        
        // Show modal
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    generateProfileModalContent() {
        const profile = this.userProfile.getProfile();
        const preferences = this.userProfile.getPreferences();

        return `
            <div class="profile-tabs">
                <div class="tab-buttons">
                    <button class="tab-btn active" data-tab="personal">Personal</button>
                    <button class="tab-btn" data-tab="preferences">Preferences</button>
                    <button class="tab-btn" data-tab="goals">Goals</button>
                    <button class="tab-btn" data-tab="appearance">Appearance</button>
                </div>
                
                <div class="tab-content-container">
                    <!-- Personal Info Tab -->
                    <div class="tab-content active" data-tab="personal">
                        ${this.generatePersonalTab(profile)}
                    </div>
                    
                    <!-- Preferences Tab -->
                    <div class="tab-content" data-tab="preferences">
                        ${this.generatePreferencesTab(preferences)}
                    </div>
                    
                    <!-- Goals Tab -->
                    <div class="tab-content" data-tab="goals">
                        ${this.generateGoalsTab()}
                    </div>
                    
                    <!-- Appearance Tab -->
                    <div class="tab-content" data-tab="appearance">
                        ${this.generateAppearanceTab(preferences)}
                    </div>
                </div>
            </div>
        `;
    }

    generatePersonalTab(profile) {
        return `
            <div class="form-section">
                <h3 class="form-section-title">Basic Information</h3>
                
                <!-- Avatar Section -->
                <div class="avatar-section">
                    <div class="avatar-upload">
                        <div class="profile-avatar-section">
                            ${this.userProfile.generateAvatarHTML(profile.avatar, 80)}
                            <button class="avatar-edit-button" id="edit-avatar-btn">✎</button>
                        </div>
                        <div class="avatar-options" id="avatar-options" style="display: none;">
                            <button class="avatar-option" data-type="emoji">😊 Choose Emoji</button>
                            <button class="avatar-option" data-type="initials">AB Initials</button>
                            <button class="avatar-option" data-type="upload">📷 Upload Photo</button>
                        </div>
                    </div>
                </div>

                <!-- Personal Info Form -->
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <input type="text" class="form-input" id="profile-name" 
                               value="${profile.name || ''}" placeholder="Your name">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group half">
                        <label class="form-label">Age</label>
                        <input type="number" class="form-input" id="profile-age" 
                               value="${profile.age || ''}" placeholder="25" min="13" max="120">
                    </div>
                    <div class="form-group half">
                        <label class="form-label">Gender</label>
                        <select class="form-input form-select" id="profile-gender">
                            <option value="">Select...</option>
                            <option value="male" ${profile.gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${profile.gender === 'female' ? 'selected' : ''}>Female</option>
                            <option value="other" ${profile.gender === 'other' ? 'selected' : ''}>Other</option>
                            <option value="prefer-not-to-say" ${profile.gender === 'prefer-not-to-say' ? 'selected' : ''}>Prefer not to say</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group half">
                        <label class="form-label">Height</label>
                        <div class="input-with-unit">
                            <input type="number" class="form-input" id="profile-height" 
                                   value="${profile.height || ''}" placeholder="70" step="0.1">
                            <span class="unit-display">${preferences?.units?.height || 'inches'}</span>
                        </div>
                    </div>
                    <div class="form-group half">
                        <label class="form-label">Weight</label>
                        <div class="input-with-unit">
                            <input type="number" class="form-input" id="profile-weight" 
                                   value="${profile.weight || ''}" placeholder="150" step="0.1">
                            <span class="unit-display">${preferences?.units?.weight || 'lbs'}</span>
                        </div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Fitness Level</label>
                        <select class="form-input form-select" id="profile-fitness-level">
                            <option value="beginner" ${profile.fitnessLevel === 'beginner' ? 'selected' : ''}>Beginner</option>
                            <option value="intermediate" ${profile.fitnessLevel === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                            <option value="advanced" ${profile.fitnessLevel === 'advanced' ? 'selected' : ''}>Advanced</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Bio</label>
                        <textarea class="form-input form-textarea" id="profile-bio" 
                                  placeholder="Tell us about your fitness journey...">${profile.bio || ''}</textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn ios-button" id="save-profile-btn">Save Profile</button>
                </div>
            </div>
        `;
    }

    generatePreferencesTab(preferences) {
        return `
            <div class="preferences-section">
                <!-- Units Preferences -->
                <div class="preference-group">
                    <div class="preference-group-title">Measurement Units</div>
                    
                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-label">Weight</div>
                            <div class="preference-description">Choose your preferred weight unit</div>
                        </div>
                        <div class="preference-control">
                            <div class="unit-selector" data-preference="units.weight">
                                <button class="unit-option ${preferences?.units?.weight === 'lbs' ? 'selected' : ''}" data-value="lbs">lbs</button>
                                <button class="unit-option ${preferences?.units?.weight === 'kg' ? 'selected' : ''}" data-value="kg">kg</button>
                            </div>
                        </div>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-label">Height</div>
                            <div class="preference-description">Choose your preferred height unit</div>
                        </div>
                        <div class="preference-control">
                            <div class="unit-selector" data-preference="units.height">
                                <button class="unit-option ${preferences?.units?.height === 'inches' ? 'selected' : ''}" data-value="inches">in</button>
                                <button class="unit-option ${preferences?.units?.height === 'cm' ? 'selected' : ''}" data-value="cm">cm</button>
                            </div>
                        </div>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-label">Distance</div>
                            <div class="preference-description">Choose your preferred distance unit</div>
                        </div>
                        <div class="preference-control">
                            <div class="unit-selector" data-preference="units.distance">
                                <button class="unit-option ${preferences?.units?.distance === 'miles' ? 'selected' : ''}" data-value="miles">mi</button>
                                <button class="unit-option ${preferences?.units?.distance === 'km' ? 'selected' : ''}" data-value="km">km</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- App Behavior -->
                <div class="preference-group">
                    <div class="preference-group-title">App Behavior</div>
                    
                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-label">Notifications</div>
                            <div class="preference-description">Enable workout reminders and alerts</div>
                        </div>
                        <div class="preference-control">
                            <div class="toggle-switch ${preferences?.app?.notifications ? 'active' : ''}" 
                                 data-preference="app.notifications">
                            </div>
                        </div>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-label">Sound Effects</div>
                            <div class="preference-description">Enable sound for timers and notifications</div>
                        </div>
                        <div class="preference-control">
                            <div class="toggle-switch ${preferences?.app?.soundEnabled ? 'active' : ''}" 
                                 data-preference="app.soundEnabled">
                            </div>
                        </div>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-label">Auto-start Rest Timer</div>
                            <div class="preference-description">Automatically start rest timer after completing a set</div>
                        </div>
                        <div class="preference-control">
                            <div class="toggle-switch ${preferences?.app?.autoStartRest ? 'active' : ''}" 
                                 data-preference="app.autoStartRest">
                            </div>
                        </div>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-label">Default Rest Time</div>
                            <div class="preference-description">Default rest time between sets (seconds)</div>
                        </div>
                        <div class="preference-control">
                            <select class="form-input form-select" data-preference="app.defaultRestTime">
                                <option value="30" ${preferences?.app?.defaultRestTime === 30 ? 'selected' : ''}>30 seconds</option>
                                <option value="60" ${preferences?.app?.defaultRestTime === 60 ? 'selected' : ''}>1 minute</option>
                                <option value="90" ${preferences?.app?.defaultRestTime === 90 ? 'selected' : ''}>90 seconds</option>
                                <option value="120" ${preferences?.app?.defaultRestTime === 120 ? 'selected' : ''}>2 minutes</option>
                                <option value="180" ${preferences?.app?.defaultRestTime === 180 ? 'selected' : ''}>3 minutes</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Workout Preferences -->
                <div class="preference-group">
                    <div class="preference-group-title">Workout Settings</div>
                    
                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-label">Default Sets</div>
                            <div class="preference-description">Default number of sets for new exercises</div>
                        </div>
                        <div class="preference-control">
                            <select class="form-input form-select" data-preference="workout.defaultSets">
                                <option value="1" ${preferences?.workout?.defaultSets === 1 ? 'selected' : ''}>1 set</option>
                                <option value="2" ${preferences?.workout?.defaultSets === 2 ? 'selected' : ''}>2 sets</option>
                                <option value="3" ${preferences?.workout?.defaultSets === 3 ? 'selected' : ''}>3 sets</option>
                                <option value="4" ${preferences?.workout?.defaultSets === 4 ? 'selected' : ''}>4 sets</option>
                                <option value="5" ${preferences?.workout?.defaultSets === 5 ? 'selected' : ''}>5 sets</option>
                            </select>
                        </div>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-label">Default Reps</div>
                            <div class="preference-description">Default number of reps for new exercises</div>
                        </div>
                        <div class="preference-control">
                            <input type="number" class="form-input" 
                                   value="${preferences?.workout?.defaultReps || 10}" 
                                   min="1" max="100" 
                                   data-preference="workout.defaultReps">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateGoalsTab() {
        const goals = this.userProfile.getGoals();
        
        return `
            <div class="goals-section">
                <div class="goals-header">
                    <h3>Fitness Goals</h3>
                    <button class="btn ios-button-secondary" id="add-goal-btn">Add Goal</button>
                </div>
                
                <div class="goals-list" id="goals-list">
                    ${goals.length > 0 ? goals.map(goal => this.generateGoalCard(goal)).join('') : 
                      '<div class="empty-state">No goals set yet. Add your first fitness goal!</div>'}
                </div>
            </div>
        `;
    }

    generateGoalCard(goal) {
        const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
        
        return `
            <div class="goal-card" data-goal-id="${goal.id}">
                <div class="goal-header">
                    <div>
                        <div class="goal-title">${goal.title}</div>
                        <div class="goal-description">${goal.description}</div>
                    </div>
                    <div class="goal-priority ${goal.priority}">${goal.priority}</div>
                </div>
                
                <div class="goal-progress">
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <div class="goal-progress-text">
                        <span class="goal-current">${goal.currentValue} ${goal.unit}</span>
                        <span class="goal-target">of ${goal.targetValue} ${goal.unit}</span>
                    </div>
                </div>
                
                <div class="goal-actions">
                    <button class="goal-action-btn" onclick="profileUI.updateGoalProgress('${goal.id}')">Update</button>
                    <button class="goal-action-btn" onclick="profileUI.editGoal('${goal.id}')">Edit</button>
                    <button class="goal-action-btn" onclick="profileUI.deleteGoal('${goal.id}')">Delete</button>
                </div>
            </div>
        `;
    }

    generateAppearanceTab(preferences) {
        return `
            <div class="appearance-section">
                <!-- Theme Mode -->
                <div class="preference-group">
                    <div class="preference-group-title">Theme</div>
                    
                    <div class="preference-item">
                        <div class="preference-info">
                            <div class="preference-label">Theme Mode</div>
                            <div class="preference-description">Choose your preferred theme</div>
                        </div>
                        <div class="preference-control">
                            <select class="form-input form-select" data-preference="theme.mode">
                                <option value="system" ${preferences?.theme?.mode === 'system' ? 'selected' : ''}>System</option>
                                <option value="light" ${preferences?.theme?.mode === 'light' ? 'selected' : ''}>Light</option>
                                <option value="dark" ${preferences?.theme?.mode === 'dark' ? 'selected' : ''}>Dark</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Color Scheme -->
                <div class="preference-group">
                    <div class="preference-group-title">Color Scheme</div>
                    
                    <div class="theme-selector" id="color-scheme-selector">
                        ${this.generateColorSchemeOptions(preferences?.theme?.colorScheme)}
                    </div>
                </div>
            </div>
        `;
    }

    generateColorSchemeOptions(currentScheme = 'blue') {
        const schemes = [
            { id: 'blue', name: 'Blue', preview: 'theme-preview-blue' },
            { id: 'purple', name: 'Purple', preview: 'theme-preview-purple' },
            { id: 'green', name: 'Green', preview: 'theme-preview-green' },
            { id: 'orange', name: 'Orange', preview: 'theme-preview-orange' },
            { id: 'red', name: 'Red', preview: 'theme-preview-red' },
            { id: 'pink', name: 'Pink', preview: 'theme-preview-pink' }
        ];

        return schemes.map(scheme => `
            <div class="theme-option ${scheme.id === currentScheme ? 'selected' : ''}" 
                 data-scheme="${scheme.id}">
                <div class="theme-preview ${scheme.preview}"></div>
                <div class="theme-name">${scheme.name}</div>
            </div>
        `).join('');
    }

    setupProfileModalListeners(modal) {
        // Close modal
        const closeBtn = modal.querySelector('#close-profile-modal');
        closeBtn.addEventListener('click', () => this.closeProfileModal());

        // Tab switching
        const tabButtons = modal.querySelectorAll('.tab-btn');
        const tabContents = modal.querySelectorAll('.tab-content');
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // Update active tab button
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update active tab content
                tabContents.forEach(content => {
                    content.classList.toggle('active', content.dataset.tab === targetTab);
                });
            });
        });

        // Profile form handlers
        this.setupPersonalTabListeners(modal);
        this.setupPreferencesListeners(modal);
        this.setupGoalsListeners(modal);
        this.setupAppearanceListeners(modal);
    }

    setupPersonalTabListeners(modal) {
        // Save profile button
        const saveBtn = modal.querySelector('#save-profile-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.savePersonalInfo(modal));
        }

        // Avatar edit button
        const avatarEditBtn = modal.querySelector('#edit-avatar-btn');
        if (avatarEditBtn) {
            avatarEditBtn.addEventListener('click', () => this.showAvatarOptions(modal));
        }
    }

    setupPreferencesListeners(modal) {
        // Toggle switches
        const toggles = modal.querySelectorAll('.toggle-switch');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
                const preference = toggle.dataset.preference;
                const value = toggle.classList.contains('active');
                this.updatePreference(preference, value);
            });
        });

        // Unit selectors
        const unitSelectors = modal.querySelectorAll('.unit-selector');
        unitSelectors.forEach(selector => {
            const options = selector.querySelectorAll('.unit-option');
            options.forEach(option => {
                option.addEventListener('click', () => {
                    // Update UI
                    options.forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    
                    // Update preference
                    const preference = selector.dataset.preference;
                    const value = option.dataset.value;
                    this.updatePreference(preference, value);
                });
            });
        });

        // Select dropdowns and inputs
        const preferenceControls = modal.querySelectorAll('[data-preference]');
        preferenceControls.forEach(control => {
            if (control.tagName === 'SELECT' || control.tagName === 'INPUT') {
                control.addEventListener('change', () => {
                    const preference = control.dataset.preference;
                    let value = control.value;
                    
                    // Convert numeric values
                    if (control.type === 'number') {
                        value = parseFloat(value);
                    }
                    
                    this.updatePreference(preference, value);
                });
            }
        });
    }

    setupGoalsListeners(modal) {
        // Add goal button
        const addGoalBtn = modal.querySelector('#add-goal-btn');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => this.showAddGoalModal());
        }
    }

    setupAppearanceListeners(modal) {
        // Theme mode selector
        const themeModeSelect = modal.querySelector('[data-preference="theme.mode"]');
        if (themeModeSelect) {
            themeModeSelect.addEventListener('change', () => {
                this.updatePreference('theme.mode', themeModeSelect.value);
            });
        }

        // Color scheme selector
        const colorSchemeOptions = modal.querySelectorAll('.theme-option');
        colorSchemeOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Update UI
                colorSchemeOptions.forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                
                // Update preference
                const scheme = option.dataset.scheme;
                this.updatePreference('theme.colorScheme', scheme);
            });
        });
    }

    async savePersonalInfo(modal) {
        try {
            const updates = {
                name: modal.querySelector('#profile-name').value,
                age: parseInt(modal.querySelector('#profile-age').value) || null,
                gender: modal.querySelector('#profile-gender').value,
                height: parseFloat(modal.querySelector('#profile-height').value) || null,
                weight: parseFloat(modal.querySelector('#profile-weight').value) || null,
                fitnessLevel: modal.querySelector('#profile-fitness-level').value,
                bio: modal.querySelector('#profile-bio').value
            };

            await this.userProfile.updateProfile(updates);
            this.showNotification('Profile updated successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showNotification('Failed to save profile', 'error');
        }
    }

    async updatePreference(path, value) {
        try {
            const updates = this.setNestedProperty({}, path, value);
            await this.userProfile.updatePreferences(updates);
            
        } catch (error) {
            console.error('Error updating preference:', error);
            this.showNotification('Failed to update preference', 'error');
        }
    }

    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return obj;
    }

    showAvatarOptions(modal) {
        const avatarOptions = modal.querySelector('#avatar-options');
        if (avatarOptions) {
            avatarOptions.style.display = avatarOptions.style.display === 'none' ? 'block' : 'none';
        }
    }

    closeProfileModal() {
        if (this.currentModal) {
            this.currentModal.classList.remove('active');
            setTimeout(() => {
                this.currentModal.remove();
                this.currentModal = null;
            }, 300);
        }
    }

    showNotification(message, type = 'info') {
        // Use app's notification system if available
        if (this.app && this.app.showNotification) {
            this.app.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Goal management methods
    async updateGoalProgress(goalId) {
        // Implementation for updating goal progress
        console.log('Update goal progress:', goalId);
    }

    async editGoal(goalId) {
        // Implementation for editing goal
        console.log('Edit goal:', goalId);
    }

    async deleteGoal(goalId) {
        try {
            if (confirm('Are you sure you want to delete this goal?')) {
                await this.userProfile.deleteGoal(goalId);
                this.refreshGoalsTab();
                this.showNotification('Goal deleted', 'success');
            }
        } catch (error) {
            console.error('Error deleting goal:', error);
            this.showNotification('Failed to delete goal', 'error');
        }
    }

    refreshGoalsTab() {
        const goalsList = document.querySelector('#goals-list');
        if (goalsList) {
            const goals = this.userProfile.getGoals();
            goalsList.innerHTML = goals.length > 0 ? 
                goals.map(goal => this.generateGoalCard(goal)).join('') : 
                '<div class="empty-state">No goals set yet. Add your first fitness goal!</div>';
        }
    }

    showAddGoalModal() {
        // Implementation for add goal modal
        console.log('Show add goal modal');
    }
}

// Make available globally for onclick handlers
window.profileUI = null;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileUI;
}