/**
 * User Profile Management System
 * Handles user information, preferences, goals, themes, and personalization
 */

class UserProfile {
    constructor(database) {
        this.database = database;
        this.profile = null;
        this.preferences = null;
        this.goals = [];
        this.currentTheme = 'system';
        this.listeners = new Map();
        
        this.init();
    }

    async init() {
        try {
            await this.loadProfile();
            await this.loadPreferences();
            await this.loadGoals();
            await this.applyTheme();
            console.log('✅ User profile system initialized');
        } catch (error) {
            console.error('❌ Failed to initialize user profile:', error);
            await this.createDefaultProfile();
        }
    }

    // Profile Management
    async loadProfile() {
        try {
            this.profile = await this.database.getSetting('userProfile');
            if (!this.profile) {
                this.profile = this.getDefaultProfile();
                await this.saveProfile();
            }
            return this.profile;
        } catch (error) {
            console.error('Error loading profile:', error);
            this.profile = this.getDefaultProfile();
            return this.profile;
        }
    }

    getDefaultProfile() {
        return {
            name: '',
            email: '',
            age: null,
            gender: '',
            height: null,
            weight: null,
            fitnessLevel: 'beginner', // beginner, intermediate, advanced
            avatar: {
                type: 'initials', // initials, emoji, upload, avatar
                value: '👤',
                backgroundColor: '#007AFF',
                textColor: '#FFFFFF'
            },
            bio: '',
            location: '',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            joinDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
    }

    async saveProfile() {
        try {
            this.profile.lastUpdated = new Date().toISOString();
            await this.database.setSetting('userProfile', this.profile);
            this.emitEvent('profileUpdated', this.profile);
            return true;
        } catch (error) {
            console.error('Error saving profile:', error);
            throw error;
        }
    }

    async updateProfile(updates) {
        try {
            this.profile = { ...this.profile, ...updates };
            await this.saveProfile();
            return this.profile;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    // Preferences Management
    async loadPreferences() {
        try {
            this.preferences = await this.database.getSetting('userPreferences');
            if (!this.preferences) {
                this.preferences = this.getDefaultPreferences();
                await this.savePreferences();
            }
            return this.preferences;
        } catch (error) {
            console.error('Error loading preferences:', error);
            this.preferences = this.getDefaultPreferences();
            return this.preferences;
        }
    }

    getDefaultPreferences() {
        return {
            // Measurement Units
            units: {
                weight: 'lbs', // lbs, kg
                height: 'inches', // inches, cm
                distance: 'miles', // miles, km
                temperature: 'fahrenheit' // fahrenheit, celsius
            },
            
            // Theme Preferences
            theme: {
                mode: 'system', // light, dark, system
                colorScheme: 'blue', // blue, purple, green, orange, red, pink
                accentColor: '#007AFF',
                useSystemColors: true
            },
            
            // App Behavior
            app: {
                language: 'en',
                notifications: true,
                soundEnabled: true,
                vibrationEnabled: true,
                autoStartRest: false,
                defaultRestTime: 90, // seconds
                showRestTimerWarning: true,
                autoSaveWorkouts: true
            },
            
            // Workout Preferences
            workout: {
                defaultWorkoutName: 'My Workout',
                trackRestTime: true,
                showExerciseInstructions: true,
                confirmSetCompletion: false,
                enableQuickAdd: true,
                defaultSets: 3,
                defaultReps: 10
            },
            
            // Privacy & Data
            privacy: {
                shareWorkouts: false,
                allowAnalytics: true,
                exportPersonalData: true,
                rememberLastWorkout: true
            },
            
            lastUpdated: new Date().toISOString()
        };
    }

    async savePreferences() {
        try {
            this.preferences.lastUpdated = new Date().toISOString();
            await this.database.setSetting('userPreferences', this.preferences);
            await this.applyPreferences();
            this.emitEvent('preferencesUpdated', this.preferences);
            return true;
        } catch (error) {
            console.error('Error saving preferences:', error);
            throw error;
        }
    }

    async updatePreferences(updates) {
        try {
            // Deep merge preferences
            this.preferences = this.deepMerge(this.preferences, updates);
            await this.savePreferences();
            return this.preferences;
        } catch (error) {
            console.error('Error updating preferences:', error);
            throw error;
        }
    }

    // Goals Management
    async loadGoals() {
        try {
            this.goals = await this.database.getSetting('userGoals') || [];
            return this.goals;
        } catch (error) {
            console.error('Error loading goals:', error);
            this.goals = [];
            return this.goals;
        }
    }

    async addGoal(goalData) {
        try {
            const goal = {
                id: Date.now().toString(),
                type: goalData.type, // weight_loss, muscle_gain, strength, endurance, custom
                title: goalData.title,
                description: goalData.description || '',
                targetValue: goalData.targetValue,
                currentValue: goalData.currentValue || 0,
                unit: goalData.unit,
                targetDate: goalData.targetDate,
                category: goalData.category || 'fitness', // fitness, body, performance
                priority: goalData.priority || 'medium', // low, medium, high
                status: 'active', // active, completed, paused, abandoned
                createdDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                milestones: [],
                notes: goalData.notes || ''
            };

            this.goals.push(goal);
            await this.saveGoals();
            this.emitEvent('goalAdded', goal);
            return goal;
        } catch (error) {
            console.error('Error adding goal:', error);
            throw error;
        }
    }

    async updateGoal(goalId, updates) {
        try {
            const goalIndex = this.goals.findIndex(g => g.id === goalId);
            if (goalIndex === -1) {
                throw new Error('Goal not found');
            }

            this.goals[goalIndex] = {
                ...this.goals[goalIndex],
                ...updates,
                lastUpdated: new Date().toISOString()
            };

            await this.saveGoals();
            this.emitEvent('goalUpdated', this.goals[goalIndex]);
            return this.goals[goalIndex];
        } catch (error) {
            console.error('Error updating goal:', error);
            throw error;
        }
    }

    async deleteGoal(goalId) {
        try {
            const goalIndex = this.goals.findIndex(g => g.id === goalId);
            if (goalIndex === -1) {
                throw new Error('Goal not found');
            }

            const deletedGoal = this.goals.splice(goalIndex, 1)[0];
            await this.saveGoals();
            this.emitEvent('goalDeleted', deletedGoal);
            return deletedGoal;
        } catch (error) {
            console.error('Error deleting goal:', error);
            throw error;
        }
    }

    async saveGoals() {
        try {
            await this.database.setSetting('userGoals', this.goals);
            return true;
        } catch (error) {
            console.error('Error saving goals:', error);
            throw error;
        }
    }

    // Theme Management
    async applyTheme() {
        try {
            if (!this.preferences) return;

            const themeMode = this.preferences.theme.mode;
            const colorScheme = this.preferences.theme.colorScheme;
            
            // Apply theme mode (light/dark/system)
            this.applyThemeMode(themeMode);
            
            // Apply color scheme
            this.applyColorScheme(colorScheme);
            
            this.currentTheme = themeMode;
            this.emitEvent('themeApplied', { mode: themeMode, colorScheme });
        } catch (error) {
            console.error('Error applying theme:', error);
        }
    }

    applyThemeMode(mode) {
        const root = document.documentElement;
        
        // Remove existing theme classes
        root.classList.remove('theme-light', 'theme-dark', 'theme-system');
        
        // Apply new theme
        switch (mode) {
            case 'light':
                root.classList.add('theme-light');
                root.setAttribute('data-theme', 'light');
                break;
            case 'dark':
                root.classList.add('theme-dark');
                root.setAttribute('data-theme', 'dark');
                break;
            case 'system':
            default:
                root.classList.add('theme-system');
                root.setAttribute('data-theme', 'system');
                
                // Listen for system theme changes
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                mediaQuery.addEventListener('change', (e) => {
                    if (this.preferences.theme.mode === 'system') {
                        root.setAttribute('data-theme-system', e.matches ? 'dark' : 'light');
                    }
                });
                
                // Set initial system theme
                root.setAttribute('data-theme-system', mediaQuery.matches ? 'dark' : 'light');
                break;
        }
    }

    applyColorScheme(scheme) {
        const colorSchemes = {
            blue: {
                primary: '#007AFF',
                primaryDark: '#0051D0',
                accent: '#5AC8FA'
            },
            purple: {
                primary: '#AF52DE',
                primaryDark: '#8E44AD',
                accent: '#BF5AF2'
            },
            green: {
                primary: '#34C759',
                primaryDark: '#28A745',
                accent: '#30D158'
            },
            orange: {
                primary: '#FF9500',
                primaryDark: '#E8890B',
                accent: '#FF9F0A'
            },
            red: {
                primary: '#FF3B30',
                primaryDark: '#DC2626',
                accent: '#FF453A'
            },
            pink: {
                primary: '#FF2D92',
                primaryDark: '#EC4899',
                accent: '#FF375F'
            }
        };

        const colors = colorSchemes[scheme] || colorSchemes.blue;
        const root = document.documentElement;

        // Apply CSS custom properties
        root.style.setProperty('--user-primary-color', colors.primary);
        root.style.setProperty('--user-primary-dark', colors.primaryDark);
        root.style.setProperty('--user-accent-color', colors.accent);
        
        // Update iOS blue variables to user's chosen color
        root.style.setProperty('--ios-blue', colors.primary);
        root.style.setProperty('--ios-blue-dark', colors.primaryDark);
        
        // Store accent color in preferences
        if (this.preferences) {
            this.preferences.theme.accentColor = colors.primary;
        }
    }

    // Avatar Management
    generateAvatarFromInitials(name, backgroundColor = '#007AFF') {
        if (!name) return { type: 'emoji', value: '👤' };
        
        const initials = name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);

        return {
            type: 'initials',
            value: initials,
            backgroundColor: backgroundColor,
            textColor: this.getContrastColor(backgroundColor)
        };
    }

    generateAvatarHTML(avatar, size = 40) {
        if (!avatar) {
            avatar = { type: 'emoji', value: '👤' };
        }

        const sizeClass = size <= 32 ? 'small' : size <= 60 ? 'medium' : 'large';
        
        switch (avatar.type) {
            case 'initials':
                return `
                    <div class="avatar avatar-initials avatar-${sizeClass}" 
                         style="background-color: ${avatar.backgroundColor}; color: ${avatar.textColor}; width: ${size}px; height: ${size}px; line-height: ${size}px;">
                        ${avatar.value}
                    </div>
                `;
            case 'emoji':
                return `
                    <div class="avatar avatar-emoji avatar-${sizeClass}" 
                         style="width: ${size}px; height: ${size}px; line-height: ${size}px;">
                        ${avatar.value}
                    </div>
                `;
            case 'upload':
                return `
                    <div class="avatar avatar-image avatar-${sizeClass}" 
                         style="width: ${size}px; height: ${size}px;">
                        <img src="${avatar.value}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                    </div>
                `;
            default:
                return `
                    <div class="avatar avatar-default avatar-${sizeClass}" 
                         style="width: ${size}px; height: ${size}px; line-height: ${size}px;">
                        👤
                    </div>
                `;
        }
    }

    // Unit Conversion Utilities
    convertWeight(value, fromUnit, toUnit) {
        if (fromUnit === toUnit) return value;
        
        // Convert to kg as base unit
        let kg = fromUnit === 'lbs' ? value * 0.453592 : value;
        
        // Convert from kg to target unit
        return toUnit === 'lbs' ? kg * 2.20462 : kg;
    }

    convertHeight(value, fromUnit, toUnit) {
        if (fromUnit === toUnit) return value;
        
        // Convert to cm as base unit
        let cm = fromUnit === 'inches' ? value * 2.54 : value;
        
        // Convert from cm to target unit
        return toUnit === 'inches' ? cm * 0.393701 : cm;
    }

    convertDistance(value, fromUnit, toUnit) {
        if (fromUnit === toUnit) return value;
        
        // Convert to km as base unit
        let km = fromUnit === 'miles' ? value * 1.60934 : value;
        
        // Convert from km to target unit
        return toUnit === 'miles' ? km * 0.621371 : km;
    }

    formatWeight(value, unit = null) {
        unit = unit || this.preferences?.units?.weight || 'lbs';
        const rounded = Math.round(value * 10) / 10;
        return `${rounded} ${unit}`;
    }

    formatHeight(value, unit = null) {
        unit = unit || this.preferences?.units?.height || 'inches';
        
        if (unit === 'inches') {
            const feet = Math.floor(value / 12);
            const inches = Math.round(value % 12);
            return inches === 0 ? `${feet}'` : `${feet}'${inches}"`;
        } else {
            return `${Math.round(value)} cm`;
        }
    }

    // Preference Application
    async applyPreferences() {
        try {
            if (!this.preferences) return;

            // Apply theme
            await this.applyTheme();
            
            // Apply other preferences
            this.applyNotificationSettings();
            this.applySoundSettings();
            this.applyAppBehavior();
            
        } catch (error) {
            console.error('Error applying preferences:', error);
        }
    }

    applyNotificationSettings() {
        if (!this.preferences.app.notifications) {
            // Disable notifications if user preference is off
            if ('Notification' in window && Notification.permission === 'granted') {
                // Note: Can't revoke permission programmatically, but app won't send notifications
            }
        }
    }

    applySoundSettings() {
        // Apply sound settings to audio elements and notification sounds
        const soundEnabled = this.preferences.app.soundEnabled;
        document.documentElement.setAttribute('data-sound-enabled', soundEnabled);
    }

    applyAppBehavior() {
        // Apply various app behavior preferences
        const behavior = this.preferences.app;
        
        // Auto-start rest timer
        document.documentElement.setAttribute('data-auto-start-rest', behavior.autoStartRest);
        
        // Default rest time
        document.documentElement.setAttribute('data-default-rest-time', behavior.defaultRestTime);
    }

    // Utility Methods
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    getContrastColor(hexColor) {
        // Remove # if present
        hexColor = hexColor.replace('#', '');
        
        // Convert to RGB
        const r = parseInt(hexColor.substr(0, 2), 16);
        const g = parseInt(hexColor.substr(2, 2), 16);
        const b = parseInt(hexColor.substr(4, 2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return black or white based on luminance
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    async createDefaultProfile() {
        try {
            this.profile = this.getDefaultProfile();
            this.preferences = this.getDefaultPreferences();
            this.goals = [];
            
            await this.saveProfile();
            await this.savePreferences();
            await this.saveGoals();
            
            console.log('✅ Default profile created');
        } catch (error) {
            console.error('❌ Failed to create default profile:', error);
        }
    }

    // Event System
    addEventListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    removeEventListener(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emitEvent(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in user profile event listener for ${event}:`, error);
                }
            });
        }
    }

    // Public API
    getProfile() {
        return this.profile;
    }

    getPreferences() {
        return this.preferences;
    }

    getGoals() {
        return this.goals;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getUnits() {
        return this.preferences?.units || this.getDefaultPreferences().units;
    }

    destroy() {
        this.listeners.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserProfile;
}